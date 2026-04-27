/**
 * Auth routes — /auth/*
 *
 * Response shape for all auth endpoints (MUST match FormIQ frontend AuthResponse type):
 *   { user: User, tokens: { accessToken: string, refreshToken: string } }
 *
 * Error shape (must match what api.ts reads):
 *   { error: string }
 *
 * Routes:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/google
 *   POST /auth/refresh
 *   POST /auth/logout
 *   GET  /auth/me
 */
import { Router } from 'express';
import { z } from 'zod';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { users, sessions } from '../db/schema';
import type { User } from '../db/schema';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  generateTokenBundle,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../lib/jwt';
import { verifyGoogleAccessToken } from '../lib/google';
import { requireAuth } from '../middleware/auth';
import { Errors } from '../lib/errors';

export const authRouter: Router = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

/** Shape sent back for all auth operations */
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    companyName: string | null;
    emailVerified: boolean;
    isSuperAdmin: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

function formatUser(u: User): AuthResponse['user'] {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    avatarUrl: u.avatarUrl ?? null,
    companyName: u.companyName ?? null,
    emailVerified: u.emailVerified,
    isSuperAdmin: u.isSuperAdmin,
  };
}

async function buildAuthResponse(user: User): Promise<AuthResponse> {
  const bundle = await generateTokenBundle(user.id, user.email);

  // Store hashed refresh token
  await db.insert(sessions).values({
    userId: user.id,
    refreshTokenHash: bundle.refreshToken.hash,
    expiresAt: bundle.refreshToken.expiresAt,
  });

  return {
    user: formatUser(user),
    tokens: {
      accessToken: bundle.accessToken,
      refreshToken: bundle.refreshToken.raw,
    },
  };
}

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(255).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const googleSchema = z.object({
  accessToken: z.string().min(1, 'Google access token is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── POST /auth/register ───────────────────────────────────────────────────────

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest(
        parsed.error.errors.map((e) => e.message).join('; '),
      );
    }
    const { email, password, name } = parsed.data;

    // Check for existing user
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      throw Errors.conflict('An account with that email already exists');
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name: name ?? null,
        emailVerified: false,
      })
      .returning();

    const response = await buildAuthResponse(user);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest(
        parsed.error.errors.map((e) => e.message).join('; '),
      );
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Use the same error message for "not found" and "wrong password"
    // to prevent email enumeration
    if (!user || !user.passwordHash) {
      throw Errors.unauthorized('Invalid email or password');
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      throw Errors.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw Errors.unauthorized('Account has been deactivated');
    }

    const response = await buildAuthResponse(user);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/google ─────────────────────────────────────────────────────────

authRouter.post('/google', async (req, res, next) => {
  try {
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest(
        parsed.error.errors.map((e) => e.message).join('; '),
      );
    }

    const profile = await verifyGoogleAccessToken(parsed.data.accessToken);

    // Look up by googleSub first (fastest path), then fall back to email
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleSub, profile.sub))
      .limit(1);

    if (!user) {
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      if (byEmail) {
        // Link Google to existing email account
        [user] = await db
          .update(users)
          .set({
            googleSub: profile.sub,
            avatarUrl: profile.picture ?? byEmail.avatarUrl,
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, byEmail.id))
          .returning();
      } else {
        // Create new account
        [user] = await db
          .insert(users)
          .values({
            email: profile.email,
            name: profile.name,
            googleSub: profile.sub,
            avatarUrl: profile.picture ?? null,
            emailVerified: true,
          })
          .returning();
      }
    }

    if (!user.isActive) {
      throw Errors.unauthorized('Account has been deactivated');
    }

    const response = await buildAuthResponse(user);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.unauthorized('Invalid refresh token');
    }

    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const now = new Date();

    // Find active session
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, tokenHash),
          gt(sessions.expiresAt, now),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);

    if (!session) {
      throw Errors.unauthorized('Invalid or expired refresh token');
    }

    // Fetch the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw Errors.unauthorized('User not found or deactivated');
    }

    // Revoke the old session (token rotation)
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.id, session.id));

    // Issue new token pair
    const newRefresh = generateRefreshToken();
    const newAccess = await signAccessToken(user.id, user.email);

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash: newRefresh.hash,
      expiresAt: newRefresh.expiresAt,
    });

    // Return full AuthResponse (frontend casts refresh response as AuthResponse)
    res.json({
      user: formatUser(user),
      tokens: {
        accessToken: newAccess,
        refreshToken: newRefresh.raw,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    // Optionally revoke the specific refresh token if provided in body
    const body = req.body as { refreshToken?: string };
    if (body.refreshToken) {
      const tokenHash = hashRefreshToken(body.refreshToken);
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(sessions.refreshTokenHash, tokenHash),
            eq(sessions.userId, req.user!.id),
          ),
        );
    } else {
      // Revoke ALL sessions for this user (full sign-out)
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(sessions.userId, req.user!.id),
            isNull(sessions.revokedAt),
          ),
        );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user) {
      throw Errors.notFound('User not found');
    }

    res.json({ user: formatUser(user) });
  } catch (err) {
    next(err);
  }
});
