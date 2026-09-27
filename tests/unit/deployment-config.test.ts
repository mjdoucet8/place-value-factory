import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("provider-independent deployment preflight", () => {
  it("accepts a private fictional pilot configuration and rejects a local production identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "pvf-preflight-"));
    const backups = join(root, "backups");
    await mkdir(backups, { mode: 0o700 });
    const env = {
      ...process.env,
      DATABASE_URL: "postgresql://fictional@localhost/fictional_pilot",
      PVF_ORIGIN: "http://127.0.0.1:5183",
      PVF_AUTH: "local",
      PVF_RECEIPT_KEY: randomBytes(32).toString("hex"),
      PVF_BACKUP_KEY: randomBytes(32).toString("hex"),
      PVF_DELETION_LEDGER_KEY: randomBytes(32).toString("hex"),
      PVF_BACKUP_DIRECTORY: backups,
      PVF_DELETION_LEDGER: join(root, "deletions.jsonl"),
      PVF_RETENTION_DAYS: "30",
      PVF_BACKUP_RETENTION_DAYS: "30",
      PVF_AUDIT_RETENTION_DAYS: "30",
    };
    try {
      const run = (profile: string, overrides = {}) => spawnSync(process.execPath, ["scripts/validate-deployment.mjs", profile], { cwd: process.cwd(), env: { ...env, ...overrides }, encoding: "utf8" });
      const pilot = run("pilot");
      expect(pilot.status, pilot.stderr).toBe(0);
      expect(JSON.parse(pilot.stdout)).toMatchObject({ profile: "pilot", valid: true, errors: [] });
      const badKey = run("pilot", { PVF_BACKUP_KEY: env.PVF_RECEIPT_KEY });
      expect(badKey.status).not.toBe(0);
      expect(JSON.parse(badKey.stdout).errors).toContain("Keys: use distinct private keys for receipts, backup and deletion ledger");
      const staging = run("staging", {
        PVF_ORIGIN: "https://fictional-staging.example",
        PVF_FICTIONAL_ONLY: "true",
      });
      expect(staging.status, staging.stderr).toBe(0);
      expect(JSON.parse(staging.stdout)).toMatchObject({ profile: "staging", valid: true, errors: [] });
      const production = run("production", { PVF_ORIGIN: "https://fictional.example" });
      expect(production.status).not.toBe(0);
      expect(JSON.parse(production.stdout).errors).toContain("PVF_AUTH: school identity adapter is not implemented; production remains blocked");
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
