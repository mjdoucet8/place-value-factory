import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { migrateDatabase } from "../apps/server/src/migrations.js";
import { PostgresRuntimeStore } from "../apps/server/src/runtime-store.js";
import { LocalIdentity } from "../apps/server/src/identity.js";

if (
  !process.env.PGHOST?.startsWith("/tmp/pvf-pilot-") ||
  process.env.PVF_FICTIONAL_SEED !== "new-owned-cluster"
)
  throw new Error(
    "Seed is restricted to a new launcher-owned fictional pilot cluster.",
  );
const pool = new Pool();
try {
  await migrateDatabase(pool);
  if ((await pool.query("SELECT id FROM pvf_identity LIMIT 1")).rowCount)
    throw new Error("Refusing to seed a populated identity database.");
  const store = new PostgresRuntimeStore(pool);
  const identity = new LocalIdentity(() => store.connection());
  const username = "pilot-teacher",
    password = randomBytes(18).toString("base64url");
  await store.transaction(() => identity.provisionTeacher(username, password));
  process.stdout.write(JSON.stringify({ username, password }));
} finally {
  await pool.end();
}
