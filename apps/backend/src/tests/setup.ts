/**
 * Vitest test setup — stubs the DB + external services so tests are pure unit/integration
 * without requiring a real Postgres or Google token.
 */
import { vi } from 'vitest';

// Stub dotenv so tests don't fail on missing .env
vi.mock('dotenv/config', () => ({}));

// Provide required env vars before config.ts loads
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/formiq_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-32chars!';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
process.env.NODE_ENV = 'test';
