/**
 * Drizzle ORM client — shared singleton.
 * Uses node-postgres (pg) pool under the hood.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as schema from './schema';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // Railway Postgres requires SSL; disable for local dev
  ssl:
    config.NODE_ENV === 'production' || config.NODE_ENV === 'staging'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export const db = drizzle(pool, { schema });
