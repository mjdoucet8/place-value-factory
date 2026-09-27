import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { IncomingMessage } from "node:http";
import { Pool } from "pg";
import { describe, it, expect } from "vitest";
import { createApiServer } from "../../apps/server/src/index.js";
import { migrateDatabase } from "../../apps/server/src/migrations.js";
import { PostgresRuntimeStore } from "../../apps/server/src/runtime-store.js";
import { LocalIdentity } from "../../apps/server/src/identity.js";

const socket = process.env.PVF_TEST_PG_SOCKET;
describe.skipIf(!socket || process.env.PVF_TEST_PG_RESTART === "1")(
  "secure classroom HTTP with real PostgreSQL",
  () => {
    it("isolates classes and verifies play, sessions, CSRF, reset, revocation and throttling", async () => {
      if (!socket?.startsWith("/tmp/pvf-postgres-test-"))
        throw new Error("Requires owned disposable test socket");
      const schema = `security_${randomUUID().replaceAll("-", "")}`;
      const admin = new Pool({ host: socket, database: "postgres" });
      await admin.query(`CREATE SCHEMA ${schema}`);
      await admin.end();
      const pool = new Pool({
        host: socket,
        database: "postgres",
        options: `-c search_path=${schema}`,
      });
      await migrateDatabase(pool);
      const store = new PostgresRuntimeStore(pool),
        key = randomBytes(32);
      const identity = new LocalIdentity(() => store.connection(), key),
        passwords = [randomUUID(), randomUUID()];
      expect(() => createApiServer("/unused/invalid.json", { database: pool, identity: { origin: "http://classroom.test", receiptKey: key.toString("hex") } })).toThrow(/HTTPS/);
      expect(() => createApiServer("/unused/invalid.json", { database: pool, identity: { origin: "https://classroom.test", receiptKey: "bad" } })).toThrow(/encryption key/);
      const previousMode = process.env.PVF_MODE;
      try {
        process.env.PVF_MODE = "production";
        expect(() => createApiServer("/unused/production.json", { database: pool, identity: { origin: "https://classroom.test", receiptKey: key.toString("hex") } })).toThrow(/school identity adapter/);
      } finally {
        if (previousMode === undefined) delete process.env.PVF_MODE;
        else process.env.PVF_MODE = previousMode;
      }
      await store.transaction(async () => {
        await identity.provisionTeacher("teacher-one", passwords[0]);
        await identity.provisionTeacher("teacher-two", passwords[1]);
      });
      const origin = "https://classroom.test";
      const server = createApiServer("/unused/security-test.json", {
        database: pool,
        identity: { origin, receiptKey: key.toString("hex") },
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
      type Session = { cookie: string; csrf: string };
      const request = async (
        path: string,
        body?: any,
        session?: Session,
        method = body === undefined ? "GET" : "POST",
        extra: Record<string, string> = {},
      ) => {
        const response = await fetch(base + path, {
          method,
          headers: {
            "content-type": "application/json",
            origin,
            ...(session
              ? { cookie: session.cookie, "x-csrf-token": session.csrf }
              : {}),
            ...(body?.commandId ? { "idempotency-key": body.commandId } : {}),
            ...extra,
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return {
          status: response.status,
          body: response.status === 204 ? null : await response.json(),
          cookie: response.headers.get("set-cookie"),
        };
      };
      const login = async (role: string, body: any) => {
        const result = await request(`/auth/${role}/session`, body);
        expect(result.status).toBe(200);
        for (const attribute of ["HttpOnly", "Secure", "SameSite=Strict"])
          expect(result.cookie).toContain(attribute);
        return {
          cookie: result.cookie!.split(";")[0],
          csrf: result.body.csrfToken,
        };
      };
      try {
        expect(
          (
            await request("/profile", undefined, undefined, "GET", {
              "x-session": "student-ava",
              cookie: "pvf_session=student-ava",
            })
          ).status,
        ).toBe(401);
        const t1 = await login("teacher", {
            username: "teacher-one",
            password: passwords[0],
          }),
          t2 = await login("teacher", {
            username: "teacher-two",
            password: passwords[1],
          });
        await pool.query("UPDATE pvf_session SET last_seen_at=now()-interval '2 minutes' WHERE token_hash=$1", [createHash("sha256").update(t1.cookie.slice("pvf_session=".length)).digest("hex")]);
        const concurrentReads = await Promise.all(Array.from({ length: 10 }, () => request("/teacher/classes", undefined, t1)));
        expect(concurrentReads.every((result) => result.status === 200)).toBe(true);
        // A long read must not hold the idle-heartbeat row against another read.
        await pool.query("UPDATE pvf_session SET last_seen_at=now()-interval '2 minutes' WHERE token_hash=$1", [createHash("sha256").update(t1.cookie.slice("pvf_session=".length)).digest("hex")]);
        const reads = [0,1].map(() => ({method:"GET",headers:{cookie:t1.cookie}} as IncomingMessage));
        let firstReady!: () => void, releaseFirst!: () => void;
        const ready = new Promise<void>((resolve) => { firstReady=resolve; });
        const held = new Promise<void>((resolve) => { releaseFirst=resolve; });
        const firstRead = store.transaction(async () => {
          expect((await identity.authenticate(reads[0]))?.role).toBe("teacher");
          firstReady(); await held;
        }, true);
        try {
          await ready;
          await store.transaction(async () => {
            await store.connection().query("SET LOCAL statement_timeout='1s'");
            expect((await identity.authenticate(reads[1]))?.role).toBe("teacher");
          }, true);
        } finally { releaseFirst(); await firstRead; }
        await Promise.all(reads.map((read) => identity.touchReadSession(read,pool)));
        expect((await pool.query("SELECT last_seen_at>now()-interval '1 minute' AS refreshed FROM pvf_session WHERE token_hash=$1", [createHash("sha256").update(t1.cookie.slice("pvf_session=".length)).digest("hex")])).rows[0].refreshed).toBe(true);
        const classCommand = {
          commandId: "class-one",
          name: "Fictional One",
          timezone: "America/Toronto",
        };
        expect(
          (
            await request("/teacher/classes", classCommand, t1, "POST", {
              "x-csrf-token": "forged",
            })
          ).status,
        ).toBe(403);
        expect(
          (
            await request("/teacher/classes", classCommand, t1, "POST", {
              origin: "https://untrusted.test",
            })
          ).status,
        ).toBe(403);
        const c1 = await request("/teacher/classes", classCommand, t1);
        expect(c1.status).toBe(201);
        expect(
          (await request("/teacher/classes", classCommand, t1)).body,
        ).toEqual(c1.body);
        const c2 = await request(
          "/teacher/classes",
          { ...classCommand, commandId: "class-two", name: "Fictional Two" },
          t2,
        );
        const provision = {
          commandId: "provision",
          alias: "Learner",
          username: "learner",
        };
        const one = await request(
          `/teacher/classes/${c1.body.id}/students`,
          provision,
          t1,
        );
        expect(one.status).toBe(201);
        expect(one.body.oneTimePin).toMatch(/^\d{6}$/);
        expect(
          (
            await request(
              `/teacher/classes/${c1.body.id}/students`,
              provision,
              t1,
            )
          ).body,
        ).toEqual(one.body);
        const two = await request(
          `/teacher/classes/${c2.body.id}/students`,
          provision,
          t2,
        );
        expect(two.status).toBe(201);
        expect(
          (
            await request(
              `/teacher/classes/${c1.body.id}/students`,
              undefined,
              t2,
            )
          ).status,
        ).toBe(404);
        expect(
          (
            await request(
              `/teacher/students/${one.body.student.id}/reset-pin`,
              { commandId: "cross-reset" },
              t2,
            )
          ).status,
        ).toBe(404);
        const s1 = await login("student", {
          classCode: c1.body.classCode,
          username: "LEARNER",
          pin: one.body.oneTimePin,
        });
        const s2 = await login("student", {
          classCode: c2.body.classCode,
          username: "learner",
          pin: two.body.oneTimePin,
        });
        expect((await request("/teacher/classes", undefined, s1)).status).toBe(
          403,
        );
        const started = await request(
          "/games/place-value-factory/attempts",
          {
            commandId: "start",
            profileRevision: 0,
            tabId: "student-tab",
            levelId: "level-1",
          },
          s1,
        );
        expect(started.status).toBe(201);
        let snapshot = started.body;
        const firstOrderId = snapshot.activeOrder.id;
        expect(
          (
            await request(
              `/games/place-value-factory/attempts/${snapshot.attemptId}`,
              undefined,
              s2,
            )
          ).status,
        ).toBe(404);
        for (let slot = 0; slot < 5; slot++) {
          let remaining = snapshot.activeOrder.target;
          const representationA = [100000, 10000, 1000, 100, 10, 1].map(
            (value) => {
              const count = Math.floor(remaining / value);
              remaining %= value;
              return count;
            },
          );
          const answer = await request(
            `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${snapshot.activeOrder.id}/responses`,
            {
              commandId: `answer-${slot}`,
              expectedRevision: snapshot.revision,
              leaseEpoch: snapshot.leaseEpoch,
              tabId: "student-tab",
              representationA,
            },
            s1,
          );
          expect(answer.status).toBe(200);
          snapshot = answer.body.snapshot;
        }
        const report = await request(
          `/teacher/classes/${c1.body.id}/games/place-value-factory/report`,
          undefined,
          t1,
        );
        expect(report.body.students[0]).toMatchObject({
          submittedN: 5,
          eventuallyCorrectN: 5,
        });
        expect((await request(
          `/teacher/students/${one.body.student.id}/games/place-value-factory/report`,
          undefined, t1,
        )).body.submittedN).toBe(5);
        expect((await request(
          `/teacher/students/${one.body.student.id}/games/place-value-factory/report`,
          undefined, t2,
        )).status).toBe(404);
        expect((await request(
          `/teacher/orders/${firstOrderId}/evidence`, undefined, t2,
        )).status).toBe(404);
        expect(
          (
            await request(
              `/teacher/classes/${c1.body.id}/games/place-value-factory/report`,
              undefined,
              t2,
            )
          ).status,
        ).toBe(404);
        const reset = await request(
          `/teacher/students/${one.body.student.id}/reset-pin`,
          { commandId: "reset" },
          t1,
        );
        expect(reset.status).toBe(200);
        expect((await request("/profile", undefined, s1)).status).toBe(401);
        const replacement = await login("student", {
          classCode: c1.body.classCode,
          username: "learner",
          pin: reset.body.oneTimePin,
        });
        expect(
          (
            await request(
              `/games/place-value-factory/attempts/${snapshot.attemptId}/results`,
              undefined,
              replacement,
            )
          ).status,
        ).toBe(200);
        const stored = (
          await pool.query(
            "SELECT response,secret_ciphertext FROM pvf_roster_receipt WHERE command_id='reset'",
          )
        ).rows[0];
        expect(stored.response).not.toHaveProperty("oneTimePin");
        expect(stored.secret_ciphertext).not.toContain(reset.body.oneTimePin);
        await pool.query(
          "UPDATE pvf_roster_receipt SET secret_expires_at=now()-interval '1 second' WHERE command_id='reset'",
        );
        expect(
          (
            await request(
              `/teacher/students/${one.body.student.id}/reset-pin`,
              { commandId: "reset" },
              t1,
            )
          ).body.error.code,
        ).toBe("RESET_COMPLETED_PIN_NOT_REDISPLAYABLE");
        expect(
          (
            await request(
              `/teacher/students/${one.body.student.id}/access`,
              { commandId: "revoke", enabled: false },
              t1,
              "PATCH",
            )
          ).status,
        ).toBe(200);
        expect((await request("/profile", undefined, replacement)).status).toBe(
          401,
        );
        expect(
          (
            await request("/auth/student/session", {
              classCode: c1.body.classCode,
              username: "learner",
              pin: reset.body.oneTimePin,
            })
          ).status,
        ).toBe(401);
        expect(
          (
            await request(
              `/teacher/classes/${c2.body.id}/access`,
              { commandId: "archive", enabled: false },
              t2,
              "PATCH",
            )
          ).status,
        ).toBe(200);
        expect((await request("/profile", undefined, s2)).status).toBe(401);
        for (let failure = 0; failure < 5; failure++) {
          expect(
            (
              await request("/auth/teacher/session", {
                username: "unknown-teacher",
                password: "incorrect-password",
              })
            ).status,
          ).toBe(401);
          if (failure < 4)
            await pool.query(
              "UPDATE pvf_login_limit SET blocked_until=now()-interval '1 second'",
            );
        }
        expect(
          (
            await request("/auth/teacher/session", {
              username: "unknown-teacher",
              password: "incorrect-password",
            })
          ).status,
        ).toBe(429);
        const networkBucket = createHash("sha256").update("network:127.0.0.1").digest("hex");
        await pool.query("UPDATE pvf_login_limit SET failures=299,window_start=now() WHERE bucket=$1", [networkBucket]);
        expect((await request("/auth/teacher/session", {
          username: "another-unknown", password: "incorrect-password",
        })).status).toBe(401);
        expect((await request("/auth/teacher/session", {
          username: "teacher-one", password: passwords[0],
        })).status).toBe(429);
        await pool.query("UPDATE pvf_login_limit SET window_start=now()-interval '11 minutes' WHERE bucket=$1", [networkBucket]);
        expect((await request("/auth/teacher/session", {
          username: "teacher-one", password: passwords[0],
        })).status).toBe(200);
        await pool.query("UPDATE pvf_login_limit SET failures=299,window_start=now() WHERE bucket=$1", [networkBucket]);
        expect((await request("/auth/teacher/session", { username: "", password: "x" })).status).toBe(401);
        expect((await request("/auth/teacher/session", {
          username: "teacher-one", password: passwords[0],
        })).status).toBe(429);
        await pool.query(
          "UPDATE pvf_session SET expires_at=now()-interval '1 second'",
        );
        expect((await request("/teacher/classes", undefined, t1)).status).toBe(
          401,
        );
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.end();
      }
    }, 20_000);
  },
);
