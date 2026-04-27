/**
 * Environment configuration — loaded once at startup.
 * Crashes the process if required vars are missing (fail-fast).
 */
import { z } from 'zod';
import 'dotenv/config';

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT secrets — enforce minimum length in production
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // Google OAuth (optional — Google sign-in is disabled when not set)
  GOOGLE_CLIENT_ID: z.string().optional(),

  // CORS — comma-separated list of allowed frontend origins
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const config = result.data;

/** Parsed list of allowed CORS origins */
export const allowedOrigins = config.FRONTEND_ORIGIN.split(',').map((s) =>
  s.trim(),
);
