import { lstat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const profile = process.argv[2] ?? "pilot";
if (!["pilot", "staging", "production"].includes(profile)) throw new Error("Use pilot, staging or production.");
const errors = [];
const hexKey = (name) => {
  const value = process.env[name];
  if (!/^[a-f0-9]{64}$/i.test(value ?? "")) errors.push(`${name}: private 32-byte hex key required`);
  return value;
};
const positive = (name) => {
  const value = Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < 1) errors.push(`${name}: approved positive days required`);
};
const outsideRepository = (path) => {
  const distance = relative(resolve(process.cwd()), path);
  return distance.startsWith("..") || isAbsolute(distance);
};
const privatePath = async (name, asDirectory) => {
  const path = process.env[name];
  if (!path || !isAbsolute(path) || !outsideRepository(path)) {
    errors.push(`${name}: absolute path outside repository required`);
    return;
  }
  try {
    const info = await lstat(asDirectory ? path : dirname(path));
    if (!info.isDirectory() || info.isSymbolicLink() || (info.mode & 0o077) !== 0)
      errors.push(`${name}: private non-symlink directory required (0700)`);
  } catch { errors.push(`${name}: private directory must already exist`); }
};
try {
  const url = new URL(process.env.DATABASE_URL || process.env.POSTGRES_URL || "");
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.pathname.slice(1)) throw new Error();
} catch { errors.push("DATABASE_URL/POSTGRES_URL: PostgreSQL URL and database name required"); }
try {
  const origin = new URL(process.env.PVF_ORIGIN ?? "");
  if (origin.pathname !== "/" || origin.search || origin.hash) throw new Error();
  if (["staging", "production"].includes(profile) && origin.protocol !== "https:") throw new Error();
  if (profile === "pilot" && !(origin.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname))) throw new Error();
} catch { errors.push("PVF_ORIGIN: HTTPS production origin or loopback pilot origin required"); }
if (profile === "pilot" && process.env.PVF_AUTH !== "local") errors.push("PVF_AUTH: local identity required for fictional pilot");
if (profile === "staging" && process.env.PVF_AUTH !== "local") errors.push("PVF_AUTH: local identity required for fictional staging");
if (profile === "staging" && process.env.PVF_FICTIONAL_ONLY !== "true") errors.push("PVF_FICTIONAL_ONLY: true is required for staging");
if (profile === "staging") {
  const poolMax = Number(process.env.PVF_DATABASE_POOL_MAX ?? "1");
  if (!Number.isSafeInteger(poolMax) || poolMax < 1 || poolMax > 50)
    errors.push("PVF_DATABASE_POOL_MAX: integer from 1 to 50 required");
}
if (profile === "production") errors.push("PVF_AUTH: school identity adapter is not implemented; production remains blocked");
const receipt = hexKey("PVF_RECEIPT_KEY"), backup = hexKey("PVF_BACKUP_KEY"), ledger = hexKey("PVF_DELETION_LEDGER_KEY");
if (receipt && (receipt === backup || receipt === ledger) || backup && backup === ledger) errors.push("Keys: use distinct private keys for receipts, backup and deletion ledger");
for (const name of ["PVF_RETENTION_DAYS", "PVF_BACKUP_RETENTION_DAYS", "PVF_AUDIT_RETENTION_DAYS"]) positive(name);
await privatePath("PVF_BACKUP_DIRECTORY", true);
await privatePath("PVF_DELETION_LEDGER", false);
console.log(JSON.stringify({ profile, valid: errors.length === 0, errors }));
if (errors.length) process.exitCode = 1;
