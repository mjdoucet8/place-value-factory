import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createApiServer } from "../../apps/server/src/index.js";
import { migrateDatabase } from "../../apps/server/src/migrations.js";
import { alternateWitnessFor, witnessFor } from "../../packages/game-engine/src/index.js";
import { STAGE_GATE_SKILLS } from "../../packages/config/src/index.js";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";

const socket = process.env.PVF_TEST_PG_SOCKET;
const student = "student-ava";
const tabId = "rc07-journey-tab";
const canonical = (target: number) => {
  let remaining = target;
  return [100000, 10000, 1000, 100, 10, 1].map((place) => {
    const quantity = Math.floor(remaining / place);
    remaining %= place;
    return quantity;
  });
};

describe.skipIf(!socket)("RC-07 real PostgreSQL progression journey", () => {
  it("practices a real stage gate, unlocks Stage 2, earns transfer, and reconciles after restart", async () => {
    if (!socket?.startsWith("/tmp/pvf-postgres-test-"))
      throw new Error("Requires owned disposable test socket");
    const admin = new Pool({ host: socket, database: "postgres" });
    let schema: string;
    if (process.env.PVF_TEST_PG_RESTART === "1") {
      const found = await admin.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'rc07journey_%'",
      );
      expect(found.rows).toHaveLength(1);
      schema = found.rows[0].schema_name;
      if (!/^rc07journey_[a-f0-9]{32}$/.test(schema))
        throw new Error("Unexpected RC-07 journey schema");
    } else {
      schema = `rc07journey_${randomUUID().replaceAll("-", "")}`;
      await admin.query(`CREATE SCHEMA ${schema}`);
    }
    await admin.end();
    const pool = new Pool({
      host: socket,
      database: "postgres",
      options: `-c search_path=${schema}`,
    });
    await migrateDatabase(pool);
    const now = { value: new Date("2026-09-26T12:00:00.000Z") };
    const server = createApiServer("/nonexistent/rc07-test.json", {
      database: pool,
      now: () => new Date(now.value),
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    let commandIndex = 0;
    const request = async (path: string, body?: any, actor = student) => {
      const response = await fetch((path.startsWith("/v2/") ? base.replace(/\/v1$/, "") : base) + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "content-type": "application/json",
          "x-session": actor,
          ...(body?.commandId ? { "idempotency-key": body.commandId } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: (await response.json()) as any };
    };
    const command = (prefix: string) => `${prefix}-${++commandIndex}`;
    const startAttempt = async (levelId: string, kind?: "practice") => {
      const profile = await request("/profile");
      expect(profile.status, JSON.stringify(profile.body)).toBe(200);
      const commandId = command("start");
      const started = await request("/games/place-value-factory/attempts", {
        commandId,
        profileRevision: profile.body.revision,
        tabId,
        levelId,
        ...(kind ? { kind } : {}),
      });
      expect(started.status).toBe(201);
      return started.body;
    };
    const ship = async (snapshot: any, representation?: number[], representationB?: number[]) => {
      const order = snapshot.activeOrder;
      const body = {
        commandId: command("response"),
        expectedRevision: snapshot.revision,
        leaseEpoch: snapshot.leaseEpoch,
        tabId,
        representationA: representation ?? canonical(order.target),
        representationB: representationB ?? null,
      };
      const saved = await request(
        `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${order.id}/responses`,
        body,
      );
      expect(saved.status, JSON.stringify({ levelId: snapshot.levelId, skill: order.primarySkill, body: saved.body })).toBe(200);
      return saved.body;
    };
    const finishFive = async (initial: any) => {
      let snapshot = initial;
      while (!snapshot.completed && snapshot.shippedSlots < 5) {
        const saved = await ship(snapshot);
        snapshot = saved.snapshot;
      }
      expect(snapshot).toMatchObject({ status: "completed", shippedSlots: 5 });
      return snapshot;
    };
    const finishObjectives = async (initial: any) => {
      let snapshot = initial;
      while (snapshot.status !== "completed") {
        const order = snapshot.activeOrder;
        const first = witnessFor(order);
        const second = alternateWitnessFor(order);
        if (snapshot.kind === "path" && order.primarySkill === "reason.multiple") {
          const initial = await ship(snapshot, [...first], [...first]);
          expect(initial.validation).toMatchObject({ valueMatches: true, objectiveMet: false, shipmentAccepted: false });
          snapshot = initial.snapshot;
        }
        let answer = [...first];
        if (snapshot.levelId === "level-16" && snapshot.kind === "path" && snapshot.shippedSlots === 0) {
          const large = order.allowed.find((place: number) => first[[100000, 10000, 1000, 100, 10, 1].indexOf(place)] > 0);
          const small = [...order.allowed].reverse().find((place: number) => large && place < large && large % place === 0);
          expect(large).toBeDefined();
          expect(small).toBeDefined();
          const largeIndex = [100000, 10000, 1000, 100, 10, 1].indexOf(large!);
          const smallIndex = [100000, 10000, 1000, 100, 10, 1].indexOf(small!);
          answer[largeIndex]--;
          answer[smallIndex] += large! / small!;
          expect(answer.reduce((sum, n) => sum + n, 0)).toBeGreaterThan(first.reduce((sum, n) => sum + n, 0));
        }
        const saved = await ship(snapshot, answer, second ? [...second] : undefined);
        expect(saved.validation.shipmentAccepted, JSON.stringify({ levelId: snapshot.levelId, order })).toBe(true);
        snapshot = saved.snapshot;
      }
      expect(snapshot.shippedSlots).toBe(5);
      return snapshot;
    };

    try {
      if (process.env.PVF_TEST_PG_RESTART !== "1") {
        // Finish the Stage 1 path using only issued HTTP orders and solved vectors.
        for (let level = 1; level <= 4; level++)
          await finishFive(await startAttempt(`level-${level}`));
        expect((await request("/profile")).body.highestUnlockedLevelId).toBe(
          "level-4",
        );

        // Real practice attempts are separated by more than the signature
        // deduplication window. Nothing writes evidence or progression directly.
        let progress = await request("/games/place-value-factory/progress");
        expect(progress.status).toBe(200);
        let attempts = 0;
        while (
          progress.body.skills
            .filter((skill: any) =>
              [
                "pv.ones",
                "pv.tens",
                "pv.hundreds",
                "pv.thousands",
                "pv.tenThousands",
                "pv.hundredThousands",
              ].includes(skill.skillId),
            )
            .some((skill: any) => skill.status !== "secure") &&
          attempts < 160
        ) {
          const training = await startAttempt("level-1", "practice");
          expect(training.kind).toBe("practice");
          const skillId = training.activeOrder.primarySkill;
          expect(skillId).toMatch(/^pv\./);
          const completed = await finishFive(training);
          expect(completed.kind).toBe("practice");
          now.value = new Date(now.value.getTime() + 25 * 60 * 60 * 1000);
          progress = await request("/games/place-value-factory/progress");
          attempts++;
        }
        expect(attempts).toBeLessThan(160);
        const gate = progress.body.skills.filter((skill: any) =>
          [
            "pv.ones",
            "pv.tens",
            "pv.hundreds",
            "pv.thousands",
            "pv.tenThousands",
            "pv.hundredThousands",
          ].includes(skill.skillId),
        );
        expect(gate).toHaveLength(6);
        expect(gate.every((skill: any) => skill.status === "secure")).toBe(
          true,
        );
        expect((await request("/profile")).body.highestUnlockedLevelId).toBe(
          "level-5",
        );

        const levelFive = await startAttempt("level-5");
        expect(levelFive.levelId).toBe("level-5");
        expect(levelFive.kind).toBe("path");
        let snapshot = levelFive;
        // A mathematically equivalent representation has correct value but
        // misses the canonical objective. Keep it as immutable first evidence,
        // then solve the same issued order correctly.
        const order = snapshot.activeOrder;
        const allOnes = [0, 0, 0, 0, 0, order.target];
        const equivalent = await ship(snapshot, allOnes);
        expect(equivalent.validation).toMatchObject({
          valueMatches: true,
          objectiveMet: false,
          shipmentAccepted: false,
        });
        snapshot = equivalent.snapshot;
        const corrected = await ship(snapshot);
        expect(corrected.validation).toMatchObject({
          valueMatches: true,
          objectiveMet: true,
          shipmentAccepted: true,
        });
        snapshot = corrected.snapshot;
        while (snapshot.status !== "completed") {
          const saved = await ship(snapshot);
          snapshot = saved.snapshot;
        }
        expect(snapshot).toMatchObject({
          status: "completed",
          shippedSlots: 5,
        });

        const transferCommand = command("transfer");
        const transferStart = await request(
          `/games/place-value-factory/attempts/${snapshot.attemptId}/transfer`,
          {
            commandId: transferCommand,
            expectedRevision: snapshot.revision,
            leaseEpoch: snapshot.leaseEpoch,
            tabId,
          },
        );
        expect(transferStart.status).toBe(200);
        const transferSnapshot = transferStart.body.snapshot;
        const transferSaved = await ship(transferSnapshot);
        expect(transferSaved.validation.shipmentAccepted).toBe(true);
        const result = await request(
          `/games/place-value-factory/attempts/${snapshot.attemptId}/results`,
        );
        expect(result.status).toBe(200);
        expect(result.body).toMatchObject({
          mainStars: 2,
          transferStar: true,
          bestLevelStars: 3,
          firstValueCorrect: 5,
          firstObjectiveCorrect: 4,
          eventuallyCorrect: 5,
        });
        const mainOrders = await pool.query(
          "SELECT id,spec FROM pvf_order WHERE attempt_id=$1 AND role='main' ORDER BY slot_index",
          [snapshot.attemptId],
        );
        expect(mainOrders.rows).toHaveLength(5);
        for (const [slot, row] of mainOrders.rows.entries())
          expect(row.spec).toMatchObject({
            attemptId: snapshot.attemptId,
            slotIndex: slot,
            role: "main",
            configVersion: "v1-local",
            engineVersion: "xorshift32-v1",
            seed: expect.any(Number),
          });
        const transferRows = await pool.query(
          "SELECT id FROM pvf_order WHERE attempt_id=$1 AND role='transfer'",
          [snapshot.attemptId],
        );
        expect(transferRows.rows).toHaveLength(1);
        const responses = await pool.query(
          "SELECT order_id,representation_a,validation FROM pvf_response WHERE order_id = ANY($1::text[]) ORDER BY sequence",
          [mainOrders.rows.map((row) => row.id)],
        );
        const firstOrderResponses = responses.rows.filter(
          (row) => row.order_id === mainOrders.rows[0].id,
        );
        expect(firstOrderResponses).toHaveLength(2);
        expect(firstOrderResponses[0].validation).toMatchObject({
          valueMatches: true,
          objectiveMet: false,
        });
        expect(firstOrderResponses[1].validation).toMatchObject({
          valueMatches: true,
          objectiveMet: true,
        });
        const secureGate = async (stage: number, nextLevel: number | null) => {
          const required = STAGE_GATE_SKILLS[stage];
          for (let tries = 0; tries < 100; tries++) {
            const progress = await request("/games/place-value-factory/progress");
            expect(progress.status).toBe(200);
            const bySkill = new Map(progress.body.skills.map((entry: any) => [entry.skillId, entry.status]));
            const profile = await request("/profile");
            const ready = required.every((id) => bySkill.get(id) === "secure");
            const unlocked = nextLevel === null || Number(profile.body.highestUnlockedLevelId.slice(6)) >= nextLevel;
            if (ready && unlocked) {
              expect(profile.body.certifications).toContain(`stage-${stage}`);
              return tries;
            }
            const practice = await startAttempt(`level-${Math.max(1, nextLevel === null ? 30 : nextLevel - 1)}`, "practice");
            await finishObjectives(practice);
            now.value = new Date(now.value.getTime() + 25 * 60 * 60 * 1000);
          }
          throw new Error(`Stage ${stage} gate unreachable through practice`);
        };
        const boundaryStages = new Map([[10, 2], [16, 3], [19, 4], [22, 5]]);
        for (let level = 6; level <= 30; level++) {
          const previousStage = boundaryStages.get(level);
          if (previousStage) await secureGate(previousStage, level);
          await finishObjectives(await startAttempt(`level-${level}`));
        }
        expect(await secureGate(6, null)).toBeGreaterThan(0);
        const finalProfile = await request("/profile");
        expect(finalProfile.body.certifications).toEqual(expect.arrayContaining([
          "stage-1", "stage-2", "stage-3", "stage-4", "stage-5", "stage-6",
        ]));
        const pendingReplay = await startAttempt("level-1");
        expect(pendingReplay.kind).toBe("replay");
        expect(pendingReplay.activeOrder).toHaveProperty("target");
      } else {
        // This branch runs after pg_ctl restart against the same schema.
        const profile = await request("/profile");
        expect(profile.status).toBe(200);
        expect(profile.body).toMatchObject({
          highestUnlockedLevelId: "level-30",
          certifications: expect.arrayContaining(["stage-1", "stage-2", "stage-3", "stage-4", "stage-5", "stage-6"]),
          totalStars: 61,
        });
        const savedPractice = await pool.query(
          "SELECT practice_schedule FROM pvf_attempt WHERE kind='practice' ORDER BY created_at LIMIT 1",
        );
        expect(savedPractice.rows[0].practice_schedule).toHaveLength(5);
        const pending = await pool.query(
          "SELECT id,active_order_id FROM pvf_attempt WHERE kind='replay' AND status='active' ORDER BY created_at DESC LIMIT 1",
        );
        expect(pending.rows).toHaveLength(1);
        const pendingSpec = await pool.query("SELECT spec FROM pvf_order WHERE id=$1", [pending.rows[0].active_order_id]);
        const restored = await request(`/games/place-value-factory/attempts/${pending.rows[0].id}`);
        expect(restored.status).toBe(200);
        expect(restored.body.activeOrder).toMatchObject({
          id: pendingSpec.rows[0].spec.id,
          target: pendingSpec.rows[0].spec.target,
          allowed: pendingSpec.rows[0].spec.allowed,
          primarySkill: pendingSpec.rows[0].spec.primarySkill,
        });
        expect(restored.body.activeOrder.seed).toBeUndefined();
        const attempt = await pool.query(
          "SELECT id FROM pvf_attempt WHERE student_id=$1 AND level_id='level-5' AND status='completed' ORDER BY created_at DESC LIMIT 1",
          [student],
        );
        expect(attempt.rows).toHaveLength(1);
        const result = await request(
          `/games/place-value-factory/attempts/${attempt.rows[0].id}/results`,
        );
        expect(result.status).toBe(200);
        expect(result.body).toMatchObject({
          transferStar: true,
          bestLevelStars: 3,
          firstValueCorrect: 5,
          firstObjectiveCorrect: 4,
          eventuallyCorrect: 5,
        });
        const report = await request(
          "/teacher/classes/class-demo/games/place-value-factory/report?from=2026-09-01&to=2027-12-31",
          undefined,
          "teacher-dev",
        );
        expect(report.status).toBe(200);
        const ava = report.body.students.find(
          (entry: any) => entry.studentId === student,
        );
        expect(ava).toMatchObject({
          submittedN: expect.any(Number),
          firstValueCorrectN: expect.any(Number),
          firstObjectiveCorrectN: expect.any(Number),
          eventuallyCorrectN: expect.any(Number),
        });
        const compact = await request("/v2/teacher/classes/class-demo/games/place-value-factory/summary?from=2026-09-01&to=2027-12-31",undefined,"teacher-dev");
        expect(compact.status).toBe(200);
        const {evidence: fullEvidence,...legacyCounts}=ava;
        const {viewRevision,...summaryCounts}=compact.body.students.find((entry:any)=>entry.studentId===student);
        expect(summaryCounts).toEqual(legacyCounts);
        const pages:any[]=[];let cursor:string|null=null;
        do {
          const page=await request(`/v2/teacher/students/${student}/games/place-value-factory/evidence?from=2026-09-01&to=2027-12-31&viewRevision=${viewRevision}${cursor?`&cursor=${encodeURIComponent(cursor)}`:""}`,undefined,"teacher-dev");
          expect(page.status).toBe(200);pages.push(...page.body.evidence);cursor=page.body.nextCursor;
        } while(cursor);
        expect(pages).toEqual([...fullEvidence].sort((a:any,b:any)=>a.firstResponse.at.localeCompare(b.firstResponse.at)||a.orderId.localeCompare(b.orderId)));
        expect(ava.submittedN).toBeGreaterThanOrEqual(45);
        expect(ava.firstValueCorrectN).toBe(ava.submittedN);
        expect(ava.firstObjectiveCorrectN).toBeLessThan(ava.submittedN);
        expect(ava.eventuallyCorrectN).toBe(ava.submittedN);
        const corrected = ava.evidence.find((entry: any) => entry.firstResponse?.order?.id?.includes("level-5") && entry.firstResponse?.validation?.objectiveMet === false);
        expect(corrected).toBeDefined();
        expect(corrected.firstResponse.representationA).not.toEqual(corrected.finalResponse.representationA);
        expect(corrected.finalResponse.validation.shipmentAccepted).toBe(true);
        const restricted = ava.evidence.find((entry: any) => entry.firstResponse?.order?.mode === "restricted" && entry.firstResponse?.order?.id?.includes("level-16"));
        expect(restricted?.accepted).toBe(true);
        const transfer = await pool.query(
          "SELECT count(*)::int AS n FROM pvf_order WHERE role='transfer'",
        );
        expect(transfer.rows[0].n).toBe(1);
      }
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pool.end();
    }
  }, 600_000);
});
