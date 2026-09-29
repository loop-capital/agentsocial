/**
 * SQL migration runner.
 *
 * Applies each `migrations/*.sql` file once, in filename order, recording it in
 * `schema_migrations`. Each file runs in its own transaction.
 *
 * Files sorting before BASELINE predate this runner; the database already
 * reflects them (they were applied by hand or by startup code), so they are
 * recorded as applied without running. New migrations: add a file named
 * `YYYY_MM_DD_description.sql` (date >= the baseline).
 */

import { readdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pool } from "./index.js";

const BASELINE = "2026_09_29";

// dist/db/migrate.js and src/db/migrate.ts both sit two levels below packages/api
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "migrations");

export async function runMigrations(log: (msg: string) => void = console.log): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now(),
      baseline boolean NOT NULL DEFAULT false
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const { rows } = await pool.query(`SELECT name FROM schema_migrations`);
  const applied = new Set(rows.map((r) => r.name as string));
  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;

    if (file < BASELINE) {
      await pool.query(`INSERT INTO schema_migrations (name, baseline) VALUES ($1, true) ON CONFLICT DO NOTHING`, [file]);
      continue;
    }

    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      ran.push(file);
      log(`Applied migration ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  return ran;
}
