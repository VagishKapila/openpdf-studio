/**
 * Auth middleware — verifies Bearer access token and attaches user to req.
 *
 * Usage:
 *   router.get('/protected', requireAuth, (req, res) => { req.user ... })
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { Errors } from '../lib/errors';

// Extend Express Request to include authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw Errors.unauthorized('Missing or malformed Authorization header');
    }
    const token = header.slice(7);
    const payload = await verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    // jose throws JWTExpired etc — treat all verify failures as 401
    if ((err as { status?: number }).status === 401) {
      next(err);
    } else {
      next(Errors.unauthorized('Invalid or expired access token'));
    }
  }
}
