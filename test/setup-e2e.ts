/**
 * E2E Test Setup - Global Configuration
 * Sets up test environment variables and global test utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Database configuration for E2E tests
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.TEST_DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'rentfix_e2e_test';

// Redis configuration for E2E tests
process.env.TEST_REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
process.env.TEST_REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';
process.env.REDIS_URL = `redis://${process.env.TEST_REDIS_HOST}:${process.env.TEST_REDIS_PORT}`;

// JWT configuration for E2E tests
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.JWT_EXPIRATION = '1h';
process.env.REFRESH_TOKEN_EXPIRATION = '7d';

// AI Service configuration (mock for E2E)
process.env.OPENAI_API_KEY = 'sk-test-mock-key-for-e2e-testing';
process.env.AI_CLASSIFICATION_ENABLED = 'false'; // Disable actual AI calls in E2E

// S3/Storage configuration (mock for E2E)
process.env.S3_BUCKET = 'test-bucket';
process.env.S3_REGION = 'us-east-1';
process.env.S3_ACCESS_KEY = 'test-key';
process.env.S3_SECRET_KEY = 'test-secret';

// Notification services (mock for E2E)
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';

// Extend Jest matchers with custom assertions
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Increase timeout for E2E tests
jest.setTimeout(60000);

// Global test utilities
global.sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
