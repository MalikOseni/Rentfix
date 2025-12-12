/**
 * Environment Variable Validation using Zod
 *
 * Validates all required environment variables at startup
 * Fails fast if critical configuration is missing
 *
 * Standards: 12-factor app - configuration via environment
 */

import { z } from 'zod';

/**
 * Environment schema - defines all required and optional environment variables
 */
const envSchema = z.object({
  // ============================================================================
  // Application Configuration
  // ============================================================================
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development'),

  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .default('4000'),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'verbose'])
    .default('info'),

  API_VERSION: z.string().default('v1'),

  // ============================================================================
  // Database Configuration (REQUIRED)
  // ============================================================================
  DATABASE_URL: z
    .string()
    .url()
    .startsWith('postgresql://', {
      message: 'DATABASE_URL must be a valid PostgreSQL connection string',
    })
    .describe('PostgreSQL connection string'),

  DATABASE_HOST: z.string().optional(),
  DATABASE_PORT: z.string().optional(),
  DATABASE_USER: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  DATABASE_NAME: z.string().optional(),

  DATABASE_SSL: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  DATABASE_POOL_MIN: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0))
    .default('2'),

  DATABASE_POOL_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .default('10'),

  // ============================================================================
  // Redis Configuration (REQUIRED)
  // ============================================================================
  REDIS_URL: z
    .string()
    .url()
    .startsWith('redis://', {
      message: 'REDIS_URL must be a valid Redis connection string',
    })
    .or(
      z
        .string()
        .startsWith('rediss://', {
          message: 'REDIS_URL can also use rediss:// for TLS',
        })
    )
    .describe('Redis connection string for caching and job queues'),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  REDIS_TLS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // ============================================================================
  // Authentication & Security (REQUIRED)
  // ============================================================================
  JWT_SECRET: z
    .string()
    .min(32, {
      message: 'JWT_SECRET must be at least 32 characters for security',
    })
    .describe('Secret key for JWT token signing'),

  JWT_EXPIRATION: z.string().default('1h'),

  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, {
      message: 'REFRESH_TOKEN_SECRET must be at least 32 characters',
    })
    .describe('Secret key for refresh token signing'),

  REFRESH_TOKEN_EXPIRATION: z.string().default('7d'),

  // Password hashing
  BCRYPT_ROUNDS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(10).max(15))
    .default('12'),

  // ============================================================================
  // AI Service Configuration (REQUIRED for production)
  // ============================================================================
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', {
      message: 'OPENAI_API_KEY must start with "sk-"',
    })
    .min(20)
    .describe('OpenAI API key for AI classification'),

  OPENAI_MODEL: z.string().default('gpt-4-vision-preview'),

  AI_CLASSIFICATION_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // ============================================================================
  // Cloud Storage Configuration (REQUIRED for production)
  // ============================================================================
  S3_BUCKET: z
    .string()
    .min(3)
    .describe('S3 bucket name for media storage'),

  S3_REGION: z.string().min(2).describe('AWS region for S3'),

  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // ============================================================================
  // Email & Notifications (REQUIRED for production)
  // ============================================================================
  SENDGRID_API_KEY: z
    .string()
    .startsWith('SG.')
    .optional()
    .describe('SendGrid API key for email'),

  SENDGRID_FROM_EMAIL: z
    .string()
    .email()
    .default('noreply@rentfix.com'),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // Push notifications
  FCM_SERVER_KEY: z.string().optional(),

  // ============================================================================
  // Payment Processing (REQUIRED for production)
  // ============================================================================
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_')
    .optional()
    .describe('Stripe secret key'),

  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_')
    .optional(),

  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ============================================================================
  // Monitoring & Observability
  // ============================================================================
  SENTRY_DSN: z.string().url().optional(),

  DATADOG_API_KEY: z.string().optional(),
  DATADOG_APP_KEY: z.string().optional(),

  // ============================================================================
  // CORS & Security
  // ============================================================================
  CORS_ORIGINS: z
    .string()
    .transform((val) => val.split(','))
    .default('http://localhost:3000'),

  RATE_LIMIT_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('60'),

  RATE_LIMIT_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),

  // ============================================================================
  // Feature Flags
  // ============================================================================
  ENABLE_SWAGGER: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  ENABLE_METRICS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  ENABLE_HEALTH_CHECKS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

/**
 * Validate environment variables
 * @throws Error if validation fails
 */
export function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));

    const missingVars = result.error.issues
      .filter((issue) => issue.code === 'invalid_type' && issue.received === 'undefined')
      .map((issue) => issue.path.join('.'));

    if (missingVars.length > 0) {
      console.error('\n🚨 Missing required environment variables:');
      missingVars.forEach((varName) => {
        console.error(`   - ${varName}`);
      });
    }

    const invalidVars = result.error.issues.filter(
      (issue) => issue.code !== 'invalid_type' || issue.received !== 'undefined'
    );

    if (invalidVars.length > 0) {
      console.error('\n⚠️  Invalid environment variables:');
      invalidVars.forEach((issue) => {
        console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
      });
    }

    throw new Error('Environment validation failed. Check the errors above.');
  }

  console.log('✅ Environment validation passed');
  return result.data;
}

/**
 * Validate environment with custom requirements
 */
export function validateEnvStrict(requirements: {
  requireOpenAI?: boolean;
  requireStripe?: boolean;
  requireSendGrid?: boolean;
  requireTwilio?: boolean;
}): z.infer<typeof envSchema> {
  const env = validateEnv();

  // Additional strict checks for production
  if (env.NODE_ENV === 'production') {
    const errors: string[] = [];

    if (requirements.requireOpenAI && !env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required in production');
    }

    if (requirements.requireStripe && !env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY is required in production');
    }

    if (requirements.requireSendGrid && !env.SENDGRID_API_KEY) {
      errors.push('SENDGRID_API_KEY is required in production');
    }

    if (requirements.requireTwilio && (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN)) {
      errors.push('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required in production');
    }

    if (errors.length > 0) {
      console.error('❌ Production environment validation failed:');
      errors.forEach((error) => console.error(`   - ${error}`));
      throw new Error('Missing required production environment variables');
    }
  }

  return env;
}

/**
 * Type-safe environment variables
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Export for use in NestJS ConfigModule
 */
export const envValidation = () => validateEnv();
