# Rentfix Monorepo

Production-ready workspace combining the web agent app (Next.js), mobile apps (React Native/Expo), core NestJS services, worker pools, and shared packages.

## Folder structure
```
apps/
  web-agent/            # Next.js agent dashboard
  mobile-tenant/        # React Native (Expo) tenant app
  mobile-contractor/    # React Native (Expo) contractor app
services/
  api-gateway/          # Edge routing, auth, rate limiting, service discovery
  core-auth/            # Identity, sessions, MFA, RBAC
  core-properties/      # Properties, units, leases
  core-tickets/         # Ticket lifecycle + SLA state
  core-matching/        # Contractor recommendation + assignments
  core-notifications/   # Email/SMS/push delivery + templates
  core-evidence/        # Evidence metadata, exports, storage references
  core-payments/        # Invoices, payouts, reimbursements
  core-analytics/       # Aggregations, KPI endpoints, warehouse fan-out
  worker-ai/            # AI inference jobs and prompt orchestration
  worker-media/         # Media resizing and metadata extraction
  worker-reporting/     # Long-running report generation
packages/
  config/               # Shared configuration module for Nest services
  types/                # Cross-service TypeScript types
  ui/                   # Reusable UI primitives
  utils/                # Small utility helpers
  eslint-config/        # Shared linting rules
```

## Environment templates
Each workspace ships with an `.env.example` indicating required variables. Copy to `.env` and adjust per environment. A root `.env.example` captures shared defaults (DB, Redis, S3, JWT).

## TypeScript configuration
`tsconfig.base.json` defines shared compiler settings and path aliases (`@rentfix/types`, `@rentfix/ui`, `@rentfix/config`, `@rentfix/utils`). Each workspace extends it with its own `tsconfig.json`.

## Getting started
1. Install dependencies per workspace (`npm install` within the target package) or configure a workspace-aware package manager.
2. Create `.env` files from the provided templates.
3. Run services locally (e.g., `npm run dev` inside `services/core-tickets`) and point clients to the API Gateway (`http://localhost:4000`).
