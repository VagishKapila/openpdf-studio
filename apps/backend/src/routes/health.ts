/**
 * GET /health
 * Public endpoint used by Railway healthchecks and start-of-Cowork verification.
 *
 * Response:
 *   200 { ok: true, version, timestamp, db: "connected" | "down" }
 *   503 { ok: false, ... } when DB is unreachable
 */
import { Router } from 'express';
import { pool } from '../db/client';

// Provided by npm/pnpm at runtime; fallback to package constant
const VERSION = process.env.npm_package_version ?? '1.0.0';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbStatus: 'connected' | 'down' = 'down';

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'connected';
  } catch {
    // DB is down — return 503 so Railway marks service unhealthy
  }

  const status = dbStatus === 'connected' ? 200 : 503;
  res.status(status).json({
    ok: dbStatus === 'connected',
    version: VERSION,
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});
