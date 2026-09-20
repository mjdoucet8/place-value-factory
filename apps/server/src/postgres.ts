import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import type { EvidenceRecord, Validation } from '../../../packages/game-engine/src/index.js';

export type PostgresResponseInput = {
  actorId: string;
  attemptId: string;
  orderId: string;
  commandId: string;
  payloadHash: string;
  expectedRevision: number;
  leaseEpoch: number;
  tabId: string;
  representationA: unknown;
  representationB: unknown;
  activeMs: number;
  validation: Validation;
  nextSlot: number;
  completed: boolean;
  receipt: unknown;
  evidence: Omit<EvidenceRecord, 'committedAt'> | null;
};
export type PersistedResponse = { kind: 'committed'; revision: number } | { kind: 'replay'; status: number; body: unknown } |
  { kind: 'conflict'; code: 'IDEMPOTENCY_CONFLICT' | 'REVISION_CONFLICT' | 'LEASE_LOST' | 'ORDER_NOT_ACTIVE'; revision?: number };

/**
 * PostgreSQL is authoritative when DATABASE_URL is supplied. This repository
 * uses row locks and a receipt lookup before revision checks so a lost reply
 * can be safely replayed without duplicating evidence.
 */
export class PostgresGameRepository {
  constructor(private readonly pool: Pool) {}

  static fromDatabaseUrl(databaseUrl: string) { return new PostgresGameRepository(new Pool({ connectionString: databaseUrl })); }
  static fromPool(pool: Pool) { return new PostgresGameRepository(pool); }
  async close() { await this.pool.end(); }

  async evidenceFor(studentId: string, skillId: string): Promise<EvidenceRecord[]> {
    const result = await this.pool.query<{
      skill_id: string; score: string; independent_first: boolean; attempt_id: string; signature: string; committed_at: string; eligible: boolean;
    }>(`SELECT evidence.skill_id, evidence.score, evidence.independent_first, orders.attempt_id, evidence.signature, evidence.committed_at, evidence.eligible
        FROM pvf_skill_evidence evidence
        JOIN pvf_order orders ON orders.id = evidence.order_id
        WHERE evidence.student_id = $1 AND evidence.skill_id = $2
        ORDER BY evidence.committed_at DESC`, [studentId, skillId]);
    return result.rows.map((row) => ({ skillId: row.skill_id, score: Number(row.score), independentFirst: row.independent_first, attemptId: row.attempt_id, signature: row.signature, committedAt: row.committed_at, eligible: row.eligible }));
  }

  async persistResponse(input: PostgresResponseInput): Promise<PersistedResponse> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      const prior = await client.query<{ payload_hash: string; status: number; response: unknown }>(
        'SELECT payload_hash, status, response FROM pvf_command_receipt WHERE actor_id = $1 AND command_id = $2', [input.actorId, input.commandId]);
      if (prior.rowCount) {
        await client.query('COMMIT');
        const receipt = prior.rows[0];
        return receipt.payload_hash === input.payloadHash ? { kind: 'replay', status: receipt.status, body: receipt.response } : { kind: 'conflict', code: 'IDEMPOTENCY_CONFLICT' };
      }
      const attempt = await client.query<{ revision: number; lease_epoch: number; writer_tab_id: string; lease_expires_at: Date; status: string }>(
        'SELECT revision, lease_epoch, writer_tab_id, lease_expires_at, status FROM pvf_attempt WHERE id = $1 AND student_id = $2 FOR UPDATE', [input.attemptId, input.actorId]);
      if (!attempt.rowCount || attempt.rows[0].status !== 'active') { await client.query('ROLLBACK'); return { kind: 'conflict', code: 'ORDER_NOT_ACTIVE' }; }
      const current = attempt.rows[0];
      if (current.revision !== input.expectedRevision) { await client.query('ROLLBACK'); return { kind: 'conflict', code: 'REVISION_CONFLICT', revision: current.revision }; }
      if (current.lease_epoch !== input.leaseEpoch || (current.lease_expires_at.getTime() > Date.now() && current.writer_tab_id !== input.tabId)) { await client.query('ROLLBACK'); return { kind: 'conflict', code: 'LEASE_LOST' }; }
      const order = await client.query('SELECT id FROM pvf_order WHERE id = $1 AND attempt_id = $2 AND status = \'active\' FOR UPDATE', [input.orderId, input.attemptId]);
      if (!order.rowCount) { await client.query('ROLLBACK'); return { kind: 'conflict', code: 'ORDER_NOT_ACTIVE' }; }
      const sequence = await client.query<{ sequence: number }>('SELECT COALESCE(MAX(sequence) + 1, 0) AS sequence FROM pvf_response WHERE order_id = $1', [input.orderId]);
      await client.query(
        `INSERT INTO pvf_response (id, order_id, command_id, sequence, representation_a, representation_b, validation, active_ms)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8)`,
        [randomUUID(), input.orderId, input.commandId, sequence.rows[0].sequence, JSON.stringify(input.representationA), JSON.stringify(input.representationB), JSON.stringify(input.validation), input.activeMs]);
      if (input.validation.shipmentAccepted) await client.query("UPDATE pvf_order SET status = 'resolved' WHERE id = $1", [input.orderId]);
      const revision = current.revision + 1;
      await client.query(`UPDATE pvf_attempt SET slot = $1, status = $2, revision = $3, writer_tab_id = $4, lease_expires_at = now() + interval '60 seconds', completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE NULL END WHERE id = $5`, [input.nextSlot, input.completed ? 'completed' : 'active', revision, input.tabId, input.attemptId]);
      if (input.evidence) await this.insertEvidence(client, input.actorId, input.orderId, input.evidence);
      await client.query('INSERT INTO pvf_command_receipt (actor_id, command_id, payload_hash, status, response) VALUES ($1, $2, $3, 200, $4::jsonb)', [input.actorId, input.commandId, input.payloadHash, JSON.stringify(input.receipt)]);
      await client.query('COMMIT');
      return { kind: 'committed', revision };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  private async insertEvidence(client: PoolClient, studentId: string, orderId: string, evidence: Omit<EvidenceRecord, 'committedAt'>) {
    await client.query(`INSERT INTO pvf_skill_evidence (id, student_id, order_id, skill_id, score, independent_first, signature, eligible, policy_version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'v1-local')`, [randomUUID(), studentId, orderId, evidence.skillId, evidence.score, evidence.independentFirst, evidence.signature, evidence.eligible ?? true]);
  }
}

export function postgresRepositoryFromEnvironment() {
  return process.env.DATABASE_URL ? PostgresGameRepository.fromDatabaseUrl(process.env.DATABASE_URL) : null;
}
