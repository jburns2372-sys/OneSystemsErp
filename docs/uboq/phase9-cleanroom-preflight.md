# OneSystemsERP Phase 9 — cleanroom preflight and controlled migration plan

**Purpose:** establish a working PostgreSQL 18 UAT environment for the atomic project/creator bootstrap without relying on Neon ticket **#01077965** for privileges in the existing Preview branch.

**This document and \`scripts/uboq/phase9-cleanroom-inventory.sql\` are read-only preparation.** They do not install the migration, change RLS, create cloud projects, edit Vercel secrets or release to Production. Use GitHub Issue #9 for the current owner-approved scope and evidence.

## Source identity — verified on the disposable Preview database

- Neon project: \`long-recipe-20782583\`; branch: \`br-restless-dust-bc1a91f4\`; DB: \`oserp_uboq_preview\`. **Never substitute Neon default/main branch or another project.**
- PostgreSQL version: 18; 39 completed Prisma migrations; Phase 9 \`20261118090000_phase9_project_creator_bootstrap\` absent; \`phase9_create_project_profile\` absent.
- Baseline **252** public tables, **88** FORCE RLS tables, **325** public RLS policies, **110** public SECURITY DEFINER functions. Snapshot counts are informational drift checks, not proof of equivalence.
- Current \`neondb_owner\` is LOGIN/CREATEROLE/CREATEDB/BYPASSRLS but **cannot SET either existing protected owner role**. \`oserp_preview_migrate_admin\` is NOLOGIN/NOBYPASSRLS and owns Project/ProjectUserAssignment. \`oserp_migrations_owner\` is NOLOGIN/**BYPASSRLS** and owns signed RLS verification functions. **The approved Phase 9 SQL intentionally requires that attribute** on this trusted owner; do not replace it with NOBYPASSRLS.
- Existing disposable Preview contains one user and zero projects, **not an export entitlement**. Do not copy identities, passwords, authentication hashes, app secrets, signing keys or private document vault content into another environment.

## Stage 0 — isolate the runner and perform read-only inventory

1. Use **one separate Git worktree**, pinned to the approved development SHA. Do not mutate another Antigravity agent's worktree or a running server.
2. Check that \`psql\`, \`pg_dump\` and the target PostgreSQL binaries are version 18, and that Docker or the local PostgreSQL service is available. Avoid upgrading a shared PostgreSQL server.
3. Connect **only** to the named disposable Preview source with secure environment-based credentials, not credentials embedded in command arguments or scripts. Do not print the connection string.
4. Run \`psql -X -v ON_ERROR_STOP=1 -f scripts/uboq/phase9-cleanroom-inventory.sql\` and save **sanitized catalog output** to local scratch. Never commit output showing secrets, hostnames, user IDs or privileged tokens.
5. Compare function owners, table owners, role attributes, FORCE RLS flags and extensions against the baseline above. If any role or function is missing or additional live data exists, stop and report drift before making a copy.
6. Use \`pg_dump\` against **the same explicitly selected Preview database** for a private **schema-only** snapshot, e.g. with \`--schema-only --format=custom --no-owner --no-acl\`. Keep the archive local and access-controlled. Stored function definitions and extensions may contain security-sensitive code; **never commit or attach raw dumps**. Export only sanitized manifest names, counts and approved checksums to GitHub.

## Stage 1 — local-only PostgreSQL 18 cleanroom (no Neon billing)

- Initialize a **new disposable local** database isolated from existing development databases, with independent local-only credentials. Restore the required extensions and schema in dependency order. Using a schema-only dump without \`--owner\` **does not preserve table ownership, runtime roles, grants or a real Prisma migration history**.
- Explicitly reconstruct separate NOLOGIN table owner and NOLOGIN BYPASSRLS command owner, plus distinct app runtime login roles which are **NOBYPASSRLS** and cannot SET either owner. Establish any temporary \`SET ROLE\` authority through legitimately granted, audited memberships and revoke it at the end; do not inherit owner privileges into runtime.
- Verify ownership, FORCE RLS and signed RLS trust-anchor function provenance before attempting the Phase 9 SQL. Create a **new cleanroom-only** signed-context trust anchor and synthetic test users. Do not copy existing AUTH/UBOQ signing secrets.
- Execute/restore the **39 historical migrations** in their documented order when feasible. If restoring an already migrated schema instead, reconcile every migration's actual catalog effects and ledger state before using Prisma migration tools. **Never forge 39 ledger entries or mark Phase 9 applied without executing it.**
- Apply the reviewed unmodified \`prisma/migrations/20261118090000_phase9_project_creator_bootstrap/migration.sql\` under authorized migration authority. On error, preserve failure evidence and stop; do not disable FORCE RLS, edit the migration to use a LOGIN owner or grant application runtime table INSERT privileges as a shortcut.
- Assert that the function is SECURITY DEFINER under the correct NOLOGIN/BYPASSRLS owner; EXECUTE access is only to the intended compat app role, PUBLIC/legacy execution denied, signed actor proof mandatory, creator assignment atomic and bounded, and negative spoof/role/rollback cases fail as specified.
- Save a **sanitized** test report: exact source SHA, PostgreSQL major version, tests PASS/FAIL, role invariants, object counts, pre-/post- migration receipts, backup/rollback result, and outstanding blockers.

## Stage 2 — new isolated Neon cloud Preview, only after owner approval

- Provision a **new Neon project**, PostgreSQL 18, same chosen region, distinct Preview-only namespace and isolated application secrets; this can incur usage charges. **Do not** clone the old branch: that duplicates its protected ownership graph.
- Postgres 18 \`CREATE ROLE\` allows a role that already possesses BYPASSRLS plus CREATEROLE to create another role with BYPASSRLS; confirm the new Neon project administrator's actual effective privileges and its newly created role's attributes. Do not assume the user has authority over **existing** provider-created roles. Reference: https://www.postgresql.org/docs/18/sql-createrole.html.
- Reproduce and test the local security invariants independently in the cleanroom database. Do not use the default LOGIN/BYPASSRLS administrator as long-term application runtime or function owner.
- Use a **dedicated feature Preview deployment/branch** for new DB credentials and app-only trust keys. Do not change Production, global Preview variables, existing Preview aliases, or the old Preview source database without a separate accepted cutover plan.
- Only mark **cloud UAT PASS** after authenticated real-browser project creation, active creator assignment, negative PBAC and RLS tests, document intake and BOQ DRAFT generation, evidence storage verification, and rollback/recovery evidence on the actual new cloud DB. A Vercel READY build is not database UAT.

## Production hold / explicit STOP

- Never change old Neon protected ownership, default/main branch, FORCE RLS or grants to bypass provider-level restrictions; never manually falsify Prisma migration ledger.
- Do not run recovery writes, release PR #2, migrate Production or copy live users/secrets based only on local cleanroom PASS.
- Any new cloud service/project that may incur charges, Preview env cutover, or Production action requires the owner's separate scope confirmation.
- Until the cleanroom is independently accepted, Neon ticket **#01077965** remains open as a fallback for installing the unchanged approved migration on the existing Preview target.

## Exit criteria

\`DONE\` = read-only source inventory, exact migration tested on isolated PostgreSQL 18, required 39 migration/schema reconciliation, positive/negative PBAC + signed proof + RLS tests, backup/recovery and audit evidence.

\`NOT DONE\` = no actual local PostgreSQL output, no verified migration/owner evidence, Preview cloud not provisioned/tested, or Production not separately accepted. Clearly report \`DONE | TESTS | BLOCKED | NEXT | SHA\` instead of implying completion.
