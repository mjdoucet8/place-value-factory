import { Pool } from "pg";
import { migrateDatabase } from "../apps/server/src/migrations.js";
import { PostgresRuntimeStore } from "../apps/server/src/runtime-store.js";
import { LocalIdentity } from "../apps/server/src/identity.js";

if (
  process.env.PVF_MODE !== "staging" ||
  process.env.PVF_FICTIONAL_ONLY !== "true" ||
  process.env.PVF_AUTH !== "local"
)
  throw new Error(
    "Staging seed requires PVF_MODE=staging, PVF_FICTIONAL_ONLY=true and PVF_AUTH=local.",
  );
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const username = process.env.PVF_STAGING_TEACHER_USERNAME?.trim().toLowerCase();
const password = process.env.PVF_STAGING_TEACHER_PASSWORD;
const pool = new Pool({ connectionString: databaseUrl });

try {
  await migrateDatabase(pool);
  const teachers = await pool.query(
    "SELECT username FROM pvf_identity WHERE role='teacher' ORDER BY created_at",
  );
  if (teachers.rowCount) {
    if (username && !teachers.rows.some((row) => row.username === username))
      throw new Error(
        "A different staging teacher already exists; credentials were not changed.",
      );
    console.log("Fictional staging teacher already provisioned.");
  } else {
    if (!username || !password)
      throw new Error(
        "PVF_STAGING_TEACHER_USERNAME and PVF_STAGING_TEACHER_PASSWORD are required for first staging startup.",
      );
    const store = new PostgresRuntimeStore(pool);
    const identity = new LocalIdentity(() => store.connection());
    await store.transaction(() => identity.provisionTeacher(username, password));
    console.log("Fictional staging teacher provisioned.");
  }
} finally {
  await pool.end();
}
