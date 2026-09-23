import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiServer } from "../../apps/server/src/index.js";

const studentHeaders = {
  "content-type": "application/json",
  "x-session": "student-ava",
};
let server: ReturnType<typeof createApiServer>;
let baseUrl = "";
let dataDirectory = "";

beforeEach(async () => {
  dataDirectory = await mkdtemp(join(tmpdir(), "place-value-factory-"));
  server = createApiServer(join(dataDirectory, "development.json"));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await rm(dataDirectory, { recursive: true, force: true });
});

async function request(
  path: string,
  body?: unknown,
  headers: Record<string, string> = studentHeaders,
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: (await response.json()) as any };
}

function canonical(target: number) {
  const values = [100000, 10000, 1000, 100, 10, 1];
  let remaining = target;
  return values.map((value) => {
    const quantity = Math.floor(remaining / value);
    remaining %= value;
    return quantity;
  });
}

describe("fictional-data command safety", () => {
  it("issues distinct persisted order identities when replaying the same deterministic level", async () => {
    const issuedIds = new Set<string>();
    const targets: number[][] = [];
    for (let run = 0; run < 2; run++) {
      const startKey = `repeat-start-${run}`;
      const started = await request(
        "/games/place-value-factory/attempts",
        {
          commandId: startKey,
          profileRevision: run,
          tabId: "tab-a",
          levelId: "level-1",
        },
        { ...studentHeaders, "idempotency-key": startKey },
      );
      expect(started.status).toBe(201);
      let snapshot = started.body;
      targets.push([]);
      for (let slot = 0; slot < 5; slot++) {
        const order = snapshot.activeOrder;
        expect(issuedIds.has(order.id)).toBe(false);
        expect(order.id.startsWith(`${snapshot.attemptId}.`)).toBe(true);
        issuedIds.add(order.id);
        targets[run].push(order.target);
        const key = `repeat-answer-${run}-${slot}`;
        const answer = await request(
          `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${order.id}/responses`,
          {
            commandId: key,
            expectedRevision: snapshot.revision,
            leaseEpoch: snapshot.leaseEpoch,
            tabId: "tab-a",
            representationA: canonical(order.target),
            representationB: null,
          },
          { ...studentHeaders, "idempotency-key": key },
        );
        expect(answer.status).toBe(200);
        snapshot = answer.body.snapshot;
      }
    }
    expect(targets[0]).toEqual(targets[1]);
    expect(issuedIds.size).toBe(10);
    const report = await request(
      "/teacher/classes/class-demo/games/place-value-factory/report",
      undefined,
      { "x-session": "teacher-dev" },
    );
    expect(report.body.students[0].submittedN).toBe(10);
    for (const orderId of issuedIds) {
      const evidence = await request(
        `/teacher/orders/${orderId}/evidence`,
        undefined,
        { "x-session": "teacher-dev" },
      );
      expect(evidence.status).toBe(200);
      expect(evidence.body.evidence.orderId).toBe(orderId);
    }
  });

  it("replays the original response for a duplicate command without adding a second response", async () => {
    const start = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "start-1",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "start-1" },
    );
    expect(start.status).toBe(201);
    const order = start.body.activeOrder;
    const command = {
      commandId: "response-1",
      expectedRevision: start.body.revision,
      leaseEpoch: start.body.leaseEpoch,
      tabId: "tab-a",
      representationA: canonical(order.target),
      representationB: null,
      activeMs: 100,
    };
    const headers = { ...studentHeaders, "idempotency-key": "response-1" };
    const first = await request(
      `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${order.id}/responses`,
      command,
      headers,
    );
    const replay = await request(
      `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${order.id}/responses`,
      command,
      headers,
    );
    expect(first.status).toBe(200);
    expect(replay).toEqual(first);
    const current = await request(
      `/games/place-value-factory/attempts/${start.body.attemptId}`,
    );
    expect(current.body.shippedSlots).toBe(1);
    expect(current.body.revision).toBe(1);
  });

  it("rejects altered duplicate payloads, stale revisions, and a second active writer", async () => {
    const start = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "start-2",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "start-2" },
    );
    const order = start.body.activeOrder;
    const responsePath = `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${order.id}/responses`;
    const command = {
      commandId: "response-2",
      expectedRevision: 0,
      leaseEpoch: 1,
      tabId: "tab-a",
      representationA: canonical(order.target),
      representationB: null,
    };
    expect(
      (
        await request(responsePath, command, {
          ...studentHeaders,
          "idempotency-key": "response-2",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(
          responsePath,
          { ...command, activeMs: 50 },
          { ...studentHeaders, "idempotency-key": "response-2" },
        )
      ).body.error.code,
    ).toBe("IDEMPOTENCY_CONFLICT");
    expect(
      (
        await request(
          responsePath,
          { ...command, commandId: "stale-1" },
          { ...studentHeaders, "idempotency-key": "stale-1" },
        )
      ).body.error.code,
    ).toBe("REVISION_CONFLICT");
    expect(
      (
        await request(
          responsePath,
          {
            ...command,
            commandId: "writer-2",
            expectedRevision: 1,
            tabId: "tab-b",
          },
          { ...studentHeaders, "idempotency-key": "writer-2" },
        )
      ).body.error.code,
    ).toBe("LEASE_LOST");
  });

  it("takes over a lease explicitly and rejects the old epoch", async () => {
    const start = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "start-3",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "start-3" },
    );
    const takeover = await request(
      `/games/place-value-factory/attempts/${start.body.attemptId}/lease/takeover`,
      {
        commandId: "takeover-1",
        expectedRevision: 0,
        leaseEpoch: 1,
        tabId: "tab-b",
      },
      { ...studentHeaders, "idempotency-key": "takeover-1" },
    );
    expect(takeover.body.snapshot).toMatchObject({
      writerTabId: "tab-b",
      leaseEpoch: 2,
      revision: 1,
    });
    const oldWriter = await request(
      `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${start.body.activeOrder.id}/responses`,
      {
        commandId: "old-writer",
        expectedRevision: 0,
        leaseEpoch: 1,
        tabId: "tab-a",
        representationA: canonical(start.body.activeOrder.target),
        representationB: null,
      },
      { ...studentHeaders, "idempotency-key": "old-writer" },
    );
    expect(oldWriter.body.error.code).toBe("LEASE_LOST");
  });

  it("requires the original tab to reacquire an expired lease before writes", async () => {
    const started = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "expired-start",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "expired-start" },
    );
    expect(started.status).toBe(201);
    const dataPath = join(dataDirectory, "development.json");
    const stored = JSON.parse(await readFile(dataPath, "utf8"));
    stored.attempts[0].leaseExpiresAt = new Date(0).toISOString();
    await writeFile(dataPath, JSON.stringify(stored));
    const attemptPath = `/games/place-value-factory/attempts/${started.body.attemptId}`;
    const responsePath = `${attemptPath}/orders/${started.body.activeOrder.id}/responses`;
    const representationA = canonical(started.body.activeOrder.target);
    const foreign = await request(
      responsePath,
      {
        commandId: "expired-foreign",
        expectedRevision: 0,
        leaseEpoch: 1,
        tabId: "tab-b",
        representationA,
        representationB: null,
      },
      { ...studentHeaders, "idempotency-key": "expired-foreign" },
    );
    expect(foreign.body.error.code).toBe("LEASE_LOST");
    const resumed = await request(
      `${attemptPath}/resume`,
      {
        commandId: "expired-resume",
        expectedRevision: 0,
        leaseEpoch: 1,
        tabId: "tab-a",
      },
      { ...studentHeaders, "idempotency-key": "expired-resume" },
    );
    expect(resumed.body.snapshot).toMatchObject({
      leaseEpoch: 2,
      revision: 1,
    });
    const stale = await request(
      responsePath,
      {
        commandId: "expired-stale",
        expectedRevision: 1,
        leaseEpoch: 1,
        tabId: "tab-a",
        representationA,
        representationB: null,
      },
      { ...studentHeaders, "idempotency-key": "expired-stale" },
    );
    expect(stale.body.error.code).toBe("LEASE_LOST");
    const answer = await request(
      responsePath,
      {
        commandId: "expired-answer",
        expectedRevision: 1,
        leaseEpoch: 2,
        tabId: "tab-a",
        representationA,
        representationB: null,
      },
      { ...studentHeaders, "idempotency-key": "expired-answer" },
    );
    expect(answer.status).toBe(200);
    expect(answer.body.snapshot.shippedSlots).toBe(1);
  });

  it("requires two saved misses before replacing a skipped slot", async () => {
    const start = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "start-skip",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "start-skip" },
    );
    const skipPath = `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${start.body.activeOrder.id}/skip`;
    const skip = async (commandId: string, revision: number) =>
      request(
        skipPath,
        {
          commandId,
          expectedRevision: revision,
          leaseEpoch: 1,
          tabId: "tab-a",
        },
        { ...studentHeaders, "idempotency-key": commandId },
      );
    expect((await skip("skip-early", 0)).status).toBe(409);
    let snapshot = start.body;
    for (const commandId of ["wrong-1", "wrong-2"]) {
      const response = await request(
        `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${snapshot.activeOrder.id}/responses`,
        {
          commandId,
          expectedRevision: snapshot.revision,
          leaseEpoch: snapshot.leaseEpoch,
          tabId: "tab-a",
          representationA: [0, 0, 0, 0, 0, 0],
          representationB: null,
        },
        { ...studentHeaders, "idempotency-key": commandId },
      );
      snapshot = response.body.snapshot;
    }
    const replacement = await skip("skip-ready", snapshot.revision);
    expect(replacement.status).toBe(200);
    expect(replacement.body.snapshot).toMatchObject({
      shippedSlots: 0,
      revision: 3,
    });
    expect(replacement.body.snapshot.activeOrder.id).not.toBe(
      start.body.activeOrder.id,
    );
  });

  it("records ordered help once and applies H3 evidence weight to the resolved order", async () => {
    const start = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "start-hint",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "start-hint" },
    );
    const hintPath = `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${start.body.activeOrder.id}/hints`;
    const hint = (
      commandId: string,
      step: "H1" | "H2" | "H3",
      revision: number,
    ) =>
      request(
        hintPath,
        {
          commandId,
          step,
          expectedRevision: revision,
          leaseEpoch: 1,
          tabId: "tab-a",
        },
        { ...studentHeaders, "idempotency-key": commandId },
      );
    expect((await hint("hint-too-early", "H2", 0)).body.error.code).toBe(
      "HINT_OUT_OF_SEQUENCE",
    );
    const h1 = await hint("hint-h1", "H1", 0);
    expect(h1.body.hint.code).toBe("BASE_TEN_RELATIONSHIP");
    expect((await hint("hint-h1", "H1", 0)).body).toEqual(h1.body);
    const h2 = await hint("hint-h2", "H2", h1.body.snapshot.revision);
    expect(h2.body.hint.workedExample.target).toBe(34);
    const h3 = await hint("hint-h3", "H3", h2.body.snapshot.revision);
    expect(h3.body.hint.workedExample.target).toBe(
      start.body.activeOrder.target,
    );
    const response = await request(
      `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${start.body.activeOrder.id}/responses`,
      {
        commandId: "response-after-h3",
        expectedRevision: h3.body.snapshot.revision,
        leaseEpoch: 1,
        tabId: "tab-a",
        representationA: canonical(start.body.activeOrder.target),
        representationB: null,
      },
      { ...studentHeaders, "idempotency-key": "response-after-h3" },
    );
    expect(response.status).toBe(200);
    const progress = await request("/games/place-value-factory/progress");
    expect(
      progress.body.skills.find(
        (skill: any) => skill.skillId === start.body.activeOrder.primarySkill,
      ),
    ).toMatchObject({ score: 0.25, independentFirstN: 0 });
  });

  it("awards the optional transfer star once without changing the five main shipments", async () => {
    let start = await request(
      "/games/place-value-factory/attempts",
      {
        commandId: "start-transfer",
        profileRevision: 0,
        tabId: "tab-a",
        levelId: "level-1",
      },
      { ...studentHeaders, "idempotency-key": "start-transfer" },
    );
    let snapshot = start.body;
    for (let index = 0; index < 5; index++) {
      const response = await request(
        `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${snapshot.activeOrder.id}/responses`,
        {
          commandId: `main-transfer-${index}`,
          expectedRevision: snapshot.revision,
          leaseEpoch: snapshot.leaseEpoch,
          tabId: "tab-a",
          representationA: canonical(snapshot.activeOrder.target),
          representationB: null,
        },
        { ...studentHeaders, "idempotency-key": `main-transfer-${index}` },
      );
      snapshot = response.body.snapshot;
    }
    expect(snapshot).toMatchObject({
      status: "completed",
      shippedSlots: 5,
      activeOrder: null,
    });
    const transfer = await request(
      `/games/place-value-factory/attempts/${snapshot.attemptId}/transfer`,
      {
        commandId: "start-extra",
        expectedRevision: snapshot.revision,
        leaseEpoch: snapshot.leaseEpoch,
        tabId: "tab-a",
      },
      { ...studentHeaders, "idempotency-key": "start-extra" },
    );
    expect(transfer.body.snapshot.activeOrder).toBeTruthy();
    const extra = transfer.body.snapshot.activeOrder;
    const resolved = await request(
      `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${extra.id}/responses`,
      {
        commandId: "finish-extra",
        expectedRevision: transfer.body.snapshot.revision,
        leaseEpoch: transfer.body.snapshot.leaseEpoch,
        tabId: "tab-a",
        representationA: canonical(extra.target),
        representationB: null,
      },
      { ...studentHeaders, "idempotency-key": "finish-extra" },
    );
    expect(resolved.body.result).toMatchObject({
      shipped: 5,
      transferStar: true,
      bestLevelStars: 3,
    });
  });
});
