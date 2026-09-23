import { migrateDatabase } from "../../apps/server/src/migrations.js";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import {
  PostgresGameRepository,
  type PostgresResponseInput,
} from "../../apps/server/src/postgres.js";

const socket = process.env.PVF_TEST_PG_SOCKET;
describe.skipIf(!socket)("real PostgreSQL isolated cluster", () => {
  it.skipIf(process.env.PVF_TEST_PG_RESTART === "1")(
    "renews, reacquires and takes over leases atomically without replaying transitions",
    async () => {
      if (!socket?.startsWith("/tmp/pvf-postgres-test-"))
        throw new Error("Requires owned disposable test socket");
      const schema = `lease_${randomUUID().replaceAll("-", "")}`;
      const admin = new Pool({ host: socket, database: "postgres" });
      await admin.query(`CREATE SCHEMA ${schema}`);
      await admin.end();
      const pool = new Pool({
        host: socket,
        database: "postgres",
        options: `-c search_path=${schema}`,
      });
      const repository = PostgresGameRepository.fromPool(pool);
      try {
        await migrateDatabase(pool);
        const attemptId = randomUUID();
        await pool.query(
          "INSERT INTO pvf_game_profile(student_id) VALUES ('lease-student')",
        );
        await pool.query(
          "INSERT INTO pvf_attempt(id,student_id,level_id,seed,status,writer_tab_id,lease_expires_at) VALUES($1,'lease-student','level-1',1,'active','tab-a',now()+interval '60 seconds')",
          [attemptId],
        );
        const base = {
          actorId: "lease-student",
          attemptId,
          commandId: "heartbeat",
          payloadHash: "heartbeat-hash",
          expectedRevision: 0,
          tabId: "tab-a",
          leaseEpoch: 1,
        };
        const heartbeat = await repository.changeLease({
          ...base,
          action: "heartbeat",
        });
        expect(heartbeat).toMatchObject({
          kind: "committed",
          snapshot: { revision: 0, leaseEpoch: 1, writerTabId: "tab-a" },
        });
        expect(
          await repository.changeLease({ ...base, action: "heartbeat" }),
        ).toMatchObject({
          kind: "replay",
          body: heartbeat.kind === "committed" ? heartbeat.snapshot : null,
        });
        expect(
          await repository.changeLease({
            ...base,
            action: "heartbeat",
            payloadHash: "different",
          }),
        ).toMatchObject({ kind: "conflict", code: "IDEMPOTENCY_CONFLICT" });
        expect(
          await repository.changeLease({
            ...base,
            action: "heartbeat",
            actorId: "other-student",
          }),
        ).toMatchObject({ kind: "conflict", code: "ORDER_NOT_ACTIVE" });
        await pool.query(
          "UPDATE pvf_attempt SET lease_expires_at=now()-interval '1 second',status='paused'",
        );
        expect(
          await repository.changeLease({
            ...base,
            action: "heartbeat",
            commandId: "expired",
          }),
        ).toMatchObject({ kind: "conflict", code: "LEASE_LOST" });
        expect(
          await repository.changeLease({
            ...base,
            action: "resume",
            commandId: "foreign-resume",
            tabId: "tab-b",
          }),
        ).toMatchObject({ kind: "conflict", code: "LEASE_LOST" });
        expect(
          await repository.changeLease({
            ...base,
            action: "resume",
            commandId: "resume",
          }),
        ).toMatchObject({
          kind: "committed",
          snapshot: { revision: 1, leaseEpoch: 2, writerTabId: "tab-a" },
        });
        expect(
          (await pool.query("SELECT status FROM pvf_attempt")).rows[0].status,
        ).toBe("active");
        const takeover = {
          ...base,
          action: "takeover" as const,
          expectedRevision: 1,
          commandId: "takeover",
          payloadHash: "takeover-hash",
          tabId: "tab-b",
        };
        const races = await Promise.all(
          Array.from({ length: 6 }, () => repository.changeLease(takeover)),
        );
        expect(races.filter((r) => r.kind === "committed")).toHaveLength(1);
        expect(races.filter((r) => r.kind === "replay")).toHaveLength(5);
        expect(races.find((r) => r.kind === "committed")).toMatchObject({
          snapshot: { revision: 2, leaseEpoch: 3, writerTabId: "tab-b" },
        });
        expect(
          await repository.changeLease({
            ...base,
            action: "heartbeat",
            commandId: "old-writer",
            expectedRevision: 2,
            leaseEpoch: 2,
          }),
        ).toMatchObject({ kind: "conflict", code: "LEASE_LOST" });
        expect(
          await repository.changeLease({
            ...takeover,
            commandId: "stale-takeover",
            tabId: "tab-c",
          }),
        ).toMatchObject({
          kind: "conflict",
          code: "REVISION_CONFLICT",
          revision: 2,
        });
        expect(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM pvf_command_receipt",
            )
          ).rows[0].n,
        ).toBe(3);
      } finally {
        await repository.close();
      }
    },
  );

  it.skipIf(process.env.PVF_TEST_PG_RESTART === "1")(
    "upgrades populated v1 ownership without changing saved evidence",
    async () => {
      if (!socket?.startsWith("/tmp/pvf-postgres-test-"))
        throw new Error("Requires owned disposable test socket");
      const schema = `upgrade_${randomUUID().replaceAll("-", "")}`;
      const admin = new Pool({ host: socket, database: "postgres" });
      await admin.query(`CREATE SCHEMA ${schema}`);
      await admin.end();
      const pool = new Pool({
        host: socket,
        database: "postgres",
        options: `-c search_path=${schema}`,
      });
      try {
        await pool.query(
          await readFile(
            new URL(
              "../../db/migrations/001_place_value_factory.sql",
              import.meta.url,
            ),
            "utf8",
          ),
        );
        await pool.query(
          "CREATE TABLE pvf_schema_migration(filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
        );
        await pool.query(
          "INSERT INTO pvf_schema_migration(filename) VALUES ('001_place_value_factory.sql')",
        );
        await pool.query(
          "INSERT INTO pvf_game_profile(student_id) VALUES ('upgrade-student')",
        );
        const attemptId = randomUUID();
        await pool.query(
          "INSERT INTO pvf_attempt(id,student_id,level_id,seed,status,writer_tab_id,lease_expires_at) VALUES($1,'upgrade-student','level-1',1,'completed','tab',now())",
          [attemptId],
        );
        await pool.query(
          "INSERT INTO pvf_order(id,attempt_id,slot_index,spec,primary_skill,signature) VALUES('old-order',$1,0,'{\"target\":3}','pv.ones','old-signature')",
          [attemptId],
        );
        await pool.query(
          "INSERT INTO pvf_skill_evidence(id,student_id,order_id,skill_id,score,independent_first,signature,policy_version) VALUES($1,'upgrade-student','old-order','pv.ones',1,true,'old-signature','v1-local')",
          [randomUUID()],
        );
        const before = (await pool.query("SELECT * FROM pvf_skill_evidence"))
          .rows;
        expect(await migrateDatabase(pool)).toEqual([
          "002_ownership_integrity.sql",
        ]);
        expect(
          (await pool.query("SELECT student_id,spec FROM pvf_order")).rows,
        ).toEqual([{ student_id: "upgrade-student", spec: { target: 3 } }]);
        expect(
          (await pool.query("SELECT * FROM pvf_skill_evidence")).rows,
        ).toEqual(before);
        expect(await migrateDatabase(pool)).toEqual([]);
      } finally {
        await pool.end();
      }
    },
  );

  it("commits once, rolls back partial writes and retains data across connections", async () => {
    if (!socket?.startsWith("/tmp/pvf-postgres-test-"))
      throw new Error("Requires owned disposable test socket");
    const pool = new Pool({ host: socket, database: "postgres" });
    if (process.env.PVF_TEST_PG_RESTART === "1") {
      try {
        const schemas = await pool.query(
          "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'test_%'",
        );
        expect(schemas.rows).toHaveLength(1);
        const schema = schemas.rows[0].schema_name as string;
        if (!/^test_[a-f0-9]{32}$/.test(schema))
          throw new Error("Unexpected test schema");
        for (const table of [
          "pvf_response",
          "pvf_command_receipt",
          "pvf_skill_evidence",
        ]) {
          expect(
            (
              await pool.query(
                `SELECT count(*)::int AS n FROM ${schema}.${table}`,
              )
            ).rows[0].n,
          ).toBe(1);
        }
        expect(
          (await pool.query(`SELECT revision FROM ${schema}.pvf_attempt`))
            .rows[0].revision,
        ).toBe(1);
      } finally {
        await pool.end();
      }
      return;
    }
    const schema = `test_${randomUUID().replaceAll("-", "")}`;
    await pool.query(`CREATE SCHEMA ${schema}`);
    await pool.end();
    const isolated = new Pool({
      host: socket,
      database: "postgres",
      options: `-c search_path=${schema}`,
    });
    const repository = PostgresGameRepository.fromPool(isolated);
    try {
      expect(
        (
          await Promise.all([
            migrateDatabase(isolated),
            migrateDatabase(isolated),
          ])
        ).flat(),
      ).toEqual(["001_place_value_factory.sql", "002_ownership_integrity.sql"]);
      expect(await migrateDatabase(isolated)).toEqual([]);
      const attemptId = randomUUID();
      await isolated.query(
        "INSERT INTO pvf_game_profile(student_id) VALUES ('fictional-student')",
      );
      await isolated.query(
        "INSERT INTO pvf_attempt(id,student_id,level_id,seed,writer_tab_id,lease_expires_at,status) VALUES($1,'fictional-student','level-1',1,'tab',now()+interval '60 seconds','active')",
        [attemptId],
      );
      await isolated.query(
        "INSERT INTO pvf_order(id,attempt_id,student_id,slot_index,spec,primary_skill,signature) VALUES('order',$1,'fictional-student',0,'{}','pv.ones','one')",
        [attemptId],
      );
      const input: PostgresResponseInput = {
        actorId: "fictional-student",
        attemptId,
        orderId: "order",
        commandId: "answer",
        payloadHash: "hash",
        expectedRevision: 0,
        leaseEpoch: 1,
        tabId: "tab",
        representationA: [0, 0, 0, 0, 0, 3],
        representationB: null,
        activeMs: 0,
        validation: {
          schemaValid: true,
          valueMatches: true,
          restrictionsMet: true,
          objectiveMet: true,
          shipmentAccepted: true,
          representedTotals: [3],
          crateCounts: [3],
          minimumCrates: null,
          feedbackCode: "SHIPMENT_CORRECT",
        },
        nextSlot: 1,
        completed: false,
        receipt: { saved: true },
        evidence: {
          skillId: "pv.ones",
          score: 1,
          independentFirst: true,
          attemptId,
          signature: "one",
        },
      };
      // The invalid evidence fails after response/order/attempt writes, proving rollback.
      await isolated.query(
        "INSERT INTO pvf_game_profile(student_id) VALUES ('another-student')",
      );
      await expect(
        isolated.query(
          "INSERT INTO pvf_order(id,attempt_id,student_id,slot_index,spec,primary_skill,signature) VALUES('cross-owner',$1,'another-student',1,'{}','pv.ones','two')",
          [attemptId],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        isolated.query(
          "INSERT INTO pvf_skill_evidence(id,student_id,order_id,skill_id,score,independent_first,signature,policy_version) VALUES($1,'another-student','order','pv.ones',1,true,'one','v1-local')",
          [randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await isolated.query(
        "UPDATE pvf_attempt SET lease_expires_at = now() - interval '1 second'",
      );
      expect(await repository.persistResponse(input)).toMatchObject({
        kind: "conflict",
        code: "LEASE_LOST",
      });
      expect(
        await repository.persistResponse({ ...input, tabId: "new-writer" }),
      ).toMatchObject({ kind: "conflict", code: "LEASE_LOST" });
      await isolated.query(
        "UPDATE pvf_attempt SET lease_expires_at = now() + interval '60 seconds'",
      );
      await expect(
        repository.persistResponse({
          ...input,
          evidence: { ...input.evidence!, score: 2 },
        }),
      ).rejects.toThrow();
      expect(
        (await isolated.query("SELECT count(*)::int AS n FROM pvf_response"))
          .rows[0].n,
      ).toBe(0);
      expect(
        (await isolated.query("SELECT revision FROM pvf_attempt")).rows[0]
          .revision,
      ).toBe(0);
      const concurrent = await Promise.all(
        Array.from({ length: 6 }, () => repository.persistResponse(input)),
      );
      expect(
        concurrent.filter((result) => result.kind === "committed"),
      ).toHaveLength(1);
      expect(
        concurrent.filter((result) => result.kind === "replay"),
      ).toHaveLength(5);
      expect(await repository.persistResponse(input)).toMatchObject({
        kind: "replay",
      });
      expect(
        await repository.persistResponse({ ...input, payloadHash: "altered" }),
      ).toMatchObject({ kind: "conflict", code: "IDEMPOTENCY_CONFLICT" });
      expect(
        await repository.persistResponse({
          ...input,
          actorId: "another-student",
        }),
      ).toMatchObject({ kind: "conflict", code: "ORDER_NOT_ACTIVE" });
      expect(
        await repository.persistResponse({
          ...input,
          commandId: "stale-revision",
        }),
      ).toMatchObject({ kind: "conflict", code: "REVISION_CONFLICT" });
      expect(
        await repository.persistResponse({
          ...input,
          commandId: "stale-lease",
          expectedRevision: 1,
          leaseEpoch: 0,
        }),
      ).toMatchObject({ kind: "conflict", code: "LEASE_LOST" });
      const evidence = await repository.evidenceFor(
        "fictional-student",
        "pv.ones",
      );
      expect(evidence).toHaveLength(1);
      expect(evidence[0].committedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(
        await repository.evidenceFor("another-student", "pv.ones"),
      ).toEqual([]);
      const fresh = new Pool({
        host: socket,
        database: "postgres",
        options: `-c search_path=${schema}`,
      });
      try {
        expect(
          (await fresh.query("SELECT count(*)::int AS n FROM pvf_response"))
            .rows[0].n,
        ).toBe(1);
        expect(
          (
            await fresh.query(
              "SELECT count(*)::int AS n FROM pvf_command_receipt",
            )
          ).rows[0].n,
        ).toBe(1);
        expect(
          (
            await fresh.query(
              "SELECT count(*)::int AS n FROM pvf_skill_evidence",
            )
          ).rows[0].n,
        ).toBe(1);
      } finally {
        await fresh.end();
      }
    } finally {
      await repository.close();
    }
  });
});
