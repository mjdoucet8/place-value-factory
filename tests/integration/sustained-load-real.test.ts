import { chromium, type Browser, type Page } from "@playwright/test";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { resolve } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { migrateDatabase } from "../../apps/server/src/migrations.js";
import { witnessFor } from "../../packages/game-engine/src/index.js";

const reportingV2 = process.env.PVF_REPORT_V2 === "1";
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
    const metrics: Record<string, number[]> = { profile: [], start: [], answer: [], retry: [], ...(reportingV2 ? { summary: [], detail: [] } : { report: [] }) };
    const sizes: Record<string, {request: number[]; response: number[]}> = {};
    const serverTimings: Record<string,number[]> = {};
    const summaryKinds = { class: [] as number[], student: [] as number[] };
    const browserTiming = { summary: [] as number[], evidence: [] as number[], nextPage: [] as number[] };
    let browser: Browser | undefined, browserPage: Page | undefined, web: ViteDevServer | undefined;
    const reportTiming = { headers: [] as number[], body: [] as number[], parse: [] as number[], bytes: [] as number[] };
    const errors: { phase: string; status: number; body: unknown }[] = [];
    let evidenceRetrieved = 0, browserEvidenceRetrieved = 0, refreshConflicts = 0;
    let browserApi: {kind:string;ms:number;headerMs:number;serverTiming:string;status:number}[] = [];
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
      const response = await fetch((path.startsWith("/v2/") ? base.replace(/\/v1$/, "") : base) + path, { method: body ? "POST" : "GET", headers: { origin: "https://classroom.test", cookie: `pvf_session=${actor.token}`, "x-csrf-token": actor.csrf, "content-type": "application/json", ...(body?.commandId ? { "idempotency-key": String(body.commandId) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (phase === "summary" && path.includes("/classes/")) for (const timing of (response.headers.get("server-timing")??"").split(",")) {
        const [name, duration] = timing.split(";dur="); if(duration) (serverTimings[name]??=[]).push(Number(duration));
      }
      let payload: any;
      let bytes = 0;
      if (["report", "summary", "detail"].includes(phase)) {
        const headersAt = performance.now();
        const raw = await response.text();
        const bodyAt = performance.now();
        payload = JSON.parse(raw);
        reportTiming.headers.push(headersAt - began);
        reportTiming.body.push(bodyAt - headersAt);
        reportTiming.parse.push(performance.now() - bodyAt);
        bytes = Buffer.byteLength(raw); reportTiming.bytes.push(bytes);
      } else { const raw = await response.text(); bytes = Buffer.byteLength(raw); payload = JSON.parse(raw); }
      if (phase !== "setup") {
        const elapsed = performance.now() - began;
        metrics[phase].push(elapsed); requests++;
        if (phase === "summary") summaryKinds[path.includes("/classes/") ? "class" : "student"].push(elapsed);
        sizes[phase] ??= {request: [], response: []};
        sizes[phase].request.push(Buffer.byteLength(body ? JSON.stringify(body) : path)); sizes[phase].response.push(bytes);
      }
      if (reportingV2 && response.status === 409 && payload.error?.code === "REPORT_CHANGED") refreshConflicts++;
      else if (response.status >= 400) errors.push({ phase, status: response.status, body: payload });
      if (phase === "detail" && response.status === 200) evidenceRetrieved += payload.evidence.length;
      return { status: response.status, body: payload };
    };
    const filters = "from=2026-01-01&to=2027-01-01";
    const teacherInteraction = async (teacher: Actor, round: number) => {
      const summary = await send("summary", `/v2/teacher/classes/${teacher.classId}/games/place-value-factory/summary?${filters}`, teacher);
      expect(summary.status).toBe(200);
      expect(summary.body.students).toHaveLength(30);
      const student = summary.body.students[round % 30];
      const path = `/v2/teacher/students/${student.studentId}/games/place-value-factory`;
      const selected = await send("summary", `${path}/summary?${filters}`, teacher);
      expect(selected.status).toBe(200);
      let cursor: string | null = null;
      const ids = new Set<string>();
      for (let page = 0; page < 3; page++) {
        const result = await send("detail", `${path}/evidence?${filters}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, teacher);
        if (result.status === 409) { ids.clear(); cursor = null; continue; }
        expect(result.status).toBe(200);
        for (const row of result.body.evidence) { expect(ids.has(row.orderId)).toBe(false); ids.add(row.orderId); }
        cursor = result.body.nextCursor;
        if (!cursor) break;
      }
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
      if (reportingV2) {
        web = await createViteServer({ configFile: resolve("apps/web/vite.config.ts"), root: resolve("apps/web"), server: { host:"127.0.0.1", port:0, strictPort:false, proxy:{"/api":apiProcesses[0].base.replace(/\/api\/v1$/, "")} } });
        await web.listen();
        const address = web.httpServer!.address();
        if (!address || typeof address === "string") throw new Error("Browser fixture listener missing");
        const webUrl = `http://127.0.0.1:${address.port}`;
        browser = await chromium.launch({headless:true});
        const context = await browser.newContext({viewport:{width:1366,height:768}});
        await context.addCookies([{name:"pvf_session",value:teachers[2].token,url:webUrl+"/api",httpOnly:true,sameSite:"Strict"}]);
        browserPage = await context.newPage();
        browserPage.on("pageerror",(error)=>console.log("BROWSER_PAGE_ERROR",error.message));
        await browserPage.addInitScript(() => {
          const bag = window as any; bag.__pvfReportTiming = [];
          const original = window.fetch.bind(window);
          window.fetch = async (input, init) => {
            const started = window.performance.now(); const response = await original(input, init);
            const headerMs = window.performance.now()-started;
            const path = String(input instanceof Request ? input.url : input);
            if (path.includes("/api/v2/") && /\/(summary|evidence)\?/.test(path)) {
              const json = response.json.bind(response);
              response.json = async () => { try { return await json(); } finally {
                bag.__pvfReportTiming.push({kind:path.includes("/evidence?")?"detail":path.includes("/classes/")?"classSummary":"studentSummary",ms:window.performance.now()-started,headerMs,serverTiming:response.headers.get("server-timing")??"",status:response.status});
              }};
            }
            return response;
          };
        });
        await browserPage.goto(webUrl);
        try { await browserPage.locator("main[data-report-observed]").waitFor(); }
        catch (error) { console.log("BROWSER_SETUP_FAILURE", await browserPage.locator("body").innerText()); throw error; }
        await browserPage.getByLabel("From", {exact:true}).fill("2026-01-01");
        await browserPage.getByLabel("To (exclusive)").fill("2027-01-01");
        const before = await browserPage.locator("main").getAttribute("data-report-observed");
        await browserPage.getByRole("button",{name:"Apply report filters"}).click();
        await browserPage.waitForFunction((prior) => document.querySelector("main")?.getAttribute("data-report-observed") !== prior, before);
      }
      const browserInteraction = async () => {
        if (!browserPage) return;
        const before = await browserPage.locator("main").getAttribute("data-report-observed");
        let started = performance.now();
        await browserPage.getByRole("button",{name:"Refresh report"}).click();
        await browserPage.waitForFunction((prior) => document.querySelector("main")?.getAttribute("data-report-observed") !== prior, before);
        await browserPage.getByRole("button",{name:/View evidence for/}).first().waitFor({state:"visible"});
        browserTiming.summary.push(performance.now()-started);
        started=performance.now();
        await browserPage.getByRole("button",{name:/View evidence for/}).last().click();
        await browserPage.waitForFunction(() => document.querySelectorAll("tr[data-order-id]").length > 0 || document.querySelector('[role="alert"]'));
        if (await browserPage.locator("tr[data-order-id]").count()) {
          browserTiming.evidence.push(performance.now()-started);
          const firstIds = await browserPage.locator("tr[data-order-id]").evaluateAll((rows)=>rows.map((row)=>row.getAttribute("data-order-id")));
          browserEvidenceRetrieved += firstIds.length;
          started=performance.now();
          await browserPage.getByRole("button",{name:"Next evidence page"}).click();
          await browserPage.waitForFunction(() => document.body.textContent?.includes("Page 2 ·") || document.querySelector('[role="alert"]'));
          if (await browserPage.getByText(/Page 2 ·/).count()) {
            browserTiming.nextPage.push(performance.now()-started);
            const secondIds = await browserPage.locator("tr[data-order-id]").evaluateAll((rows)=>rows.map((row)=>row.getAttribute("data-order-id")));
            expect(new Set([...firstIds,...secondIds]).size).toBe(firstIds.length+secondIds.length);
            browserEvidenceRetrieved += secondIds.length;
          }
        }
      };
      if (browserPage) await browserPage.evaluate(() => { (window as any).__pvfReportTiming = []; });
      const baselineRss = process.memoryUsage().rss + apiProcesses.reduce((sum, api) => sum + childRss(api.child.pid), 0);
      const began = performance.now();
      let rounds = 0;
      while (performance.now() - began < durationMs) {
        await Promise.all([
          browserInteraction(),
          waves(students, async (student) => complete(student, await start(student, "replay", "start"), "answer", true)),
          ...teachers.map((teacher) => reportingV2 ? teacherInteraction(teacher, rounds) : send("report", `/teacher/classes/${teacher.classId}/games/place-value-factory/report?from=2026-01-01&to=2027-01-01`, teacher)),
        ]);
        rounds++;
      }
      if (browserPage) {
        browserApi = await browserPage.evaluate(() => (window as any).__pvfReportTiming);
        await browserPage.screenshot({path:"/tmp/pvf-reporting-wide.png",fullPage:true});
        await browserPage.setViewportSize({width:320,height:720});
        expect(await browserPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await browserPage.screenshot({path:"/tmp/pvf-reporting-narrow.png",fullPage:true});
      }
      const measuredActivityMs = performance.now() - began;
      const finalReports = await Promise.all(teachers.map((teacher) => send(reportingV2 ? "setup" : "report", `/teacher/classes/${teacher.classId}/games/place-value-factory/report?from=2026-01-01&to=2027-01-01`, teacher)));
      if (reportingV2) {
        for (let i = 0; i < teachers.length; i++) {
          const teacher = teachers[i];
          const summary = await send("setup", `/v2/teacher/classes/${teacher.classId}/games/place-value-factory/summary?${filters}`, teacher);
          for (const legacy of finalReports[i].body.students) {
            const { evidence, ...counts } = legacy;
            const { viewRevision, ...current } = summary.body.students.find((s: any) => s.studentId === legacy.studentId);
            expect(current).toEqual(counts);
            const all: any[] = [];
            let cursor: string | null = null;
            do {
              const page = await send("setup", `/v2/teacher/students/${legacy.studentId}/games/place-value-factory/evidence?${filters}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, teacher);
              expect(page.status).toBe(200); all.push(...page.body.evidence); cursor = page.body.nextCursor;
            } while (cursor);
            const sort = (a: any, b: any) => a.firstResponse.at.localeCompare(b.firstResponse.at) || a.orderId.localeCompare(b.orderId);
            expect(all).toEqual([...evidence].sort(sort));
            expect(new Set(all.map((row) => row.orderId)).size).toBe(all.length);
          }
        }
      }
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
      const readModel = (await pool.query("SELECT count(*)::int AS orders,sum(response_n)::int AS answers,count(*) FILTER (WHERE first_objective AND first_value AND accepted)::int AS correct FROM pvf_report_order")).rows[0];
      expect(readModel).toEqual({orders:finalCounts.answers,answers:finalCounts.answers,correct:finalCounts.answers});
      expect(finalCounts.receipts).toBe(90 * (2 + rounds) * 6);
      const rewardProfiles = await Promise.all(students.map((student) => send("setup", "/profile", student)));
      expect(rewardProfiles.every((profile) => profile.status === 200 && profile.body.totalStars === 2)).toBe(true);
      expect(errors).toEqual([]);
      const elapsedMs = measuredActivityMs;
      const summary = Object.fromEntries(Object.entries(metrics).map(([phase, times]) => [phase, { count: times.length, p50Ms: percentile(times, 50), p95Ms: percentile(times, 95), p99Ms: percentile(times, 99), maxMs: Math.round(Math.max(...times)) }]));
      const reportBreakdown = Object.fromEntries(Object.entries(reportTiming).map(([phase, times]) => [phase, { p50: percentile(times, 50), p95: percentile(times, 95), max: Math.round(Math.max(...times)) }]));
      const responseSizes = Object.fromEntries(Object.entries(sizes).map(([phase,value]) => [phase,{requestBytesP95:percentile(value.request,95),responseBytesP95:percentile(value.response,95),responseBytesMax:Math.max(...value.response)}]));
      const browserMetrics = Object.fromEntries(Object.entries(browserTiming).map(([phase,value]) => [phase,{n:value.length,p50Ms:percentile(value,50),p95Ms:percentile(value,95),maxMs:Math.round(Math.max(0,...value))}]));
      const browserApiMetrics = Object.fromEntries(["classSummary","studentSummary","detail"].map((kind)=>{
        const records=browserApi.filter((r)=>r.kind===kind); return [kind,{n:records.length,headerP95Ms:percentile(records.map((r)=>r.headerMs),95),bodyP95Ms:percentile(records.map((r)=>r.ms-r.headerMs),95),serverTimings:records.map((r)=>r.serverTiming),p95Ms:percentile(records.map((r)=>r.ms),95),successP95Ms:percentile(records.filter((r)=>r.status===200).map((r)=>r.ms),95),refreshConflicts:records.filter((r)=>r.status===409).length}];
      }));
      const summaryBreakdown = Object.fromEntries(Object.entries(summaryKinds).map(([phase,value]) => [phase,{n:value.length,p95Ms:percentile(value,95)}]));
      console.log(`SUSTAINED_LOAD_METRICS ${JSON.stringify({ serverTimings:Object.fromEntries(Object.entries(serverTimings).map(([name,values])=>[name,{p50:percentile(values,50),p95:percentile(values,95)}])), browserApiMetrics, browserMetrics, browserEvidenceRetrieved, responseSizes, summaryBreakdown, workflow: reportingV2 ? "v2-summary-detail" : "v1-full-detail", evidenceRetrieved, refreshConflicts, students: 90, concurrency: 30, apiProcesses: apiProcesses.length, historyPerStudent, seeded, durationTargetMs: durationMs, measuredMs: Math.round(elapsedMs), rounds, requests, throughputRps: Math.round(requests / elapsedMs * 1000), errors: errors.length, lockWaitSamples, polls, baselineRss, peakRss, memoryScope: "load client including Vite plus API workers; excludes PostgreSQL and Chromium", finalCounts, metrics: summary, reportBreakdown })}`);
      if (reportingV2) {
        for (const [kind, times] of Object.entries(summaryKinds)) expect(percentile(times,95), `${kind} summary p95`).toBeLessThan(500);
        for (const [kind, stats] of Object.entries(browserApiMetrics)) {
          expect(stats.n,`browser ${kind} requests measured`).toBeGreaterThan(0);
          expect(stats.p95Ms,`browser ${kind} request p95`).toBeLessThan(500);
          expect(stats.successP95Ms,`browser ${kind} successful request p95`).toBeLessThan(500);
        }
        expect(browserApi.every((r)=>[200,409].includes(r.status))).toBe(true);
        expect(browserTiming.evidence.length).toBeGreaterThan(5); expect(browserTiming.nextPage.length).toBeGreaterThan(5);
      }
      for (const [phase, times] of Object.entries(metrics)) expect(percentile(times, 95), `${phase} p95`).toBeLessThan(500);
    } finally {
      clearInterval(sampler);
      await browser?.close(); await web?.close();
      await Promise.all(apiProcesses.map(async ({ child }) => {
        if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
      }));
      await pool.end();
    }
  }, 900_000);
});
