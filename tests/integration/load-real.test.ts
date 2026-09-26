import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { performance } from "node:perf_hooks";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { createApiServer } from "../../apps/server/src/index.js";
import { migrateDatabase } from "../../apps/server/src/migrations.js";

const socket = process.env.PVF_TEST_PG_SOCKET;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const percentile = (values: number[], percent: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.ceil((percent / 100) * sorted.length) - 1] ?? 0);
};

describe.skipIf(!socket)("bounded fictional classroom load", () => {
  it("exercises 90 students with 30 concurrent starts, answers, retries and report reads", async () => {
    if (!socket?.startsWith("/tmp/pvf-postgres-test-")) throw new Error("Disposable socket required");
    const schema = `load_${randomUUID().replaceAll("-", "")}`;
    const admin = new Pool({ host: socket, database: "postgres" });
    await admin.query(`CREATE SCHEMA ${schema}`);
    await admin.end();
    const pool = new Pool({ host: socket, database: "postgres", max: 35, options: `-c search_path=${schema}` });
    await migrateDatabase(pool);
    const teachers: { id: string; token: string; csrf: string; classId: string }[] = [];
    const students: { id: string; token: string; csrf: string; classId: string }[] = [];
    for (let classIndex = 0; classIndex < 3; classIndex++) {
      const teacherId = randomUUID(), classId = randomUUID(), token = randomBytes(32).toString("base64url"), csrf = randomBytes(32).toString("base64url");
      await pool.query("INSERT INTO pvf_identity(id,role,username,credential_hash) VALUES($1,'teacher',$2,'load-fixture')", [teacherId, `teacher-${classIndex}`]);
      await pool.query("INSERT INTO pvf_class(id,teacher_id,name,timezone,code) VALUES($1,$2,$3,'UTC',$4)", [classId, teacherId, `Fictional ${classIndex}`, `class${classIndex}`]);
      await pool.query("INSERT INTO pvf_session(token_hash,actor_id,csrf_token) VALUES($1,$2,$3)", [digest(token), teacherId, csrf]);
      teachers.push({ id: teacherId, token, csrf, classId });
      for (let number = 0; number < 30; number++) {
        const studentId = randomUUID(), studentToken = randomBytes(32).toString("base64url"), studentCsrf = randomBytes(32).toString("base64url");
        await pool.query("INSERT INTO pvf_identity(id,role,username,credential_hash) VALUES($1,'student',$2,'load-fixture')", [studentId, `student-${classIndex}-${number}`]);
        await pool.query("INSERT INTO pvf_student(id,class_id,username,alias) VALUES($1,$2,$3,$4)", [studentId, classId, `student-${number}`, `Fictional ${number}`]);
        await pool.query("INSERT INTO pvf_game_profile(student_id) VALUES($1)", [studentId]);
        await pool.query("INSERT INTO pvf_session(token_hash,actor_id,csrf_token) VALUES($1,$2,$3)", [digest(studentToken), studentId, studentCsrf]);
        students.push({ id: studentId, token: studentToken, csrf: studentCsrf, classId });
      }
    }
    const server = createApiServer("/unused/load.json", { database: pool, identity: { origin: "https://classroom.test", receiptKey: randomBytes(32).toString("hex") } });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    const latencies: Record<string, number[]> = { start: [], answer: [], retry: [], report: [] };
    const errors: { phase: string; status: number; body: unknown }[] = [];
    let lockWaitSamples = 0, samples = 0;
    const sampler = setInterval(async () => {
      try {
        const result = await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event='advisory' AND datname=current_database()");
        lockWaitSamples += result.rows[0].n;
        samples++;
      } catch { /* sampling is ancillary */ }
    }, 50);
    const send = async (phase: keyof typeof latencies, path: string, actor: typeof students[number], body?: Record<string, unknown>) => {
      const begun = performance.now();
      const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { origin: "https://classroom.test", cookie: `pvf_session=${actor.token}`, "x-csrf-token": actor.csrf, "content-type": "application/json", ...(body?.commandId ? { "idempotency-key": String(body.commandId) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const payload = await response.json();
      latencies[phase].push(performance.now() - begun);
      if (response.status >= 400) errors.push({ phase, status: response.status, body: payload });
      return { status: response.status, body: payload };
    };
    const runWaves = async <T>(items: T[], task: (item: T, index: number) => Promise<unknown>) => {
      for (let offset = 0; offset < items.length; offset += 30)
        await Promise.all(items.slice(offset, offset + 30).map((item, index) => task(item, offset + index)));
    };
    const begun = performance.now();
    try {
      const snapshots: any[] = new Array(students.length);
      await runWaves(students, async (student, index) => {
        const result = await send("start", "/games/place-value-factory/attempts", student, { commandId: `start-${index}`, profileRevision: 0, tabId: `tab-${index}`, levelId: "level-1" });
        snapshots[index] = result.body;
      });
      expect(errors, JSON.stringify(errors.slice(0, 5))).toHaveLength(0);
      await Promise.all([runWaves(students.slice(0, 30), async (student, index) => {
        const snapshot = snapshots[index];
        const order = snapshot.activeOrder;
        let remainder = order.target;
        const representationA = [100000,10000,1000,100,10,1].map((denomination) => { const n = Math.floor(remainder / denomination); remainder %= denomination; return n; });
        const body = { commandId: `answer-${index}`, expectedRevision: snapshot.revision, leaseEpoch: snapshot.leaseEpoch, tabId: `tab-${index}`, representationA };
        const path = `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${order.id}/responses`;
        const answer = await send("answer", path, student, body);
        const retry = await send("retry", path, student, body);
        expect(retry.body).toEqual(answer.body);
      }), ...teachers.map((teacher) => send("report", `/teacher/classes/${teacher.classId}/games/place-value-factory/report`, teacher))]);
      const finalReports = await Promise.all(teachers.map((teacher) => send("report", `/teacher/classes/${teacher.classId}/games/place-value-factory/report`, teacher)));
      expect(finalReports.map((report) => report.body.students.length)).toEqual([30, 30, 30]);
      expect(finalReports.reduce((sum, report) => sum + report.body.students.reduce((classSum: number, item: any) => classSum + item.submittedN, 0), 0)).toBe(30);
      const elapsed = performance.now() - begun;
      const metrics = Object.fromEntries(Object.entries(latencies).map(([name, values]) => [name, { count: values.length, p50Ms: percentile(values, 50), p95Ms: percentile(values, 95), maxMs: Math.round(Math.max(...values)) }]));
      console.log(`LOAD_METRICS ${JSON.stringify({ students: 90, peakConcurrent: 30, elapsedMs: Math.round(elapsed), throughputRps: Math.round((Object.values(latencies).flat().length / elapsed) * 1000), errors: errors.length, lockWaitSamples, samples, metrics })}`);
      expect(errors, JSON.stringify(errors.slice(0, 3))).toHaveLength(0);
      for (const values of Object.values(latencies))
        expect(percentile(values, 95)).toBeLessThan(500);
      expect((await pool.query("SELECT count(*)::int AS n FROM pvf_attempt")).rows[0].n).toBe(90);
      expect((await pool.query("SELECT count(*)::int AS n FROM pvf_response")).rows[0].n).toBe(30);
      expect((await pool.query("SELECT count(*)::int AS n FROM pvf_command_receipt WHERE command_id LIKE 'answer-%'")).rows[0].n).toBe(30);
    } finally {
      clearInterval(sampler);
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await pool.end();
    }
  }, 180_000);
});
