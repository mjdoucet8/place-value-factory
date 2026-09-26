import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { Attempt, Store } from "./index.js";

type Context = { client: PoolClient; state?: Store; dirty: boolean };
const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : value;

/** Normalized SQL unit of work. Responses are released only after commit.
 * The initial runtime serializes requests across processes with a transaction
 * advisory lock; profile-scoped optimization must preserve this atomic boundary.
 */
export class PostgresRuntimeStore {
  private context = new AsyncLocalStorage<Context>();
  constructor(private pool: Pool) {}

  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout='5s'");
      await client.query("SET LOCAL statement_timeout='10s'");
      await client.query("SELECT pg_advisory_xact_lock(736482902)");
      const context: Context = { client, dirty: false };
      const result = await this.context.run(context, operation);
      if (context.dirty && context.state)
        await this.persist(client, context.state);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async load(): Promise<Store> {
    const context = this.requiredContext();
    if (context.state) return context.state;
    const client = context.client;
    const profiles = (
      await client.query(
        "SELECT student_id,settings,access_enabled,certifications FROM pvf_game_profile",
      )
    ).rows;
    const attempts = (
      await client.query("SELECT * FROM pvf_attempt ORDER BY created_at,id")
    ).rows;
    const orders = (
      await client.query("SELECT id,attempt_id,spec,slot_index,replacement_index,role,status FROM pvf_order")
    ).rows;
    const byOrder = new Map(orders.map((row) => [row.id, row]));
    const responses = (
      await client.query(
        "SELECT * FROM pvf_response ORDER BY committed_at,sequence",
      )
    ).rows;
    const evidence = (
      await client.query(
        "SELECT * FROM pvf_skill_evidence ORDER BY committed_at,id",
      )
    ).rows;
    const receipts = (
      await client.query(
        "SELECT * FROM pvf_command_receipt ORDER BY committed_at,command_id",
      )
    ).rows;
    const supports = (
      await client.query(
        "SELECT * FROM pvf_support_event ORDER BY committed_at,step",
      )
    ).rows;
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
        activeOrder: byOrder.get(row.active_order_id)?.spec,
        transferOrder: byOrder.get(row.transfer_order_id)?.spec,
        issuedOrders: orders
          .filter((order) => order.attempt_id === row.id)
          .map((order) => ({
            spec: order.spec,
            slot: order.slot_index,
            replacement: order.replacement_index,
            role: order.role,
            status: order.status,
          })),
        responses: responses
          .filter((r) => byOrder.get(r.order_id)?.attempt_id === row.id)
          .map((r) => ({
            commandId: r.command_id,
            activeMs: r.active_ms,
            order: byOrder.get(r.order_id)!.spec,
            representationA: r.representation_a,
            representationB: r.representation_b,
            validation: r.validation,
            at: iso(r.committed_at),
          })),
        evidence: evidence
          .filter((e) => byOrder.get(e.order_id)?.attempt_id === row.id)
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
        receipts: receipts
          .filter((r) => r.attempt_id === row.id)
          .map((r) => ({
            actorId: r.actor_id,
            commandId: r.command_id,
            payloadHash: r.payload_hash,
            status: r.status,
            body: r.response,
          })),
        supportEvents: supports
          .filter((s) => byOrder.get(s.order_id)?.attempt_id === row.id)
          .map((s) => ({
            orderId: s.order_id,
            step: s.step,
            at: iso(s.committed_at),
          })),
      })),
    };
    return context.state;
  }

  async save(state: Store) {
    const context = this.requiredContext();
    context.state = state;
    context.dirty = true;
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

  private async persist(client: PoolClient, state: Store) {
    const studentIds = new Set([
      ...state.attempts.map((a) => a.studentId),
      ...Object.keys(state.settings ?? {}),
      ...Object.keys(state.studentAccess ?? {}),
    ]);
    for (const id of studentIds) {
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
    for (const attempt of state.attempts)
      await this.persistAttempt(client, attempt);
  }

  private async persistAttempt(client: PoolClient, attempt: Attempt) {
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
    for (const [id, order] of issued) {
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
    const sequences = new Map<string, number>();
    for (const response of attempt.responses) {
      const sequence = sequences.get(response.order.id) ?? 0;
      sequences.set(response.order.id, sequence + 1);
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
    for (const evidence of attempt.evidence) {
      if (!evidence.orderId)
        throw new Error("Exact evidence order ownership required");
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
    for (const support of attempt.supportEvents)
      await client.query(
        `INSERT INTO pvf_support_event(order_id,step,committed_at) VALUES($1,$2,$3) ON CONFLICT(order_id,step) DO NOTHING`,
        [support.orderId, support.step, support.at],
      );
    for (const receipt of attempt.receipts)
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
