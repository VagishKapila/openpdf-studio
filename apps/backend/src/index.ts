/**
 * FormIQ Backend — Express server entry point.
 *
 * Startup sequence:
 *   1. Load + validate environment config
 *   2. Run DB migrations (idempotent)
 *   3. Start HTTP server
 *   4. Register SIGTERM handler for graceful Railway shutdown
 */
import 'dotenv/config';
import express from 'express';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { authRateLimit } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { runMigrations } from './db/migrate';
import { pool } from './db/client';

async function bootstrap(): Promise<void> {
  // ── Run migrations before accepting traffic ─────────────────────────────────
  try {
    await runMigrations();
  } catch (err) {
    console.error('[Startup] Migration failed — aborting:', err);
    process.exit(1);
  }

  // ── Build Express app ───────────────────────────────────────────────────────
  const app = express();

  // Trust Railway's reverse proxy so req.ip reflects the real client IP
  app.set('trust proxy', 1);

  // Global middleware
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // Routes
  app.use(healthRouter);
  app.use('/auth', authRateLimit, authRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler — must be last
  app.use(errorHandler);

  // ── Start server ────────────────────────────────────────────────────────────
  const server = app.listen(config.PORT, () => {
    console.log(
      `[FormIQ Backend] Listening on port ${config.PORT} (${config.NODE_ENV})`,
    );
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  process.on('SIGTERM', () => {
    console.log('[Shutdown] SIGTERM received — closing server');
    server.close(async () => {
      await pool.end();
      console.log('[Shutdown] DB pool closed — exiting');
      process.exit(0);
    });
  });
}

bootstrap().catch((err) => {
  console.error('[Startup] Fatal error:', err);
  process.exit(1);
});
