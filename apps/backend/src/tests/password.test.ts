/**
 * Unit tests: argon2 password hashing
 */
import { describe, it, expect } from 'vitest';
import './setup';

import { hashPassword, verifyPassword } from '../lib/password';

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const plain = 'SecurePass123!';
    const hash = await hashPassword(plain);

    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$argon2')).toBe(true);

    const valid = await verifyPassword(hash, plain);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    const valid = await verifyPassword(hash, 'wrong-horse');
    expect(valid).toBe(false);
  });

  it('produces different hashes for same input (salt)', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toBe(b); // different salts
    // both should verify correctly
    expect(await verifyPassword(a, 'same-password')).toBe(true);
    expect(await verifyPassword(b, 'same-password')).toBe(true);
  });

  it('returns false for corrupted hash', async () => {
    const valid = await verifyPassword('$argon2id$corrupted', 'any-password');
    expect(valid).toBe(false);
  });
}, 30_000); // argon2 is intentionally slow — 30s timeout
