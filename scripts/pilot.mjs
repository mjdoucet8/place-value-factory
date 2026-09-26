import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { userInfo } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const resume = process.argv[2];
if (resume && !/^\/tmp\/pvf-pilot-[A-Za-z0-9]+$/.test(resume))
  throw new Error(
    "Resume requires an exact /tmp/pvf-pilot-* directory created by this launcher.",
  );
const directory = resume ?? (await mkdtemp("/tmp/pvf-pilot-"));
const socket = join(directory, "socket"),
  data = join(directory, "data");
const binary = process.env.PVF_POSTGRES_BIN ?? "/usr/lib/postgresql/16/bin";
const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} failed`);
  return result;
};
let started = false,
  child;
const stop = () => {
  if (child?.pid) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
  if (started) {
    started = false;
    run(join(binary, "pg_ctl"), ["-D", data, "-m", "fast", "-w", "stop"]);
  }
};
try {
  if (!resume) {
    await mkdir(socket, { mode: 0o700 });
    run(join(binary, "initdb"), [
      "-D",
      data,
      "--auth-local=peer",
      "--auth-host=reject",
      "--no-locale",
      "--encoding=UTF8",
    ]);
  } else await readFile(join(directory, "pilot-private.json"), "utf8");
  run(join(binary, "pg_ctl"), [
    "-D",
    data,
    "-l",
    join(directory, "postgres.log"),
    "-o",
    `-k ${socket} -c listen_addresses=''`,
    "-w",
    "start",
  ]);
  started = true;
  const env = {
    ...process.env,
    PGHOST: socket,
    PGUSER: userInfo().username,
    PGDATABASE: "postgres",
    PGPORT: "5432",
  };
  const databaseUrl = `postgresql://${encodeURIComponent(env.PGUSER)}@/postgres?host=${encodeURIComponent(socket)}`;
  run("npx", ["tsx", "apps/server/src/migrate.ts"], {
    cwd: repo,
    env: { ...env, DATABASE_URL: databaseUrl },
  });
  let config;
  if (!resume) {
    const seeded = run("npx", ["tsx", "scripts/seed-pilot.ts"], {
      cwd: repo,
      env: { ...env, PVF_FICTIONAL_SEED: "new-owned-cluster" },
      stdio: ["ignore", "pipe", "inherit"],
      encoding: "utf8",
    });
    config = {
      ...JSON.parse(seeded.stdout),
      receiptKey: randomBytes(32).toString("hex"),
    };
    await writeFile(
      join(directory, "pilot-private.json"),
      JSON.stringify(config, null, 2),
      { mode: 0o600 },
    );
  } else
    config = JSON.parse(
      await readFile(join(directory, "pilot-private.json"), "utf8"),
    );
  const webPort = process.env.PVF_WEB_PORT ?? "5183",
    apiPort = process.env.PORT ?? "3103";
  const url = `http://127.0.0.1:${webPort}`;
  console.log(
    `Fictional-data pilot: ${url}\nTeacher credentials: ${join(directory, "pilot-private.json")}\nResume later: npm run pilot:local -- ${directory}\nData stays in this private temporary directory; no existing database was changed.`,
  );
  child = spawn("npm", ["run", "dev"], {
    detached: true,
    cwd: repo,
    stdio: "inherit",
    env: {
      ...env,
      DATABASE_URL: databaseUrl,
      PVF_MODE: "pilot",
      PVF_AUTH: "local",
      PVF_ORIGIN: url,
      PVF_RECEIPT_KEY: config.receiptKey,
      PVF_WEB_PORT: webPort,
      PORT: apiPort,
      PVF_API_PORT: apiPort,
    },
  });
  process.once("SIGINT", () => {
    stop();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    stop();
    process.exit(0);
  });
  await new Promise((resolve) => child.once("exit", resolve));
} finally {
  stop();
}
