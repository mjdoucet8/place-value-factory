import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApiServer } from "../../apps/server/src/index.js";

const roots: string[] = [];
afterEach(async () => {
  delete process.env.PVF_STATIC_DIR;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("single-service staging server", () => {
  it("serves the built SPA, keeps missing assets 404 and exposes health", async () => {
    const root = await mkdtemp(join(tmpdir(), "pvf-static-"));
    roots.push(root);
    await writeFile(join(root, "index.html"), "<!doctype html><title>Factory staging</title>");
    process.env.PVF_STATIC_DIR = root;
    const server = createApiServer(join(root, "state.json"));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Missing test address");
      const origin = `http://127.0.0.1:${address.port}`;
      expect(await (await fetch(`${origin}/mission/1`)).text()).toContain("Factory staging");
      expect((await fetch(`${origin}/assets/missing.js`)).status).toBe(404);
      expect(await (await fetch(`${origin}/api/healthz`)).json()).toEqual({ status: "ok" });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
