import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

const directory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../db/migrations",
);

/** Serialize migration runners and apply each schema change with its ledger entry. */
export async function migrateDatabase(pool: Pool): Promise<string[]> {
  const client = await pool.connect();
  const appliedNow: string[] = [];
  try {
    await client.query("SELECT pg_advisory_lock(736482901)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS pvf_schema_migration(filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = new Set(
      (
        await client.query<{ filename: string }>(
          "SELECT filename FROM pvf_schema_migration",
        )
      ).rows.map((row) => row.filename),
    );
    for (const filename of (await readdir(directory))
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      if (applied.has(filename)) continue;
      const sql = await readFile(join(directory, filename), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO pvf_schema_migration(filename) VALUES($1)",
          [filename],
        );
        await client.query("COMMIT");
        appliedNow.push(filename);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    return appliedNow;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(736482901)");
    } finally {
      client.release();
    }
  }
}
