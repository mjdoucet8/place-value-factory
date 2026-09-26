import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Always create our own cluster. Never read DATABASE_URL or reset a supplied database.
const directory = await mkdtemp(join(tmpdir(), "pvf-postgres-test-"));
const socket = join(directory, "socket");
await mkdir(socket, { mode: 0o700 });
const binary = process.env.PVF_POSTGRES_BIN ?? "/usr/lib/postgresql/16/bin";
const data = join(directory, "data");
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status})`);
}
let started = false;
try {
  run(join(binary, "initdb"), [
    "-D",
    data,
    "--auth-local=peer",
    "--auth-host=reject",
    "--no-locale",
    "--encoding=UTF8",
  ]);
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
  run(
    "npx",
    [
      "vitest",
      "run",
      "tests/integration/postgres-real.test.ts",
      "tests/integration/rc07-progression-real.test.ts",
      "tests/integration/security-real.test.ts",
    ],
    {
      env: {
        ...process.env,
        PVF_TEST_PG_SOCKET: socket,
        PGUSER: userInfo().username,
        PGDATABASE: "postgres",
      },
    },
  );
  run(join(binary, "pg_ctl"), ["-D", data, "-m", "fast", "-w", "restart"]);
  run(
    "npx",
    [
      "vitest",
      "run",
      "tests/integration/postgres-real.test.ts",
      "tests/integration/rc07-progression-real.test.ts",
    ],
    {
      env: {
        ...process.env,
        PVF_TEST_PG_SOCKET: socket,
        PVF_TEST_PG_RESTART: "1",
        PGUSER: userInfo().username,
        PGDATABASE: "postgres",
      },
    },
  );
} finally {
  if (started)
    run(join(binary, "pg_ctl"), ["-D", data, "-m", "fast", "-w", "stop"]);
  console.log(`Disposable test cluster retained for diagnostics: ${directory}`);
}
