import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { Attempt, Store } from "./index.js";

type Context = {
  client: PoolClient;
  state?: Store;
  dirty: boolean;
  snapshotOnly: boolean;
  originalAttempts?: Map<string, Attempt>;
  originalProfiles?: Map<string, string>;
  changedAttemptIds?: Set<string>;
};
const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : value;

/** Normalized SQL unit of work. Responses are released only after commit.
 * Student mutations share a global gate and serialize per student. Teacher and
 * operational mutations use the exclusive global gate so revocation cannot
 * race an already authenticated student write. GETs use repeatable-read.
 */
export class PostgresRuntimeStore {
  private context = new AsyncLocalStorage<Context>();
  constructor(private pool: Pool) {}

  async transaction<T>(operation: () => Promise<T>, snapshotOnly = false, studentLockId?: string): Promise<T> {
    if (!snapshotOnly) return this.transactionOnce(operation, false, studentLockId);
    for (let retry = 0; ; retry++) {
      try {
        return await this.transactionOnce(operation, true);
      } catch (error) {
        if ((error as { code?: string }).code !== "40001" || retry >= 2) throw error;
      }
    }
  }

  private async transactionOnce<T>(operation: () => Promise<T>, snapshotOnly: boolean, studentLockId?: string): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (snapshotOnly)
        await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
      await client.query("SET LOCAL lock_timeout='5s'");
      await client.query("SET LOCAL statement_timeout='10s'");
      if (!snapshotOnly) {
        if (studentLockId) {
          await client.query("SELECT pg_advisory_xact_lock_shared(736482902)");
          await client.query("SELECT pg_advisory_xact_lock(736482903,hashtext($1))", [studentLockId]);
        } else await client.query("SELECT pg_advisory_xact_lock(736482902)");
      }
      const context: Context = { client, dirty: false, snapshotOnly };
      const result = await this.context.run(context, operation);
      if (context.dirty && context.state)
        await this.persist(client, context.state, context);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async load(studentIds?: string[], reportOnly = false, startCommandId?: string): Promise<Store> {
    const context = this.requiredContext();
    if (context.state) return context.state;
    const client = context.client;
    const readRows = async (query: string, values: unknown[] = []) =>
      (await client.query(query, values)).rows;
    const scope = studentIds === undefined ? "" : " WHERE student_id=ANY($1::text[])";
    const params = studentIds === undefined ? [] : [studentIds];
    const profiles = await readRows(
        `SELECT student_id,settings,access_enabled,certifications FROM pvf_game_profile${scope}`,
        params,
      );
    const attempts = await readRows(`SELECT * FROM pvf_attempt${scope} ORDER BY created_at,id`, params);
    const attemptIds = attempts.map((row) => row.id);
    // A class report needs the exact issued spec, response history and evidence
    // for each order. Read those together so one row parser pass covers the
    // common one-response/one-evidence case, including skipped evidence.
    const reportRows = reportOnly ? await readRows(
      `SELECT o.id,o.attempt_id,o.spec,o.slot_index,o.replacement_index,o.role,o.status,
        r.order_id AS response_order_id,r.command_id,r.active_ms,r.representation_a,r.representation_b,r.validation,
        r.committed_at AS response_at,r.sequence,
        e.order_id AS evidence_order_id,e.skill_id,e.score,e.independent_first,e.signature,e.eligible,
        e.committed_at AS evidence_at
       FROM pvf_order o
       LEFT JOIN pvf_response r ON r.order_id=o.id
       LEFT JOIN pvf_skill_evidence e ON e.order_id=o.id
       WHERE o.attempt_id=ANY($1::uuid[])`,
      [attemptIds],
    ) : [];
    const orders = reportOnly
      ? [...new Map(reportRows.map((row) => [row.id, row])).values()]
      : await readRows("SELECT id,attempt_id,spec,slot_index,replacement_index,role,status FROM pvf_order WHERE attempt_id=ANY($1::uuid[]) ORDER BY attempt_id,slot_index,replacement_index,role", [attemptIds]);
    const byOrder = new Map(orders.map((row) => [row.id, row]));
    const activeAttemptIds = new Set(attempts.filter((row) => row.status !== "completed").map((row) => row.id));
    const responseOrderIds = startCommandId
      ? orders.filter((row) => activeAttemptIds.has(row.attempt_id)).map((row) => row.id)
      : orders.map((row) => row.id);
    const responses = reportOnly ? reportRows
      .filter((row) => row.response_order_id !== null)
      .map((row) => ({ ...row, order_id: row.response_order_id, committed_at: row.response_at }))
      .sort((a, b) => a.committed_at.getTime() - b.committed_at.getTime() || a.sequence - b.sequence)
      : await readRows(
        "SELECT * FROM pvf_response WHERE order_id=ANY($1::text[]) ORDER BY committed_at,sequence",
        [responseOrderIds],
      );
    const evidence = reportOnly
      ? [...new Map(reportRows.filter((row) => row.evidence_order_id !== null).map((row) => [row.evidence_order_id, row])).values()]
        .map((row) => ({ ...row, order_id: row.evidence_order_id, committed_at: row.evidence_at }))
      : await readRows(
        `SELECT * FROM pvf_skill_evidence${scope} ORDER BY committed_at,id`,
        params,
      );
    const receipts = reportOnly ? [] : await readRows(
        startCommandId
          ? "SELECT * FROM pvf_command_receipt WHERE actor_id=ANY($1::text[]) AND command_id=$2 ORDER BY committed_at,command_id"
          : `SELECT * FROM pvf_command_receipt${studentIds === undefined ? "" : " WHERE actor_id=ANY($1::text[])"} ORDER BY committed_at,command_id`,
        startCommandId ? [studentIds, startCommandId] : params,
      );
    const supports = await readRows(
        "SELECT * FROM pvf_support_event WHERE order_id=ANY($1::text[]) ORDER BY committed_at,step",
        [responseOrderIds],
      );
    const grouped = <T>(items: T[], key: (item: T) => string | undefined) => {
      const groups = new Map<string, T[]>();
      for (const item of items) {
        const id = key(item);
        if (id === undefined) continue;
        const list = groups.get(id) ?? [];
        list.push(item);
        groups.set(id, list);
      }
      return groups;
    };
    const ordersByAttempt = grouped(orders, (row) => row.attempt_id);
    const responsesByAttempt = grouped(responses, (row) => byOrder.get(row.order_id)?.attempt_id);
    const evidenceByAttempt = grouped(evidence, (row) => byOrder.get(row.order_id)?.attempt_id);
    const receiptsByAttempt = grouped(receipts, (row) => row.attempt_id ?? undefined);
    const supportsByAttempt = grouped(supports, (row) => byOrder.get(row.order_id)?.attempt_id);
    context.state = {
      settings: Object.fromEntries(
        profiles.map((row) => [row.student_id, row.settings]),
      ),
      studentAccess: Object.fromEntries(
        profiles.map((row) => [row.student_id, row.access_enabled]),
      ),
      certifications: Object.fromEntries(
        profiles.map((row) => [row.student_id, row.certifications]),
      ),
      attempts: attempts.map((row) => ({
        id: row.id,
        studentId: row.student_id,
        levelId: row.level_id,
        seed: Number(row.seed),
        slot: row.slot,
        status: row.status,
        completed: row.status === "completed",
        revision: row.revision,
        leaseEpoch: row.lease_epoch,
        writerTabId: row.writer_tab_id,
        leaseExpiresAt: iso(row.lease_expires_at),
        createdAt: iso(row.created_at),
        replacementIndex: row.replacement_index,
        skippedOrders: row.skipped_orders,
        kind: row.kind,
        practiceSkill: row.practice_skill ?? undefined,
        practiceSchedule: row.practice_schedule ?? undefined,
        awardedTier: row.awarded_tier ?? undefined,
        transferStar: row.transfer_star,
        activeOrder: reportOnly ? undefined : byOrder.get(row.active_order_id)?.spec,
        transferOrder: reportOnly ? undefined : byOrder.get(row.transfer_order_id)?.spec,
        issuedOrders: reportOnly ? [] : (ordersByAttempt.get(row.id) ?? [])
          .map((order) => ({
            spec: order.spec,
            slot: order.slot_index,
            replacement: order.replacement_index,
            role: order.role,
            status: order.status,
          })),
        responses: (responsesByAttempt.get(row.id) ?? [])
          .map((r) => ({
            commandId: r.command_id,
            activeMs: r.active_ms,
            order: byOrder.get(r.order_id)!.spec,
            representationA: r.representation_a,
            representationB: r.representation_b,
            validation: r.validation,
            at: iso(r.committed_at),
          })),
        evidence: (evidenceByAttempt.get(row.id) ?? [])
          .map((e) => ({
            orderId: e.order_id,
            skillId: e.skill_id,
            score: Number(e.score),
            independentFirst: e.independent_first,
            attemptId: row.id,
            signature: e.signature,
            committedAt: iso(e.committed_at),
            eligible: e.eligible,
          })),
        receipts: (receiptsByAttempt.get(row.id) ?? [])
          .map((r) => ({
            actorId: r.actor_id,
            commandId: r.command_id,
            payloadHash: r.payload_hash,
            status: r.status,
            body: r.response,
          })),
        supportEvents: (supportsByAttempt.get(row.id) ?? [])
          .map((s) => ({
            orderId: s.order_id,
            step: s.step,
            at: iso(s.committed_at),
          })),
      })),
    };
    if (!context.snapshotOnly) {
      context.originalAttempts = new Map(context.state.attempts.map((attempt) => [
        attempt.id,
        {
          ...attempt,
          issuedOrders: attempt.issuedOrders?.map((order) => ({ ...order })),
          responses: [...attempt.responses],
          evidence: [...attempt.evidence],
          receipts: [...attempt.receipts],
          supportEvents: [...attempt.supportEvents],
        },
      ]));
      context.originalProfiles = new Map(
        profiles.map((row) => [row.student_id, JSON.stringify([
          row.settings,
          row.access_enabled,
          row.certifications,
        ])]),
      );
    }
    return context.state;
  }

  async save(state: Store, changedAttemptId?: string) {
    const context = this.requiredContext();
    context.state = state;
    context.dirty = true;
    if (changedAttemptId) {
      context.changedAttemptIds ??= new Set();
      context.changedAttemptIds.add(changedAttemptId);
    }
  }

  private requiredContext() {
    const context = this.context.getStore();
    if (!context)
      throw new Error("Database operation outside request transaction");
    return context;
  }

  connection() {
    return this.requiredContext().client;
  }

  private async persist(client: PoolClient, state: Store, context: Context) {
    // Only persist changed entities. Rewriting every attempt on each command
    // held the mutation lock long enough to miss the 30-user API target.
    const studentIds = new Set([
      ...state.attempts.map((a) => a.studentId),
      ...Object.keys(state.settings ?? {}),
      ...Object.keys(state.studentAccess ?? {}),
    ]);
    for (const id of studentIds) {
      const currentProfile = JSON.stringify([
        state.settings?.[id] ?? {},
        state.studentAccess?.[id] !== false,
        state.certifications?.[id] ?? [],
      ]);
      if (context.originalProfiles?.get(id) === currentProfile) continue;
      await client.query(
        `INSERT INTO pvf_game_profile(student_id,settings,access_enabled,certifications) VALUES($1,$2::jsonb,$3,$4::jsonb)
        ON CONFLICT(student_id) DO UPDATE SET settings=EXCLUDED.settings,access_enabled=EXCLUDED.access_enabled,certifications=EXCLUDED.certifications,updated_at=now()`,
        [
          id,
          JSON.stringify(state.settings?.[id] ?? {}),
          state.studentAccess?.[id] !== false,
          JSON.stringify(state.certifications?.[id] ?? []),
        ],
      );
    }
    for (const attempt of state.attempts) {
      const original = context.originalAttempts?.get(attempt.id);
      if (context.changedAttemptIds) {
        if (!context.changedAttemptIds.has(attempt.id)) continue;
      } else if (original && JSON.stringify(original) === JSON.stringify(attempt)) continue;
      await this.persistAttempt(client, attempt, original);
    }
  }

  private async persistAttempt(client: PoolClient, attempt: Attempt, previous?: Attempt) {
    await client.query(
      `INSERT INTO pvf_attempt(id,student_id,level_id,seed,slot,status,revision,lease_epoch,writer_tab_id,lease_expires_at,created_at,kind,practice_skill,replacement_index,transfer_star,active_order_id,transfer_order_id,skipped_orders,awarded_tier,practice_schedule)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb)
      ON CONFLICT(id) DO UPDATE SET slot=EXCLUDED.slot,status=EXCLUDED.status,revision=EXCLUDED.revision,lease_epoch=EXCLUDED.lease_epoch,
      writer_tab_id=EXCLUDED.writer_tab_id,lease_expires_at=EXCLUDED.lease_expires_at,replacement_index=EXCLUDED.replacement_index,
      transfer_star=EXCLUDED.transfer_star,active_order_id=EXCLUDED.active_order_id,transfer_order_id=EXCLUDED.transfer_order_id,skipped_orders=EXCLUDED.skipped_orders,awarded_tier=EXCLUDED.awarded_tier,practice_schedule=EXCLUDED.practice_schedule`,
      [
        attempt.id,
        attempt.studentId,
        attempt.levelId,
        attempt.seed,
        attempt.slot,
        attempt.completed ? "completed" : (attempt.status ?? "active"),
        attempt.revision,
        attempt.leaseEpoch,
        attempt.writerTabId,
        attempt.leaseExpiresAt,
        attempt.createdAt,
        attempt.kind ?? "path",
        attempt.practiceSkill ?? null,
        attempt.replacementIndex ?? 0,
        attempt.transferStar ?? false,
        attempt.activeOrder?.id ?? null,
        attempt.transferOrder?.id ?? null,
        attempt.skippedOrders ?? 0,
        attempt.awardedTier ?? null,
        JSON.stringify(attempt.practiceSchedule ?? []),
      ],
    );
    const issued = new Map<
      string,
      {
        spec: NonNullable<Attempt["activeOrder"]>;
        slot: number;
        replacement: number;
        role: string;
        status: string;
      }
    >();
    let slot = 0;
    let replacement = 0;
    for (const response of attempt.responses) {
      if (!issued.has(response.order.id)) {
        const role = slot >= 5 ? "transfer" : "main";
        issued.set(response.order.id, {
          spec: response.order,
          slot: Math.min(slot, 4),
          replacement: replacement++,
          role,
          status: "skipped",
        });
      }
      if (
        response.validation.shipmentAccepted &&
        issued.get(response.order.id)!.status !== "resolved"
      ) {
        issued.get(response.order.id)!.status = "resolved";
        slot++;
      }
    }
    for (const [spec, role] of [
      [attempt.activeOrder, "main"],
      [attempt.transferOrder, "transfer"],
    ] as const) {
      if (spec && !issued.has(spec.id))
        issued.set(spec.id, {
          spec,
          slot: Math.min(attempt.slot, 4),
          replacement: replacement++,
          role,
          status: "active",
        });
      if (spec && (role === "transfer" || !attempt.completed))
        issued.get(spec.id)!.status = "active";
    }
    const previousOrders = new Map(previous?.issuedOrders?.map((item) => [item.spec.id, item.status]) ?? []);
    for (const [id, order] of issued) {
      if (previousOrders.get(id) === order.status) continue;
      await client.query(
        `INSERT INTO pvf_order(id,attempt_id,student_id,slot_index,replacement_index,role,status,spec,primary_skill,signature)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status`,
        [
          id,
          attempt.id,
          attempt.studentId,
          order.slot,
          order.replacement,
          order.role,
          order.status,
          JSON.stringify(order.spec),
          order.spec.primarySkill ?? "unknown",
          `${order.spec.target}:${order.spec.allowed.join(",")}:${order.spec.mode ?? ""}`,
        ],
      );
    }
    const previousSequences = new Map<string, number>();
    for (const response of previous?.responses ?? [])
      previousSequences.set(response.order.id, (previousSequences.get(response.order.id) ?? 0) + 1);
    const sequences = new Map<string, number>();
    for (const response of attempt.responses) {
      const sequence = sequences.get(response.order.id) ?? 0;
      sequences.set(response.order.id, sequence + 1);
      if (sequence < (previousSequences.get(response.order.id) ?? 0)) continue;
      await client.query(
        `INSERT INTO pvf_response(id,order_id,command_id,sequence,representation_a,representation_b,validation,committed_at,active_ms)
        VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9) ON CONFLICT(order_id,sequence) DO NOTHING`,
        [
          randomUUID(),
          response.order.id,
          response.commandId ?? `${response.order.id}:${sequence}`,
          sequence,
          JSON.stringify(response.representationA),
          JSON.stringify(response.representationB),
          JSON.stringify(response.validation),
          response.at,
          response.activeMs ?? 0,
        ],
      );
    }
    const previousEvidence = new Set(previous?.evidence.map((item) => item.orderId) ?? []);
    for (const evidence of attempt.evidence) {
      if (!evidence.orderId)
        throw new Error("Exact evidence order ownership required");
      if (previousEvidence.has(evidence.orderId)) continue;
      await client.query(
        `INSERT INTO pvf_skill_evidence(id,student_id,order_id,skill_id,score,independent_first,signature,eligible,committed_at,policy_version)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'v1-local') ON CONFLICT(order_id) DO NOTHING`,
        [
          randomUUID(),
          attempt.studentId,
          evidence.orderId,
          evidence.skillId,
          evidence.score,
          evidence.independentFirst,
          evidence.signature,
          evidence.eligible ?? true,
          evidence.committedAt,
        ],
      );
    }
    const previousSupport = new Set(previous?.supportEvents.map((item) => `${item.orderId}:${item.step}`) ?? []);
    for (const support of attempt.supportEvents) {
      if (previousSupport.has(`${support.orderId}:${support.step}`)) continue;
      await client.query(
        `INSERT INTO pvf_support_event(order_id,step,committed_at) VALUES($1,$2,$3) ON CONFLICT(order_id,step) DO NOTHING`,
        [support.orderId, support.step, support.at],
      );
    }
    const previousReceipts = new Set(previous?.receipts.map((item) => item.commandId) ?? []);
    for (const receipt of attempt.receipts) {
      if (previousReceipts.has(receipt.commandId)) continue;
      await client.query(
        `INSERT INTO pvf_command_receipt(actor_id,command_id,payload_hash,status,response,attempt_id)
      VALUES($1,$2,$3,$4,$5::jsonb,$6) ON CONFLICT(actor_id,command_id) DO NOTHING`,
        [
          receipt.actorId,
          receipt.commandId,
          receipt.payloadHash,
          receipt.status,
          JSON.stringify(receipt.body),
          attempt.id,
        ],
      );
    }
  }
}
