import {
  hashPassword,
  verifyPassword,
  needsRehash,
  generateSecurePassword,
  validatePasswordStrength,
  hashSensitiveData,
  verifySensitiveData,
  generateToken,
  generateBase64Token,
  timingSafeEqual
} from '../../src/utils/password.utils';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should handle unicode characters', async () => {
      const password = 'Pässwörd123!';
      const hash = await hashPassword(password);
      expect(hash).toMatch(/^\$argon2id\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const result = await verifyPassword('WrongPassword123!', hash);

      expect(result).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const result = await verifyPassword('password', 'invalid-hash');
      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const result = await verifyPassword('securepassword123!', hash);

      expect(result).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('should return false for freshly hashed password', async () => {
      const hash = await hashPassword('password');
      const result = needsRehash(hash);
      expect(result).toBe(false);
    });

    it('should return true for invalid hash', () => {
      const result = needsRehash('invalid-hash');
      expect(result).toBe(true);
    });

    it('should return true for bcrypt hash (wrong algorithm)', () => {
      // bcrypt hash format
      const bcryptHash = '$2b$10$abcdefghijklmnopqrstuv';
      const result = needsRehash(bcryptHash);
      expect(result).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of default length', () => {
      const password = generateSecurePassword();
      expect(password.length).toBe(16);
    });

    it('should generate password of specified length', () => {
      const password = generateSecurePassword(32);
      expect(password.length).toBe(32);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      expect(password1).not.toBe(password2);
    });

    it('should contain valid characters', () => {
      const password = generateSecurePassword(100);
      const validChars = /^[A-Za-z0-9!@#$%^&*]+$/;
      expect(password).toMatch(validChars);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('SecurePassword123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 14 characters long');
    });

    it('should require uppercase letter', () => {
      const result = validatePasswordStrength('securepassword123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = validatePasswordStrength('SECUREPASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const result = validatePasswordStrength('SecurePassword!!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const result = validatePasswordStrength('SecurePassword123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject repeated characters', () => {
      const result = validatePasswordStrength('Seeeecure12345!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password cannot contain 3 or more repeated characters');
    });

    it('should return multiple errors', () => {
      const result = validatePasswordStrength('bad');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('hashSensitiveData', () => {
    it('should hash sensitive data', async () => {
      const data = 'bank-account-123456';
      const hash = await hashSensitiveData(data);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(data);
      expect(hash).toMatch(/^\$argon2id\$/);
    });
  });

  describe('verifySensitiveData', () => {
    it('should verify correct data', async () => {
      const data = 'secret-data-123';
      const hash = await hashSensitiveData(data);

      const result = await verifySensitiveData(data, hash);

      expect(result).toBe(true);
    });

    it('should reject incorrect data', async () => {
      const data = 'secret-data-123';
      const hash = await hashSensitiveData(data);

      const result = await verifySensitiveData('wrong-data', hash);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate hex token of default length', () => {
      const token = generateToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate token of specified length', () => {
      const token = generateToken(16);
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateBase64Token', () => {
    it('should generate base64url token', () => {
      const token = generateBase64Token();
      expect(token).toBeDefined();
      // Base64url should not contain +, /, or =
      expect(token).not.toMatch(/[+/=]/);
    });

    it('should generate token of appropriate length', () => {
      const token = generateBase64Token(32);
      // 32 bytes in base64url is approximately 43 characters
      expect(token.length).toBeGreaterThanOrEqual(42);
    });

    it('should generate unique tokens', () => {
      const token1 = generateBase64Token();
      const token2 = generateBase64Token();
      expect(token1).not.toBe(token2);
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      const result = timingSafeEqual('secret123', 'secret123');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = timingSafeEqual('secret123', 'secret456');
      expect(result).toBe(false);
    });

    it('should return false for different length strings', () => {
      const result = timingSafeEqual('short', 'longer-string');
      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = timingSafeEqual('', '');
      expect(result).toBe(true);
    });

    it('should be case sensitive', () => {
      const result = timingSafeEqual('Secret', 'secret');
      expect(result).toBe(false);
    });
  });
});
