# Phase 9 project creation blocker

Issue #4; parent `08d2a43e631ee3d2ee7cd08d00b8e600e35f110c`; worktree `project-intake-p9` only.

## Fix

`createProjectProfile` retains operational-session verification, the existing database create-permission lookup and form validation. It generates a new project UUID, binds the existing signed RLS context inside its Prisma transaction, and invokes `public.phase9_create_project_profile` with parameterized profile fields.

The new forward migration introduces one bounded SECURITY DEFINER command using the **existing** trusted NOLOGIN `oserp_migrations_owner`. It verifies compat-login membership (rejecting legacy membership), the existing signed proof and exact project binding, and the current database actor's active/unlocked/password/session state. It checks the active database role's `PROJECT_MANAGEMENT.canCreate` permission. Actor and permission rows are locked until commit to serialize revocation with creation. PostgreSQL requires UPDATE privilege for these row locks; only ID-column privileges are granted to the existing command owner, never runtime roles.

The command inserts a new zero-value PLANNING Project and one active FULL assignment to the authenticated creator, deriving both user ID and project role from database-verified identity. It accepts no assignment target, role, access level, financial amount or existing-project mutation. Plain INSERT rejects existing project IDs and replays; an assignment error rolls back the project. No BOQ, approval, tax-profile selection or financial baseline is created.

Existing table policies, FORCE RLS, runtime table privileges and roles are unchanged. The command uses the established owner-mediated write pattern; it does not introduce a new BYPASSRLS role or enable runtime RLS bypass. The migration refuses a missing/incompatible trusted owner or owner membership inherited by the runtime application role. Trusted deployment ownership and actual login memberships still require independent target verification before applying it. This does not repair or depend on the paused Security PR #3 ownership bootstrap.

## Focused evidence

- `node scripts/uboq/phase9-bootstrap-fixture.cjs`: **13/13 PASS**, actual PostgreSQL 18.4 on loopback, newly initialized disposable cluster, stopped afterward. The harness instantiates six real-schema creation/permission tables, their applicable unique indexes/FKs, the accepted signed verifier/actor verifier/tenant predicate and Project/PUA policies. It applies only the new migration. A fail-closed legacy-only predicate stub avoids loading unrelated BOQ tables; this is not a full migration-chain rehearsal or legacy-workflow acceptance.
- The actual action executes with real Prisma and real PostgreSQL; only its authenticated-session provider is supplied by the fixture. Checks cover the original blocker, unchanged runtime ACL/policy catalogs, invalid/expired/forged/unbound proof, wrong login, invalid account/session, revoked permission/inactive role, independent SQL input validation, successful creator bootstrap, peer isolation, existing-project rejection, assignment-failure rollback and direct-write/owner-assumption denial.
- `node --test --test-name-pattern '^project' scripts/uboq/phase9-acceptance.test.cjs`: **7/7 PASS**. Only the affected project-action fixtures were updated. They verify context/command binding, failure propagation, session/RBAC rejection and form validation; SQL semantics are established by the integration fixture.
- Focused ESLint on `src/app/actions/project-intake.ts`, fixture JavaScript syntax check and `git diff --check`: PASS.

The first sandbox initialization failed before tests because Windows could not create its restricted token. The authorized local retry exposed inherited launcher output handles, then missing synthetic Module data, then the command owner's row-lock privilege requirement. Those were corrected; the final successful result is frozen in the receipt. No remote database was used.

## Preserved evidence and limits

The historical **38/38 PASS** TAP and its receipt remain unchanged. The seven creation tests now have focused replacement evidence; the other 31 test bodies and their application dependencies remain unchanged and reuse their recorded PASS. The thirteen accepted baseline source digests still match. Historical RLS/RBAC evidence retains the environment/source limits in the accepted baseline ledger. No broad suite, full build or unrelated test was rerun; earlier build/type evidence remains historical and is not an exact-new-commit claim.

`phase9-project-bootstrap-receipt.json` records the tested source digests, focused results and preserved evidence identities. Existing uncommitted `.gitignore` changes were not included. Security PR #3, Production, accepted RBAC data and unrelated modules were not modified. No push, remote comment, merge, migration against Preview, or deployment was performed.

## Remaining Preview acceptance

Next: independently review this delta, then pin an authorized disposable Preview to the new commit and verify its database/login identity, trusted function ownership/ACLs, runtime memberships and signing-secret/trust-anchor match before applying the reviewed migration. Capture exact-SHA browser acceptance for create-without-BOQ, creator assignment and workspace access, failed-creation rollback, unauthorized-role/peer denial and unchanged register/upload/download/draft-staging behavior. Existing private-blob and Owner acceptance gates remain open. Production and Security PR #3 remain untouched; no merge or deploy is authorized by this batch.
