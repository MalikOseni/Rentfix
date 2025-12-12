# RentFix Platform - Comprehensive Testing Guide

> **Complete guide for cloning, setting up, testing, and evaluating the RentFix platform built by 9 elite engineers**

**Date:** December 12, 2025
**Version:** 1.0.0
**Status:** Production-Ready Testing Guide

---

## Table of Contents

1. [Quick Start Overview](#1-quick-start-overview)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Step 1: Clone & Install Dependencies](#step-1-clone--install-dependencies)
4. [Step 2: Database Setup (PostgreSQL + PostGIS & Redis)](#step-2-database-setup-postgresql--postgis--redis)
5. [Step 3: Environment Configuration](#step-3-environment-configuration)
6. [Step 4: Verify Database Setup & Inspect Data](#step-4-verify-database-setup--inspect-data)
7. [Step 5: Running Backend Services](#step-5-running-backend-services)
8. [Step 6: Running Mobile Apps](#step-6-running-mobile-apps)
9. [Step 7: Running Web Agent Dashboard](#step-7-running-web-agent-dashboard)
10. [Testing Strategy: Physical Device vs Emulator](#testing-strategy-physical-device-vs-emulator)
11. [Code Evaluation Checklist](#code-evaluation-checklist)
12. [Validating All 9 Engineers' Work](#validating-all-9-engineers-work)
13. [API Testing Guide](#api-testing-guide)
14. [Troubleshooting Common Issues](#troubleshooting-common-issues)
15. [Database Inspection Tools](#database-inspection-tools)
16. [Running Tests](#running-tests)

---

## 1. Quick Start Overview

The RentFix platform is a production-ready monorepo built by 9 elite engineers from Google, Microsoft, Adobe, Figma, NVIDIA, Uber, Anthropic, OpenAI, and Folio. Here's what you'll be testing:

### Architecture Overview
```
RentFix Platform
├── 3 Mobile/Web Apps (Frontend)
│   ├── mobile-tenant (React Native/Expo) - Tenant iOS/Android app
│   ├── mobile-contractor (React Native/Expo) - Contractor iOS/Android app
│   └── web-agent (Next.js) - Property manager dashboard
│
├── 12 Backend Microservices (NestJS)
│   ├── api-gateway (Port 4000) - Edge routing, auth, rate limiting
│   ├── core-auth (Port 4100) - Identity, sessions, MFA, RBAC
│   ├── core-tickets (Port 4200) - Ticket lifecycle + SLA state
│   ├── core-properties (Port 4500) - Properties, units, leases
│   ├── core-matching (Port 4400) - Contractor matching (Uber-style)
│   ├── core-payments (Port 4600) - Invoices, payouts
│   ├── core-notifications (Port 4700) - Email/SMS/push
│   ├── core-evidence (Port 4800) - Evidence metadata, storage
│   ├── core-analytics (Port 4900) - Aggregations, KPIs
│   ├── worker-ai - AI inference jobs
│   ├── worker-media - Media processing
│   └── worker-reporting - Report generation
│
├── Infrastructure
│   ├── PostgreSQL 16 + PostGIS 3.4 - Spatial database
│   ├── Redis 7 - Caching + job queues
│   └── Nginx - Reverse proxy (production)
│
└── Shared Packages
    ├── @rentfix/types - Cross-service TypeScript types
    ├── @rentfix/config - Shared configuration
    ├── @rentfix/ui - Reusable UI components
    └── @rentfix/utils - Utility helpers
```

---

## 2. Prerequisites & System Requirements

### Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|---------------|
| **Node.js** | >= 18.0.0 | Runtime for backend & frontend | https://nodejs.org/ |
| **npm** | >= 9.0.0 | Package manager | (included with Node) |
| **Docker** | >= 20.10 | Database containers | https://www.docker.com/ |
| **Docker Compose** | >= 2.0 | Multi-container orchestration | (included with Docker Desktop) |
| **Git** | Latest | Version control | https://git-scm.com/ |
| **PostgreSQL Client** (psql) | 14+ | Database CLI (optional) | https://www.postgresql.org/download/ |
| **Expo Go** (Mobile) | Latest | Mobile app testing | App Store / Play Store |

### Optional Tools (Highly Recommended)

| Tool | Purpose | Download Link |
|------|---------|---------------|
| **pgAdmin** | PostgreSQL GUI client | https://www.pgadmin.org/ |
| **DBeaver** | Universal database GUI | https://dbeaver.io/ |
| **Postman** | API testing | https://www.postman.com/ |
| **VS Code** | Code editor | https://code.visualstudio.com/ |
| **Android Studio** | Android emulator | https://developer.android.com/studio |
| **Xcode** (macOS only) | iOS simulator | https://developer.apple.com/xcode/ |

### System Requirements

- **RAM:** Minimum 8GB, recommended 16GB+
- **Disk Space:** 20GB free space
- **OS:** macOS, Linux, or Windows 10/11
- **Network:** Stable internet connection for dependency downloads

---

## Step 1: Clone & Install Dependencies

### 1.1 Clone the Repository

```bash
# Clone the repository
git clone https://github.com/MalikOseni/Rentfix.git
cd Rentfix

# Verify you're on the correct branch
git branch
git status
```

### 1.2 Install All Dependencies

The project uses npm workspaces to manage dependencies across all services and apps.

```bash
# Install dependencies for the entire monorepo
# This will install dependencies for all 21 workspaces
npm install

# This may take 5-10 minutes depending on your internet speed
```

**Expected Output:**
```
added 12,456 packages in 8m
21 packages are looking for funding
```

### 1.3 Verify Installation

```bash
# List all installed workspaces
npm list --workspaces --depth=0

# Check Node and npm versions
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher

# Verify Expo is installed
cd apps/mobile-tenant
npx expo --version  # Should be 49.0.20
cd ../..
```

---

## Step 2: Database Setup (PostgreSQL + PostGIS & Redis)

The RentFix platform requires **PostgreSQL with PostGIS extension** (for geospatial queries) and **Redis** (for caching and job queues).

### Option A: Using Docker Compose (Recommended)

#### 2.1 Create Development Docker Compose File

Create a file named `docker-compose.dev.yml` in the project root:

```yaml
version: '3.9'

services:
  # PostgreSQL with PostGIS extension
  postgres:
    image: postgis/postgis:16-3.4-alpine
    container_name: rentfix-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: rentfix
      POSTGRES_USER: rentfix
      POSTGRES_PASSWORD: changeme
      POSTGRES_INITDB_ARGS: '-E UTF8 --locale=en_US.UTF-8'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d:ro
    ports:
      - '5432:5432'
    networks:
      - rentfix-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rentfix']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching and job queues
  redis:
    image: redis:7-alpine
    container_name: rentfix-redis-dev
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    networks:
      - rentfix-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  rentfix-network:
    driver: bridge
```

#### 2.2 Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Verify containers are running
docker ps

# Expected output:
# CONTAINER ID   IMAGE                              STATUS          PORTS
# abc123...      postgis/postgis:16-3.4-alpine      Up 30 seconds   0.0.0.0:5432->5432/tcp
# def456...      redis:7-alpine                     Up 30 seconds   0.0.0.0:6379->6379/tcp

# View logs to ensure successful startup
docker-compose -f docker-compose.dev.yml logs -f postgres
# Press Ctrl+C to exit logs

docker-compose -f docker-compose.dev.yml logs -f redis
```

#### 2.3 Enable PostGIS Extension

```bash
# Connect to PostgreSQL and enable PostGIS
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix

# Inside psql shell, run:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# Verify PostGIS installation
SELECT PostGIS_version();
# Expected output: 3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1

# Exit psql
\q
```

#### 2.4 Verify Redis

```bash
# Test Redis connection
docker exec -it rentfix-redis-dev redis-cli ping
# Expected output: PONG

# Check Redis version
docker exec -it rentfix-redis-dev redis-cli INFO server | grep redis_version
# Expected output: redis_version:7.2.3
```

### Option B: Manual Installation (Without Docker)

If you prefer not to use Docker, follow the detailed instructions in `/docs/POSTGIS_REDIS_SETUP_GUIDE.md` for installing PostgreSQL + PostGIS and Redis directly on your system.

---

## Step 3: Environment Configuration

Each service and app requires environment variables. The project provides `.env.example` templates.

### 3.1 Root Environment Configuration

```bash
# Copy the root .env.example to .env
cp .env.example .env

# Edit the .env file with your preferred editor
nano .env  # or vim, code, etc.
```

**Required Configuration (Minimum for Development):**

```bash
# ============================================================================
# Application Configuration
# ============================================================================
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
API_VERSION=v1

# ============================================================================
# Database Configuration (PostgreSQL + PostGIS)
# ============================================================================
DATABASE_URL=postgresql://rentfix:changeme@localhost:5432/rentfix
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=rentfix
DATABASE_PASSWORD=changeme
DATABASE_NAME=rentfix
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ============================================================================
# Redis Configuration
# ============================================================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# ============================================================================
# Authentication & Security (REQUIRED)
# ============================================================================
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-changeme-now-for-security
JWT_EXPIRATION=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-characters-also-change-me
REFRESH_TOKEN_EXPIRATION=7d
BCRYPT_ROUNDS=12

# ============================================================================
# CORS & Security
# ============================================================================
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# ============================================================================
# Feature Flags
# ============================================================================
ENABLE_SWAGGER=true
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true

# ============================================================================
# Optional: External Services (For Production Features)
# ============================================================================
# These are optional for basic testing but required for full functionality

# AI Service (optional for development)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-4-vision-preview
AI_CLASSIFICATION_ENABLED=false

# Cloud Storage (optional for development)
S3_BUCKET=rentfix-media-dev
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-aws-access-key
S3_SECRET_ACCESS_KEY=your-aws-secret-key

# Email (optional for development)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@rentfix.com

# SMS (optional for development)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+15551234567

# Payments (optional for development)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 3.2 Service-Specific Environment Files

Each microservice has its own `.env.example`. For development, you can copy them:

```bash
# Core-Auth Service
cp services/core-auth/.env.example services/core-auth/.env

# Core-Tickets Service
cp services/core-tickets/.env.example services/core-tickets/.env

# Core-Matching Service
cp services/core-matching/.env.example services/core-matching/.env

# API Gateway
cp services/api-gateway/.env.example services/api-gateway/.env

# Repeat for other services as needed...
```

**Note:** For basic testing, the root `.env` file is sufficient as services inherit from it.

### 3.3 Mobile App Configuration

```bash
# Mobile Tenant App
cp apps/mobile-tenant/.env.example apps/mobile-tenant/.env

# Edit the file
nano apps/mobile-tenant/.env
```

**Content:**
```bash
API_URL=http://localhost:4000
API_TIMEOUT=30000
ENABLE_DEV_TOOLS=true
```

**Important:** For testing on a physical device, replace `localhost` with your computer's local IP address:

```bash
# Find your local IP
# On macOS/Linux:
ifconfig | grep "inet "
# On Windows:
ipconfig

# Example:
API_URL=http://192.168.1.100:4000
```

---

## Step 4: Verify Database Setup & Inspect Data

### 4.1 Verify PostgreSQL + PostGIS

```bash
# Connect to the database
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix

# Inside psql, run these verification queries:

-- Check PostGIS version
SELECT PostGIS_version();

-- List all extensions
\dx

-- Check if spatial_ref_sys table exists (PostGIS system table)
SELECT COUNT(*) FROM spatial_ref_sys;
-- Should return 8,000+ spatial reference systems

-- List all tables (should be empty initially)
\dt

-- Exit psql
\q
```

### 4.2 Using pgAdmin (GUI Tool)

If you installed pgAdmin:

1. Open pgAdmin
2. Create a new server connection:
   - **Name:** RentFix Dev
   - **Host:** localhost
   - **Port:** 5432
   - **Username:** rentfix
   - **Password:** changeme
   - **Database:** rentfix
3. Expand: Servers → RentFix Dev → Databases → rentfix → Schemas → public
4. You can now browse tables, run queries, and inspect data visually

### 4.3 Inspect Database Schema (After Running Services)

After starting the backend services (Step 5), the database will be populated with tables. You can inspect them:

```bash
# Connect to database
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix

-- List all tables
\dt

-- Expected tables (after running core-auth and core-tickets):
--  users
--  contractors
--  tickets
--  ticket_assignments
--  ticket_state_history
--  properties
--  etc.

-- Describe a specific table
\d users

-- View sample data
SELECT id, email, role, created_at FROM users LIMIT 10;

-- Check contractor locations (PostGIS geospatial data)
SELECT id, name, latitude, longitude,
       ST_AsText(location_point) as location_wkt
FROM contractors
LIMIT 5;

-- Exit
\q
```

### 4.4 Verify Redis

```bash
# Connect to Redis CLI
docker exec -it rentfix-redis-dev redis-cli

# Test basic operations
127.0.0.1:6379> PING
PONG

# Check Redis info
127.0.0.1:6379> INFO server

# List all keys (should be empty initially)
127.0.0.1:6379> KEYS *

# Exit Redis CLI
127.0.0.1:6379> EXIT
```

### 4.5 Monitor Database Activity in Real-Time

```bash
# Watch PostgreSQL logs live
docker-compose -f docker-compose.dev.yml logs -f postgres

# Watch Redis logs live
docker-compose -f docker-compose.dev.yml logs -f redis

# In another terminal, you can now start services and see database queries
```

---

## Step 5: Running Backend Services

You can run services individually or all at once.

### 5.1 Start API Gateway (Port 4000)

```bash
cd services/api-gateway

# Install dependencies (if not already done)
npm install

# Start in development mode with hot-reload
npm run dev

# Expected output:
# [NestJS] Starting Nest application...
# [NestJS] API Gateway running on http://localhost:4000
```

**Test the gateway:**
```bash
# In another terminal
curl http://localhost:4000/api/health

# Expected response:
# {"status":"ok","service":"api-gateway","upstreams":["auth","tickets","matching","notifications"]}
```

### 5.2 Start Core-Auth Service (Port 4100)

```bash
# In a new terminal
cd services/core-auth

npm install
npm run dev

# Expected output:
# Database connection established
# Redis connected
# core-auth service listening on port 4100
```

**Test authentication endpoint:**
```bash
curl http://localhost:4100/health
# Should return: {"status":"ok","service":"core-auth"}
```

### 5.3 Start Core-Tickets Service (Port 4200)

```bash
# In a new terminal
cd services/core-tickets

npm install
npm run dev

# Expected output:
# Database connection established
# core-tickets service listening on port 4200
```

### 5.4 Start Core-Matching Service (Port 4400)

```bash
# In a new terminal
cd services/core-matching

npm install
npm run dev

# Expected output:
# PostGIS extension detected
# Contractor cache initialized
# core-matching service listening on port 4400
```

### 5.5 Running All Services Simultaneously

For easier management, you can use a process manager like **concurrently** or **tmux**.

**Option A: Using npm workspace parallelism**
```bash
# From the project root
npm run dev --workspaces --if-present

# This will start all services that have a "dev" script in parallel
```

**Option B: Using a process manager (pm2)**
```bash
# Install pm2 globally
npm install -g pm2

# Create an ecosystem file: ecosystem.config.js
# (See full example in the next section)

# Start all services
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# Stop all services
pm2 stop all
pm2 delete all
```

**Full `ecosystem.config.js` Example:**
```javascript
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      cwd: './services/api-gateway',
      script: 'npm',
      args: 'run dev',
      env: { PORT: 4000 }
    },
    {
      name: 'core-auth',
      cwd: './services/core-auth',
      script: 'npm',
      args: 'run dev',
      env: { PORT: 4100 }
    },
    {
      name: 'core-tickets',
      cwd: './services/core-tickets',
      script: 'npm',
      args: 'run dev',
      env: { PORT: 4200 }
    },
    {
      name: 'core-matching',
      cwd: './services/core-matching',
      script: 'npm',
      args: 'run dev',
      env: { PORT: 4400 }
    },
    // Add more services as needed...
  ]
};
```

---

## Step 6: Running Mobile Apps

### 6.1 Mobile Tenant App (React Native/Expo)

```bash
cd apps/mobile-tenant

# Install dependencies (if not already done)
npm install

# Start Expo development server
npx expo start

# Or use the npm script
npm start
```

**Expected Output:**
```
Metro waiting on exp://192.168.1.100:19000
Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code
```

**QR Code Will Appear** - You can scan this with your phone.

### 6.2 Mobile Contractor App

```bash
# In a new terminal
cd apps/mobile-contractor

npm install
npx expo start
```

---

## Step 7: Running Web Agent Dashboard

```bash
cd apps/web-agent

npm install

# Build the Next.js app first
npm run build

# Start production server
npm start

# Or for development with hot-reload
npm run dev
```

Visit: http://localhost:3000

---

## Testing Strategy: Physical Device vs Emulator

### Recommended Approach: **Physical Device First**

**Reasons:**
1. **Real-world testing** - True performance, network conditions, and UX
2. **Camera access** - Test photo upload features
3. **Push notifications** - Test real notification delivery
4. **GPS/Location** - Test geolocation features (contractor matching)
5. **Faster setup** - No emulator installation needed

### Using Physical Device with Expo Go

**Steps:**

1. **Install Expo Go on your phone**
   - iOS: App Store → Search "Expo Go"
   - Android: Play Store → Search "Expo Go"

2. **Ensure phone and computer are on the same WiFi network**

3. **Start the mobile app (from Step 6)**
   ```bash
   cd apps/mobile-tenant
   npx expo start
   ```

4. **Scan the QR code**
   - **iOS:** Open Camera app → Point at QR code → Tap notification
   - **Android:** Open Expo Go app → Tap "Scan QR Code"

5. **App will load on your phone**

**Troubleshooting Connection Issues:**
```bash
# If the QR code doesn't work, use tunnel mode
npx expo start --tunnel

# This uses ngrok to create a public URL accessible anywhere
```

### Using Android Emulator

**Prerequisites:**
1. Install Android Studio
2. Set up an Android Virtual Device (AVD)

**Steps:**
```bash
cd apps/mobile-tenant

# Start Expo
npx expo start

# Press 'a' to open in Android emulator
# Expo will automatically launch the emulator and install the app
```

### Using iOS Simulator (macOS Only)

**Prerequisites:**
1. Install Xcode from App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

**Steps:**
```bash
cd apps/mobile-tenant

# Start Expo
npx expo start

# Press 'i' to open in iOS simulator
# Expo will automatically launch the simulator
```

### Testing Matrix

| Feature | Physical Device | Emulator | Notes |
|---------|----------------|----------|-------|
| UI/UX Testing | ✅ Best | ✅ Good | Real touch feedback on device |
| Camera/Photos | ✅ Real camera | ⚠️ Limited | Emulator uses mock images |
| GPS/Location | ✅ Real location | ⚠️ Mock location | Device gives true experience |
| Push Notifications | ✅ Real notifications | ✅ Works | Both support FCM |
| Network Speed | ✅ Real conditions | ✅ Simulated | Device shows true latency |
| Performance | ✅ Real device perf | ⚠️ May be slower | Emulator depends on PC specs |
| Bluetooth | ✅ Works | ❌ Not supported | Device only |
| Biometrics | ✅ Real FaceID/Fingerprint | ⚠️ Limited | Device preferred |

**Recommendation:** Test on **both physical device and emulator** for comprehensive coverage.

---

## Code Evaluation Checklist

Use this checklist to systematically evaluate each component of the RentFix platform.

### General Codebase Quality

- [ ] **Code Organization**
  - [ ] Files follow consistent naming conventions
  - [ ] Folder structure is logical (controllers, services, entities, DTOs)
  - [ ] No circular dependencies
  - [ ] Clear separation of concerns

- [ ] **TypeScript Quality**
  - [ ] All files are properly typed (no `any` without justification)
  - [ ] Interfaces and types are well-defined
  - [ ] Enums are used for constants
  - [ ] Generic types used appropriately

- [ ] **Code Style & Standards**
  - [ ] ESLint passes with no errors (`npm run lint --workspaces`)
  - [ ] Code formatting is consistent
  - [ ] Comments explain "why" not "what"
  - [ ] No console.log statements in production code

- [ ] **Error Handling**
  - [ ] Try-catch blocks in all async operations
  - [ ] Custom error classes for different scenarios
  - [ ] Proper HTTP status codes
  - [ ] User-friendly error messages

- [ ] **Security**
  - [ ] No hardcoded secrets or API keys
  - [ ] Input validation on all endpoints
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS protection
  - [ ] Rate limiting implemented
  - [ ] Authentication guards on protected routes
  - [ ] CORS properly configured

### Backend Services Evaluation

#### Core-Auth Service
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Token refresh mechanism works
- [ ] Password hashing with bcrypt/argon2
- [ ] Role-based access control (RBAC) implemented
- [ ] Multi-factor authentication (if implemented)
- [ ] Contractor registration with phone verification

**Test:**
```bash
# Register a new user
curl -X POST http://localhost:4100/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"tenant"}'

# Login
curl -X POST http://localhost:4100/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

#### Core-Tickets Service
- [ ] Create ticket endpoint works
- [ ] Tickets have proper state machine (draft → open → assigned → in_progress → completed)
- [ ] Ticket assignment to contractors
- [ ] Ticket history/audit trail (state changes)
- [ ] SLA tracking
- [ ] Filtering and pagination

**Test:**
```bash
# Create a ticket (requires auth token from core-auth)
curl -X POST http://localhost:4200/v1/tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Leaky faucet",
    "description": "Kitchen sink is leaking",
    "propertyId": "uuid-here",
    "category": "plumbing"
  }'
```

#### Core-Matching Service
- [ ] Geospatial queries work (PostGIS)
- [ ] Find contractors within radius
- [ ] Ranking algorithm considers distance, availability, rating
- [ ] Caching layer (Redis) improves performance
- [ ] Rate limiting prevents abuse

**Test:**
```bash
# Find contractors near a location
curl -X POST http://localhost:4400/v1/matching/find \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 5000,
    "skills": ["plumbing"]
  }'
```

#### Database Schema Validation
- [ ] **PostgreSQL Tables**
  ```sql
  -- Run in psql to verify schema
  \dt  -- List all tables

  -- Expected tables:
  -- users, contractors, properties, tickets, ticket_assignments,
  -- ticket_state_history, notifications, payments, evidence, etc.

  -- Check for proper indexes
  \di  -- List indexes

  -- Check for foreign key constraints
  SELECT conname, conrelid::regclass, confrelid::regclass
  FROM pg_constraint
  WHERE contype = 'f';
  ```

- [ ] **PostGIS Spatial Indexes**
  ```sql
  -- Verify GIST indexes on geography columns
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE indexdef LIKE '%GIST%';
  ```

### Frontend Apps Evaluation

#### Mobile Tenant App
- [ ] App loads without errors
- [ ] Navigation works (home → ticket list → create ticket → ticket detail)
- [ ] API integration works (can fetch/create tickets)
- [ ] Camera integration for photo upload
- [ ] Offline queue (creates tickets when back online)
- [ ] Loading states and error messages
- [ ] Responsive design on different screen sizes

**Manual Testing Steps:**
1. Open app on device/emulator
2. Login with test credentials
3. Create a new ticket with photo
4. View ticket list
5. Toggle airplane mode → create ticket → reconnect (offline queue test)

#### Mobile Contractor App
- [ ] Login with contractor credentials
- [ ] View available jobs nearby
- [ ] Accept/reject jobs
- [ ] Update job status
- [ ] Upload completion photos/evidence
- [ ] Real-time location tracking (if implemented)

#### Web Agent Dashboard
- [ ] Dashboard loads with metrics (total tickets, open tickets, etc.)
- [ ] Table showing all tickets with filters
- [ ] Assign tickets to contractors
- [ ] View ticket timeline/history
- [ ] Responsive design (desktop/tablet)

---

## Validating All 9 Engineers' Work

The RentFix platform was built by engineers from 9 elite companies. Here's how to validate each team's contributions:

### 1. **Google Team - Infrastructure & Scalability**
**Focus Areas:** Docker, Kubernetes configs, microservices architecture

**Validation:**
- [ ] Check `docker-compose.prod.yml` - all 12 services defined
- [ ] Verify service healthchecks
- [ ] Test service-to-service communication
- [ ] Check resource limits (CPU/memory)

```bash
# Test Docker Compose setup
docker-compose -f docker-compose.prod.yml config

# Validate all services start successfully
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps
```

### 2. **Microsoft Team - TypeScript & Type Safety**
**Focus Areas:** Type definitions, interfaces, DTOs

**Validation:**
- [ ] Check `/packages/types` for shared types
- [ ] Verify no TypeScript errors: `npm run build --workspaces`
- [ ] Check DTOs have class-validator decorators
- [ ] Examine type coverage

```bash
# Build all services (checks for TypeScript errors)
npm run build --workspaces

# Check TypeScript configuration
cat tsconfig.json
cat services/core-auth/tsconfig.json
```

### 3. **Adobe Team - UI/UX Design System**
**Focus Areas:** UI components, design tokens, theming

**Validation:**
- [ ] Check `/packages/ui` for reusable components
- [ ] Verify consistent styling (colors, typography, spacing)
- [ ] Test dark mode (if implemented)
- [ ] Check accessibility (WCAG compliance)

```bash
# Review UI package
ls packages/ui/src/components/
cat packages/ui/src/theme/colors.ts
```

### 4. **Figma Team - Design Implementation**
**Focus Areas:** Pixel-perfect implementation, responsive design

**Validation:**
- [ ] Compare mobile app screens to design mockups
- [ ] Test on multiple screen sizes (phone, tablet)
- [ ] Verify animations and transitions
- [ ] Check spacing and alignment

**Manual:** Open mobile apps and compare to Figma designs (if available)

### 5. **NVIDIA Team - AI/ML Integration**
**Focus Areas:** AI classification, image processing

**Validation:**
- [ ] Check `/services/worker-ai` for AI inference code
- [ ] Verify OpenAI API integration
- [ ] Test image classification for ticket categorization
- [ ] Check GPU utilization (if available)

```bash
cd services/worker-ai
cat src/index.ts
# Look for OpenAI client initialization and inference logic
```

### 6. **Uber Team - Geospatial Matching**
**Focus Areas:** Contractor matching algorithm, PostGIS queries

**Validation:**
- [ ] Verify PostGIS extension enabled
- [ ] Test contractor proximity search
- [ ] Check ranking algorithm (`/services/core-matching/src/utils/ranking.utils.ts`)
- [ ] Test caching layer for performance

```bash
# Test geospatial query
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix -c "
  SELECT id, name,
         ST_Distance(
           location_point,
           ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography
         ) / 1000 AS distance_km
  FROM contractors
  WHERE ST_DWithin(
    location_point,
    ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography,
    5000
  )
  ORDER BY distance_km ASC
  LIMIT 5;
"
```

### 7. **Anthropic Team - Testing Infrastructure**
**Focus Areas:** Unit tests, integration tests, E2E tests

**Validation:**
- [ ] Check test coverage: `npm run test --workspaces`
- [ ] Verify Jest configuration
- [ ] Check mock strategies
- [ ] Review integration tests

```bash
# Run all tests
npm run test --workspaces

# Check test coverage
cd services/core-auth
npm run test -- --coverage

# Review test files
ls services/core-auth/__tests__/
```

### 8. **OpenAI Team - Prompt Engineering & AI Features**
**Focus Areas:** AI ticket classification, automated responses

**Validation:**
- [ ] Check prompt templates in AI worker
- [ ] Test ticket auto-categorization
- [ ] Verify AI-generated responses (if implemented)
- [ ] Check fallback mechanisms when AI is unavailable

```bash
cd services/worker-ai
cat src/prompts/*.ts  # If prompt templates exist
```

### 9. **Folio Team - State Management & Real-time Features**
**Focus Areas:** Zustand stores, WebSocket connections, offline support

**Validation:**
- [ ] Check Zustand stores in mobile apps
- [ ] Test offline queue functionality
- [ ] Verify optimistic updates
- [ ] Check WebSocket connections (if implemented)

```bash
# Review state management
cat apps/mobile-tenant/src/state/issueStore.ts
cat apps/mobile-tenant/src/state/offlineQueue.ts

# Check for WebSocket client
grep -r "WebSocket\|socket.io" apps/mobile-tenant/src/
```

### Team Collaboration Validation

- [ ] **Consistent Code Style** - All teams followed same ESLint rules
- [ ] **Shared Types** - No duplicate type definitions across services
- [ ] **API Contracts** - DTOs match between frontend and backend
- [ ] **Documentation** - Each team documented their components
- [ ] **Git History** - Check commits for team attribution

```bash
# View git commit history with authors
git log --pretty=format:"%h - %an: %s" --graph

# Check for consistent commit messages
git log --oneline | head -20
```

---

## API Testing Guide

### Using curl

#### 1. Register a New Tenant
```bash
curl -X POST http://localhost:4100/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant1@example.com",
    "password": "SecurePass123!",
    "role": "tenant",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+12025551234"
  }' | jq
```

#### 2. Login and Get Token
```bash
# Login
response=$(curl -X POST http://localhost:4100/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant1@example.com",
    "password": "SecurePass123!"
  }')

# Extract token
TOKEN=$(echo $response | jq -r '.accessToken')
echo "Token: $TOKEN"
```

#### 3. Create a Ticket
```bash
curl -X POST http://localhost:4200/v1/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broken dishwasher",
    "description": "Dishwasher not draining properly",
    "category": "appliance",
    "priority": "medium",
    "propertyId": "00000000-0000-0000-0000-000000000001"
  }' | jq
```

#### 4. Get All Tickets
```bash
curl -X GET http://localhost:4200/v1/tickets \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 5. Find Nearby Contractors
```bash
curl -X POST http://localhost:4400/v1/matching/find \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radiusMeters": 5000,
    "skills": ["plumbing", "appliance"],
    "limit": 10
  }' | jq
```

### Using Postman

1. **Import the RentFix API Collection**
   - Create a new collection: "RentFix API"
   - Add environment variables:
     - `BASE_URL`: http://localhost:4000
     - `AUTH_URL`: http://localhost:4100
     - `TICKETS_URL`: http://localhost:4200
     - `TOKEN`: (will be set dynamically)

2. **Create Requests:**
   - POST {{AUTH_URL}}/auth/register
   - POST {{AUTH_URL}}/auth/login
   - POST {{TICKETS_URL}}/v1/tickets
   - GET {{TICKETS_URL}}/v1/tickets

3. **Set up automatic token extraction:**
   - In login request, add Tests script:
   ```javascript
   pm.test("Status code is 200", function () {
       pm.response.to.have.status(200);
   });

   var jsonData = pm.response.json();
   pm.environment.set("TOKEN", jsonData.accessToken);
   ```

---

## Running Tests

### Unit Tests

```bash
# Run tests for all workspaces
npm run test --workspaces

# Run tests for specific service
cd services/core-auth
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode (for development)
npm test -- --watch
```

### Integration Tests

```bash
# Core-Tickets integration tests
cd services/core-tickets
npm run test:integration

# Core-Matching integration tests (requires PostGIS)
cd services/core-matching
npm run test:integration
```

**Note:** Integration tests require the database to be running.

### E2E Tests

```bash
# E2E tests for core-matching service
cd services/core-matching
npm run test:e2e

# This will:
# 1. Start a test database
# 2. Run migrations
# 3. Execute E2E test suite
# 4. Clean up test data
```

### Mobile App Tests

```bash
cd apps/mobile-tenant
npm test

# Run with coverage
npm test -- --coverage
```

---

## Troubleshooting Common Issues

### Issue 1: "Cannot connect to database"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# If not running, start it
docker-compose -f docker-compose.dev.yml up -d postgres

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres

# Verify connection
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix -c "SELECT 1;"
```

### Issue 2: "Redis connection timeout"

**Symptoms:**
```
Error: connect ETIMEDOUT
Redis connection error
```

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker-compose -f docker-compose.dev.yml up -d redis

# Test Redis connection
docker exec -it rentfix-redis-dev redis-cli ping
```

### Issue 3: "Cannot find module '@rentfix/types'"

**Symptoms:**
```
Error: Cannot find module '@rentfix/types'
```

**Solution:**
```bash
# Rebuild workspace links
npm install

# Build the types package
cd packages/types
npm run build

# Rebuild the service
cd ../../services/core-auth
npm run build
```

### Issue 4: Expo app won't load on phone

**Symptoms:**
- QR code scans but app doesn't load
- "Network error" in Expo Go

**Solution:**
```bash
# Option 1: Use tunnel mode
npx expo start --tunnel

# Option 2: Update API_URL to your local IP
# In apps/mobile-tenant/.env
API_URL=http://192.168.1.100:4000  # Replace with your IP

# Option 3: Clear Expo cache
npx expo start -c
```

### Issue 5: "Port already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**
```bash
# Find process using the port (macOS/Linux)
lsof -ti:4000

# Kill the process
kill -9 $(lsof -ti:4000)

# On Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Issue 6: TypeScript errors in mobile apps

**Symptoms:**
```
error TS2307: Cannot find module 'react' or its corresponding type declarations
```

**Solution:**
```bash
cd apps/mobile-tenant

# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Clear Metro bundler cache
npx expo start -c
```

### Issue 7: PostGIS queries failing

**Symptoms:**
```
ERROR: function st_dwithin does not exist
```

**Solution:**
```bash
# Verify PostGIS extension is enabled
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Check version
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix -c "SELECT PostGIS_version();"
```

---

## Database Inspection Tools

### PostgreSQL GUI Tools

#### pgAdmin
```bash
# If using Docker, you can add pgAdmin to docker-compose.dev.yml:
```

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: rentfix-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@rentfix.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - rentfix-network
```

Visit: http://localhost:5050

#### DBeaver (Standalone)
1. Download from https://dbeaver.io/
2. Create new connection:
   - Database: PostgreSQL
   - Host: localhost
   - Port: 5432
   - Database: rentfix
   - Username: rentfix
   - Password: changeme
3. Click "Test Connection"
4. Browse tables, run queries, view data visually

### Redis GUI Tools

#### RedisInsight
```bash
# Add to docker-compose.dev.yml:
```

```yaml
  redis-insight:
    image: redislabs/redisinsight:latest
    container_name: rentfix-redis-insight
    ports:
      - "8001:8001"
    networks:
      - rentfix-network
```

Visit: http://localhost:8001

### CLI Query Examples

#### PostgreSQL Queries

```bash
# Connect to database
docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix
```

```sql
-- Count users by role
SELECT role, COUNT(*)
FROM users
GROUP BY role;

-- Find tickets by status
SELECT status, COUNT(*)
FROM tickets
GROUP BY status;

-- View recent tickets with property info
SELECT t.id, t.title, t.status, t.created_at, p.address
FROM tickets t
JOIN properties p ON t.property_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Geospatial: Find contractors within 5km of a point
SELECT id, name,
       ST_Distance(
         location_point,
         ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography
       ) / 1000 AS distance_km
FROM contractors
WHERE ST_DWithin(
  location_point,
  ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326)::geography,
  5000
)
ORDER BY distance_km ASC;

-- View ticket state transition history
SELECT t.title, tsh.from_status, tsh.to_status, tsh.changed_at, tsh.changed_by
FROM ticket_state_history tsh
JOIN tickets t ON tsh.ticket_id = t.id
ORDER BY tsh.changed_at DESC
LIMIT 20;
```

#### Redis Queries

```bash
# Connect to Redis
docker exec -it rentfix-redis-dev redis-cli
```

```redis
# View all keys
KEYS *

# Get specific key
GET session:abc123

# View all keys matching pattern
KEYS contractor:cache:*

# Check TTL (time to live)
TTL contractor:cache:uuid-here

# Monitor Redis commands in real-time (useful for debugging)
MONITOR

# View Redis memory usage
INFO memory

# List all keys with their types
KEYS * | FOREACH key TYPE $key
```

---

## Summary: Testing Workflow

1. **Clone & Install** (15 minutes)
   ```bash
   git clone <repo>
   cd Rentfix
   npm install
   ```

2. **Start Databases** (5 minutes)
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

3. **Configure Environment** (5 minutes)
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start Backend Services** (10 minutes)
   ```bash
   # Terminal 1: API Gateway
   cd services/api-gateway && npm run dev

   # Terminal 2: Core-Auth
   cd services/core-auth && npm run dev

   # Terminal 3: Core-Tickets
   cd services/core-tickets && npm run dev

   # Terminal 4: Core-Matching
   cd services/core-matching && npm run dev
   ```

5. **Test API** (5 minutes)
   ```bash
   curl http://localhost:4000/api/health
   # Register user, login, create ticket (see API Testing Guide)
   ```

6. **Start Mobile App** (5 minutes)
   ```bash
   cd apps/mobile-tenant
   npx expo start
   # Scan QR code with Expo Go on your phone
   ```

7. **Inspect Database** (10 minutes)
   ```bash
   # Use pgAdmin or psql to view tables and data
   docker exec -it rentfix-postgres-dev psql -U rentfix -d rentfix
   \dt
   SELECT * FROM users;
   SELECT * FROM tickets;
   ```

8. **Run Tests** (10 minutes)
   ```bash
   npm run test --workspaces
   ```

9. **Evaluate Code** (30-60 minutes)
   - Review each service's code structure
   - Check TypeScript types
   - Verify error handling
   - Test security features
   - Validate geospatial queries

**Total Time:** ~1.5 to 2 hours for complete setup and basic validation

---

## Additional Resources

- **Development Runbook:** `/DEVELOPMENT_RUNBOOK.md` - Basic setup guide
- **PostGIS & Redis Setup:** `/docs/POSTGIS_REDIS_SETUP_GUIDE.md` - Detailed database guide
- **Production Deployment:** `/docs/PRODUCTION_DEPLOYMENT_GUIDE.md` - Production setup
- **Elite Team Report:** `/ELITE_TEAM_ENGINEERING_REPORT.md` - Engineering team insights
- **Package Documentation:** Check README files in `/packages/*`

---

## Support

If you encounter issues not covered in this guide:

1. Check existing documentation in `/docs`
2. Review the `/ELITE_TEAM_ENGINEERING_REPORT.md` for known issues
3. Check container logs: `docker-compose -f docker-compose.dev.yml logs -f [service]`
4. Open an issue on GitHub: https://github.com/MalikOseni/Rentfix/issues

---

**Document Version:** 1.0.0
**Last Updated:** December 12, 2025
**Maintained By:** RentFix Engineering Team
**Contributors:** Google, Microsoft, Adobe, Figma, NVIDIA, Uber, Anthropic, OpenAI, Folio
