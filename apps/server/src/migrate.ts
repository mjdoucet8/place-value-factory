import { Pool } from "pg";
import { migrateDatabase } from "./migrations.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL is required to run database migrations.");

const pool = new Pool({ connectionString: databaseUrl });

try {
  for (const filename of await migrateDatabase(pool))
    console.log(`Applied ${filename}`);
} finally {
  await pool.end();
}
