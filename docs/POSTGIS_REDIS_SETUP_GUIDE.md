# PostgreSQL + PostGIS & Redis Setup Guide for RentFix

> **Complete guide for setting up PostgreSQL with PostGIS extension and Redis for the RentFix platform**

This guide provides step-by-step instructions for developers with moderate experience to set up the complete database infrastructure for RentFix. The guide covers local development, Docker environments, NestJS integration, and CI/CD configuration.

---

## Table of Contents

1. [Why PostGIS?](#1-why-postgis)
2. [Running PostGIS with Docker](#2-running-postgis-with-docker)
3. [Enabling and Verifying PostGIS](#3-enabling-and-verifying-postgis)
4. [Integrating PostGIS into NestJS Services](#4-integrating-postgis-into-nestjs-services)
5. [Running Redis with Docker](#5-running-redis-with-docker)
6. [Configuring NestJS to use Redis](#6-configuring-nestjs-to-use-redis)
7. [CI/CD Considerations](#7-cicd-considerations)
8. [Troubleshooting Tips](#8-troubleshooting-tips)

---

## 1. Why PostGIS?

### What is PostGIS?

PostGIS is a spatial database extension for PostgreSQL that adds support for geographic objects and functions. It allows PostgreSQL to store and query spatial/geographical data efficiently.

**Key Features:**
- **Spatial data types**: `POINT`, `LINESTRING`, `POLYGON`, `GEOGRAPHY`, `GEOMETRY`
- **Geographic functions**: Calculate distances, areas, intersections, nearest neighbors
- **Spatial indexing**: GIST (Generalized Search Tree) indexes for fast spatial queries
- **Standards compliance**: Implements OGC (Open Geospatial Consortium) standards

### Why RentFix Needs PostGIS

RentFix is a location-based maintenance platform that requires sophisticated geospatial capabilities:

#### **1. Property Location Management**
- Store precise coordinates (latitude/longitude) for rental properties
- Enable map-based property search and visualization
- Calculate service areas and coverage zones

#### **2. Contractor Matching (Uber-style)**
- Find contractors within a specific radius of a property (e.g., "contractors within 5km")
- Calculate real-world distances between contractors and properties
- Optimize contractor assignments based on proximity

#### **3. Distance Calculations**
```sql
-- Example: Find contractors within 5km of a property
SELECT c.id, c.name,
       ST_Distance(c.location_point, p.location_point) / 1000 as distance_km
FROM contractors c
CROSS JOIN properties p
WHERE p.id = '123'
  AND ST_DWithin(c.location_point, p.location_point, 5000)
ORDER BY distance_km ASC
LIMIT 10;
```

#### **4. Service Area Analysis**
- Define contractor service radiuses
- Analyze coverage gaps in the platform
- Generate heat maps of contractor density

#### **5. Route Optimization**
- Calculate travel time estimates
- Optimize multi-property visits for contractors
- Track contractor location history

**Without PostGIS**, you would need to:
- Store coordinates as separate latitude/longitude columns
- Use expensive and inaccurate Haversine formula calculations in application code
- Perform slow full-table scans for proximity searches
- Miss out on spatial indexing optimizations (100x+ slower queries)

---

## 2. Running PostGIS with Docker

### Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- At least 2GB of free RAM
- 10GB of free disk space for database storage

### Option A: Using Docker Compose (Recommended)

The RentFix project includes a production-ready `docker-compose.prod.yml` file. Here's the PostGIS service configuration:

#### **1. Create docker-compose.yml for Development**

Create a `docker-compose.dev.yml` file in your project root:

```yaml
version: '3.9'

services:
  # PostgreSQL with PostGIS
  postgis:
    image: postgis/postgis:16-3.4-alpine
    container_name: rentfix-postgis-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-rentfix}
      POSTGRES_USER: ${DATABASE_USER:-rentfix}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-changeme}
      POSTGRES_INITDB_ARGS: '-E UTF8 --locale=en_US.UTF-8'
    volumes:
      # Persistent data storage
      - postgis_data:/var/lib/postgresql/data
      # Optional: Auto-run migration scripts on first start
      - ./migrations:/docker-entrypoint-initdb.d:ro
    ports:
      - '5432:5432'
    networks:
      - rentfix-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DATABASE_USER:-rentfix}']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgis_data:
    driver: local

networks:
  rentfix-network:
    driver: bridge
```

**Image Breakdown:**
- `postgis/postgis`: Official PostGIS Docker image
- `16`: PostgreSQL version 16 (latest stable)
- `3.4`: PostGIS version 3.4
- `alpine`: Lightweight Linux distribution (~150MB vs ~300MB for full image)

#### **2. Configure Environment Variables**

Create a `.env` file in your project root (or copy from `.env.example`):

```bash
# Database Configuration
DATABASE_NAME=rentfix
DATABASE_USER=rentfix
DATABASE_PASSWORD=secure_password_here
DATABASE_HOST=localhost  # Use 'postgis' for Docker services
DATABASE_PORT=5432

# Production settings
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

**Security Note:** Never commit `.env` files to version control. Use `.env.example` as a template.

#### **3. Start the PostGIS Container**

```bash
# Start the container in detached mode
docker-compose -f docker-compose.dev.yml up -d postgis

# View logs to confirm successful startup
docker-compose -f docker-compose.dev.yml logs -f postgis
```

**Expected Output:**
```
postgis-dev | PostgreSQL init process complete; ready for start up.
postgis-dev | 2024-01-15 10:30:22.123 UTC [1] LOG:  database system is ready to accept connections
```

#### **4. Verify the Container is Running**

```bash
# Check container status
docker ps | grep postgis

# Check health status
docker inspect rentfix-postgis-dev | grep -A 5 Health
```

#### **5. Connect to the Database**

You can now connect to the database on `localhost:5432` using any PostgreSQL client:

**Using psql (PostgreSQL CLI):**
```bash
# From your host machine (requires psql installed)
psql -h localhost -p 5432 -U rentfix -d rentfix

# From within the Docker container
docker exec -it rentfix-postgis-dev psql -U rentfix -d rentfix
```

**Using GUI clients:**
- **pgAdmin**: Host: `localhost`, Port: `5432`, User: `rentfix`, Password: `[your_password]`
- **DBeaver**: Same credentials as above
- **DataGrip**: Same credentials as above

### Option B: Standalone Docker Container

If you prefer not to use Docker Compose:

```bash
# Create a Docker volume for persistent storage
docker volume create postgis_data

# Run the container
docker run -d \
  --name rentfix-postgis \
  -e POSTGRES_DB=rentfix \
  -e POSTGRES_USER=rentfix \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_INITDB_ARGS="-E UTF8 --locale=en_US.UTF-8" \
  -p 5432:5432 \
  -v postgis_data:/var/lib/postgresql/data \
  postgis/postgis:16-3.4-alpine

# View logs
docker logs -f rentfix-postgis
```

### Understanding Volume Persistence

The `-v postgis_data:/var/lib/postgresql/data` mount ensures:
- Data persists even if the container is stopped or removed
- Database survives Docker restarts
- You can backup/restore data by backing up the volume

**Volume Management:**
```bash
# List volumes
docker volume ls

# Backup volume
docker run --rm -v postgis_data:/data -v $(pwd):/backup alpine tar czf /backup/postgis_backup.tar.gz -C /data .

# Restore volume
docker run --rm -v postgis_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgis_backup.tar.gz -C /data
```

---

## 3. Enabling and Verifying PostGIS

### Step 1: Connect as Superuser

PostGIS extensions must be enabled by a PostgreSQL superuser (typically the `POSTGRES_USER`):

```bash
# Connect to the database
docker exec -it rentfix-postgis-dev psql -U rentfix -d rentfix
```

### Step 2: Enable PostGIS Extension

Run the following SQL commands:

```sql
-- Enable core PostGIS extension (required)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable topology support (optional, for advanced spatial relationships)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Enable raster support (optional, for satellite imagery / GIS data)
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- Enable fuzzy matching for addresses (optional, useful for geocoding)
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Enable PostGIS Tiger Geocoder (optional, US address geocoding)
-- CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
```

**For RentFix, you need at minimum:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### Step 3: Verify Installation

#### **Method 1: Check PostGIS Version**

```sql
SELECT PostGIS_full_version();
```

**Expected Output:**
```
POSTGIS="3.4.0" [EXTENSION] PGSQL="160" GEOS="3.12.0" PROJ="9.3.0" LIBXML="2.11.5" LIBJSON="0.17" LIBPROTOBUF="1.4.1" WAGYU="0.5.0 (Internal)" TOPOLOGY
```

**Simpler version check:**
```sql
SELECT PostGIS_version();
```

**Expected Output:**
```
 3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

#### **Method 2: Test Spatial Functionality**

```sql
-- Create a test point (New York City coordinates)
SELECT ST_AsText(ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326));
```

**Expected Output:**
```
 POINT(-74.006 40.7128)
```

#### **Method 3: List Installed Extensions**

```sql
SELECT * FROM pg_extension WHERE extname LIKE 'postgis%';
```

**Expected Output:**
```
 extname         | extversion
-----------------+------------
 postgis         | 3.4.0
 postgis_topology| 3.4.0
```

### Step 4: Verify Spatial Reference Systems

PostGIS includes 8,500+ coordinate systems. Verify the most common one (WGS 84 - GPS coordinates):

```sql
-- Check for SRID 4326 (WGS 84 - used by GPS, Google Maps, etc.)
SELECT auth_name, auth_srid, srtext
FROM spatial_ref_sys
WHERE srid = 4326;
```

**Expected Output:**
```
 auth_name | auth_srid | srtext
-----------+-----------+--------
 EPSG      | 4326      | GEOGCS["WGS 84"...
```

### Automating PostGIS Setup

The RentFix project includes a migration script that automatically enables PostGIS:

**File:** `services/core-matching/migrations/001_enable_postgis.sql`

```sql
-- Migration: Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify installation
SELECT PostGIS_version();

-- Create spatial reference system (WGS 84 - GPS coordinates)
-- SRID 4326 should already exist, but adding for safety
```

**Run the migration:**
```bash
# Using psql
docker exec -i rentfix-postgis-dev psql -U rentfix -d rentfix < services/core-matching/migrations/001_enable_postgis.sql

# Or from within the container
docker exec -it rentfix-postgis-dev psql -U rentfix -d rentfix -f /docker-entrypoint-initdb.d/001_enable_postgis.sql
```

---

## 4. Integrating PostGIS into NestJS Services

### Connection Configuration

NestJS services can connect to PostgreSQL using TypeORM, Prisma, or node-postgres (`pg`). RentFix uses a connection string approach for flexibility.

### Step 1: Configure Database Connection String

The connection format differs between **local development** and **Docker environments**:

#### **Local Development (Host Machine)**

```bash
# .env (services running on your machine, PostGIS in Docker)
DATABASE_URL=postgresql://rentfix:changeme@localhost:5432/rentfix
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=rentfix
DATABASE_PASSWORD=changeme
DATABASE_NAME=rentfix
```

#### **Docker Environment (Services in Containers)**

```bash
# .env (all services in Docker Compose network)
DATABASE_URL=postgresql://rentfix:changeme@postgis:5432/rentfix
DATABASE_HOST=postgis  # Service name from docker-compose.yml
DATABASE_PORT=5432
DATABASE_USER=rentfix
DATABASE_PASSWORD=changeme
DATABASE_NAME=rentfix
```

**Key Difference:** Use the Docker service name (`postgis`) as the host instead of `localhost`.

### Step 2: Configure TypeORM (Example)

If using TypeORM in a NestJS service:

**File:** `services/core-properties/src/config/database.config.ts`

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  // Alternative: individual parameters
  // host: configService.get<string>('DATABASE_HOST'),
  // port: configService.get<number>('DATABASE_PORT'),
  // username: configService.get<string>('DATABASE_USER'),
  // password: configService.get<string>('DATABASE_PASSWORD'),
  // database: configService.get<string>('DATABASE_NAME'),

  // SSL configuration (required for production, e.g., AWS RDS)
  ssl: configService.get<boolean>('DATABASE_SSL')
    ? { rejectUnauthorized: false }
    : false,

  // Connection pooling
  extra: {
    min: configService.get<number>('DATABASE_POOL_MIN', 2),
    max: configService.get<number>('DATABASE_POOL_MAX', 10),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  },

  // Auto-load entities
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // Migration settings
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: false, // Run manually for safety

  // Development only
  synchronize: false, // NEVER use in production
  logging: configService.get<string>('NODE_ENV') === 'development',
});
```

**Register in your module:**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
  ],
})
export class AppModule {}
```

### Step 3: Configure Prisma (Alternative)

If using Prisma as your ORM:

**File:** `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // PostGIS extensions
  extensions = [postgis]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

model Property {
  id          String   @id @default(uuid())
  address     String
  latitude    Float
  longitude   Float
  // PostGIS geography column (auto-generated from lat/lng via trigger)
  locationPoint Unsupported("geography(Point,4326)")?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([locationPoint], name: "idx_property_location", type: Gist)
}

model Contractor {
  id              String   @id @default(uuid())
  name            String
  latitude        Float?
  longitude       Float?
  serviceRadius   Int      @default(5000) // meters
  locationPoint   Unsupported("geography(Point,4326)")?

  @@index([locationPoint], name: "idx_contractor_location", type: Gist)
}
```

**Generate Prisma Client:**
```bash
cd services/core-properties
npx prisma generate
npx prisma db push  # For development
# OR
npx prisma migrate deploy  # For production
```

### Step 4: Using PostGIS in Queries

#### **Example: Find Nearby Contractors**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Contractor)
    private contractorRepo: Repository<Contractor>,
  ) {}

  async findNearbyContractors(
    propertyLat: number,
    propertyLng: number,
    radiusMeters: number = 5000,
    limit: number = 10,
  ) {
    return this.contractorRepo
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.name',
        'c.latitude',
        'c.longitude',
        // Calculate distance in kilometers
        `ST_Distance(
          c.location_point,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ) / 1000 AS distance_km`,
      ])
      .where(
        `ST_DWithin(
          c.location_point,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
      )
      .andWhere('c.deleted_at IS NULL')
      .andWhere("c.status = 'verified'")
      .andWhere("c.availability_status = 'available'")
      .setParameters({
        lat: propertyLat,
        lng: propertyLng,
        radius: radiusMeters,
      })
      .orderBy('distance_km', 'ASC')
      .limit(limit)
      .getRawMany();
  }
}
```

#### **Example: Raw SQL Query**

```typescript
async findContractorsWithinRadius(lat: number, lng: number, radius: number) {
  const query = `
    SELECT
      c.id,
      c.name,
      c.latitude,
      c.longitude,
      ST_Distance(
        c.location_point,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) / 1000 as distance_km
    FROM contractors c
    WHERE ST_DWithin(
      c.location_point,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )
    AND c.deleted_at IS NULL
    AND c.status = 'verified'
    ORDER BY distance_km ASC
    LIMIT 10
  `;

  return this.databaseService.query(query, [lng, lat, radius]);
}
```

### Step 5: Running Migrations

#### **TypeORM Migrations**

```bash
# Generate a migration
npm run migration:generate -- -n AddContractorLocation

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

#### **Prisma Migrations**

```bash
# Create a migration
npx prisma migrate dev --name add_contractor_location

# Apply migrations in production
npx prisma migrate deploy
```

#### **Manual SQL Migrations**

The RentFix project includes SQL migration files in `/migrations/`:

```bash
# Run initial schema
docker exec -i rentfix-postgis-dev psql -U rentfix -d rentfix < migrations/0001_initial_schema.sql

# Enable PostGIS
docker exec -i rentfix-postgis-dev psql -U rentfix -d rentfix < services/core-matching/migrations/001_enable_postgis.sql
```

### Step 6: Environment-Specific Configuration

**Development:**
```bash
DATABASE_HOST=localhost
DATABASE_URL=postgresql://rentfix:password@localhost:5432/rentfix
```

**Docker (docker-compose):**
```bash
DATABASE_HOST=postgis  # Service name
DATABASE_URL=postgresql://rentfix:password@postgis:5432/rentfix
```

**Production (AWS RDS, etc.):**
```bash
DATABASE_HOST=rentfix-prod.abc123.us-east-1.rds.amazonaws.com
DATABASE_URL=postgresql://rentfix:secure_pwd@rentfix-prod.abc123.us-east-1.rds.amazonaws.com:5432/rentfix
DATABASE_SSL=true
```

### Step 7: Health Checks & Connection Retry

Ensure your NestJS services wait for the database to be ready:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    await this.waitForDatabase();
  }

  private async waitForDatabase(maxRetries = 10, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.dataSource.query('SELECT 1');
        console.log('✓ Database connection established');
        return;
      } catch (error) {
        console.log(`Database not ready, retrying... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Failed to connect to database after maximum retries');
  }

  async checkHealth() {
    try {
      await this.dataSource.query('SELECT PostGIS_version()');
      return { status: 'healthy', postgis: true };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
```

---

## 5. Running Redis with Docker

Redis is used in RentFix for:
- **Caching**: User sessions, API responses, computed data
- **Job Queues**: Background tasks (Bull/BullMQ)
- **Pub/Sub**: Real-time notifications between services
- **Rate Limiting**: API throttling

### Option A: Docker Compose (Recommended)

Add to your `docker-compose.dev.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: rentfix-redis-dev
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-changeme}
    volumes:
      # Persistent storage (AOF - Append Only File)
      - redis_data:/data
    ports:
      - '6379:6379'
    networks:
      - rentfix-network
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  redis_data:
    driver: local
```

**Command Explanation:**
- `--appendonly yes`: Enable persistence via AOF (Append Only File)
- `--requirepass changeme`: Set a password (recommended even for development)

**Start Redis:**
```bash
docker-compose -f docker-compose.dev.yml up -d redis

# View logs
docker-compose -f docker-compose.dev.yml logs -f redis
```

### Option B: Standalone Docker Container

```bash
# Create volume for persistence
docker volume create redis_data

# Run Redis with password protection
docker run -d \
  --name rentfix-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass changeme

# View logs
docker logs -f rentfix-redis
```

### Option C: Redis Without Password (Development Only)

```bash
# INSECURE: Only for local development
docker run -d \
  --name rentfix-redis-dev \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# No password required to connect
```

### Connecting to Redis CLI

#### **From Within Docker Container**

```bash
# With password
docker exec -it rentfix-redis redis-cli -a changeme

# Without password (if no --requirepass)
docker exec -it rentfix-redis redis-cli
```

#### **From Host Machine (if redis-cli installed)**

```bash
# With password
redis-cli -h localhost -p 6379 -a changeme

# Test connection
redis-cli -h localhost -p 6379 -a changeme ping
# Expected: PONG
```

### Verify Redis is Working

```bash
# Connect to Redis CLI
docker exec -it rentfix-redis redis-cli -a changeme

# Test basic operations
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> SET test:key "Hello RentFix"
OK

127.0.0.1:6379> GET test:key
"Hello RentFix"

127.0.0.1:6379> DEL test:key
(integer) 1

127.0.0.1:6379> INFO server
# Server
redis_version:7.2.3
redis_mode:standalone
...
```

### Redis Persistence Modes

Redis offers two persistence mechanisms:

#### **1. RDB (Redis Database) - Snapshots**
- Periodic snapshots of the dataset
- Faster restarts, smaller files
- Potential data loss between snapshots

```bash
# Enable RDB in docker-compose.yml
command: redis-server --save 60 1000 --requirepass changeme
# Save to disk if ≥1000 keys changed in 60 seconds
```

#### **2. AOF (Append Only File) - Transaction Log**
- Logs every write operation
- More durable, minimal data loss
- Slower restarts, larger files

```bash
# Enable AOF (already in our config)
command: redis-server --appendonly yes --requirepass changeme
```

**For RentFix, use AOF** to prevent data loss in job queues and user sessions.

---

## 6. Configuring NestJS to use Redis

### Step 1: Install Dependencies

```bash
# Using ioredis (recommended, fastest)
npm install --save ioredis

# Type definitions
npm install --save-dev @types/ioredis

# Optional: NestJS cache manager for Redis
npm install --save @nestjs/cache-manager cache-manager-ioredis
```

### Step 2: Configure Environment Variables

```bash
# .env - Local development (PostGIS in Docker, services on host)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=changeme
REDIS_URL=redis://:changeme@localhost:6379

# Docker environment (all services in containers)
REDIS_HOST=redis  # Service name from docker-compose.yml
REDIS_PORT=6379
REDIS_PASSWORD=changeme
REDIS_URL=redis://:changeme@redis:6379
```

### Step 3: Create Redis Configuration Module

**File:** `services/core-auth/src/config/redis.config.ts`

```typescript
import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const getRedisConfig = (configService: ConfigService): RedisOptions => ({
  host: configService.get<string>('REDIS_HOST', 'localhost'),
  port: configService.get<number>('REDIS_PORT', 6379),
  password: configService.get<string>('REDIS_PASSWORD'),

  // Connection settings
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('Redis connection failed after 10 retries');
      return null; // Stop retrying
    }
    // Exponential backoff: 100ms, 200ms, 400ms, ...
    return Math.min(times * 100, 3000);
  },

  // Connection pool
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,

  // Debugging (disable in production)
  lazyConnect: false,
  showFriendlyErrorStack: configService.get<string>('NODE_ENV') === 'development',
});
```

### Step 4: Create Redis Service

**File:** `services/core-auth/src/redis/redis.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis(getRedisConfig(this.configService));

    this.client.on('connect', () => {
      console.log('✓ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('ready', () => {
      console.log('✓ Redis ready to accept commands');
    });

    await this.waitForReady();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private async waitForReady(maxRetries = 10, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.client.ping();
        return;
      } catch (error) {
        console.log(`Redis not ready, retrying... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Failed to connect to Redis after maximum retries');
  }

  getClient(): Redis {
    return this.client;
  }

  // Convenience methods
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
}
```

### Step 5: Register Redis Module

**File:** `services/core-auth/src/redis/redis.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Make available across all modules
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

**Import in AppModule:**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 6: Using Redis in Services

#### **Example 1: Caching User Sessions**

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionService {
  constructor(private redisService: RedisService) {}

  async createSession(userId: string, sessionData: object): Promise<string> {
    const sessionId = crypto.randomUUID();
    const key = `session:${sessionId}`;
    const ttl = 3600; // 1 hour

    await this.redisService.set(
      key,
      JSON.stringify({ userId, ...sessionData }),
      ttl,
    );

    return sessionId;
  }

  async getSession(sessionId: string): Promise<object | null> {
    const key = `session:${sessionId}`;
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redisService.delete(key);
  }
}
```

#### **Example 2: Rate Limiting**

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private redisService: RedisService) {}

  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const client = this.redisService.getClient();

    const current = await client.incr(key);

    if (current === 1) {
      // First request, set expiration
      await client.expire(key, windowSeconds);
    }

    return current <= maxRequests;
  }
}
```

#### **Example 3: Job Queue (BullMQ)**

```bash
# Install BullMQ
npm install --save bullmq
```

```typescript
import { Injectable } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailQueueService {
  private queue: Queue;
  private worker: Worker;

  constructor(private configService: ConfigService) {
    const connection = {
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    };

    // Create queue
    this.queue = new Queue('email-queue', { connection });

    // Create worker
    this.worker = new Worker(
      'email-queue',
      async (job) => {
        console.log(`Processing email job ${job.id}`);
        await this.sendEmail(job.data);
      },
      { connection },
    );
  }

  async addEmailJob(to: string, subject: string, body: string) {
    await this.queue.add('send-email', { to, subject, body });
  }

  private async sendEmail(data: any) {
    // Implementation...
  }
}
```

### Step 7: NestJS Cache Manager Integration

For automatic caching decorators:

```bash
npm install --save @nestjs/cache-manager cache-manager cache-manager-ioredis
```

**Configure:**

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        password: configService.get<string>('REDIS_PASSWORD'),
        ttl: 300, // Default 5 minutes
      }),
    }),
  ],
})
export class AppModule {}
```

**Use in services:**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PropertyService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getProperty(id: string) {
    const cacheKey = `property:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const property = await this.propertyRepo.findOne({ where: { id } });

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, property, 3600);

    return property;
  }
}
```

---

## 7. CI/CD Considerations

### GitHub Actions Configuration

The RentFix project includes a comprehensive CI/CD pipeline at `.github/workflows/deploy.yml`. Here's how to ensure PostGIS and Redis work in CI:

### Step 1: Define Services in Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    name: Integration & E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20

    # Define service containers
    services:
      # PostgreSQL with PostGIS
      postgres:
        image: postgis/postgis:16-3.4-alpine
        env:
          POSTGRES_USER: rentfix
          POSTGRES_PASSWORD: test-password
          POSTGRES_DB: rentfix_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      # Redis
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: 📥 Install dependencies
        run: npm ci --legacy-peer-deps

      # IMPORTANT: Wait for services to be ready
      - name: ⏳ Wait for PostgreSQL
        run: |
          until pg_isready -h localhost -U rentfix; do
            echo "Waiting for PostgreSQL..."
            sleep 2
          done

      - name: ⏳ Wait for Redis
        run: |
          until redis-cli -h localhost ping; do
            echo "Waiting for Redis..."
            sleep 2
          done

      # Enable PostGIS extension
      - name: 🗺️ Enable PostGIS extension
        run: |
          psql -h localhost -U rentfix -d rentfix_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"
          psql -h localhost -U rentfix -d rentfix_test -c "SELECT PostGIS_version();"
        env:
          PGPASSWORD: test-password

      # Run migrations
      - name: 🗄️ Run database migrations
        run: |
          psql -h localhost -U rentfix -d rentfix_test -f migrations/0001_initial_schema.sql
        env:
          PGPASSWORD: test-password

      # Run tests
      - name: 🧪 Run E2E tests
        run: npm run test:e2e --workspaces
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://rentfix:test-password@localhost:5432/rentfix_test
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_USER: rentfix
          DATABASE_PASSWORD: test-password
          DATABASE_NAME: rentfix_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          REDIS_PASSWORD: ''
          JWT_SECRET: test-jwt-secret-for-ci
```

### Step 2: Health Checks and Wait Scripts

**Option A: Using Docker Compose in CI**

```yaml
- name: 🐳 Start services
  run: docker-compose -f docker-compose.test.yml up -d postgis redis

- name: ⏳ Wait for services
  run: |
    # Wait for PostGIS
    until docker-compose -f docker-compose.test.yml exec -T postgis pg_isready -U rentfix; do
      echo "Waiting for PostGIS..."
      sleep 2
    done

    # Wait for Redis
    until docker-compose -f docker-compose.test.yml exec -T redis redis-cli ping; do
      echo "Waiting for Redis..."
      sleep 2
    done

- name: 🗺️ Enable PostGIS
  run: |
    docker-compose -f docker-compose.test.yml exec -T postgis psql -U rentfix -d rentfix_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"

- name: 🧪 Run tests
  run: docker-compose -f docker-compose.test.yml run --rm api-gateway npm run test:e2e
  env:
    DATABASE_URL: postgresql://rentfix:test@postgis:5432/rentfix_test
    REDIS_URL: redis://redis:6379
```

**Option B: Using wait-for-it.sh Script**

Create `scripts/wait-for-it.sh`:

```bash
#!/usr/bin/env bash
# wait-for-it.sh - Wait for a service to be ready

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port..."
  sleep 2
done

echo "$host:$port is ready!"
exec $cmd
```

**Use in CI:**

```yaml
- name: ⏳ Wait for services
  run: |
    chmod +x scripts/wait-for-it.sh
    ./scripts/wait-for-it.sh localhost 5432
    ./scripts/wait-for-it.sh localhost 6379

- name: 🧪 Run tests
  run: npm run test:e2e
```

### Step 3: Environment Variables in CI

Create `.env.ci` for test-specific configuration:

```bash
# .env.ci
NODE_ENV=test
DATABASE_URL=postgresql://rentfix:test-password@localhost:5432/rentfix_test
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=rentfix
DATABASE_PASSWORD=test-password
DATABASE_NAME=rentfix_test
DATABASE_SSL=false

REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=test-jwt-secret-min-32-chars-long
REFRESH_TOKEN_SECRET=test-refresh-secret-min-32-chars-long
```

**Load in CI:**

```yaml
- name: 🧪 Run tests
  run: |
    export $(cat .env.ci | xargs)
    npm run test:e2e
```

### Step 4: Parallel Test Execution

For matrix testing across multiple services:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        service:
          - core-auth
          - core-properties
          - core-matching
          - core-tickets

    services:
      postgres:
        image: postgis/postgis:16-3.4-alpine
        # ... (same as above)

      redis:
        image: redis:7-alpine
        # ... (same as above)

    steps:
      # ... (setup steps)

      - name: 🧪 Test ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://rentfix:test@localhost:5432/rentfix_test_${{ matrix.service }}
          REDIS_HOST: localhost
```

### Step 5: Docker Compose for CI

Create `docker-compose.ci.yml`:

```yaml
version: '3.9'

services:
  postgis:
    image: postgis/postgis:16-3.4-alpine
    environment:
      POSTGRES_DB: rentfix_test
      POSTGRES_USER: rentfix
      POSTGRES_PASSWORD: test
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rentfix']
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 10

  # Test runner (example)
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgis:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://rentfix:test@postgis:5432/rentfix_test
      REDIS_URL: redis://redis:6379
    command: npm run test:e2e
```

**Use in CI:**

```yaml
- name: 🧪 Run integration tests
  run: |
    docker-compose -f docker-compose.ci.yml up --abort-on-container-exit --exit-code-from test-runner
```

---

## 8. Troubleshooting Tips

### PostGIS Issues

#### **Issue 1: "ERROR: extension 'postgis' does not exist"**

**Cause:** PostGIS extension not installed or not enabled.

**Solution:**
```sql
-- Connect as superuser
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify
SELECT PostGIS_version();
```

If this fails, the PostGIS image might not be loaded:
```bash
# Check your Docker image
docker exec -it rentfix-postgis-dev psql -U rentfix -d rentfix -c "SELECT * FROM pg_available_extensions WHERE name = 'postgis';"

# If empty, you're not using a PostGIS image. Switch to:
# postgis/postgis:16-3.4-alpine
```

---

#### **Issue 2: "relation 'spatial_ref_sys' does not exist"**

**Cause:** PostGIS extension not properly initialized.

**Solution:**
```sql
-- Drop and recreate extension
DROP EXTENSION IF EXISTS postgis CASCADE;
CREATE EXTENSION postgis;

-- Verify spatial_ref_sys table exists
SELECT COUNT(*) FROM spatial_ref_sys;
```

---

#### **Issue 3: Slow spatial queries**

**Cause:** Missing GIST index on geography/geometry columns.

**Solution:**
```sql
-- Create spatial index
CREATE INDEX idx_contractors_location
ON contractors USING GIST (location_point);

-- Verify index is used
EXPLAIN ANALYZE
SELECT * FROM contractors
WHERE ST_DWithin(
  location_point,
  ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography,
  5000
);
-- Should show "Index Scan using idx_contractors_location"
```

---

#### **Issue 4: "function st_dwithin does not exist"**

**Cause:** Case sensitivity or missing PostGIS extension.

**Solution:**
```sql
-- PostgreSQL functions are case-insensitive, but check:
SELECT PostGIS_version();

-- If version shows, try lowercase:
ST_DWithin() -> st_dwithin()

-- Or check if extension is in search_path:
SHOW search_path;
SET search_path TO public, postgis;
```

---

### Redis Issues

#### **Issue 1: "NOAUTH Authentication required"**

**Cause:** Redis has a password, but you didn't provide it.

**Solution:**
```bash
# CLI with password
redis-cli -h localhost -a changeme

# Or authenticate after connecting
redis-cli -h localhost
127.0.0.1:6379> AUTH changeme
OK
```

**In NestJS:**
```typescript
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'changeme', // Add this!
});
```

---

#### **Issue 2: "connect ECONNREFUSED 127.0.0.1:6379"**

**Cause:** Redis is not running or not accessible.

**Solution:**
```bash
# Check if Redis container is running
docker ps | grep redis

# Check Redis logs
docker logs rentfix-redis

# Test connection
docker exec -it rentfix-redis redis-cli ping
# Expected: PONG

# If not running, start it:
docker-compose up -d redis
```

---

#### **Issue 3: Redis data loss after restart**

**Cause:** No persistence enabled or volume not mounted.

**Solution:**
```yaml
# Enable AOF persistence in docker-compose.yml
services:
  redis:
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data  # IMPORTANT: Mount volume
```

**Verify persistence:**
```bash
docker exec -it rentfix-redis redis-cli CONFIG GET appendonly
# Should return: "yes"

docker exec -it rentfix-redis redis-cli CONFIG GET save
# Should return snapshot configuration
```

---

### Docker Compose Issues

#### **Issue 1: Services can't connect to each other**

**Cause:** Not using Docker network service names.

**Solution:**
```bash
# WRONG (in Docker environment):
DATABASE_HOST=localhost
REDIS_HOST=localhost

# CORRECT (in Docker environment):
DATABASE_HOST=postgis  # Service name from docker-compose.yml
REDIS_HOST=redis       # Service name from docker-compose.yml
```

**Verify network:**
```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect rentfix-network

# Check if services are on same network
docker inspect rentfix-postgis-dev | grep -A 10 Networks
docker inspect rentfix-redis | grep -A 10 Networks
```

---

#### **Issue 2: "database does not exist" on first start**

**Cause:** Database initialization hasn't completed.

**Solution:**
```bash
# Check if database was created
docker exec -it rentfix-postgis-dev psql -U rentfix -d postgres -c "\l"

# If 'rentfix' database is missing, create it:
docker exec -it rentfix-postgis-dev psql -U rentfix -d postgres -c "CREATE DATABASE rentfix;"

# Or set POSTGRES_DB in docker-compose.yml
environment:
  POSTGRES_DB: rentfix  # Creates on first start
```

---

#### **Issue 3: "relation 'users' does not exist"**

**Cause:** Migrations haven't been run yet.

**Solution:**
```bash
# Run migrations manually
docker exec -i rentfix-postgis-dev psql -U rentfix -d rentfix < migrations/0001_initial_schema.sql

# Or use your ORM migration tool
cd services/core-auth
npm run migration:run

# For Prisma:
npx prisma migrate deploy
```

---

### NestJS Connection Issues

#### **Issue 1: Services start before database is ready**

**Cause:** No health check or retry logic.

**Solution 1: Use depends_on with health checks**
```yaml
services:
  api-gateway:
    depends_on:
      postgis:
        condition: service_healthy
      redis:
        condition: service_healthy
```

**Solution 2: Add connection retry in NestJS**
```typescript
// See "Step 7: Health Checks & Connection Retry" in Section 4
async waitForDatabase(maxRetries = 10, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await this.dataSource.query('SELECT 1');
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Database connection failed');
}
```

---

#### **Issue 2: TypeORM can't find entities**

**Cause:** Incorrect entity path in TypeORM config.

**Solution:**
```typescript
// WRONG (might fail in production):
entities: ['src/**/*.entity.ts']

// CORRECT (works in dev & prod):
entities: [__dirname + '/../**/*.entity{.ts,.js}']

// OR use explicit imports:
entities: [User, Property, Contractor]
```

---

#### **Issue 3: Redis connection timeout in production**

**Cause:** Long network latency or firewall blocking port.

**Solution:**
```typescript
const redisConfig: RedisOptions = {
  host: 'redis',
  port: 6379,
  password: 'changeme',

  // Increase timeouts
  connectTimeout: 30000,  // 30 seconds
  commandTimeout: 10000,  // 10 seconds

  // Enable retry logic
  retryStrategy: (times) => {
    if (times > 10) return null;
    return Math.min(times * 200, 5000);
  },
};
```

---

### CI/CD Issues

#### **Issue 1: GitHub Actions services fail health checks**

**Cause:** Services not fully initialized before tests run.

**Solution:**
```yaml
# Add explicit wait steps
- name: ⏳ Wait for PostgreSQL
  run: |
    for i in {1..30}; do
      pg_isready -h localhost -U rentfix && break
      echo "Waiting for PostgreSQL... ($i/30)"
      sleep 2
    done

- name: ⏳ Wait for Redis
  run: |
    for i in {1..30}; do
      redis-cli -h localhost ping && break
      echo "Waiting for Redis... ($i/30)"
      sleep 2
    done
```

---

#### **Issue 2: Migrations fail in CI**

**Cause:** Wrong database name or user permissions.

**Solution:**
```yaml
# Ensure database exists before running migrations
- name: 🗄️ Create database
  run: |
    psql -h localhost -U rentfix -d postgres -c "CREATE DATABASE rentfix_test;"
  env:
    PGPASSWORD: test-password

# Then run migrations
- name: 🗄️ Run migrations
  run: |
    psql -h localhost -U rentfix -d rentfix_test -f migrations/0001_initial_schema.sql
  env:
    PGPASSWORD: test-password
```

---

### General Debugging Tips

#### **Enable Debug Logging**

**PostgreSQL:**
```bash
# View real-time PostgreSQL logs
docker logs -f rentfix-postgis-dev

# Enable query logging
docker exec -it rentfix-postgis-dev psql -U rentfix -d rentfix -c "ALTER SYSTEM SET log_statement = 'all';"
docker restart rentfix-postgis-dev
```

**Redis:**
```bash
# View real-time Redis logs
docker logs -f rentfix-redis

# Enable verbose logging
docker exec -it rentfix-redis redis-cli CONFIG SET loglevel verbose
```

**NestJS:**
```typescript
// Enable TypeORM query logging
TypeOrmModule.forRoot({
  logging: true,
  logger: 'advanced-console',
});

// Enable Redis debug logging
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  lazyConnect: false,
  showFriendlyErrorStack: true,
});

redis.on('connect', () => console.log('Redis connecting...'));
redis.on('ready', () => console.log('Redis ready!'));
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('close', () => console.log('Redis connection closed'));
```

---

#### **Test Connections Manually**

**PostgreSQL:**
```bash
# Test from host
psql -h localhost -p 5432 -U rentfix -d rentfix -c "SELECT version();"

# Test from another container
docker run --rm --network rentfix-network postgres:16-alpine psql -h postgis -U rentfix -d rentfix -c "SELECT PostGIS_version();"
```

**Redis:**
```bash
# Test from host
redis-cli -h localhost -p 6379 -a changeme PING

# Test from another container
docker run --rm --network rentfix-network redis:7-alpine redis-cli -h redis -a changeme PING
```

---

#### **Check Network Connectivity**

```bash
# Inspect Docker network
docker network inspect rentfix-network

# Check if services can reach each other
docker exec -it rentfix-api-gateway ping postgis
docker exec -it rentfix-api-gateway ping redis

# Test DNS resolution
docker exec -it rentfix-api-gateway nslookup postgis
docker exec -it rentfix-api-gateway nslookup redis
```

---

#### **Clean Slate Reset**

If all else fails, reset everything:

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove all containers, networks, and volumes
docker system prune -a --volumes

# Rebuild and restart
docker-compose up -d --build
```

---

## Summary Checklist

### ✅ PostGIS Setup
- [ ] Docker Compose configured with `postgis/postgis:16-3.4-alpine`
- [ ] Volumes mounted for persistence
- [ ] `CREATE EXTENSION postgis;` executed
- [ ] `SELECT PostGIS_version();` returns version
- [ ] GIST indexes created on geography columns
- [ ] NestJS services configured with correct `DATABASE_HOST` (localhost vs postgis)
- [ ] Migrations include PostGIS-specific columns and functions
- [ ] Health checks configured in Docker Compose

### ✅ Redis Setup
- [ ] Docker Compose configured with `redis:7-alpine`
- [ ] AOF persistence enabled (`--appendonly yes`)
- [ ] Password set (`--requirepass`)
- [ ] Volume mounted for `/data`
- [ ] `ioredis` installed in NestJS services
- [ ] RedisService configured with retry logic
- [ ] Environment variables use correct `REDIS_HOST` (localhost vs redis)
- [ ] Health checks configured

### ✅ CI/CD Configuration
- [ ] GitHub Actions workflow includes PostGIS and Redis services
- [ ] Health checks configured for both services
- [ ] Wait scripts ensure services are ready before tests
- [ ] PostGIS extension enabled in CI
- [ ] Migrations run before tests
- [ ] Environment variables set correctly for test environment
- [ ] Test database created and isolated

### ✅ Production Readiness
- [ ] SSL/TLS enabled for database connections
- [ ] Redis password authentication enabled
- [ ] Connection pooling configured
- [ ] Retry logic implemented
- [ ] Health check endpoints exposed
- [ ] Monitoring and alerting configured
- [ ] Backup strategy defined for PostGIS and Redis
- [ ] Secrets managed securely (not in .env files)

---

## Additional Resources

### Official Documentation
- **PostGIS:** https://postgis.net/documentation/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Redis:** https://redis.io/documentation
- **NestJS:** https://docs.nestjs.com/
- **TypeORM:** https://typeorm.io/
- **ioredis:** https://github.com/luin/ioredis
- **Docker Compose:** https://docs.docker.com/compose/

### RentFix Project Files
- `docker-compose.prod.yml`: Production Docker configuration
- `migrations/`: Database migration scripts
- `.env.example`: Environment variable template
- `.github/workflows/deploy.yml`: CI/CD pipeline
- `services/*/src/config/`: Service-specific configurations

### Tutorials & Guides
- [PostGIS in Action](https://www.manning.com/books/postgis-in-action-third-edition)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Docker Networking](https://docs.docker.com/network/)

---

**Need Help?**
- Create an issue in the RentFix repository
- Check existing issues for similar problems
- Review logs: `docker-compose logs -f [service-name]`
- Join the team Slack channel for real-time support

---

**Version:** 1.0.0
**Last Updated:** 2024-01-15
**Maintained By:** RentFix Engineering Team
