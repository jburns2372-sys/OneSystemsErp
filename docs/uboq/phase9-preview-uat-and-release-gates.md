# Phase 9 — Preview UAT and Release Gates

**Project:** `OSERP-PROJ-UBOQ-001` — OneSystemsERP Universal Project Intake.
**Security posture:** No Production writes, migration replay, role ownership changes or review bypass from this checklist.
**Phase 9 source baseline (before this PR):** `65fdeb77ee129649af063fcd1c117aa3aca7bb05` on `feat/oserp-unified-project-intake-p9`.
**Historical local evidence:** real disposable PostgreSQL project-bootstrap 13/13 PASS and focused action tests 7/7 PASS. This is **not** live Preview acceptance.

## Gate 0 — Non-database work (can complete immediately)

- [x] Security ZIP/ExcelJS P1 remediation and independent Codex review accepted on former PR #5; merged to Phase 9 development, SHA `65fdeb77ee129649af063fcd1c117aa3aca7bb05`.
- [x] Exact post-merge GitHub Actions security suite and full-project TypeScript succeeded (5/5 focused scanner; 44/44 credential-free acceptance fixture).
- [x] OneSystemsERP Vercel project access and expected development-branch Preview deployment identified: project `prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`, branch `feat/oserp-unified-project-intake-p9`, SHA `65fdeb77ee129649af063fcd1c117aa3aca7bb05`.
- [x] Owner browser inspection confirms the protected Preview dashboard and the Create Project dialog render; **no project was submitted**.
- [x] GitHub code-review lifecycle adjusted to skip automatic Neon child-branch provisioning/deletion when PR base is the Phase 9 development or UBOQ release branch.
- [ ] Review and merge the project-list role-simulator boundary correction after exact-head CI and independent reviewer verdict. A simulated role must never broaden actual User.role-based project-list scope.
- [ ] Confirm the correct Vercel Production branch and preview deployment protection remain unchanged using Vercel control-plane evidence.
- [ ] Confirm Preview-only environment variable **names, scope and branch override metadata**, without retrieving or publishing secrets. Configuration presence is not validation of runtime values.

## Gate 1 — Authorized disposable Preview migration (Neon support-dependent; HOLD)

- [ ] Neon ticket **#01077965**: obtain supported one-time executor authorized for project `long-recipe-20782583`, disposable branch `br-restless-dust-bc1a91f4`, database `oserp_uboq_preview`. Never assume provider role `cloud_admin` or self-grant protected memberships.
- [ ] Before execution, confirm the branch, database and exact migration SHA. Take an appropriate restore point/backup and verify ownership/privilege preflight.
- [ ] Apply `20261118090000_phase9_project_creator_bootstrap` through an authorized, reviewed migration process, preserving Prisma migration history (no manual edits or fake successful ledger entries).
- [ ] Inspect function `public.phase9_create_project_profile(text,text,text,text,text,text,text)` and its owner (`oserp_migrations_owner`), EXECUTE ACL, signed creator context, unchanged FORCE RLS and table owners.
- [ ] Confirm temporary executor membership is revoked and ordinary runtime roles cannot write directly to `ProjectUserAssignment`.
- [ ] Record the real migration ledger state, checksum, read-only catalog outputs and rollback plan. Never count the existing 39 migrations as proof Phase 9 is installed.

## Gate 2 — Preview identity, authorization and project-creation UAT (after Gate 1)

- [ ] Confirm Vercel deployment ID / Git SHA / target branch, **actual** Preview database identity (project/branch/database/login), isolated Blob store namespace and trusted signing anchor; don't expose URLs containing passwords or raw anchors.
- [ ] With an actual database-authorized `PROJECT_MANAGER` actor and an appropriate `SUPER_ADMIN` actor, test the `PROJECT_MANAGEMENT.canCreate` permission. The dashboard role simulator must not grant privileges.
- [ ] Submit a uniquely named **disposable** project on isolated Preview. Confirm status `PLANNING`, contract amount `0`, `uboqGovernanceEnabled=false`, exactly one active FULL creator assignment, and no awarded BOQ/financial baseline created.
- [ ] Confirm that the creator can open the new Documents & Intake workspace while an unassigned peer cannot read it. Test PROJECT_DIRECTOR/FINANCE_OFFICER create-denial according to current DB matrix.
- [ ] Confirm wrong-user, forged/expired/wrong-project RLS proofs, inactive/locked/stale user sessions, and permission revocation block project creation.
- [ ] Confirm duplicate project ID/replay does not attach another user, and assignment failure rolls back project creation without orphan rows.
- [ ] Register categorized supporting documents and upload/download via the private Preview Blob vault; verify SHA-256 and authenticated readback; reject cross-project reads, forged URI and oversized/MIME-mismatched files.
- [ ] Upload an awarded BOQ requiring explicit sector-specific tax-profile confirmation; verify staging produces **DRAFT** only and does not silently approve or mutate the financial baseline.
- [ ] Verify duplicate sequential/concurrent intake preserves the original immutable object and does not stage a duplicate financial snapshot.
- [ ] Record actual response codes, sanitized logs, actor roles, test IDs and whether rollback/clean-up succeeded. No UAT checkbox is PASS based on merely viewing a form.

## Gate 3 — Broader baseline, backup and recovery (after Gate 1)

- [ ] Execute UAT-00 through UAT-05 in `docs/uboq/preview-uat-checklist.md` as applicable, and record any scope revisions rather than silently carrying forward historical PASS.
- [ ] Produce and verify a new pre-Production `pg_dump -Fc` and **real** `pg_restore` into a separate disposable database; verify protected roles, policy behavior, canonical BOQ, row counts and private-vault recovery.
- [ ] Verify no Preview artifacts or synthetic data exist in Production. Confirm safe rollback/fallback plan and whether data restoration requires an independently authorized operator.
- [ ] Obtain documented functional acceptance by Project Manager, Finance Director and Project Owner. Zero unresolved critical/high findings.

## Gate 4 — Production deployment (separate authorization and gates)

- [ ] Review current Phase 9 PR #2 exact SHA, all independent security/CI approvals and branch integrity rules; preserve separate Phase 8 security PR #3.
- [ ] Verify Production project, branch, database, secrets scope, backup recovery point and rollback procedure. Never point Preview at Production.
- [ ] Run the separately authorized Production migration and guarded deploy only when all prior gates PASS. No `prisma db push`, `--accept-data-loss`, `migrate reset`, or `_prisma_migrations` rewrites.
- [ ] Inspect exact-sha Production deployment, functional smoke and denial tests, post-release logs and rollback readiness, then record Owner ACCEPTED/FROZEN.

**Current disposition:** Gates 1–4 remain HOLD. The new offline code-review hardening and its CI evidence may be accepted separately; they do not authorize Preview writes or Production release.
