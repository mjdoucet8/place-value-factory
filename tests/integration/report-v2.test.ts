import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { migrateDatabase } from "../../apps/server/src/migrations.js";
import { PostgresRuntimeStore } from "../../apps/server/src/runtime-store.js";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import type { AddressInfo } from "node:net";
import { createApiServer, type Attempt, type Store } from "../../apps/server/src/index.js";
import type { OrderSpec } from "../../packages/contracts/src/index.js";
import { validateRepresentation } from "../../packages/game-engine/src/index.js";

const golden = JSON.parse(
  readFileSync(new URL("../fixtures/report-v2.json", import.meta.url), "utf8"),
);
const socket = process.env.PVF_TEST_PG_SOCKET;
describe.each(socket ? ["json", "postgres"] : ["json"])(
  "versioned teacher reports (%s)",
  (backend) => {
    it("matches independent counts and v1, preserves first/final/supports, binds cursors and invalidates changed views", async () => {
      const directory = await mkdtemp(join(tmpdir(), "pvf-v2-"));
      const dataPath = join(directory, "fixture.json");
      let pool: Pool | undefined;
      if (backend === "postgres") {
        if (!socket?.startsWith("/tmp/pvf-postgres-test-"))
          throw new Error("Disposable cluster required");
        const schema = `report_${randomUUID().replaceAll("-", "")}`;
        const admin = new Pool({ host: socket, database: "postgres" });
        await admin.query(`CREATE SCHEMA ${schema}`);
        await admin.end();
        pool = new Pool({
          host: socket,
          database: "postgres",
          options: `-c search_path=${schema}`,
        });
        await migrateDatabase(pool);
        await pool.query(
          "INSERT INTO pvf_game_profile(student_id) VALUES('student-ava')",
        );
      }
      const at = "2026-09-26T10:00:00.000Z";
      const orders: OrderSpec[] = Array.from({ length: 61 }, (_, i) => ({
        id: `order-${String(i).padStart(3, "0")}${i === 60 ? "-transfer" : ""}`,
        target: 100,
        allowed: [100000, 10000, 1000, 100, 10, 1] as const,
        canonicalRequired: true,
        minimumRequired: false,
        exactTypes: null,
        distinctRepresentations: 1 as const,
        primarySkill: "pv.hundreds",
      }));
      orders[3] = {
        ...orders[3],
        mode: "twoWays",
        canonicalRequired: false,
        distinctRepresentations: 2,
      };
      const answer = (i: number, correct: boolean, time = at) => ({
        order: orders[i],
        representationA: correct ? [0, 0, 0, 1, 0, 0] : [0, 0, 0, 0, 0, 0],
        representationB: i === 3 ? [0, 0, 0, 0, 10, 0] : null,
        validation: validateRepresentation(
          orders[i],
          correct ? [0, 0, 0, 1, 0, 0] : [0, 0, 0, 0, 0, 0],
          i === 3 ? [0, 0, 0, 0, 10, 0] : null,
        ),
        at: time,
      });
      const attempts = orders.map((_, i) => ({
        id: randomUUID(),
        studentId: "student-ava",
        levelId: "level-1",
        seed: i + 1,
        slot: 1,
        completed: false,
        status: i === 1 ? "active" : "abandoned",
        revision: 1,
        leaseEpoch: 1,
        writerTabId: "fixture",
        leaseExpiresAt: at,
        createdAt: at,
        kind: "replay",
        responses: [answer(i, i > 2)],
        evidence: [],
        receipts: [],
        supportEvents:
          i === 0 ? [{ orderId: orders[i].id, step: "H2", at }] : [],
      })) as unknown as Attempt[];
      attempts[2].evidence.push({
        orderId: orders[2].id,
        skillId: "pv.hundreds",
        score: 0,
        independentFirst: false,
        attemptId: attempts[2].id,
        signature: "skipped",
        committedAt: at,
      });
      attempts[0].responses.push(answer(0, true, "2026-09-27T10:00:00.000Z"));
      attempts[0].evidence.push({
        orderId: orders[0].id,
        skillId: "pv.hundreds",
        score: 0.6,
        independentFirst: false,
        attemptId: attempts[0].id,
        signature: "correction",
        committedAt: "2026-09-27T10:00:00.000Z",
      });
      const save = async () => {
        if (!pool) return writeFile(dataPath, JSON.stringify({ attempts }));
        // Replace only this disposable fixture; production deletion is covered by operations-real.
        await pool.query("DELETE FROM pvf_attempt");
        const store = new PostgresRuntimeStore(pool);
        await store.transaction(() => store.save({ attempts }));
      };
      await save();
      const server = createApiServer(dataPath, {
        database: pool,
        now: () => new Date("2026-09-28T12:00:00Z"),
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const get = async (path: string, actor = "teacher-dev") => {
        const response = await fetch(base + path, {
          headers: { "x-session": actor },
        });
        return { status: response.status, body: await response.json() };
      };
      const filters = "from=2026-09-26T00:00:00Z&to=2026-09-27T00:00:00Z";
      const root =
        "/api/v2/teacher/students/student-ava/games/place-value-factory";
      try {
        const legacy = (
          await get(
            `/api/v1/teacher/students/student-ava/games/place-value-factory/report?${filters}`,
          )
        ).body;
        const summary = await get(`${root}/summary?${filters}`);
        expect(summary.status).toBe(200);
        if (pool) {
          const reader = new PostgresRuntimeStore(pool);
          const full = await reader.transaction(() => reader.load(["student-ava"]), true);
          const profile = await reader.transaction(() => reader.loadProfile("student-ava"), true);
          expect(profile.settings).toEqual(full.settings);
          expect(profile.certifications).toEqual(full.certifications);
          const profileFields = (state: Store) => state.attempts.map((a) => ({id:a.id,studentId:a.studentId,levelId:a.levelId,
            completed:a.completed,revision:a.revision,kind:a.kind,transferStar:a.transferStar,evidence:a.evidence}));
          expect(profileFields(profile)).toEqual(profileFields(full));
          const facts = (
            await pool.query("SELECT * FROM pvf_report_order ORDER BY order_id")
          ).rows;
          expect(facts).toHaveLength(61);
          expect(facts.reduce((n, row) => n + row.response_n, 0)).toBe(62);
          expect(facts[0]).toMatchObject({
            response_n: 2,
            first_objective: false,
            accepted: true,
          });
          await pool.query("DELETE FROM pvf_report_order");
          expect(
            (await pool.query("SELECT pvf_rebuild_report_orders() AS n"))
              .rows[0].n,
          ).toBe("61");
          const rebuiltFacts = (
            await pool.query("SELECT * FROM pvf_report_order ORDER BY order_id")
          ).rows;
          const withoutToken = (rows: any[]) =>
            rows.map(({ change_id, ...row }) => row);
          expect(withoutToken(rebuiltFacts)).toEqual(withoutToken(facts));
          expect(
            (
              await get(
                `${root}/evidence?${filters}&viewRevision=${summary.body.viewRevision}`,
              )
            ).status,
          ).toBe(409);
          const rebuiltSummary = (await get(`${root}/summary?${filters}`)).body;
          expect(rebuiltSummary).toEqual({
            ...summary.body,
            viewRevision: rebuiltSummary.viewRevision,
          });
          // Exercise invalidation independently of application writes, then restore the fixture.
          await pool.query(
            "DELETE FROM pvf_response WHERE order_id='order-000' AND sequence=1",
          );
          expect(
            (
              await pool.query(
                "SELECT response_n,accepted,first_objective FROM pvf_report_order WHERE order_id='order-000'",
              )
            ).rows[0],
          ).toEqual({ response_n: 1, accepted: false, first_objective: false });
          const beforeUpdate = (await get(`${root}/summary?${filters}`)).body
            .viewRevision;
          await pool.query(
            `UPDATE pvf_response SET validation=jsonb_set(validation,'{valueMatches}','true') WHERE order_id='order-001'`,
          );
          expect(
            (
              await pool.query(
                "SELECT first_value FROM pvf_report_order WHERE order_id='order-001'",
              )
            ).rows[0].first_value,
          ).toBe(true);
          expect(
            (
              await get(
                `${root}/evidence?${filters}&viewRevision=${beforeUpdate}`,
              )
            ).status,
          ).toBe(409);
          await save();
          summary.body = (await get(`${root}/summary?${filters}`)).body;
        }

        expect(summary.body).toMatchObject(golden.summaryCounts);
        const { evidence, asOf, ...legacySummary } = legacy;
        const {
          version,
          viewRevision,
          asOf: observed,
          includeTransfer,
          ...v2Summary
        } = summary.body;
        expect(v2Summary).toEqual(legacySummary);
        expect(summary.body.evidence).toBeUndefined();
        const collected: any[] = [];
        let cursor: string | null = null;
        let firstCursor = "";
        do {
          const page = await get(
            `${root}/evidence?${filters}&limit=7${cursor ? `&cursor=${cursor}` : `&viewRevision=${viewRevision}`}`,
          );
          expect(page.status).toBe(200);
          expect(page.body.totalN).toBe(60);
          collected.push(...page.body.evidence);
          cursor = page.body.nextCursor;
          firstCursor ||= cursor ?? "";
        } while (cursor);
        expect(collected).toEqual(
          [...evidence].sort(
            (a, b) =>
              a.firstResponse.at.localeCompare(b.firstResponse.at) ||
              a.orderId.localeCompare(b.orderId),
          ),
        );
        expect(new Set(collected.map((row) => row.orderId)).size).toBe(60);
        expect(collected[0]).toMatchObject(golden.firstEvidence);
        expect(collected[2].status).toBe("skipped");
        expect(collected[3].firstResponse.representationB).toEqual([
          0, 0, 0, 0, 10, 0,
        ]);
        expect(
          (
            await get(
              `${root}/evidence?${filters}&limit=7&cursor=${firstCursor}`,
              "teacher-other",
            )
          ).status,
        ).toBe(404);
        expect(
          (await get(`${root}/evidence?${filters}`, "student-ava")).status,
        ).toBe(403);
        expect(
          (
            await get(
              `${root}/evidence?${filters}&limit=8&cursor=${firstCursor}`,
            )
          ).status,
        ).toBe(422);
        expect(
          (
            await get(
              `${root}/evidence?${filters}&includeTransfer=true&limit=7&cursor=${firstCursor}`,
            )
          ).status,
        ).toBe(422);
        expect(
          (await get(`${root}/evidence?${filters}&cursor=invalid`)).status,
        ).toBe(422);
        expect((await get(`${root}/summary?${filters}&unknown=x`)).status).toBe(
          422,
        );
        expect(
          (await get(`${root}/summary?${filters}&limit=1&limit=2`)).status,
        ).toBe(422);
        expect(
          (await get(`${root}/summary?${filters}&includeTransfer=true`)).body
            .submittedN,
        ).toBe(61);
        expect(
          (await get(`${root}/summary?from=2000-01-01&to=2000-01-02`)).body,
        ).toMatchObject({
          submittedN: 0,
          firstObjectiveAccuracy: null,
          evidenceLabel: "No evidence",
        });
        const classPage = await get(
          `/api/v2/teacher/classes/class-demo/games/place-value-factory/summary?${filters}`,
        );
        expect(classPage.body.students[0].viewRevision).toBe(viewRevision);
        attempts[1].responses.push(answer(1, true, "2026-09-28T11:00:00Z"));
        attempts[1].revision++;
        await save();
        expect(
          (
            await get(
              `${root}/evidence?${filters}&limit=7&cursor=${firstCursor}`,
            )
          ).status,
        ).toBe(409);
        expect(
          (
            await get(
              `${root}/evidence?${filters}&viewRevision=${viewRevision}`,
            )
          ).status,
        ).toBe(409);
        expect((await get(`${root}/summary?${filters}`)).body).toMatchObject({
          eventuallyCorrectN: 59,
          correctionSuccessN: 2,
          pendingN: 0,
        });
        attempts.splice(0, 1);
        await save();
        expect((await get(`${root}/summary?${filters}`)).body.submittedN).toBe(
          59,
        );
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
        await pool?.end();
        await rm(directory, { recursive: true, force: true });
      }
    });
  },
);
