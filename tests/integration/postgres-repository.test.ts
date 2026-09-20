import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { newDb } from 'pg-mem';
import { describe, expect, it } from 'vitest';
import { PostgresGameRepository } from '../../apps/server/src/postgres.js';
import { summarizeMastery } from '../../packages/game-engine/src/index.js';

describe('PostgreSQL persistence repository', () => {
  it('persists one response, receipt, and adaptive evidence atomically', async () => {
    const database = newDb();
    const { Pool } = database.adapters.createPg();
    const pool = new Pool();
    const migration = await readFile(resolve('db/migrations/001_place_value_factory.sql'), 'utf8');
    await pool.query(migration);
    const attemptId = randomUUID();
    await pool.query("INSERT INTO pvf_game_profile (student_id) VALUES ('student-ava')");
    await pool.query("INSERT INTO pvf_attempt (id, student_id, level_id, seed, writer_tab_id, lease_expires_at, status) VALUES ($1, 'student-ava', 'level-1', 72, 'tab-a', now() + interval '60 seconds', 'active')", [attemptId]);
    await pool.query("INSERT INTO pvf_order (id, attempt_id, slot_index, spec, primary_skill, signature) VALUES ('order-1', $1, 0, '{}'::jsonb, 'pv.ones', 'signature-1')", [attemptId]);
    const repository = PostgresGameRepository.fromPool(pool as never);
    const input = { actorId: 'student-ava', attemptId, orderId: 'order-1', commandId: 'command-1', payloadHash: 'hash-1', expectedRevision: 0, leaseEpoch: 1, tabId: 'tab-a', representationA: [0, 0, 0, 0, 0, 3], representationB: null, activeMs: 0, validation: { schemaValid: true, valueMatches: true, restrictionsMet: true, objectiveMet: true, shipmentAccepted: true, representedTotals: [3], crateCounts: [3], minimumCrates: null, feedbackCode: 'SHIPMENT_CORRECT' as const }, nextSlot: 1, completed: false, receipt: { commandId: 'command-1' }, evidence: { skillId: 'pv.ones', score: 1, independentFirst: true, attemptId, signature: 'signature-1' } };
    expect(await repository.persistResponse(input)).toEqual({ kind: 'committed', revision: 1 });
    expect(await repository.persistResponse(input)).toMatchObject({ kind: 'replay' });
    const evidence = await repository.evidenceFor('student-ava', 'pv.ones');
    expect(evidence).toHaveLength(1);
    expect(summarizeMastery('pv.ones', evidence).sampleN).toBe(1);
    await repository.close();
  });
});
