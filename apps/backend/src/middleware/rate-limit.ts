/**
 * Rate limiting for auth endpoints.
 * 10 requests per IP per minute on /auth/* routes.
 *
 * Uses express-rate-limit with in-memory store (sufficient for single-instance Railway deploy).
 * Upgrade to Redis store if horizontal scaling is needed.
 */
import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute and try again' },
  keyGenerator: (req) => {
    // Trust Railway's proxy — use X-Forwarded-For if present
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return req.ip ?? 'unknown';
  },
  skip: (req) => {
    // Never rate-limit /health
    return req.path === '/health';
  },
});
