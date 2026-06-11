/**
 * JWT utilities using jose (RFC 7519 compliant, no secret key length limits).
 *
 * Access tokens:  signed HS256, 15-minute expiry, carry user ID + email
 * Refresh tokens: random UUID v4 (opaque), stored as SHA-256 hash in DB
 */
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { config } from '../config';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY_DAYS = 30;

// Pre-encode secrets as Uint8Array once at module load
const accessSecret = new TextEncoder().encode(config.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(config.JWT_REFRESH_SECRET);

// ── Access token ──────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;   // user UUID
  email: string;
}

export async function signAccessToken(
  userId: string,
  email: string,
): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}

// ── Refresh token ─────────────────────────────────────────────────────────────

export interface RefreshTokenPair {
  raw: string;   // sent to client
  hash: string;  // stored in DB
  expiresAt: Date;
}

export function generateRefreshToken(): RefreshTokenPair {
  const raw = uuidv4();
  const hash = hashRefreshToken(raw);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);
  return { raw, hash, expiresAt };
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// ── Convenience: generate both tokens ────────────────────────────────────────

export interface TokenBundle {
  accessToken: string;
  refreshToken: RefreshTokenPair;
}

export async function generateTokenBundle(
  userId: string,
  email: string,
): Promise<TokenBundle> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(userId, email),
    Promise.resolve(generateRefreshToken()),
  ]);
  return { accessToken, refreshToken };
}
