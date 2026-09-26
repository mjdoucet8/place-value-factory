import { constants } from "node:fs";
import { open, readFile } from "node:fs/promises";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { dirname, isAbsolute } from "node:path";

export type DeletionIntent = {
  classId: string;
  studentId: string;
  reason: "student_delete" | "retention_delete";
  requestedAt: string;
};

const keyFrom = (value: string | undefined) => {
  if (!/^[a-f0-9]{64}$/i.test(value ?? ""))
    throw new Error("PVF_DELETION_LEDGER_KEY must be a private random 32-byte hex key.");
  return Buffer.from(value!, "hex");
};
const validatePath = (path: string | undefined) => {
  if (!path || !isAbsolute(path)) throw new Error("PVF_DELETION_LEDGER must be an absolute path.");
  return path;
};

/** Every line is independently authenticated; custody must preserve the entire file. */
export async function readDeletionLedger(path: string | undefined, keyHex: string | undefined, requireExists = false): Promise<DeletionIntent[]> {
  const file = validatePath(path);
  const key = keyFrom(keyHex);
  let raw: string;
  try {
    const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await handle.stat();
      if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error("Deletion ledger must be a private regular file (0600).");
      raw = await handle.readFile("utf8");
    } finally { await handle.close(); }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" && !requireExists) return [];
    throw error;
  }
  if (raw && !raw.endsWith("\n")) throw new Error("Deletion ledger has an incomplete final record.");
  return raw.split("\n").filter(Boolean).map((line) => {
    const item = JSON.parse(line) as { version: number; iv: string; ciphertext: string; tag: string };
    if (item.version !== 1) throw new Error("Unsupported deletion ledger version.");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(item.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(item.tag, "base64url"));
    const intent = JSON.parse(Buffer.concat([decipher.update(Buffer.from(item.ciphertext, "base64url")), decipher.final()]).toString("utf8")) as DeletionIntent;
    if (!/^[0-9a-f-]{36}$/i.test(intent.classId) || !/^[0-9a-f-]{36}$/i.test(intent.studentId) || !["student_delete", "retention_delete"].includes(intent.reason) || !Number.isFinite(Date.parse(intent.requestedAt)))
      throw new Error("Invalid deletion ledger record.");
    return intent;
  });
}

/** Write and fsync the request before the database deletion. A failed DB action
 * leaves a safe pending intent that will be retried during restore/replay. */
export async function appendDeletionIntent(path: string | undefined, keyHex: string | undefined, intent: DeletionIntent) {
  const file = validatePath(path);
  const key = keyFrom(keyHex);
  await readDeletionLedger(file, keyHex);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(intent)), cipher.final()]);
  const line = JSON.stringify({ version: 1, iv: iv.toString("base64url"), ciphertext: ciphertext.toString("base64url"), tag: cipher.getAuthTag().toString("base64url") }) + "\n";
  const handle = await open(file, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
  try {
    const info = await handle.stat();
    if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error("Deletion ledger must be a private regular file (0600).");
    await handle.writeFile(line);
    await handle.sync();
  } finally { await handle.close(); }
  const directory = await open(dirname(file), constants.O_RDONLY);
  try { await directory.sync(); } finally { await directory.close(); }
}
