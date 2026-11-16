# OneSystemsERP Universal BOQ (`OSERP-PROJ-UBOQ-001`) — Preview Deployment Configuration & Rollback Runbook

**Target Vercel Project:** `jburns2372-sys-projects/one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`)  
**Linked Git Repository:** `jburns2372-sys/OneSystemsErp` (`repoId: 1264605590`, `productionBranch: main`)  
**Target Release Branch:** `release/oserp-proj-uboq-001`  
**Mandatory Policy:** Never run `prisma db push` or `--accept-data-loss` in build scripts; never rewrite `_prisma_migrations` history; never bind Preview to the shared Production database.

---

## 1. Critical Pre-Deployment Control-Plane Findings & Remediations (Verified 2026-11-16)

1. **Project-Level Neon Separation Required (`holy-shape-01357429` Disqualified for UBOQ Preview):**
   - Existing Neon project `holy-shape-01357429` (`neon-camel-bell`, connected via Vercel store `store_rKvM2BF7sg3httYj`) is a **shared multi-application Neon project** that also hosts an unrelated application database and unrelated branches (`br-odd-butterfly-ap7r6x8q` / `onesystemserp-uboq-preview-clean` was halted at `0` public tables and preserved untouched without applying any migrations or pointing Vercel to it).
   - **Vercel Marketplace Restriction:** Organization `org-sweet-fog-42432629` (`Vercel: jburns2372-sys' projects`, `plan: scale`, up to `1,000` projects) has `managed_by = "vercel"`. Non-interactive CLI project creation (`neonctl projects create --org-id org-sweet-fog-42432629`) is blocked by Neon (`ERROR: action restricted; reason:"organization is managed by Vercel"`), and existing dedicated projects in the org report `creation_source = "console"`.
2. **Sibling Vercel Auto-Deploy Hazard (`REMEDIATED — PASS`):** Both sibling Vercel projects linked to `jburns2372-sys/OneSystemsErp` (`one-systems-erp-jphh` [`prj_2me3QVWtlsKkd1AxePemhLRcHEqZ`] and `one-systems-erp-wsts` [`prj_878wLnOFwDspguC80UC9sqL7oBTJ`]) now enforce `commandForIgnoringBuildStep = '[ "$VERCEL_ENV" != "production" ] && exit 0 || exit 1'`, cancelling all Preview builds on sibling projects without interrupting Production.
3. **GitHub Actions Neon Workflow Defect (`REMEDIATED — PASS`):** `.github/workflows/neon-branch.yml` fixed `steps.create_neon_branch.outputs.db_url` and explicitly excludes `release/oserp-proj-uboq-001` so PR pushes cannot create branches inside the shared project.
4. **Dedicated Preview Neon Project Provisioned & `39/39` `MANAGED_PG18_RC_V1` Deployed (`REMEDIATED — PASS`):** Dedicated Neon project `long-recipe-20782583` (`onesystemserp-uboq-preview`, PostgreSQL `18.7`, `aws-us-east-1`, branch `br-quiet-rice-bc1edkvd`, database `oserp_uboq_preview`, `0` unrelated DBs) has all `39/39` `MANAGED_PG18_RC_V1` migrations applied (`schema: prisma/managed-pg18-rc-v1/schema.prisma`, GitHub Actions isolated private run `43877100343`), `oserp_preview_migrate_admin` locked `NOLOGIN NOBYPASSRLS`, 256-bit RLS trust anchors seeded, and Preview-only (`target: ["preview"]`, `type: "sensitive"`) `NOBYPASSRLS` credentials (`oserp_preview_runtime_app`, `oserp_preview_direct_app`, `oserp_preview_payroll_app`) bound on `one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`) with zero Production modifications.
5. **AWS Dependency Removed — Vercel Blob Private Storage Provisioned & Verified (`REMEDIATED — PASS`):** Retired AWS S3 requirements have been replaced by `VercelBlobPrivateVaultProvider` (`@vercel/blob` `access: 'private'`). A dedicated **PRIVATE** Preview Blob store (`store_XuH1XvlM7GKo3wX9` / `onesystemserp-uboq-vault-preview`, `region: iad1`) has been provisioned on `jburns2372-sys-projects/one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`), connected exclusively to `["preview"]` (`productionConnected: false`), with authenticated application-layer `AES-256-GCM` envelope encryption (`UBOQBV1\0`) and 5 Preview-only `sensitive` `UBOQ_VAULT_*` variables bound and verified (`7/7 PASS`). Legacy `aws-infrastructure/main.tf` remains quarantined and unused.

---

## 2. Supported Provisioning Path for Dedicated OneSystemsERP Preview Neon Project

### Step 2.1 — Create Dedicated Neon Project in Vercel / Neon Console (`creation_source: console`)
1. Sign in to **Vercel Dashboard** (`jburns2372-sys-projects` team) → **Storage** → **Create Database** → **Neon Postgres** (under the existing `scale_v3` installation, **without** auto-connecting to Production):
   - **Resource / Project Name:** `onesystemserp-uboq-preview`
   - **Region:** `aws-us-east-1` (co-located with `one-systems-erp` `iad1` functions)
   - **PostgreSQL Version:** `18`
   - **Connect to Project:** Skip initial project env auto-link (or uncheck `Production`) so unrestricted owner credentials are never injected into runtime.
2. Copy the new dedicated Neon Project ID (e.g., `ephemeral-noun-12345678`, distinct from `holy-shape-01357429`) and run the automated provisioner & gate runner from this workspace:
   ```powershell
   $env:OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID = "<new_dedicated_neon_project_id>"
   node scripts/uboq/provision-dedicated-preview-project-db.cjs
   ```
   This script verifies project ownership (`org-sweet-fog-42432629`), verifies **zero unrelated databases/branches** exist via both Neon API and `pg_database`, creates isolated branch `preview-release-uboq-001` and database `oserp_uboq_preview`, provisions the 4 separate `SCRAM-SHA-256` roles, executes Migration `#14`'s read-only preflight, applies Migrations `#1`–`#39` only after preflight clearance, locks down `oserp_preview_migrate_admin`, isolates Vercel Preview variables, and re-runs `verify-preview-target-readiness.cjs`.

### Step 2.2 — Read-Only Preflight Credential (Before Any Migration Apply)
Run as the Neon Preview branch owner (generating a strong 24-byte hex password offline and computing its `SCRAM-SHA-256` verifier locally so plaintext never enters `pg_stat_activity` or logs):

```sql
CREATE ROLE oserp_preview_readonly_preflight
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT
  PASSWORD '<SCRAM-SHA-256-VERIFIER>';

ALTER ROLE oserp_preview_readonly_preflight SET default_transaction_read_only = on;
GRANT CONNECT ON DATABASE "<preview_db_name>" TO oserp_preview_readonly_preflight;
GRANT USAGE ON SCHEMA public TO oserp_preview_readonly_preflight;
-- Grant SELECT on _prisma_migrations only if table already exists on a non-empty branch:
DO $$
BEGIN
  IF to_regclass('public."_prisma_migrations"') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public."_prisma_migrations" TO oserp_preview_readonly_preflight';
  END IF;
END $$;
```

Run the read-only preflight gate from this workspace:

```powershell
# Existing baseline branch inspection (NO --allow-empty):
$env:MIGRATION14_TARGET_DATABASE_URL = "<readonly_preview_connection_url>"
node scripts/uboq/verify-migration14-provenance-gate.cjs --target-read-only

# ONLY for an explicitly approved brand-new empty Preview database:
$env:PREVIEW_EMPTY_BRANCH_APPROVED = "true"
node scripts/uboq/verify-preview-target-readiness.cjs --allow-empty
```

### Step 2.3 — Controlled Migration Apply (`#1`–`#39`) & Runtime Role Binding
Once `verify-migration14-provenance-gate.cjs --target-read-only` returns `eligible: true`:
1. Take a pre-migration Neon restore point / logical `pg_dump -Fc` snapshot (if non-empty baseline).
2. Run `npx prisma migrate deploy` using `DIRECT_URL` (unpooled migration-owner connection, `oserp_migrations_owner` / schema owner).
3. Provision the two `NOBYPASSRLS` runtime logins and seed the two 256-bit (`64`-hex) cryptographic RLS trust anchors (`_uboq_rls_trust_anchor` and `_company_payroll_trust_anchor`):

```sql
BEGIN;
SET LOCAL password_encryption = 'scram-sha-256';

CREATE ROLE oserp_preview_compat_login
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT
  PASSWORD '<SCRAM-SHA-256-COMPAT-VERIFIER>';
GRANT oserp_compat_app TO oserp_preview_compat_login;
GRANT CONNECT ON DATABASE "<preview_db_name>" TO oserp_preview_compat_login;

CREATE ROLE oserp_preview_payroll_login
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT
  PASSWORD '<SCRAM-SHA-256-PAYROLL-VERIFIER>';
GRANT oserp_company_payroll_app TO oserp_preview_payroll_login;
GRANT CONNECT ON DATABASE "<preview_db_name>" TO oserp_preview_payroll_login;

-- Seed 64-hex cryptographic trust anchors (parameterized $1 / $2 from secret manager, never literal SQL):
INSERT INTO public."_uboq_rls_trust_anchor" ("anchorId", "secretHex", "rotatedAt")
VALUES ('PRIMARY', $1, NOW())
ON CONFLICT ("anchorId") DO UPDATE SET "secretHex" = EXCLUDED."secretHex", "rotatedAt" = NOW();

INSERT INTO public."_company_payroll_trust_anchor" (id, "secretHex", "updatedAt")
VALUES ('PRIMARY', $2, NOW())
ON CONFLICT (id) DO UPDATE SET "secretHex" = EXCLUDED."secretHex", "updatedAt" = NOW();
COMMIT;
```

---

## 3. Preview Environment Secret Matrix (Zero Values Stored in Git)

Configure as **`Sensitive` (`Secret`)** scoped explicitly to **`Preview` (`gitBranch = release/oserp-proj-uboq-001`)** on `one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`) and the Preview `apps/aws-backend` service:

| Variable Name | Target Service | Required Role / Format |
| --- | --- | --- |
| `DATABASE_URL` | Vercel Preview + Backend | Pooled TLS (`sslmode=require`) connection using `oserp_preview_compat_login` (`NOBYPASSRLS`) |
| `DIRECT_URL` | Migration Runner Only (or Vercel Preview) | Unpooled TLS connection (`sslmode=require`) to the **same** isolated Preview DB |
| `COMPANY_PAYROLL_DATABASE_URL` | Backend (`apps/aws-backend`) | TLS connection using `oserp_preview_payroll_login` (`oserp_company_payroll_app`, `NOBYPASSRLS`) |
| `UBOQ_RLS_CONTEXT_SECRET` | Vercel Preview + Backend | Exact 64-char lowercase hex (256-bit) matching `_uboq_rls_trust_anchor.secretHex` |
| `COMPANY_PAYROLL_CONTEXT_SECRET` | Backend (`apps/aws-backend`) | Exact 64-char lowercase hex (256-bit) matching `_company_payroll_trust_anchor.secretHex` |
| `INTERNAL_API_SECRET` | Vercel Preview + Backend | High-entropy shared internal service token (distinct from Production) |
| `AUTH_SECRET` | Vercel Preview + Backend | Preview session signing secret |
| `AUTH_TRUST_HOST` | Vercel Preview | `true` |
| `AUTH_URL` / `NEXTAUTH_URL` | Vercel Preview | Canonical Preview HTTPS origin |
| `UBOQ_VAULT_BACKEND` | Vercel Preview + Backend | `vercel_blob_private` (`local_durable` is blocked whenever `NODE_ENV=production`; zero AWS dependencies) |
| `BLOB_READ_WRITE_TOKEN` / `UBOQ_VAULT_BLOB_READ_WRITE_TOKEN` | Vercel Preview + Backend | Preview-only `sensitive` token scoped strictly to private store `store_XuH1XvlM7GKo3wX9` (`onesystemserp-uboq-vault-preview`) |
| `UBOQ_VAULT_BLOB_STORE_ID` | Vercel Preview + Backend | `store_XuH1XvlM7GKo3wX9` (enforces store-ID pin & GCM AAD binding; rejects mismatched store tokens) |
| `UBOQ_VAULT_ENV_NAMESPACE` | Vercel Preview + Backend | `preview` (segregates path namespace `uboq-private-vault/preview/<projectId>/<sha256>.uboqvault` & GCM AAD from Production) |
| `UBOQ_VAULT_ENCRYPTION_KEY` | Vercel Preview + Backend | Exact 64-char lowercase hex (256-bit) master key for HKDF-SHA256 + `AES-256-GCM` envelope encryption (distinct from Production) |

---

## 4. Vercel Blob Private Immutable Vault Security Specification (`VERIFIED — 7/7 PASS`)

- **Dedicated Private Store:** `store_XuH1XvlM7GKo3wX9` (`onesystemserp-uboq-vault-preview`, `region: iad1`) created with `--access private` and connected solely to `--environment preview` on `jburns2372-sys-projects/one-systems-erp` (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`; `productionConnected = false`).
- **Cloud Access Control (`403 Forbidden` Direct Access):** All blobs are written with `access: 'private'`, `addRandomSuffix: false`, `allowOverwrite: false`, and read via `get(..., { access: 'private', useCache: false })`. Unauthenticated HTTP GET requests to both `blob.url` and `blob.downloadUrl` return `403 Forbidden`.
- **Authenticated Application-Layer Envelope Encryption (`AES-256-GCM`):**
  - Payloads are encrypted prior to upload as `UBOQBV1\0 || IV(12B) || TAG(16B) || CIPHERTEXT` using a 256-bit subkey derived via `HKDF-SHA256` from `UBOQ_VAULT_ENCRYPTION_KEY`.
  - GCM Additional Authenticated Data (`AAD`) binds `"UBOQ_BLOB_VAULT_AAD_V1|<storeId>|<envNamespace>|<projectId>|<sha256>"`, failing closed on cross-project, cross-environment, cross-store, wrong-key, or tampered reads.
- **Immutability & Download Gate Preservation:** Content-addressed deduplication verifies full decrypted SHA-256 integrity before reuse; `/api/uboq/documents/[documentId]/download` enforces authenticated session, project RBAC (`DOCUMENT_EXPORT_READ`), `projectId` ownership match, `Cache-Control: private, no-store`, and `X-Robots-Tag: noindex, nofollow`.

---

## 5. Rollback & Emergency Recovery Procedures

1. **Application Rollback (Vercel & Backend — `< 60 seconds`):**
   - Promote the previous Preview deployment or disable the Preview deployment alias in Vercel (`jburns2372-sys-projects/one-systems-erp`). Because `package.json` `build` runs only `prisma generate && next build`, rolling back application builds has zero destructive impact on database state.
2. **Database Rollback in Preview (`trg_uboq_guard_prisma_migration_ledger` Active):**
   - Migrations `#37` and `#38` enforce append-only immutability on `_prisma_migrations` (`DELETE` and post-finish `checksum`/`finished_at` `UPDATE` raise `42501`).
   - **If a migration fails mid-transaction during `prisma migrate deploy`:** PostgreSQL rolls back the DDL transaction atomically; inspect the failed row and reset the isolated Neon Preview branch to its pre-deploy parent/restore timestamp.
   - **If a defect is discovered after `#1`–`#39` complete in Preview:** Either (a) author a reviewed forward-only compensating migration (`#40`), or (b) reset the isolated Neon Preview branch to the pre-deploy restore point (`neon branches restore`). Never mutate or delete rows in `_prisma_migrations`.
3. **Private Vercel Blob Vault Quarantine / Cleanup:**
   - Preview UBOQ objects live exclusively in dedicated private store `store_XuH1XvlM7GKo3wX9` (`onesystemserp-uboq-vault-preview`) under `uboq-private-vault/preview/<projectId>/<sha256>.uboqvault`, completely isolated from Production storage. Orphaned objects from rolled-back test runs can be audited and purged via `reconcileProjectVaultOrphans(prisma, projectId, false)`.
