import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Database Configuration
 * Enterprise-grade PostgreSQL + PostGIS setup
 * Follows Google SRE and Microsoft Azure best practices
 */

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'rentfix',

    // SSL configuration for production (Azure/AWS RDS)
    ssl: isProduction
      ? {
          rejectUnauthorized: true,
          ca: process.env.DB_SSL_CA,
        }
      : false,

    // Connection pool settings (Google Cloud SQL recommendations)
    extra: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,

      // Statement timeout to prevent long-running queries
      statement_timeout: 30000,

      // Application name for monitoring
      application_name: 'rentfix-core-matching',
    },

    // Entity auto-loading
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],

    // Migration settings
    migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
    migrationsRun: false, // Run manually for safety

    // Synchronize disabled in production
    synchronize: false,

    // Logging
    logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    logger: 'advanced-console',

    // Performance optimizations
    cache: {
      type: 'redis',
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        duration: 60000, // Cache for 1 minute
      },
      ignoreErrors: true, // Degrade gracefully if Redis is down
    },

    // Timezone handling
    timezone: 'UTC',

    // Retry logic for transient failures (Azure SQL best practice)
    retryAttempts: isProduction ? 3 : 1,
    retryDelay: 3000,
  };
};

/**
 * Validate database configuration on startup
 */
export const validateDatabaseConfig = (): void => {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}`
    );
  }

  // Validate connection string format
  const host = process.env.DB_HOST;
  if (host && !host.match(/^[a-zA-Z0-9.-]+$/)) {
    throw new Error('Invalid DB_HOST format');
  }

  console.log('✓ Database configuration validated');
};
