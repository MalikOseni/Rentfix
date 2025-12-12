import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiryTime,
  parseExpiryToSeconds,
  generateTokenId,
  extractBearerToken,
  createDeviceFingerprint,
  isValidTokenVersion,
  generateOpaqueRefreshToken,
  calculateExpiryDate,
  shouldRotateToken,
  redactToken,
  TokenPayload,
  TokenConfig
} from '../../src/utils/token.utils';

describe('Token Utils', () => {
  const testSecret = 'test-secret-key-at-least-32-chars-long';
  const testPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'agent',
    tenantId: 'org-123',
    org_id: 'org-123',
    token_version: 1
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(testPayload, testSecret);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload in token', () => {
      const token = generateAccessToken(testPayload, testSecret);
      const decoded = jwt.verify(token, testSecret) as TokenPayload;

      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should set default expiry of 15 minutes', () => {
      const token = generateAccessToken(testPayload, testSecret);
      const decoded = jwt.verify(token, testSecret) as TokenPayload;

      const expectedExpiry = Math.floor(Date.now() / 1000) + 15 * 60;
      expect(decoded.exp).toBeCloseTo(expectedExpiry, -1);
    });

    it('should respect custom expiry', () => {
      const token = generateAccessToken(testPayload, testSecret, '1h');
      const decoded = jwt.verify(token, testSecret) as TokenPayload;

      const expectedExpiry = Math.floor(Date.now() / 1000) + 60 * 60;
      expect(decoded.exp).toBeCloseTo(expectedExpiry, -1);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(testPayload, testSecret);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should set default expiry of 7 days', () => {
      const token = generateRefreshToken(testPayload, testSecret);
      const decoded = jwt.verify(token, testSecret) as TokenPayload;

      const expectedExpiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      expect(decoded.exp).toBeCloseTo(expectedExpiry, -1);
    });
  });

  describe('generateTokenPair', () => {
    const config: TokenConfig = {
      accessSecret: testSecret,
      refreshSecret: 'refresh-secret-key-at-least-32-chars',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d'
    };

    it('should generate both access and refresh tokens', () => {
      const pair = generateTokenPair(testPayload, config);

      expect(pair.accessToken).toBeDefined();
      expect(pair.refreshToken).toBeDefined();
      expect(pair.tokenType).toBe('Bearer');
    });

    it('should include expiry seconds', () => {
      const pair = generateTokenPair(testPayload, config);

      expect(pair.expiresIn).toBe(900); // 15 minutes
    });

    it('should generate different tokens', () => {
      const pair = generateTokenPair(testPayload, config);

      expect(pair.accessToken).not.toBe(pair.refreshToken);
    });

    it('should include issuer and audience when provided', () => {
      const configWithIssuer: TokenConfig = {
        ...config,
        issuer: 'rentfix-auth',
        audience: 'rentfix-api'
      };

      const pair = generateTokenPair(testPayload, configWithIssuer);
      const decoded = jwt.verify(pair.accessToken, config.accessSecret) as TokenPayload;

      expect(decoded.iss).toBe('rentfix-auth');
      expect(decoded.aud).toBe('rentfix-api');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(testPayload, testSecret);
      const decoded = verifyAccessToken(token, testSecret);

      expect(decoded.sub).toBe(testPayload.sub);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token', testSecret)).toThrow();
    });

    it('should throw for expired token', () => {
      const token = generateAccessToken(testPayload, testSecret, '-1s');
      expect(() => verifyAccessToken(token, testSecret)).toThrow();
    });

    it('should throw for wrong secret', () => {
      const token = generateAccessToken(testPayload, testSecret);
      expect(() => verifyAccessToken(token, 'wrong-secret')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testPayload, testSecret);
      const decoded = verifyRefreshToken(token, testSecret);

      expect(decoded.sub).toBe(testPayload.sub);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token', testSecret)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(testPayload, testSecret);
      const decoded = decodeToken(token);

      expect(decoded?.sub).toBe(testPayload.sub);
    });

    it('should decode expired token', () => {
      const token = generateAccessToken(testPayload, testSecret, '-1s');
      const decoded = decodeToken(token);

      expect(decoded?.sub).toBe(testPayload.sub);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not-a-valid-jwt');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateAccessToken(testPayload, testSecret, '1h');
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = generateAccessToken(testPayload, testSecret, '-1s');
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid')).toBe(true);
    });
  });

  describe('getTokenExpiryTime', () => {
    it('should return time until expiry', () => {
      const token = generateAccessToken(testPayload, testSecret, '1h');
      const expiryTime = getTokenExpiryTime(token);

      // Should be approximately 1 hour (3600000ms) minus a few ms for execution
      expect(expiryTime).toBeGreaterThan(3500000);
      expect(expiryTime).toBeLessThanOrEqual(3600000);
    });

    it('should return 0 for expired token', () => {
      const token = generateAccessToken(testPayload, testSecret, '-1s');
      expect(getTokenExpiryTime(token)).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      expect(getTokenExpiryTime('invalid')).toBe(0);
    });
  });

  describe('parseExpiryToSeconds', () => {
    it('should parse seconds', () => {
      expect(parseExpiryToSeconds('30s')).toBe(30);
    });

    it('should parse minutes', () => {
      expect(parseExpiryToSeconds('15m')).toBe(900);
    });

    it('should parse hours', () => {
      expect(parseExpiryToSeconds('2h')).toBe(7200);
    });

    it('should parse days', () => {
      expect(parseExpiryToSeconds('7d')).toBe(604800);
    });

    it('should parse plain number as seconds', () => {
      expect(parseExpiryToSeconds('3600')).toBe(3600);
    });

    it('should return 0 for invalid format', () => {
      expect(parseExpiryToSeconds('invalid')).toBe(0);
      expect(parseExpiryToSeconds('15x')).toBe(0);
    });
  });

  describe('generateTokenId', () => {
    it('should generate UUID', () => {
      const id = generateTokenId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateTokenId();
      const id2 = generateTokenId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from Bearer header', () => {
      const token = extractBearerToken('Bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should be case-insensitive for Bearer', () => {
      const token = extractBearerToken('bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should return null for missing header', () => {
      expect(extractBearerToken(undefined)).toBeNull();
    });

    it('should return null for non-Bearer scheme', () => {
      expect(extractBearerToken('Basic abc123')).toBeNull();
    });

    it('should return null for malformed header', () => {
      expect(extractBearerToken('Bearer')).toBeNull();
      expect(extractBearerToken('Bearer token extra')).toBeNull();
    });
  });

  describe('createDeviceFingerprint', () => {
    it('should create consistent fingerprint for same input', () => {
      const fp1 = createDeviceFingerprint('Chrome/120', '192.168.1.1');
      const fp2 = createDeviceFingerprint('Chrome/120', '192.168.1.1');
      expect(fp1).toBe(fp2);
    });

    it('should create different fingerprint for different input', () => {
      const fp1 = createDeviceFingerprint('Chrome/120', '192.168.1.1');
      const fp2 = createDeviceFingerprint('Firefox/110', '192.168.1.1');
      expect(fp1).not.toBe(fp2);
    });

    it('should return 32 character hash', () => {
      const fp = createDeviceFingerprint('Chrome/120', '192.168.1.1');
      expect(fp.length).toBe(32);
      expect(fp).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('isValidTokenVersion', () => {
    it('should return true when versions match', () => {
      expect(isValidTokenVersion(1, 1)).toBe(true);
    });

    it('should return true when presented version is higher', () => {
      expect(isValidTokenVersion(2, 1)).toBe(true);
    });

    it('should return false when presented version is lower', () => {
      expect(isValidTokenVersion(1, 2)).toBe(false);
    });
  });

  describe('generateOpaqueRefreshToken', () => {
    it('should generate base64url encoded token', () => {
      const token = generateOpaqueRefreshToken();
      expect(token).toBeDefined();
      expect(token).not.toMatch(/[+/=]/);
    });

    it('should generate tokens of appropriate length', () => {
      const token = generateOpaqueRefreshToken(48);
      // 48 bytes base64url is approximately 64 characters
      expect(token.length).toBeGreaterThanOrEqual(60);
    });

    it('should generate unique tokens', () => {
      const token1 = generateOpaqueRefreshToken();
      const token2 = generateOpaqueRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('calculateExpiryDate', () => {
    it('should calculate expiry for minutes', () => {
      const expiry = calculateExpiryDate('15m');
      const expected = new Date(Date.now() + 15 * 60 * 1000);
      expect(expiry.getTime()).toBeCloseTo(expected.getTime(), -2);
    });

    it('should calculate expiry for days', () => {
      const expiry = calculateExpiryDate('7d');
      const expected = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(expiry.getTime()).toBeCloseTo(expected.getTime(), -2);
    });
  });

  describe('shouldRotateToken', () => {
    it('should always return true (rotation policy)', () => {
      expect(shouldRotateToken()).toBe(true);
    });
  });

  describe('redactToken', () => {
    it('should redact middle of token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const redacted = redactToken(token);

      expect(redacted).toBe('eyJhbGciOi...HsR8U');
    });

    it('should fully redact short tokens', () => {
      const redacted = redactToken('short');
      expect(redacted).toBe('***redacted***');
    });
  });
});
