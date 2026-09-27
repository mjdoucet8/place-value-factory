import { Pool } from "pg";
import { migrateDatabase } from "./migrations.js";

const databaseUrl =
  process.env.PVF_MIGRATION_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;
if (!databaseUrl)
  throw new Error(
    "PVF_MIGRATION_DATABASE_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL or POSTGRES_URL is required to run database migrations.",
  );

const pool = new Pool({ connectionString: databaseUrl });

try {
  for (const filename of await migrateDatabase(pool))
    console.log(`Applied ${filename}`);
} finally {
  await pool.end();
}
