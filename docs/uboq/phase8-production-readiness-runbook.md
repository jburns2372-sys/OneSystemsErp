# OneSystemsERP Universal BOQ (`OSERP-PROJ-UBOQ-001`) — Phase 8 Production Readiness & Cutover Runbook

> **GOVERNANCE STATUS:** **PREPARED ONLY — PRODUCTION CUTOVER NOT AUTHORIZED YET.**  
> Do **not** connect to Production, run Production migrations, modify Production Vercel environment variables, merge `release/oserp-proj-uboq-001` into `main`, or promote any deployment until Phase 7 Preview UAT sign-off is accepted and explicit Owner Phase 8 authorization is issued.

---

## 1. Pre-Cutover Mandatory Prerequisites

1. **Phase 7 Preview UAT Sign-Off (`PASS`):**
   - Consolidated `artifacts/uboq/preview-uat/phase7-preview-uat-receipt.json` shows `0 CRITICAL / 0 HIGH` open findings across `UAT-00` through `UAT-05`.
   - Written sign-off recorded by Project Manager, Finance Director, and Project Owner.
2. **Read-Only Production Ledger & Checksum Preflight (`ZERO WRITES`):**
   - Provision a strictly read-only credential (`oserp_prod_preflight_ro`: `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT`, `default_transaction_read_only = on`, `SELECT` on `public."_prisma_migrations"` only) on the Production database.
   - Run `verify-migration14-provenance-gate.cjs --target-read-only` and `verify-managed-pg18-rc-v1-gate.cjs --target-read-only`:
     - **Important Line-Ending Check:** Confirm whether Production's applied `#1`–`#8` rows in `_prisma_migrations` carry LF (`origin/main` raw Git blob SHA-256) or CRLF hashes. If Production's historical `#1`–`#8` rows carry LF hashes, **never rewrite `_prisma_migrations`**—stage a separately reviewed Production release-candidate manifest matching the exact applied historical `#1`–`#8` byte hashes while keeping `#14` (`a4accf39...`), managed PG18 `#15` (`f3398e99...`), and `#16`–`#39` unchanged.
3. **Full Backup & Isolated Restore Drill (`Mandatory Before Any Production DDL`):**
   - Record the exact Neon Production branch Point-in-Time Restore (`PITR`) timestamp immediately prior to cutover.
   - Capture a full logical backup (`pg_dump -Fc --no-owner --no-acl`) and verify `pg_restore` into an isolated disposable PostgreSQL 18 database (`0` restore errors, verified row counts on `User`, `Project`, `BOQItem`, `PurchaseOrder`, `PayrollPeriod`) before executing any Production DDL.

---

## 2. Production Infrastructure & Secret Separation (`Zero Preview Overlap`)

### 2.1 Dedicated Production Private Vercel Blob Vault (`Zero AWS Dependency`)
- Create a **separate** PRIVATE Vercel Blob store exclusively for Production (never share Preview store `store_XuH1XvlM7GKo3wX9`):
  - **Store Name:** `onesystemserp-uboq-vault-production`
  - **Access Mode:** `private` (`--access private`, direct URLs return `403 Forbidden`)
  - **Connected Environment:** `["production"]` ONLY on `jburns2372-sys-projects/one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`)
- Bind Production-only (`target: ["production"]`, `type: "sensitive"`) vault variables with **fresh, Production-unique cryptographic keys**:
  - `UBOQ_VAULT_BACKEND=vercel_blob_private`
  - `UBOQ_VAULT_ENV_NAMESPACE=production` (isolates object prefix `uboq-private-vault/production/<projectId>/<sha256>.uboqvault` and AES-256-GCM AAD from Preview)
  - `UBOQ_VAULT_BLOB_STORE_ID=<prod_store_id>`
  - `BLOB_READ_WRITE_TOKEN` & `UBOQ_VAULT_BLOB_READ_WRITE_TOKEN` (Production private store token)
  - `UBOQ_VAULT_ENCRYPTION_KEY=<fresh 64-char lowercase hex 256-bit key>`

### 2.2 Least-Privilege Production PostgreSQL Roles & 256-Bit RLS Trust Anchors
- Provision separate `SCRAM-SHA-256` Production operational logins (distinct from all Preview credentials):
  - `oserp_prod_runtime_app` → `GRANT oserp_compat_app ... WITH INHERIT TRUE, SET TRUE, ADMIN FALSE` (`NOSUPERUSER NOBYPASSRLS`, pooled `DATABASE_URL`)
  - `oserp_prod_direct_app` → `GRANT oserp_compat_app ... WITH INHERIT TRUE, SET TRUE, ADMIN FALSE` + `SELECT` on `_prisma_migrations` (`NOSUPERUSER NOBYPASSRLS CONNECTION LIMIT 10`, unpooled `DIRECT_URL`)
  - `oserp_prod_payroll_app` → `GRANT oserp_company_payroll_app ... WITH INHERIT TRUE, SET TRUE, ADMIN FALSE` (`NOSUPERUSER NOBYPASSRLS`, pooled `COMPANY_PAYROLL_DATABASE_URL`)
  - `oserp_prod_migrate_admin` → used solely during the controlled migration window, then immediately locked:
    `ALTER ROLE oserp_prod_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0 PASSWORD NULL;`
- Generate fresh Production-only 256-bit (`64`-hex) secrets for:
  - `UBOQ_RLS_CONTEXT_SECRET` ↔ `public."_uboq_rls_trust_anchor"` (`anchorId = 'PRIMARY'`)
  - `COMPANY_PAYROLL_CONTEXT_SECRET` ↔ `public._company_payroll_trust_anchor` (`id = true`)
  - `INTERNAL_API_SECRET` (fresh 256-bit Production internal service secret)

---

## 3. Controlled Production Cutover Sequence (When Authorized)

1. **Maintenance Window & Pre-Cutover Snapshot:**
   - Announce brief maintenance window, verify `0` in-flight write transactions in `pg_stat_activity`, record Production Neon PITR timestamp, and complete the verified `pg_dump -Fc` backup.
2. **Isolated Cloud-Runner Forward Migration (`prisma migrate deploy`):**
   - Execute `npx prisma@6.19.3 migrate deploy` from an isolated `us-east` cloud runner over direct TLS (`sslmode=require`) using `oserp_prod_migrate_admin`.
   - Never run `prisma db push` or `--accept-data-loss`; `package.json` `scripts.build` remains strictly `"prisma generate && next build"`.
3. **Immediate Role Lockdown & Post-Migration Audit:**
   - Seed `_uboq_rls_trust_anchor` and `_company_payroll_trust_anchor`, grant runtime role memberships (`ADMIN FALSE`), revoke `CREATE ON SCHEMA public FROM PUBLIC`, lock `oserp_prod_migrate_admin` (`NOLOGIN`), and scrub temporary CI migration secrets.
   - Verify `39/39` active finished rows (`0` unfinished/invalid), `uboq_verify_prisma_migration_ledger_state()`, `uboq_inspect_xid_rollover_health().healthy === true`, `252` base tables, and `325` RLS policies.
4. **Bind Production Vercel Secrets & Controlled Release Merge:**
   - Bind Production `DATABASE_URL`, `DIRECT_URL`, `COMPANY_PAYROLL_DATABASE_URL`, RLS secrets, and Production Private Blob Vault variables on `prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi` (`target: ["production"]`, `type: "sensitive"`).
   - Merge the accepted, UAT-verified commit from `release/oserp-proj-uboq-001` into `main` via reviewed fast-forward/merge commit and tag `v1.0.0-uboq`.
5. **Post-Cutover Smoke & Security Verification:**
   - Verify Production HTTPS health, private Blob Vault `403` direct-URL denial + authenticated `AES-256-GCM` round-trip, `X-OSERP-Statutory-Certification: NONE_INTERNAL_ERP_ONLY`, statutory `409` blocks, and executive vs. viewer redaction.

---

## 4. Emergency Production Rollback Plan

1. **Application Tier (`< 60 seconds`):**
   - Instant rollback via Vercel Dashboard / API to the prior `READY` Production deployment on `one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`). Because `npm run build` executes only `prisma generate && next build`, rolling back application code never mutates database state.
2. **Database Tier (Only If Cutover Fails Prior to Live Post-Cutover Writes):**
   - Restore the Production Neon branch to the recorded pre-cutover PITR timestamp (preserving the interrupted branch under a quarantine name for forensic review). Never manually delete or update rows in `_prisma_migrations` (`trg_uboq_guard_prisma_migration_ledger` enforces append-only immutability).
   - If post-cutover Production user transactions have already occurred, apply a reviewed forward-only compensating migration (`#40`) rather than reverting user data.
