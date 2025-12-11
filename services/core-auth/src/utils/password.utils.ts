/**
 * Password utilities using Argon2id
 *
 * Argon2id is a hybrid of Argon2i and Argon2d, providing protection
 * against both side-channel and GPU attacks.
 *
 * OWASP recommended settings for Argon2id:
 * - Memory: 19 MiB
 * - Iterations: 2
 * - Parallelism: 1
 */

import argon2 from 'argon2';
import crypto from 'crypto';

// Argon2id configuration (OWASP recommended)
const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2, // 2 iterations
  parallelism: 1, // 1 thread
  hashLength: 32 // 32 bytes output
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_CONFIG);
}

/**
 * Verify a password against an Argon2id hash
 * Uses timing-safe comparison internally
 * @param password - Plain text password to verify
 * @param hash - Argon2id hash to verify against
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password, { type: argon2.argon2id });
  } catch {
    return false;
  }
}

/**
 * Check if a hash needs to be rehashed (e.g., config changed)
 * @param hash - Existing hash to check
 * @returns True if hash should be regenerated
 */
export function needsRehash(hash: string): boolean {
  try {
    return argon2.needsRehash(hash, ARGON2_CONFIG);
  } catch {
    return true;
  }
}

/**
 * Generate a cryptographically secure random password
 * @param length - Length of password (default 16)
 * @returns Random password string
 */
export function generateSecurePassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 14 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param password - Password to validate
 * @returns Object with valid flag and array of errors
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 14) {
    errors.push('Password must be at least 14 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain 3 or more repeated characters');
  }

  const commonPasswords = [
    'password123456',
    'admin12345678',
    'qwertyuiopasdf',
    'letmein123456'
  ];

  if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate a hash for sensitive data (non-reversible)
 * Useful for hashing tokens, bank accounts, etc.
 * @param value - Value to hash
 * @returns Hashed value
 */
export async function hashSensitiveData(value: string): Promise<string> {
  return argon2.hash(value, ARGON2_CONFIG);
}

/**
 * Verify sensitive data against a hash
 * @param value - Plain value to verify
 * @param hash - Hash to verify against
 * @returns True if value matches
 */
export async function verifySensitiveData(value: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, value, { type: argon2.argon2id });
  } catch {
    return false;
  }
}

/**
 * Generate a random hex token
 * @param bytes - Number of random bytes (default 32)
 * @returns Hex-encoded token string
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a URL-safe base64 token
 * @param bytes - Number of random bytes (default 32)
 * @returns Base64url-encoded token string
 */
export function generateBase64Token(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks when comparing secrets
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to maintain constant time
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
