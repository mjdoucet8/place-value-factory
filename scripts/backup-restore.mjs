import { spawn, spawnSync } from "node:child_process";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, open, stat, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Pool } from "pg";

const [action, ...raw] = process.argv.slice(2);
const args = new Set(raw);
const option = (name) => [...args].find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3);
const archive = option("archive");
if (!["backup", "restore"].includes(action) || !archive)
  throw new Error("Use backup|restore --archive=/absolute/path [--execute --confirm-target-db=name].");
if (resolve(archive) !== archive) throw new Error("Archive path must be absolute.");
const keyHex = process.env.PVF_BACKUP_KEY;
if (!/^[a-f0-9]{64}$/i.test(keyHex ?? ""))
  throw new Error("PVF_BACKUP_KEY must be a private random 32-byte hex key.");
const key = Buffer.from(keyHex, "hex");
const sourceUrl = process.env.PVF_BACKUP_SOURCE_URL;
const targetUrl = process.env.PVF_RESTORE_TARGET_URL;
const ledgerPath = process.env.PVF_DELETION_LEDGER;
const magic = Buffer.from("PVFENC1");
const headerSize = magic.length + 12;

function pgEnvironment(connectionString) {
  if (!connectionString) throw new Error("An explicit operations database URL is required.");
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Only PostgreSQL URLs are accepted.");
  const env = { ...process.env };
  delete env.PVF_BACKUP_KEY;
  delete env.PVF_BACKUP_SOURCE_URL;
  delete env.PVF_RESTORE_TARGET_URL;
  delete env.PVF_DELETION_LEDGER;
  delete env.PVF_DELETION_LEDGER_KEY;
  delete env.PVF_RECEIPT_KEY;
  delete env.PVF_OPERATIONS_DATABASE_URL;
  delete env.DATABASE_URL;
  return {
    ...env,
    PGHOST: url.searchParams.get("host") ?? url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  };
}
function command(name, commandArgs, env) {
  const child = spawn(name, commandArgs, { env, stdio: ["pipe", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString()).slice(-2000); });
  const finished = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`${name} failed: ${stderr.trim() || code}`)));
  });
  return { child, finished };
}
function ledgerCommand(name, targetUrl, targetName) {
  const env = { ...process.env, PVF_OPERATIONS_DATABASE_URL: targetUrl };
  delete env.PVF_BACKUP_KEY;
  delete env.PVF_BACKUP_SOURCE_URL;
  delete env.PVF_RESTORE_TARGET_URL;
  const result = spawnSync("npx", ["--no-install", "tsx", "scripts/operations.ts", name, ...(name === "deletion-replay" ? ["--execute", `--confirm-db=${targetName}`] : [])], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0)
    throw new Error(`Deletion ledger ${name} failed; restored target must remain isolated: ${result.stderr?.trim() || result.error?.message || result.status}`);
  return JSON.parse(result.stdout);
}
async function dbName(url) {
  const pool = new Pool({ connectionString: url });
  try { return (await pool.query("SELECT current_database() AS name")).rows[0].name; }
  finally { await pool.end(); }
}
async function encryptedPayload() {
  const details = await stat(archive);
  if (details.size <= headerSize + 16) throw new Error("Encrypted backup is incomplete.");
  const file = await open(archive, "r");
  try {
    const header = Buffer.alloc(headerSize);
    const tag = Buffer.alloc(16);
    await file.read(header, 0, header.length, 0);
    await file.read(tag, 0, tag.length, details.size - 16);
    if (!header.subarray(0, magic.length).equals(magic)) throw new Error("Invalid encrypted backup format.");
    return { iv: header.subarray(magic.length), tag, end: details.size - 17 };
  } finally { await file.close(); }
}
const decryptStream = ({ iv, tag }) => {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher;
};

if (action === "backup") {
  const name = await dbName(sourceUrl);
  if (option("confirm-source-db") !== name)
    throw new Error(`Backup requires --confirm-source-db=${name}.`);
  const iv = randomBytes(12);
  const handle = await open(archive, "wx", 0o600);
  await handle.write(Buffer.concat([magic, iv]));
  await handle.close();
  try {
    const { child, finished } = command("pg_dump", ["--format=custom", "--no-owner", "--no-acl"], pgEnvironment(sourceUrl));
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    await Promise.all([pipeline(child.stdout, cipher, createWriteStream(archive, { flags: "a" })), finished]);
    await appendFile(archive, cipher.getAuthTag());
    console.log(JSON.stringify({ action, database: name, archive, bytes: (await stat(archive)).size, encrypted: true }));
  } catch (error) {
    await unlink(archive);
    throw error;
  }
} else {
  if (!args.has("--execute")) throw new Error("Restore requires --execute.");
  if (Boolean(ledgerPath) === args.has("--confirm-no-deletion-ledger"))
    throw new Error("Restore requires either PVF_DELETION_LEDGER with its key or --confirm-no-deletion-ledger for a verified zero-request rehearsal.");
  if (ledgerPath && (!Number.isSafeInteger(Number(process.env.PVF_BACKUP_RETENTION_DAYS)) || Number(process.env.PVF_BACKUP_RETENTION_DAYS) < 1))
    throw new Error("Restoring with a deletion ledger requires an approved PVF_BACKUP_RETENTION_DAYS value.");
  const targetName = await dbName(targetUrl);
  if (option("confirm-target-db") !== targetName)
    throw new Error(`Restore requires --confirm-target-db=${targetName}.`);
  if (sourceUrl && (await dbName(sourceUrl)) === targetName)
    throw new Error("Restore target must have a different database name from the source.");
  const payload = await encryptedPayload();
  // Authenticate the whole archive before opening the target for writes.
  await pipeline(
    createReadStream(archive, { start: headerSize, end: payload.end }),
    decryptStream(payload),
    new Writable({ write(_chunk, _encoding, callback) { callback(); } }),
  );
  if (ledgerPath) ledgerCommand("deletion-ledger-check", targetUrl, targetName);
  const pool = new Pool({ connectionString: targetUrl });
  try {
    const objects = await pool.query(
      "SELECT count(*)::int AS n FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p','v','m')",
    );
    if (objects.rows[0].n !== 0) throw new Error("Restore target public schema must be empty.");
  } finally { await pool.end(); }
  const { child, finished } = command("pg_restore", ["--exit-on-error", "--no-owner", "--no-acl", "--dbname", targetName], pgEnvironment(targetUrl));
  await Promise.all([
    pipeline(createReadStream(archive, { start: headerSize, end: payload.end }), decryptStream(payload), child.stdin),
    finished,
  ]);
  const deletionReplay = ledgerPath ? ledgerCommand("deletion-replay", targetUrl, targetName) : { skipped: "operator-confirmed zero deletion requests" };
  const verify = new Pool({ connectionString: targetUrl });
  try {
    const counts = (await verify.query(
      `SELECT
       (SELECT count(*)::int FROM pvf_student) AS students,
       (SELECT count(*)::int FROM pvf_attempt) AS attempts,
       (SELECT count(*)::int FROM pvf_order) AS orders,
       (SELECT count(*)::int FROM pvf_response) AS answers,
       (SELECT count(*)::int FROM pvf_skill_evidence) AS evidence,
       (SELECT count(*)::int FROM pvf_command_receipt) AS receipts`,
    )).rows[0];
    console.log(JSON.stringify({ action, database: targetName, archive, counts, encrypted: true, deletionReplay }));
  } finally { await verify.end(); }
}
