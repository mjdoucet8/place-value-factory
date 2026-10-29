import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApiServer, runtimeDatabaseOptions } from "../../apps/server/src/index.js";

const roots: string[] = [];
afterEach(async () => {
  delete process.env.PVF_STATIC_DIR;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("single-service staging server", () => {
  it("uses Marketplace PostgreSQL and a bounded staging pool", () => {
    expect(runtimeDatabaseOptions({
      POSTGRES_URL: "postgresql://fictional@example.test/factory",
      PVF_MODE: "staging",
    })).toEqual({
      connectionString: "postgresql://fictional@example.test/factory",
      max: 1,
    });
    expect(() => runtimeDatabaseOptions({
      DATABASE_URL: "postgresql://fictional@example.test/factory",
      PVF_DATABASE_POOL_MAX: "0",
    })).toThrow("PVF_DATABASE_POOL_MAX");
  });

  it("keeps certificate verification when URL SSL flags try to override it", () => {
    const options = runtimeDatabaseOptions({
      DATABASE_URL: "postgresql://fictional@example.test/factory?sslmode=no-verify&sslrootcert=untrusted&uselibpqcompat=true&application_name=factory",
      DATABASE_CA_CERT: "certificate-line-1\\ncertificate-line-2",
      PVF_MODE: "staging",
    });
    expect(options?.connectionString).toBe("postgresql://fictional@example.test/factory?application_name=factory");
    expect(options?.ssl).toEqual({ ca: "certificate-line-1\ncertificate-line-2", rejectUnauthorized: true });
    expect(options?.max).toBe(1);
  });

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
