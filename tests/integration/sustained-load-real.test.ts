import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { migrateDatabase } from "../../apps/server/src/migrations.js";
import { witnessFor } from "../../packages/game-engine/src/index.js";

const socket = process.env.PVF_TEST_PG_SOCKET;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.ceil(sorted.length * p / 100) - 1] ?? 0);
};
type Actor = { id: string; token: string; csrf: string; classId: string; profileRevision?: number };

describe.skipIf(!socket)("sustained fictional classroom with accumulated history", () => {
  it("keeps 90 students and reports consistent through historical practice and repeated live rounds", async () => {
    if (!socket?.startsWith("/tmp/pvf-postgres-test-")) throw new Error("Disposable socket required");
    const historyPerStudent = 10;
    const durationMs = 90_000;
    const schema = `sustained_${randomUUID().replaceAll("-", "")}`;
    const admin = new Pool({ host: socket, database: "postgres" });
    await admin.query(`CREATE SCHEMA ${schema}`);
    await admin.end();
    const pool = new Pool({ host: socket, database: "postgres", max: 35, options: `-c search_path=${schema}` });
    await migrateDatabase(pool);
    const teachers: Actor[] = [], students: Actor[] = [];
    for (let c = 0; c < 3; c++) {
      const id = randomUUID(), classId = randomUUID(), token = randomBytes(32).toString("base64url"), csrf = randomBytes(32).toString("base64url");
      await pool.query("INSERT INTO pvf_identity(id,role,username,credential_hash) VALUES($1,'teacher',$2,'fixture-only')", [id, `sustained-teacher-${c}`]);
      await pool.query("INSERT INTO pvf_class(id,teacher_id,name,timezone,code) VALUES($1,$2,$3,'UTC',$4)", [classId, id, `Fictional History ${c}`, `history${c}`]);
      await pool.query("INSERT INTO pvf_session(token_hash,actor_id,csrf_token) VALUES($1,$2,$3)", [digest(token), id, csrf]);
      teachers.push({ id, classId, token, csrf });
      for (let n = 0; n < 30; n++) {
        const studentId = randomUUID(), studentToken = randomBytes(32).toString("base64url"), studentCsrf = randomBytes(32).toString("base64url");
        await pool.query("INSERT INTO pvf_identity(id,role,username,credential_hash) VALUES($1,'student',$2,'fixture-only')", [studentId, `sustained-${c}-${n}`]);
        await pool.query("INSERT INTO pvf_student(id,class_id,username,alias) VALUES($1,$2,$3,$4)", [studentId, classId, `learner-${n}`, `Fictional ${n}`]);
        await pool.query("INSERT INTO pvf_game_profile(student_id) VALUES($1)", [studentId]);
        await pool.query("INSERT INTO pvf_session(token_hash,actor_id,csrf_token) VALUES($1,$2,$3)", [digest(studentToken), studentId, studentCsrf]);
        students.push({ id: studentId, classId, token: studentToken, csrf: studentCsrf });
      }
    }
    const receiptKey = randomBytes(32).toString("hex");
    const launch = async () => new Promise<{ child: ChildProcessWithoutNullStreams; base: string }>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", "tsx", "tests/integration/fixtures/sustained-api.ts"], {
        cwd: process.cwd(),
        env: { ...process.env, PVF_TEST_PG_SOCKET: socket, PVF_TEST_SCHEMA: schema, PVF_TEST_RECEIPT_KEY: receiptKey },
      });
      let output = "", errors = "";
      child.stdout.on("data", (chunk: Buffer) => {
        output += chunk.toString();
        const port = output.match(/SUSTAINED_PORT (\d+)/)?.[1];
        if (port) resolve({ child, base: `http://127.0.0.1:${port}/api/v1` });
      });
      child.stderr.on("data", (chunk: Buffer) => { errors += chunk.toString().slice(0, 2000); });
      child.once("exit", (code) => reject(new Error(`Sustained API fixture exited (${code}): ${errors}`)));
      child.once("error", reject);
    });
    const apiProcesses = await Promise.all(Array.from({ length: 3 }, () => launch()));
    const metrics: Record<string, number[]> = { profile: [], start: [], answer: [], retry: [], report: [] };
    const errors: { phase: string; status: number; body: unknown }[] = [];
    let requests = 0, lockWaitSamples = 0, polls = 0, peakRss = 0;
    const childRss = (pid: number | undefined) => {
      if (!pid) return 0;
      try { return Number(readFileSync(`/proc/${pid}/status`, "utf8").match(/^VmRSS:\s+(\d+) kB$/m)?.[1] ?? 0) * 1024; }
      catch { return 0; }
    };
    const sampler = setInterval(async () => {
      peakRss = Math.max(peakRss, process.memoryUsage().rss + apiProcesses.reduce((sum, api) => sum + childRss(api.child.pid), 0));
      try {
        const result = await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event='advisory' AND datname=current_database()");
        lockWaitSamples += result.rows[0].n;
        polls++;
      } catch { /* ancillary sampler */ }
    }, 50);
    const send = async (phase: keyof typeof metrics | "setup", path: string, actor: Actor, body?: Record<string, unknown>) => {
      const began = performance.now();
      const teacherIndex = teachers.findIndex((teacher) => teacher.id === actor.id);
      const worker = teacherIndex >= 0 ? teacherIndex : [...actor.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
      const destination = (worker + (phase === "retry" ? 1 : 0)) % 3;
      const base = apiProcesses[destination].base;
      const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { origin: "https://classroom.test", cookie: `pvf_session=${actor.token}`, "x-csrf-token": actor.csrf, "content-type": "application/json", ...(body?.commandId ? { "idempotency-key": String(body.commandId) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const payload = await response.json();
      if (phase !== "setup") { metrics[phase].push(performance.now() - began); requests++; }
      if (response.status >= 400) errors.push({ phase, status: response.status, body: payload });
      return { status: response.status, body: payload };
    };
    let command = 0;
    const next = () => `sustained-${++command}`;
    const start = async (student: Actor, kind: "path" | "practice" | "replay", phase: "start" | "setup") => {
      const profile = await send(phase === "start" ? "profile" : "setup", "/profile", student);
      const result = await send(phase, "/games/place-value-factory/attempts", student, { commandId: next(), profileRevision: profile.body.revision, tabId: student.id, levelId: "level-1", kind });
      expect(result.status, JSON.stringify(result.body)).toBe(201);
      return result.body;
    };
    const complete = async (student: Actor, initial: any, phase: "answer" | "setup", retry: boolean) => {
      let snapshot = initial;
      for (let slot = 0; slot < 5; slot++) {
        const order = snapshot.activeOrder;
        const body = { commandId: next(), expectedRevision: snapshot.revision, leaseEpoch: snapshot.leaseEpoch, tabId: student.id, representationA: witnessFor(order) };
        const path = `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${order.id}/responses`;
        const saved = await send(phase, path, student, body);
        expect(saved.status, JSON.stringify(saved.body)).toBe(200);
        expect(saved.body.validation.shipmentAccepted).toBe(true);
        if (retry && slot === 0) {
          const replay = await send("retry", path, student, body);
          expect(replay.body).toEqual(saved.body);
        }
        snapshot = saved.body.snapshot;
      }
      expect(snapshot.status).toBe("completed");
      return snapshot;
    };
    const waves = async (actors: Actor[], task: (actor: Actor) => Promise<unknown>) => {
      for (let offset = 0; offset < actors.length; offset += 30)
        await Promise.all(actors.slice(offset, offset + 30).map(task));
    };
    try {
      // Earn two attempts per student through the application before any history is seeded.
      await waves(students, async (student) => complete(student, await start(student, "path", "setup"), "setup", false));
      await waves(students, async (student) => complete(student, await start(student, "practice", "setup"), "setup", false));
      const earned = await pool.query("SELECT id,student_id FROM pvf_attempt WHERE kind='path' AND status='completed'");
      expect(earned.rowCount).toBe(90);
      // Historical replays are explicitly synthetic. They carry copies of genuine
      // issued questions/validated answers, but are not used as gate evidence.
      for (const source of earned.rows) {
        const orders = (await pool.query("SELECT * FROM pvf_order WHERE attempt_id=$1 ORDER BY slot_index", [source.id])).rows;
        const responses = (await pool.query("SELECT * FROM pvf_response WHERE order_id=ANY($1::text[])", [orders.map((order) => order.id)])).rows;
        const evidence = (await pool.query("SELECT * FROM pvf_skill_evidence WHERE order_id=ANY($1::text[])", [orders.map((order) => order.id)])).rows;
        for (let age = 1; age <= historyPerStudent; age++) {
          const attemptId = randomUUID();
          const at = new Date(Date.now() - age * 3 * 24 * 60 * 60 * 1000).toISOString();
          await pool.query(`INSERT INTO pvf_attempt(id,student_id,level_id,seed,slot,status,revision,lease_epoch,writer_tab_id,lease_expires_at,created_at,completed_at,kind)
            SELECT $1,student_id,level_id,seed,slot,'completed',revision,lease_epoch,'historical-fixture',$2,$2,$2,'replay' FROM pvf_attempt WHERE id=$3`, [attemptId, at, source.id]);
          for (const original of orders) {
            const orderId = `${attemptId}-${original.slot_index}-main`;
            const spec = { ...original.spec, id: orderId, attemptId };
            await pool.query(`INSERT INTO pvf_order(id,attempt_id,student_id,slot_index,replacement_index,role,status,spec,primary_skill,signature)
              VALUES($1,$2,$3,$4,$5,'main','resolved',$6::jsonb,$7,$8)`, [orderId, attemptId, source.student_id, original.slot_index, original.replacement_index, JSON.stringify(spec), original.primary_skill, original.signature]);
            const response = responses.find((item) => item.order_id === original.id);
            const skill = evidence.find((item) => item.order_id === original.id);
            await pool.query(`INSERT INTO pvf_response(id,order_id,command_id,sequence,representation_a,representation_b,validation,committed_at,active_ms)
              VALUES($1,$2,$3,0,$4::jsonb,$5::jsonb,$6::jsonb,$7,0)`, [randomUUID(), orderId, `historical-${orderId}`, JSON.stringify(response.representation_a), JSON.stringify(response.representation_b), JSON.stringify(response.validation), at]);
            if (skill) await pool.query(`INSERT INTO pvf_skill_evidence(id,student_id,order_id,skill_id,score,independent_first,signature,eligible,committed_at,policy_version)
              VALUES($1,$2,$3,$4,$5,$6,$7,false,$8,$9)`, [randomUUID(), source.student_id, orderId, skill.skill_id, skill.score, skill.independent_first, skill.signature, at, skill.policy_version]);
          }
        }
      }
      const seeded = (await pool.query("SELECT (SELECT count(*)::int FROM pvf_attempt) attempts,(SELECT count(*)::int FROM pvf_order) orders,(SELECT count(*)::int FROM pvf_response) answers,(SELECT count(*)::int FROM pvf_skill_evidence) evidence,pg_database_size(current_database())::bigint bytes")).rows[0];
      expect(seeded.attempts).toBe(90 * (2 + historyPerStudent));
      expect(seeded.answers).toBe(90 * (2 + historyPerStudent) * 5);
      console.log(`SUSTAINED_SEEDED ${JSON.stringify({ historyPerStudent, seeded, rssBytes: process.memoryUsage().rss })}`);
      const baselineRss = process.memoryUsage().rss + apiProcesses.reduce((sum, api) => sum + childRss(api.child.pid), 0);
      const began = performance.now();
      let rounds = 0;
      while (performance.now() - began < durationMs) {
        await Promise.all([
          waves(students, async (student) => complete(student, await start(student, "replay", "start"), "answer", true)),
          ...teachers.map((teacher) => send("report", `/teacher/classes/${teacher.classId}/games/place-value-factory/report?from=2026-01-01&to=2027-01-01`, teacher)),
        ]);
        rounds++;
      }
      const finalReports = await Promise.all(teachers.map((teacher) => send("report", `/teacher/classes/${teacher.classId}/games/place-value-factory/report?from=2026-01-01&to=2027-01-01`, teacher)));
      const finalCounts = (await pool.query("SELECT (SELECT count(*)::int FROM pvf_attempt) attempts,(SELECT count(*)::int FROM pvf_response) answers,(SELECT count(*)::int FROM pvf_command_receipt WHERE command_id LIKE 'sustained-%') receipts,pg_database_size(current_database())::bigint bytes")).rows[0];
      const studentCounts = finalReports.flatMap((report) => report.body.students.map((item: any) => item.submittedN));
      expect(finalReports.map((report) => report.status)).toEqual([200, 200, 200]);
      expect(finalReports.map((report) => report.body.students.length)).toEqual([30, 30, 30]);
      for (let index = 0; index < teachers.length; index++) {
        const expected = new Set(students.filter((item) => item.classId === teachers[index].classId).map((item) => item.id));
        expect(new Set(finalReports[index].body.students.map((item: any) => item.studentId))).toEqual(expected);
      }
      expect(studentCounts).toEqual(Array(90).fill((2 + historyPerStudent + rounds) * 5));
      expect(finalCounts.attempts).toBe(90 * (2 + historyPerStudent + rounds));
      expect(finalCounts.answers).toBe(90 * (2 + historyPerStudent + rounds) * 5);
      expect(finalCounts.receipts).toBe(90 * (2 + rounds) * 6);
      const rewardProfiles = await Promise.all(students.map((student) => send("setup", "/profile", student)));
      expect(rewardProfiles.every((profile) => profile.status === 200 && profile.body.totalStars === 2)).toBe(true);
      expect(errors).toEqual([]);
      const elapsedMs = performance.now() - began;
      const summary = Object.fromEntries(Object.entries(metrics).map(([phase, times]) => [phase, { count: times.length, p50Ms: percentile(times, 50), p95Ms: percentile(times, 95), p99Ms: percentile(times, 99), maxMs: Math.round(Math.max(...times)) }]));
      console.log(`SUSTAINED_LOAD_METRICS ${JSON.stringify({ students: 90, concurrency: 30, apiProcesses: apiProcesses.length, historyPerStudent, seeded, durationTargetMs: durationMs, measuredMs: Math.round(elapsedMs), rounds, requests, throughputRps: Math.round(requests / elapsedMs * 1000), errors: errors.length, lockWaitSamples, polls, baselineRss, peakRss, memoryScope: "load client plus API workers; excludes PostgreSQL", finalCounts, metrics: summary })}`);
      for (const [phase, times] of Object.entries(metrics)) expect(percentile(times, 95), `${phase} p95`).toBeLessThan(500);
    } finally {
      clearInterval(sampler);
      await Promise.all(apiProcesses.map(async ({ child }) => {
        if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
      }));
      await pool.end();
    }
  }, 900_000);
});
