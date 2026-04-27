/**
 * Password hashing using argon2id.
 * argon2id is the recommended variant (hybrid of argon2i + argon2d).
 *
 * Tuned for Railway t3 instances (1 vCPU / 512 MB RAM):
 * - memoryCost: 65536 KB (64 MB) — high enough to be secure, low enough for RAM
 * - timeCost: 3 iterations
 * - parallelism: 1
 */
import argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options & { raw: false } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  raw: false,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
