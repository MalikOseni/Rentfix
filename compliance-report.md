# Security & Compliance Verification Report

## Evidence by Control Area

### OWASP Top 10 (2023)
1. **Broken Access Control** – Tenant context embedded in JWT payload (`tenantId`/`org_id`) for downstream scoping; repository queries filter on `deletedAt IS NULL` to enforce soft deletes.【F:services/core-auth/src/services/token.service.ts†L12-L26】【F:services/core-auth/src/services/auth.service.ts†L60-L115】
2. **Cryptographic Failures** – Argon2id configured with 19,456 KiB memory, time cost 2, parallelism 1; token generation requires configured access/refresh secrets before signing.【F:services/core-auth/src/services/password.service.ts†L6-L18】【F:services/core-auth/src/services/token.service.ts†L10-L44】
3. **Injection** – TypeORM repository `where` clauses avoid string concatenation; DTO validation enforces RFC email and strong password regex before persistence.【F:services/core-auth/src/services/auth.service.ts†L60-L115】【F:services/core-auth/src/dto/register.dto.ts†L1-L34】
4. **Insecure Design** – Rate-limit guard caps login/register/OTP windows; OTP verification enforces expiry and single use; refresh flow revokes and versions tokens for rotation.【F:services/core-auth/src/shared/guards/rate-limit.guard.ts†L1-L46】【F:services/core-auth/src/services/auth.service.ts†L172-L215】【F:services/core-auth/src/services/auth.service.ts†L288-L340】
5. **Security Misconfiguration** – No CORS/Helmet/HTTPS hardening present in `main.ts`; expected to be handled at gateway level (evidence missing in this repository).【F:services/core-auth/src/main.ts†L24-L52】
6. **Vulnerable Components** – Argon2 dependency pinned (`argon2@^0.31.2`) and lockfile recorded for reproducibility.【F:services/core-auth/package.json†L1-L24】【F:package-lock.json†L1-L40】
7. **Authentication Failures** – Uniform `Invalid credentials` errors, failed-attempt counters, and lockout guard integration via rate limits to reduce timing/oracle leakage.【F:services/core-auth/src/services/auth.service.ts†L90-L135】【F:services/core-auth/src/shared/guards/rate-limit.guard.ts†L1-L46】
8. **Software/Data Integrity Failures** – Refresh tokens validated against `tokenVersion` and revoked after use; audit log is append-only with masked details for integrity and privacy.【F:services/core-auth/src/services/auth.service.ts†L296-L340】【F:services/core-auth/src/services/auth.service.ts†L454-L480】
9. **Logging/Monitoring Failures** – `logAudit` persists structured action/user/org/ip/userAgent with masked PII for traceability.【F:services/core-auth/src/services/auth.service.ts†L454-L480】
10. **SSRF** – Module performs no outbound fetches, so SSRF exposure is not applicable.

### SOC 2 Type II Mapping
- **CC6.1–CC6.3 (Logical access, provisioning, revocation)** – RBAC guard checks required roles; signup/invite paths assign roles; soft-delete removes access while retaining history.【F:services/core-auth/src/shared/guards/rbac.guard.ts†L1-L20】【F:services/core-auth/src/services/auth.service.ts†L60-L215】【F:services/core-auth/src/services/auth.service.ts†L344-L366】
- **CC6.4 (Access review)** – No scheduled access-review workflow or admin review tooling present in repo (gap).
- **A1.1–A1.2 (Audit logging/monitoring)** – Audit entity stores timestamped, append-only records with org/user linkage and masked metadata.【F:services/core-auth/src/entities/audit-log.entity.ts†L1-L27】【F:services/core-auth/src/services/auth.service.ts†L454-L480】

### GDPR Readiness
- **Right to Access & Portability** – Auth tokens carry `sub`, `email`, and tenant identifiers to scope `/me` retrieval; issuance uses validated identities.【F:services/core-auth/src/services/token.service.ts†L12-L26】【F:services/core-auth/src/dto/register.dto.ts†L1-L34】
- **Right to Erasure/Restriction** – `deleteUserAccount` soft-deletes users and revokes sessions to block further authentication while preserving audit trail.【F:services/core-auth/src/services/auth.service.ts†L320-L366】
- **Right to Rectification/Minimization** – User entity stores essential contact fields; DTOs whitelist expected attributes only.【F:services/core-auth/src/entities/user.entity.ts†L70-L88】【F:services/core-auth/src/dto/register.dto.ts†L1-L34】
- **Consent/Verification** – OTP verification required to mark email as verified before issuing long-lived tokens.【F:services/core-auth/src/services/auth.service.ts†L172-L215】

### Evidence Highlights
- **Argon2 configuration** – 19,456 KiB memory, time cost 2, parallelism 1 for Argon2id hashing.【F:services/core-auth/src/services/password.service.ts†L6-L18】
- **Rate limiting** – Login limited to 5/15m per IP; registration 3/hour; OTP verify 10/5m with guard enforced per handler key.【F:services/core-auth/src/shared/guards/rate-limit.guard.ts†L1-L46】
- **Soft delete enforcement** – All user lookups filter on `deletedAt: IsNull()`; account deletion sets `deletedAt` and revokes sessions.【F:services/core-auth/src/services/auth.service.ts†L60-L135】【F:services/core-auth/src/services/auth.service.ts†L320-L366】
- **Org isolation** – JWT payload embeds `tenantId/org_id`; invites and refresh issuance persist organization context for scoping.【F:services/core-auth/src/services/token.service.ts†L12-L26】【F:services/core-auth/src/services/auth.service.ts†L240-L287】
- **Audit logging** – `logAudit` masks email/phone values and records action, user, organization, IP, and user agent.【F:services/core-auth/src/services/auth.service.ts†L454-L480】
- **JWT payload structure** – `sub`, `email`, `role`, `tenantId/org_id`, and `token_version` included for authorization and rotation controls.【F:services/core-auth/src/services/token.service.ts†L12-L26】
- **Password validation** – Registration enforces 14+ characters with upper, lower, numeric, and special characters via regex constraints.【F:services/core-auth/src/dto/register.dto.ts†L1-L34】

## Verdict Checklist
1. **OWASP Top 10 (2023)** – 9/10 evidenced; Security Misconfiguration (CORS/Helmet/HTTPS) not configured in `core-auth` (gateway coverage required) → **NO**.
2. **GDPR Compliance** – Access, erasure, rectification, minimization, and consent handled through validated signup/OTP and soft-delete flows → **YES**.
3. **SOC 2 Type II** – CC6.1–CC6.3 and A1.1–A1.2 evidenced; CC6.4 (periodic access review) not implemented → **NO**.
4. **Code Evidence Provided** – Argon2 config, rate limits, soft delete, tenant isolation, audit logging, JWT payload, and password rules shown above → **YES**.
5. **Security Checklist** – Hardcoded secrets avoided; parameterized queries used; rate limiting and soft-delete enforced. Gaps: console-based logging in logger/main startup and unused `bcryptjs` dependency remain → **NO**.

**VERDICT:** One or more sections unresolved (Security Misconfiguration, SOC2 CC6.4, logging/bcrypt cleanup). Provide additional hardening evidence or mitigations before proceeding to Phase 6.
