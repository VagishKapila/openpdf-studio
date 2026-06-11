/**
 * Global error handler — must be the LAST middleware registered.
 *
 * Converts ApiError instances to typed JSON responses.
 * All unhandled errors become 500.
 *
 * Response shape: { error: string }
 * This matches what the FormIQ frontend api.ts reads: body.error
 */
import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Log unexpected errors with context
  console.error(`[${req.method} ${req.path}] Unhandled error:`, err);
  res.status(500).json({ error: 'Internal server error' });
}
