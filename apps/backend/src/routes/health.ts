/**
 * GET /health
 * Public endpoint for Railway healthchecks.
 * Always returns HTTP 200 — db status is in the response body.
 * Railway needs 2xx to consider the service healthy.
 */
import { Router } from 'express';
import { pool } from '../db/client';

const VERSION = process.env.npm_package_version ?? '1.0.0';

export const healthRouter: Router = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbStatus: 'connected' | 'down' = 'down';

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'connected';
  } catch {
    // DB temporarily unavailable — still return 200 so Railway does not
    // kill the container during DB cold-start. The body signals db: "down".
  }

  res.status(200).json({
    ok: true,
    version: VERSION,
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});
