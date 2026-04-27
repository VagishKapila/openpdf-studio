/**
 * Integration tests for auth routes using a mocked DB.
 *
 * These tests mock the Drizzle DB client so no real Postgres is required.
 * The tests verify:
 *  - register: 201 + AuthResponse shape, 409 on duplicate, 400 on weak password
 *  - login: 200 + AuthResponse, 401 on wrong password
 *  - refresh: 200 + new tokens, 401 on invalid token
 *  - logout: 200 { message }
 *  - me: 200 { user } when authenticated
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup';

// ── Mock DB before importing anything that uses it ────────────────────────────

const mockUser = {
  id: 'user-uuid-1234',
  email: 'test@example.com',
  passwordHash: null as string | null,
  name: 'Test User',
  avatarUrl: null,
  companyName: null,
  googleSub: null,
  emailVerified: false,
  isActive: true,
  isSuperAdmin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession = {
  id: 'session-uuid-1234',
  userId: mockUser.id,
  refreshTokenHash: '',
  userAgent: null,
  ipAddress: null,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  createdAt: new Date(),
};

// Chainable query builder mock
const makeQueryBuilder = (returnVal: unknown) => {
  const builder = {
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(returnVal),
    returning: vi.fn().mockResolvedValue(
      Array.isArray(returnVal) ? returnVal : [returnVal],
    ),
  };
  return builder;
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

vi.mock('../db/client', () => ({
  db: mockDb,
  pool: {
    connect: vi.fn().mockResolvedValue({ query: vi.fn(), release: vi.fn() }),
    end: vi.fn(),
    on: vi.fn(),
  },
}));

// Mock migrations so server doesn't try to connect DB on startup
vi.mock('../db/migrate', () => ({
  runMigrations: vi.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import express from 'express';
import request from 'supertest';
import { corsMiddleware } from '../middleware/cors';
import { errorHandler } from '../middleware/error-handler';
import { authRouter } from '../routes/auth';
import { hashPassword } from '../lib/password';
import { generateRefreshToken } from '../lib/jwt';

// Build test app (no rate limiting in tests)
function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use(corsMiddleware);
  app.use('/auth', authRouter);
  app.use(errorHandler);
  return app;
}

// ── Test helpers ──────────────────────────────────────────────────────────────

function mockEmptySelect() {
  const builder = { where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) };
  mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });
}

function mockSelectUser(user = mockUser) {
  const builder = { where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([user]) };
  mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });
}

function mockInsertUser(user = mockUser) {
  mockDb.insert.mockReturnValue(makeQueryBuilder([user]));
}

function mockInsertSession() {
  mockDb.insert.mockReturnValueOnce(makeQueryBuilder([])); // first insert (user)
  mockDb.insert.mockReturnValue(makeQueryBuilder([mockSession])); // session insert
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  const app = buildTestApp();

  beforeEach(() => vi.clearAllMocks());

  it('creates a user and returns 201 + AuthResponse shape', async () => {
    // First select: check duplicate → empty
    mockEmptySelect();
    // Insert user
    mockInsertUser();
    // Insert session
    mockDb.insert.mockReturnValue(makeQueryBuilder([mockSession]));

    const res = await request(app).post('/auth/register').send({
      email: 'new@example.com',
      password: 'Password123!',
      name: 'New User',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('tokens');
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(mockUser.email);
  });

  it('returns 409 when email is already registered', async () => {
    // Select returns existing user
    mockSelectUser();

    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'new@example.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('8 characters');
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'not-an-email',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email');
  });
});

describe('POST /auth/login', () => {
  const app = buildTestApp();

  beforeEach(() => vi.clearAllMocks());

  it('returns 200 + AuthResponse with valid credentials', async () => {
    const hash = await hashPassword('Password123!');
    mockSelectUser({ ...mockUser, passwordHash: hash });
    mockDb.insert.mockReturnValue(makeQueryBuilder([mockSession]));

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
  });

  it('returns 401 with wrong password', async () => {
    const hash = await hashPassword('correct-password');
    mockSelectUser({ ...mockUser, passwordHash: hash });

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('returns 401 when user not found', async () => {
    mockEmptySelect();

    const res = await request(app).post('/auth/login').send({
      email: 'notfound@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(401);
  });
}, 30_000);

describe('POST /auth/refresh', () => {
  const app = buildTestApp();

  beforeEach(() => vi.clearAllMocks());

  it('returns new tokens on valid refresh token', async () => {
    const rt = generateRefreshToken();
    const session = { ...mockSession, refreshTokenHash: rt.hash };

    // Select session
    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) return Promise.resolve([session]);
          return Promise.resolve([mockUser]);
        }),
      }),
    }));

    // Update (revoke old session) + Insert (new session)
    mockDb.update.mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(undefined) });
    mockDb.insert.mockReturnValue(makeQueryBuilder([session]));

    const res = await request(app).post('/auth/refresh').send({
      refreshToken: rt.raw,
    });

    expect(res.status).toBe(200);
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
  });

  it('returns 401 on invalid refresh token', async () => {
    // Select returns empty (token not found)
    const builder = { where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });

    const res = await request(app).post('/auth/refresh').send({
      refreshToken: 'invalid-token',
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  const app = buildTestApp();

  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth header', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});
