/**
 * FormIQ Backend — Express server entry point.
 *
 * Startup sequence:
 *   1. Start HTTP server immediately (Railway healthcheck can pass)
 *   2. Run DB migrations async in background
 *   3. Register SIGTERM handler for graceful shutdown
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
  // ── Build Express app ───────────────────────────────────────────────────────
  const app = express();

  // Trust Railway proxy so req.ip reflects real client IP
  app.set('trust proxy', 1);

  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use(healthRouter);
  app.use('/auth', authRateLimit, authRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use(errorHandler);

  // ── Start HTTP server FIRST so healthcheck passes immediately ───────────────
  const server = app.listen(config.PORT, () => {
    console.log(
      `[FormIQ Backend] Listening on port ${config.PORT} (${config.NODE_ENV})`,
    );
  });

  // ── Run migrations async — does not block server startup ───────────────────
  runMigrations()
    .then(() => console.log('[FormIQ Backend] Migrations complete'))
    .catch((err) => console.error('[FormIQ Backend] Migration error (non-fatal):', err));

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
