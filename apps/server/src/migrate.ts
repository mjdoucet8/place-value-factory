import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run database migrations.');

const migrationsDirectory = resolve(process.cwd(), '../../db/migrations');
const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS pvf_schema_migration (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const applied = new Set((await pool.query<{ filename: string }>('SELECT filename FROM pvf_schema_migration')).rows.map((row) => row.filename));
  for (const filename of (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort()) {
    if (applied.has(filename)) continue;
    const sql = await readFile(join(migrationsDirectory, filename), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO pvf_schema_migration (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied ${filename}`);
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
} finally { await pool.end(); }
