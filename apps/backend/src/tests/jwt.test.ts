/**
 * Unit tests: JWT signing/verification
 */
import { describe, it, expect } from 'vitest';
import './setup';

import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../lib/jwt';

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips userId and email', async () => {
    const userId = 'abc123-user-id';
    const email = 'test@example.com';

    const token = await signAccessToken(userId, email);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // valid JWT

    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe(email);
  });

  it('rejects a token signed with wrong secret', async () => {
    // Craft a token manually with wrong secret
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.invalidsig';
    await expect(verifyAccessToken(fakeToken)).rejects.toThrow();
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not.a.token')).rejects.toThrow();
  });
});

describe('generateRefreshToken / hashRefreshToken', () => {
  it('generates unique UUIDs each call', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it('hash is deterministic', () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token.raw)).toBe(token.hash);
  });

  it('expiresAt is ~30 days from now', () => {
    const { expiresAt } = generateRefreshToken();
    const daysUntilExpiry =
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysUntilExpiry).toBeGreaterThan(29);
    expect(daysUntilExpiry).toBeLessThan(31);
  });
});
