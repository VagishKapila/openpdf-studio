/**
 * Database migration runner.
 * Runs the initial schema SQL directly via pg — no Drizzle journal required.
 * Idempotent: all statements use IF NOT EXISTS.
 *
 * Called automatically on server startup.
 * Can also be run standalone: tsx src/db/migrate.ts
 */
import { Pool } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

async function runMigrations(): Promise<void> {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl:
      config.NODE_ENV === 'production' || config.NODE_ENV === 'staging'
        ? { rejectUnauthorized: false }
        : false,
  });

  const client = await pool.connect();
  try {
    console.log('[DB] Running migrations...');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _formiq_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Load all .sql files from migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');

    let sqlFiles: string[] = [];
    try {
      sqlFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    } catch {
      console.log('[DB] No migrations directory found — skipping');
      return;
    }

    for (const file of sqlFiles) {
      // Check if already applied
      const { rows } = await client.query(
        'SELECT id FROM _formiq_migrations WHERE name = $1',
        [file],
      );
      if (rows.length > 0) {
        console.log(`[DB] Migration already applied: ${file}`);
        continue;
      }

      // Apply migration
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _formiq_migrations (name) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`[DB] Applied migration: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }

    console.log('[DB] Migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

export { runMigrations };

// Allow running standalone
if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  });
}
