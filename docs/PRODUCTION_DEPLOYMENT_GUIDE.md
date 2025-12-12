# 🚀 RentalFix Production Deployment Guide

**Enterprise-Grade Implementation by Senior Engineering Team**

**Date:** 2025-12-12
**Version:** 2.0 - Production Ready
**Services:** PostgreSQL + PostGIS + Redis + TypeORM + Prometheus

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup (PostgreSQL + PostGIS)](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Application Deployment](#application-deployment)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Observability](#monitoring--observability)
8. [Performance Tuning](#performance-tuning)
9. [Disaster Recovery](#disaster-recovery)
10. [Security Audit Checklist](#security-audit-checklist)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐                                               │
│  │  Nginx   │  ← SSL Termination + Rate Limiting           │
│  │ (Reverse │                                               │
│  │  Proxy)  │                                               │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────┐         ┌─────────────┐                  │
│  │ core-matching│────────→│  worker-ai  │                  │
│  │   (NestJS)   │         │  (BullMQ)   │                  │
│  └──────┬───────┘         └─────┬───────┘                  │
│         │                       │                            │
│         ├─────┬─────┬───────────┘                           │
│         │     │     │                                        │
│         ▼     ▼     ▼                                        │
│  ┌───────┐ ┌─────┐ ┌────────┐                              │
│  │PostgreSQL │Redis│ │Prometheus                            │
│  │+ PostGIS││Cache│ │Metrics │                              │
│  └───────┘ └─────┘ └────────┘                              │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                       │
│  │  Read Replicas   │  ← Analytics & Reporting              │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Purpose | Scaling Strategy |
|-----------|---------|------------------|
| **PostgreSQL + PostGIS** | Primary database with geospatial support | Master-slave replication |
| **Redis** | Caching + Rate limiting | Cluster mode (3+ nodes) |
| **NestJS App** | Contractor matching logic | Horizontal pods (K8s) |
| **Prometheus** | Metrics collection | Federated setup |
| **Nginx** | Reverse proxy + SSL | Active-active LB |

---

## 📦 Prerequisites

### Required Software

- **PostgreSQL 14+** with PostGIS 3.3+
- **Redis 7+** (standalone or cluster)
- **Node.js 18+** LTS
- **Docker** (for containerized deployment)
- **Kubernetes** (optional, for production scale)

### Cloud Recommendations

| Provider | Database | Cache | Compute |
|----------|----------|-------|---------|
| **AWS** | RDS PostgreSQL | ElastiCache | ECS/EKS |
| **Azure** | Azure Database | Azure Cache | AKS |
| **GCP** | Cloud SQL | Memorystore | GKE |

---

## 🗄️ Database Setup (PostgreSQL + PostGIS)

### Step 1: Install PostgreSQL + PostGIS

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-14 postgresql-14-postgis-3

# macOS (Homebrew)
brew install postgresql@14 postgis

# Verify PostGIS installation
psql -c "SELECT PostGIS_version();"
```

### Step 2: Enable PostGIS Extension

```sql
-- Connect to your database
psql -U postgres -d rentfix

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify
SELECT PostGIS_version();
-- Expected: "3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1"
```

### Step 3: Run Migration

```bash
# Run PostGIS migration
psql -U postgres -d rentfix -f services/core-matching/migrations/001_enable_postgis.sql

# Verify spatial indexes
psql -U postgres -d rentfix -c "
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename = 'contractors'
  AND indexname LIKE '%location%';
"
```

### Step 4: Configure Connection Pooling

**For Production (RDS/Cloud SQL):**

```bash
# Set max connections (adjust based on instance size)
ALTER SYSTEM SET max_connections = 200;

# Enable prepared statement caching
ALTER SYSTEM SET max_prepared_transactions = 100;

# Optimize for geospatial queries
ALTER SYSTEM SET shared_buffers = '4GB';  # 25% of RAM
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';

# Reload configuration
SELECT pg_reload_conf();
```

### Step 5: Set Up Read Replicas (Optional)

For analytics/reporting workloads:

```bash
# Create read replica (AWS RDS example)
aws rds create-db-instance-read-replica \
  --db-instance-identifier rentfix-replica-1 \
  --source-db-instance-identifier rentfix-primary \
  --db-instance-class db.r6g.xlarge

# Update application config
ANALYTICS_DB_HOST=rentfix-replica-1.xxx.rds.amazonaws.com
```

---

## 🔴 Redis Setup

### Step 1: Install Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
sudo systemctl start redis-server
```

### Step 2: Configure Redis for Production

**redis.conf:**

```conf
# Persistence
save 900 1     # Save after 15 min if 1 key changed
save 300 10    # Save after 5 min if 10 keys changed
save 60 10000  # Save after 1 min if 10000 keys changed

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru  # Evict least recently used keys

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 60

# Security
requirepass YOUR_SECURE_REDIS_PASSWORD
rename-command FLUSHDB ""  # Disable dangerous commands
rename-command FLUSHALL ""
rename-command KEYS ""

# Append-only file (for durability)
appendonly yes
appendfsync everysec
```

### Step 3: Redis Cluster (Production)

For high availability:

```bash
# Create cluster (min 3 masters + 3 replicas)
redis-cli --cluster create \
  redis-1:6379 redis-2:6379 redis-3:6379 \
  redis-4:6379 redis-5:6379 redis-6:6379 \
  --cluster-replicas 1
```

**Update app config:**

```env
REDIS_CLUSTER=true
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
```

---

## 🚀 Application Deployment

### Step 1: Environment Setup

```bash
# Clone repository
git clone https://github.com/MalikOseni/Rentfix.git
cd Rentfix/services/core-matching

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env  # Update with production values
```

### Step 2: Build Application

```bash
# Build TypeScript
npm run build

# Verify build output
ls -la dist/
```

### Step 3: Database Migrations

```bash
# Run migrations
psql -U postgres -d rentfix < migrations/001_enable_postgis.sql

# Seed initial contractor data (if needed)
npm run seed  # Create this script based on your needs
```

### Step 4: Start Application

```bash
# Production mode
NODE_ENV=production npm start

# Or with PM2 (process manager)
pm2 start dist/main.js \
  --name "core-matching" \
  --instances 4 \
  --exec-mode cluster \
  --env production

# Enable auto-restart
pm2 startup
pm2 save
```

### Step 5: Docker Deployment (Recommended)

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 4400 9090
CMD ["node", "dist/main.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:14-3.3-alpine
    environment:
      POSTGRES_DB: rentfix
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  core-matching:
    build: .
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_HOST: redis
    ports:
      - "4400:4400"
      - "9090:9090"
    depends_on:
      - postgres
      - redis

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9091:9090"

volumes:
  postgres_data:
  redis_data:
```

**Start stack:**

```bash
docker-compose up -d
```

---

## 🔒 Security Hardening

### 1. **Database Security**

```sql
-- Create dedicated service account (least privilege)
CREATE USER rentfix_app WITH PASSWORD 'STRONG_PASSWORD_HERE';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE rentfix TO rentfix_app;
GRANT USAGE ON SCHEMA public TO rentfix_app;
GRANT SELECT, INSERT, UPDATE ON TABLE contractors TO rentfix_app;
GRANT SELECT ON TABLE contractor_ratings TO rentfix_app;

-- Enable Row-Level Security (RLS)
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (example)
CREATE POLICY contractor_access_policy ON contractors
  FOR SELECT
  USING (deleted_at IS NULL AND status = 'verified');
```

### 2. **API Security**

**Enable CORS:**

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Add API Key Authentication:**

```typescript
// auth.guard.ts
if (process.env.API_KEY_REQUIRED === 'true') {
  const apiKey = request.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    throw new UnauthorizedException();
  }
}
```

### 3. **SSL/TLS Configuration**

**Nginx config:**

```nginx
server {
    listen 443 ssl http2;
    server_name api.rentfix.com;

    ssl_certificate /etc/ssl/certs/rentfix.crt;
    ssl_certificate_key /etc/ssl/private/rentfix.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:4400;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;
}
```

### 4. **Input Validation**

Already implemented via `class-validator` in DTOs. Ensure all endpoints use validation pipes:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

## 📊 Monitoring & Observability

### 1. **Prometheus Metrics**

**prometheus.yml:**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'core-matching'
    static_configs:
      - targets: ['localhost:9090']
```

**Key Metrics to Monitor:**

- `http_request_duration_seconds` - P50, P95, P99 latency
- `matching_requests_total` - Request rate
- `cache_hits_total / cache_misses_total` - Cache hit rate
- `db_query_duration_seconds` - Database performance
- `contractors_available` - Business metric

### 2. **Grafana Dashboards**

Import pre-built dashboard (ID: 15038 - NestJS Metrics)

**Custom Queries:**

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 3. **Alerts (Alertmanager)**

```yaml
groups:
  - name: core-matching
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: LowCacheHitRate
        expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.7
        for: 10m

      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) > 1
        for: 5m
```

### 4. **Logging**

Use structured logging (JSON format):

```typescript
logger.log({
  level: 'info',
  message: 'Contractor matched',
  ticketId: 'abc-123',
  contractorId: 'xyz-789',
  score: 87.5,
  duration: 45,
  timestamp: new Date().toISOString(),
});
```

**Centralize logs** using:
- **ELK Stack** (Elasticsearch + Logstash + Kibana)
- **DataDog** (cloud-native)
- **CloudWatch** (AWS)

---

## ⚡ Performance Tuning

### 1. **Database Optimization**

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT *
FROM contractors
WHERE ST_DWithin(
  location_point,
  ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography,
  5000
)
AND specialties @> '["plumbing"]'::jsonb
LIMIT 10;

-- Vacuum regularly
VACUUM ANALYZE contractors;

-- Create composite indexes for common queries
CREATE INDEX idx_contractors_specialty_location
  ON contractors USING GIST (location_point)
  WHERE specialties @> '["plumbing"]'::jsonb
  AND deleted_at IS NULL;
```

### 2. **Redis Optimization**

```bash
# Monitor slow queries
redis-cli SLOWLOG GET 10

# Check memory usage
redis-cli INFO memory

# Optimize keyspace
redis-cli --bigkeys
```

### 3. **Application Tuning**

```typescript
// Enable query result caching (TypeORM)
const contractors = await repository.find({
  where: { status: 'verified' },
  cache: {
    id: 'verified_contractors',
    milliseconds: 60000,
  },
});

// Use connection pooling
extra: {
  max: 20,  // Adjust based on load
  min: 5,
  idleTimeoutMillis: 30000,
}
```

---

## 🛡️ Security Audit Checklist

- [ ] **Environment Variables** - No secrets in code
- [ ] **Database** - Dedicated user with minimal permissions
- [ ] **SSL/TLS** - Enforced on all connections
- [ ] **Rate Limiting** - Enabled on all endpoints
- [ ] **Input Validation** - All DTOs validated
- [ ] **SQL Injection** - Using parameterized queries (TypeORM)
- [ ] **XSS Protection** - Helmet.js enabled
- [ ] **CORS** - Restricted origins
- [ ] **Dependencies** - Run `npm audit` and fix vulnerabilities
- [ ] **Logging** - No PII logged
- [ ] **Encryption** - At rest (database) and in transit (SSL)
- [ ] **Backups** - Automated daily backups
- [ ] **Monitoring** - Alerts configured
- [ ] **Penetration Testing** - Schedule external audit

---

## 💾 Disaster Recovery

### Backup Strategy

```bash
# Daily database backups
0 2 * * * pg_dump -U postgres rentfix | gzip > /backups/rentfix_$(date +\%Y\%m\%d).sql.gz

# Upload to S3 (or equivalent)
aws s3 cp /backups/ s3://rentfix-backups/postgres/ --recursive

# Retention: 30 days
find /backups -mtime +30 -delete
```

### Recovery Procedure

```bash
# Restore from backup
gunzip < rentfix_20250112.sql.gz | psql -U postgres -d rentfix

# Verify data integrity
psql -U postgres -d rentfix -c "SELECT COUNT(*) FROM contractors;"
```

---

## 🎯 Success Metrics (SLOs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | 99.9% | Uptime monitoring |
| P95 Latency | < 200ms | Prometheus histogram |
| Error Rate | < 0.1% | HTTP 5xx responses |
| Cache Hit Rate | > 80% | Redis metrics |
| Database Query Time | < 100ms | TypeORM logs |

---

## 📞 Support & Escalation

**Critical Issues:**
1. Check application logs: `pm2 logs core-matching`
2. Check database: `psql -c "SELECT * FROM pg_stat_activity;"`
3. Check Redis: `redis-cli PING`
4. Rollback if needed: `git revert HEAD && npm run deploy`

**Monitoring Dashboards:**
- Grafana: https://grafana.rentfix.com
- Prometheus: https://prometheus.rentfix.com
- Sentry: https://sentry.io/rentfix

---

**Deployment completed successfully? ✅**

Proceed to [E2E Testing](#testing) to verify functionality.
