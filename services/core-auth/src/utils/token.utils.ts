/**
 * JWT Token utilities for access and refresh token management
 *
 * Token Strategy:
 * - Access tokens: Short-lived (15 min), used for API authorization
 * - Refresh tokens: Long-lived (7 days), used to get new access tokens
 * - Token rotation: Each refresh invalidates old token, issues new pair
 * - Token versioning: Tracks token generation to detect theft
 */

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Token configuration defaults
const DEFAULT_ACCESS_EXPIRY = '15m';
const DEFAULT_REFRESH_EXPIRY = '7d';

export interface TokenPayload extends JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  tenantId: string | null;
  org_id: string | null; // Organization ID (same as tenantId for consistency)
  token_version: number; // For rotation tracking
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until access token expires
  tokenType: 'Bearer';
}

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn?: string;
  refreshExpiresIn?: string;
  issuer?: string;
  audience?: string;
}

/**
 * Generate a JWT access token
 * @param payload - Token payload data
 * @param secret - Signing secret
 * @param expiresIn - Token lifetime (default 15m)
 * @param options - Additional JWT sign options
 * @returns Signed JWT string
 */
export function generateAccessToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = DEFAULT_ACCESS_EXPIRY,
  options?: Omit<SignOptions, 'expiresIn'>
): string {
  return jwt.sign(payload, secret, {
    expiresIn,
    ...options
  });
}

/**
 * Generate a JWT refresh token
 * @param payload - Token payload data
 * @param secret - Signing secret
 * @param expiresIn - Token lifetime (default 7d)
 * @param options - Additional JWT sign options
 * @returns Signed JWT string
 */
export function generateRefreshToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = DEFAULT_REFRESH_EXPIRY,
  options?: Omit<SignOptions, 'expiresIn'>
): string {
  return jwt.sign(payload, secret, {
    expiresIn,
    ...options
  });
}

/**
 * Generate both access and refresh tokens
 * @param payload - Token payload data
 * @param config - Token configuration
 * @returns Token pair with expiry information
 */
export function generateTokenPair(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  config: TokenConfig
): TokenPair {
  const accessExpiresIn = config.accessExpiresIn || DEFAULT_ACCESS_EXPIRY;
  const refreshExpiresIn = config.refreshExpiresIn || DEFAULT_REFRESH_EXPIRY;

  const signOptions: Omit<SignOptions, 'expiresIn'> = {};
  if (config.issuer) signOptions.issuer = config.issuer;
  if (config.audience) signOptions.audience = config.audience;

  const accessToken = generateAccessToken(payload, config.accessSecret, accessExpiresIn, signOptions);
  const refreshToken = generateRefreshToken(payload, config.refreshSecret, refreshExpiresIn, signOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: parseExpiryToSeconds(accessExpiresIn),
    tokenType: 'Bearer'
  };
}

/**
 * Verify and decode an access token
 * @param token - JWT token string
 * @param secret - Signing secret
 * @param options - Additional verify options
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(
  token: string,
  secret: string,
  options?: VerifyOptions
): TokenPayload {
  return jwt.verify(token, secret, options) as TokenPayload;
}

/**
 * Verify and decode a refresh token
 * @param token - JWT token string
 * @param secret - Signing secret
 * @param options - Additional verify options
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(
  token: string,
  secret: string,
  options?: VerifyOptions
): TokenPayload {
  return jwt.verify(token, secret, options) as TokenPayload;
}

/**
 * Decode a token without verifying signature
 * Useful for reading claims before verification
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token string
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  return decoded.exp * 1000 < Date.now();
}

/**
 * Get time until token expires
 * @param token - JWT token string
 * @returns Milliseconds until expiry, or 0 if expired
 */
export function getTokenExpiryTime(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  const expiryMs = decoded.exp * 1000;
  const remaining = expiryMs - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Parse expiry duration string to seconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 * @param duration - Duration string (e.g., '15m', '7d')
 * @returns Duration in seconds
 */
export function parseExpiryToSeconds(duration: string): number {
  // If just a number, treat as seconds
  if (/^\d+$/.test(duration)) {
    return Number(duration);
  }

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 0;
  }
}

/**
 * Generate a secure random token ID (jti)
 * @returns Random token ID string
 */
export function generateTokenId(): string {
  return crypto.randomUUID();
}

/**
 * Extract bearer token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null if invalid format
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Create a device fingerprint from request data
 * Used for token binding/validation
 * @param userAgent - User-Agent header
 * @param ip - Client IP address
 * @returns Fingerprint hash
 */
export function createDeviceFingerprint(userAgent: string, ip: string): string {
  const data = `${userAgent}|${ip}`;
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 32);
}

/**
 * Validate token version to detect potential theft
 * If presented version is lower than stored version, tokens may be compromised
 * @param presentedVersion - Version from the token
 * @param storedVersion - Version from database
 * @returns True if version is valid
 */
export function isValidTokenVersion(presentedVersion: number, storedVersion: number): boolean {
  return presentedVersion >= storedVersion;
}

/**
 * Generate an opaque refresh token (non-JWT)
 * Some systems prefer opaque tokens stored server-side
 * @param bytes - Number of random bytes (default 48)
 * @returns Base64url-encoded token
 */
export function generateOpaqueRefreshToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Calculate token expiry date
 * @param expiresIn - Duration string (e.g., '7d')
 * @returns Expiry Date object
 */
export function calculateExpiryDate(expiresIn: string): Date {
  const seconds = parseExpiryToSeconds(expiresIn);
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Token rotation helper - checks if refresh should be rotated
 * Rotation policy: Always rotate on use for security
 * @returns Always true (always rotate)
 */
export function shouldRotateToken(): boolean {
  return true; // Always rotate refresh tokens
}

/**
 * Redact sensitive parts of a token for logging
 * @param token - Full token string
 * @returns Redacted token (first 10 chars + ...)
 */
export function redactToken(token: string): string {
  if (token.length <= 15) {
    return '***redacted***';
  }
  return `${token.slice(0, 10)}...${token.slice(-5)}`;
}
