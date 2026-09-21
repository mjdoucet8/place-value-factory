import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createApiServer } from "../../apps/server/src/index.js";

const headers = {
  "content-type": "application/json",
  "x-session": "student-ava",
};
const canonical = (target: number) => {
  let remaining = target;
  return [100000, 10000, 1000, 100, 10, 1].map((place) => {
    const quantity = Math.floor(remaining / place);
    remaining %= place;
    return quantity;
  });
};

async function start(dataPath: string) {
  const server = createApiServer(dataPath);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  return {
    server,
    request: async (
      path: string,
      body?: unknown,
    customHeaders: Record<string, string> = headers,
      method = body === undefined ? "GET" : "POST",
    ) => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: customHeaders,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: (await response.json()) as any };
    },
  };
}

describe("fictional student and teacher journey", () => {
  let directory = "";
  let server: ReturnType<typeof createApiServer> | undefined;
  afterEach(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server!.close((error) => (error ? reject(error) : resolve())),
      );
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it("survives a restart, keeps a wrong response, completes once, and reconciles teacher counts", async () => {
    directory = await mkdtemp(join(tmpdir(), "pvf-journey-"));
    const path = join(directory, "development.json");
    let app = await start(path);
    server = app.server;
    const login = await app.request(
      "/auth/student/session",
      { classCode: "factory5", username: "AVA", pin: "123456" },
      { "content-type": "application/json" },
    );
    expect(login).toMatchObject({
      status: 200,
      body: { principal: { id: "student-ava" } },
    });
    const started = await app.request(
      "/games/place-value-factory/attempts",
      {
        commandId: "journey-start",
        profileRevision: 0,
        tabId: "journey-tab",
        levelId: "level-1",
      },
      { ...headers, "idempotency-key": "journey-start" },
    );
    let snapshot = started.body;
    const firstOrder = snapshot.activeOrder;
    const wrong = await app.request(
      `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${firstOrder.id}/responses`,
      {
        commandId: "journey-wrong",
        expectedRevision: 0,
        leaseEpoch: 1,
        tabId: "journey-tab",
        representationA: [0, 0, 0, 0, 0, 0],
        representationB: null,
      },
      { ...headers, "idempotency-key": "journey-wrong" },
    );
    expect(wrong.body.validation).toMatchObject({
      shipmentAccepted: false,
      feedbackCode: "UNDERPRODUCTION",
    });
    await new Promise<void>((resolve, reject) =>
      server!.close((error) => (error ? reject(error) : resolve())),
    );
    server = undefined;
    app = await start(path);
    server = app.server;
    snapshot = (
      await app.request(
        `/games/place-value-factory/attempts/${snapshot.attemptId}`,
      )
    ).body;
    expect(snapshot).toMatchObject({
      revision: 1,
      shippedSlots: 0,
      activeOrder: { id: firstOrder.id },
    });
    for (let index = 0; index < 5; index++) {
      const order = snapshot.activeOrder;
      const saved = await app.request(
        `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${order.id}/responses`,
        {
          commandId: `journey-save-${index}`,
          expectedRevision: snapshot.revision,
          leaseEpoch: snapshot.leaseEpoch,
          tabId: "journey-tab",
          representationA: canonical(order.target),
          representationB: null,
        },
        { ...headers, "idempotency-key": `journey-save-${index}` },
      );
      snapshot = saved.body.snapshot;
    }
    expect(snapshot).toMatchObject({ status: "completed", shippedSlots: 5 });
    const profile = await app.request("/profile");
    expect(profile.body).toMatchObject({
      totalStars: 2,
      maxStars: 90,
      activeAttemptId: null,
    });
    const settings = await app.request(
      "/profile/settings",
      {
        settings: {
          sound: false,
          reducedMotion: true,
          pressure: "calm",
          textScale: "large",
        },
      },
      headers,
      "PATCH",
    );
    expect(settings.body.settings).toMatchObject({
      reducedMotion: true,
      textScale: "large",
    });
    const report = await app.request(
      "/teacher/classes/class-demo/games/place-value-factory/report",
      undefined,
      { "x-session": "teacher-dev" },
    );
    expect(report.body.students[0]).toMatchObject({
      submittedN: 6,
      eventuallyCorrectN: 5,
      firstWrongN: 1,
      correctionSuccessN: 1,
    });
    const forbidden = await app.request(
      "/teacher/classes/class-demo/games/place-value-factory/report",
    );
    expect(forbidden.status).toBe(404);
  });
});
