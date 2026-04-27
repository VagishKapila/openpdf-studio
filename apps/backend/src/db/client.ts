/**
 * Drizzle ORM client — shared singleton.
 * SSL: determined by the DATABASE_URL sslmode parameter.
 * Railway internal postgres (railway.internal) does NOT support SSL.
 * External managed postgres (Railway public, Neon, Supabase) requires SSL.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as schema from './schema';

// Use SSL only when the DATABASE_URL is NOT an internal Railway address.
// Internal Railway domains end in .railway.internal
const isInternalRailway = config.DATABASE_URL.includes('.railway.internal');
const sslConfig = isInternalRailway
  ? false
  : config.NODE_ENV === 'production' || config.NODE_ENV === 'staging'
    ? { rejectUnauthorized: false }
    : false;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: sslConfig,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export const db = drizzle(pool, { schema });
