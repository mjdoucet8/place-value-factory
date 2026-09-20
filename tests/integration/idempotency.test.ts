import { mkdtemp, rm } from "node:fs/promises";
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
});
