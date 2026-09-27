import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { classifyResponse, type ReportFacts } from "./reporting.js";
import type { Attempt, Store } from "./index.js";

type Context = {
  client: PoolClient;
  state?: Store;
  dirty: boolean;
  snapshotOnly: boolean;
  connectionWaitMs: number;
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
    const checkoutStarted = performance.now();
    const client = await this.pool.connect();
    const connectionWaitMs = performance.now() - checkoutStarted;
    try {
      // Fixed statements execute in the same order on PostgreSQL. One wire
      // request avoids three extra event-loop turns during historical reads.
      await client.query(snapshotOnly
        ? "BEGIN; SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='10s'"
        : "BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='10s'");
      if (!snapshotOnly) {
        if (studentLockId) {
          await client.query("SELECT pg_advisory_xact_lock_shared(736482902)");
          await client.query("SELECT pg_advisory_xact_lock(736482903,hashtext($1))", [studentLockId]);
        } else await client.query("SELECT pg_advisory_xact_lock(736482902)");
      }
      const context: Context = { client, dirty: false, snapshotOnly, connectionWaitMs };
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

  async load(studentIds?: string[], reportOnly = false, startCommandId?: string, summaryWindow?: {from: Date;to: Date;includeTransfer: boolean}): Promise<Store> {
    const context = this.requiredContext();
    if (context.state) return context.state;
    if (summaryWindow) return this.loadSummary(studentIds ?? [], summaryWindow);
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
      `SELECT o.id,o.attempt_id,o.spec,o.slot_index,o.replacement_index,o.role,o.status,f.change_id,
        r.order_id AS response_order_id,r.command_id,r.active_ms,r.representation_a,r.representation_b,r.validation,
        r.committed_at AS response_at,r.sequence,
        e.order_id AS evidence_order_id,e.skill_id,e.score,e.independent_first,e.signature,e.eligible,
        e.committed_at AS evidence_at
       FROM pvf_order o
       LEFT JOIN pvf_response r ON r.order_id=o.id
       LEFT JOIN pvf_skill_evidence e ON e.order_id=o.id
       LEFT JOIN pvf_report_order f ON f.order_id=o.id
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
        reportFactRevision: reportOnly ? (ordersByAttempt.get(row.id)??[]).filter((o)=>o.change_id).map((o)=>`${o.id}:${o.change_id}`).sort().join("|") : undefined,
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

  /** Profile fields depend on attempt metadata and evidence, never answer/receipt payloads. */
  async loadProfile(studentId: string): Promise<Store> {
    const context = this.requiredContext();
    if (!context.snapshotOnly) throw new Error("Profile reads require a read snapshot");
    const client = context.client;
    const profile = (await client.query("SELECT settings,certifications FROM pvf_game_profile WHERE student_id=$1", [studentId])).rows[0];
    const attempts = (await client.query("SELECT * FROM pvf_attempt WHERE student_id=$1 ORDER BY created_at,id", [studentId])).rows;
    const evidence = (await client.query(`SELECT e.*,o.attempt_id FROM pvf_skill_evidence e JOIN pvf_order o ON o.id=e.order_id
      WHERE e.student_id=$1 ORDER BY e.committed_at,e.id`, [studentId])).rows;
    const byAttempt = new Map<string, Attempt["evidence"]>();
    for (const e of evidence) {
      const records = byAttempt.get(e.attempt_id) ?? [];
      records.push({orderId:e.order_id,skillId:e.skill_id,score:Number(e.score),independentFirst:e.independent_first,
        attemptId:e.attempt_id,signature:e.signature,committedAt:iso(e.committed_at),eligible:e.eligible});
      byAttempt.set(e.attempt_id, records);
    }
    return { settings: {[studentId]:profile?.settings ?? {}}, certifications:{[studentId]:profile?.certifications ?? []},
      attempts:attempts.map((a)=>({id:a.id,studentId:a.student_id,levelId:a.level_id,seed:Number(a.seed),slot:a.slot,status:a.status,
        completed:a.status==="completed",revision:a.revision,leaseEpoch:a.lease_epoch,writerTabId:a.writer_tab_id,
        leaseExpiresAt:iso(a.lease_expires_at),createdAt:iso(a.created_at),kind:a.kind,transferStar:a.transfer_star,
        evidence:byAttempt.get(a.id)??[],responses:[],receipts:[],supportEvents:[]})) };
  }

  private async loadSummary(studentIds: string[], window: {from: Date;to: Date;includeTransfer: boolean}): Promise<Store> {
    const context = this.requiredContext();
    if (!context.snapshotOnly) throw new Error("Summary reads require a read snapshot");
    const started = performance.now();
    const payload = (await context.client.query(`WITH order_data AS MATERIALIZED (
        SELECT o.id AS order_id,o.student_id,o.attempt_id,o.primary_skill,o.role,
          (o.spec->>'canonicalRequired')::boolean AS canonical,jsonb_array_length(o.spec->'allowed') AS allowed_n,
          f.response_n,f.first_at,f.last_at,f.first_objective,f.first_value,f.accepted,f.change_id,
          e.id AS evidence_id,e.skill_id,e.score,e.independent_first,e.signature,e.eligible,e.committed_at
        FROM pvf_order o LEFT JOIN pvf_report_order f ON f.order_id=o.id LEFT JOIN pvf_skill_evidence e ON e.order_id=o.id
        WHERE o.student_id=ANY($1::text[]) AND (f.order_id IS NOT NULL OR e.id IS NOT NULL)
      ), support AS MATERIALIZED (
        SELECT s.order_id,o.attempt_id,count(*)::int AS event_n,bool_or(s.step='H1') AS h1,bool_or(s.step='H2') AS h2,bool_or(s.step='H3') AS h3
        FROM pvf_support_event s JOIN pvf_order o ON o.id=s.order_id WHERE o.student_id=ANY($1::text[]) GROUP BY s.order_id,o.attempt_id
      ), attempt_counts AS (
        SELECT attempt_id,sum(coalesce(response_n,0))::int AS response_n,count(evidence_id)::int AS evidence_n,max(last_at) AS last_at,
          string_agg(order_id||':'||change_id,'|' ORDER BY order_id COLLATE "C") FILTER(WHERE response_n IS NOT NULL) AS fact_revision
        FROM order_data GROUP BY attempt_id
      ), support_counts AS (
        SELECT attempt_id,sum(event_n)::int AS support_n FROM support GROUP BY attempt_id
      ), attempt_rows AS (
        SELECT a.*,coalesce(c.response_n,0) AS response_n,coalesce(c.evidence_n,0) AS evidence_n,
          coalesce(s.support_n,0) AS support_n,coalesce(c.fact_revision,'') AS fact_revision,c.last_at
        FROM pvf_attempt a LEFT JOIN attempt_counts c ON c.attempt_id=a.id LEFT JOIN support_counts s ON s.attempt_id=a.id
        WHERE a.student_id=ANY($1::text[]) ORDER BY a.created_at,a.id
      ), selected AS MATERIALIZED (
        SELECT * FROM order_data WHERE first_at >= $2 AND first_at < $3 AND ($4 OR (role<>'transfer' AND order_id NOT LIKE '%-transfer'))
      ), grouped_rows AS (
        SELECT d.student_id,d.primary_skill,count(*)::int AS submitted,
          count(*) FILTER(WHERE d.first_objective)::int AS objective,count(*) FILTER(WHERE d.first_value)::int AS value,
          count(*) FILTER(WHERE d.accepted)::int AS accepted,count(*) FILTER(WHERE NOT d.first_objective AND d.accepted)::int AS corrected,
          count(*) FILTER(WHERE NOT d.accepted AND d.evidence_id IS NULL)::int AS pending,
          count(*) FILTER(WHERE d.canonical)::int AS canonical,count(*) FILTER(WHERE d.allowed_n=1)::int AS single,
          count(*) FILTER(WHERE d.allowed_n<6)::int AS restricted,
          count(*) FILTER(WHERE s.h1)::int AS h1,count(*) FILTER(WHERE s.h2)::int AS h2,count(*) FILTER(WHERE s.h3)::int AS h3,
          (array_agg(d.order_id ORDER BY d.first_at DESC,d.order_id DESC) FILTER(WHERE d.independent_first))[1:2] AS independent_ids,
          (array_agg(d.order_id ORDER BY d.first_at DESC,d.order_id DESC) FILTER(WHERE NOT d.first_objective))[1:2] AS wrong_ids
        FROM selected d LEFT JOIN support s ON s.order_id=d.order_id GROUP BY d.student_id,d.primary_skill
      ), evidence_rows AS (
        SELECT order_id,student_id,skill_id,score,independent_first,signature,eligible,committed_at,attempt_id,
          (first_at >= $2 AND first_at < $3 AND ($4 OR (role<>'transfer' AND order_id NOT LIKE '%-transfer'))) AS in_window
        FROM order_data WHERE evidence_id IS NOT NULL AND eligible ORDER BY committed_at,order_id
      ), wrong_rows AS (
        SELECT d.order_id AS id,d.student_id,o.spec,r.representation_a,r.representation_b FROM selected d JOIN pvf_response r ON r.order_id=d.order_id
        JOIN pvf_order o ON o.id=d.order_id WHERE NOT (r.validation->>'objectiveMet')::boolean
      ) SELECT
        (SELECT coalesce(json_agg(p),'[]'::json) FROM (SELECT student_id,certifications FROM pvf_game_profile WHERE student_id=ANY($1::text[])) p) AS profiles,
        (SELECT coalesce(json_agg(a),'[]'::json) FROM attempt_rows a) AS attempts,
        (SELECT coalesce(json_agg(g),'[]'::json) FROM grouped_rows g) AS grouped,
        (SELECT coalesce(json_agg(e),'[]'::json) FROM evidence_rows e) AS evidence,
        (SELECT coalesce(json_agg(w),'[]'::json) FROM wrong_rows w) AS wrong`, [studentIds,window.from,window.to,window.includeTransfer])).rows[0];
    const durations = [performance.now()-started];
    const {profiles,attempts,grouped,evidence,wrong} = payload as Record<string, any[]>;
    // JSON timestamp text is normalized to exactly the same millisecond UTC
    // strings as the raw row adapter used by v1 and detail.
    for(const a of attempts) for(const key of ["created_at","lease_expires_at","last_at"])
      if(a[key]) a[key]=new Date(a[key]).toISOString();
    for(const e of evidence) e.committed_at=new Date(e.committed_at).toISOString();
    const facts: Record<string,ReportFacts> = Object.fromEntries(studentIds.map((id)=>[id,{orders:[],aggregate:{
      submittedN:0,firstObjectiveCorrectN:0,firstValueCorrectN:0,eventuallyCorrectN:0,correctionSuccessN:0,pendingN:0,
      targeted:{PLACE_SHIFT:0,ZERO_PLACEHOLDER:0,FACTOR_TEN:0,RENAMING_GAP:0},flags:{PLACE_SHIFT:0,ZERO_PLACEHOLDER:0,FACTOR_TEN:0,RENAMING_GAP:0},
      representatives:{},supportCounts:{H1:0,H2:0,H3:0},lastActivityAt:null,windowEvidence:[]}}]));
    for(const row of grouped) {
      const a=facts[row.student_id].aggregate!;
      a.submittedN+=row.submitted; a.firstObjectiveCorrectN+=row.objective; a.firstValueCorrectN+=row.value;
      a.eventuallyCorrectN+=row.accepted; a.correctionSuccessN+=row.corrected; a.pendingN+=row.pending;
      a.targeted.PLACE_SHIFT+=row.canonical; a.targeted.ZERO_PLACEHOLDER+=row.canonical;
      a.targeted.FACTOR_TEN+=row.single; a.targeted.RENAMING_GAP+=row.restricted;
      a.supportCounts.H1+=row.h1; a.supportCounts.H2+=row.h2; a.supportCounts.H3+=row.h3;
      a.representatives[row.primary_skill]={independent:row.independent_ids??[],wrong:row.wrong_ids??[]};
    }
    const flagged = new Set<string>();
    for(const row of wrong) for(const code of [...classifyResponse(row.spec,row.representation_a),...classifyResponse(row.spec,row.representation_b)]) {
      const key=`${row.id}:${code}`; if(!flagged.has(key)) { facts[row.student_id].aggregate!.flags[code]++; flagged.add(key); }
    }
    const evidenceByAttempt = new Map<string,Attempt["evidence"]>();
    for(const e of evidence) {
      const record = {orderId:e.order_id,skillId:e.skill_id,score:Number(e.score),independentFirst:e.independent_first,attemptId:e.attempt_id,
        signature:e.signature,committedAt:iso(e.committed_at),eligible:e.eligible};
      const records=evidenceByAttempt.get(e.attempt_id)??[]; records.push(record); evidenceByAttempt.set(e.attempt_id,records);
      if(e.in_window) facts[e.student_id].aggregate!.windowEvidence.push(record);
    }
    for(const a of attempts) if(a.last_at) {
      const aggregate=facts[a.student_id].aggregate!;const last=iso(a.last_at);
      if(!aggregate.lastActivityAt||last>aggregate.lastActivityAt) aggregate.lastActivityAt=last;
    }
    context.state = { reportReadDurations:durations, reportFacts:facts,certifications:Object.fromEntries(profiles.map((p)=>[p.student_id,p.certifications])),
      attempts:attempts.map((a)=>({id:a.id,studentId:a.student_id,levelId:a.level_id,seed:Number(a.seed),slot:a.slot,status:a.status,completed:a.status==="completed",
        revision:a.revision,leaseEpoch:a.lease_epoch,writerTabId:a.writer_tab_id,leaseExpiresAt:iso(a.lease_expires_at),createdAt:iso(a.created_at),kind:a.kind,
        transferStar:a.transfer_star,responses:[],supportEvents:[],receipts:[],evidence:evidenceByAttempt.get(a.id)??[],
        reportCounts:[a.response_n,a.support_n,a.evidence_n],reportFactRevision:a.fact_revision})) };
    return context.state;
  }

  connectionWaitMs() { return this.requiredContext().connectionWaitMs; }

  async studentAccess(studentIds: string[]): Promise<Record<string, boolean>> {
    const rows = (await this.requiredContext().client.query("SELECT student_id,access_enabled FROM pvf_game_profile WHERE student_id=ANY($1::text[])", [studentIds])).rows;
    return Object.fromEntries(rows.map((row) => [row.student_id, row.access_enabled]));
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
