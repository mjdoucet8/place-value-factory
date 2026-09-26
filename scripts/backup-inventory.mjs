import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { constants } from "node:fs";
import { lstat, open, readdir, unlink } from "node:fs/promises";
import { basename, isAbsolute, join } from "node:path";

const [action, ...raw] = process.argv.slice(2);
const args = new Set(raw);
const option = (name) => [...args].find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3);
const directory = process.env.PVF_BACKUP_DIRECTORY;
const days = Number(process.env.PVF_BACKUP_RETENTION_DAYS);
if (!['inventory', 'expire'].includes(action)) throw new Error('Use inventory or expire.');
if (!directory || !isAbsolute(directory)) throw new Error('PVF_BACKUP_DIRECTORY must be an absolute, private directory.');
if (!Number.isSafeInteger(days) || days < 1) throw new Error('PVF_BACKUP_RETENTION_DAYS must be an approved positive integer.');
const directoryInfo = await lstat(directory);
if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink() || (directoryInfo.mode & 0o077) !== 0)
  throw new Error('Backup directory must be a private regular directory (0700).');

async function inspect(name) {
  if (basename(name) !== name || name === '.' || name === '..') throw new Error('Archive name must be a direct child of the selected directory.');
  const path = join(directory, name);
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o077) !== 0)
    throw new Error('Archive must be a private regular file (0600).');
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  let magic;
  try {
    const bytes = Buffer.alloc(7);
    await handle.read(bytes, 0, bytes.length, 0);
    magic = bytes.toString();
  } finally { await handle.close(); }
  if (magic !== 'PVFENC1') throw new Error('Selected file is not a Place Value Factory encrypted archive.');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  const expiresAt = new Date(info.mtimeMs + days * 24 * 60 * 60 * 1000);
  return { name, sha256: hash.digest('hex'), bytes: info.size, modifiedAt: info.mtime.toISOString(), expiresAt: expiresAt.toISOString(), expired: expiresAt.getTime() < Date.now() };
}

if (action === 'inventory') {
  const archives = [];
  for (const name of await readdir(directory)) {
    if (!name.endsWith('.backup')) continue;
    archives.push(await inspect(name));
  }
  console.log(JSON.stringify({ directory, retentionDays: days, archives }));
} else {
  const name = option('name');
  if (!name) throw new Error('Expire requires --name=exact-archive.backup.');
  const archive = await inspect(name);
  if (!archive.expired) throw new Error('Selected archive has not reached its configured expiry.');
  const execute = args.has('--execute');
  if (execute) {
    if (option('confirm-directory') !== directory || option('confirm-sha256') !== archive.sha256)
      throw new Error('Execution requires exact --confirm-directory and --confirm-sha256.');
    await unlink(join(directory, name));
    const handle = await open(directory, constants.O_RDONLY);
    try { await handle.sync(); } finally { await handle.close(); }
  }
  console.log(JSON.stringify({ directory, execute, retentionDays: days, archive }));
}
