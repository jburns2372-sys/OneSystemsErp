# OneSystemsERP — 17-module functional acceptance and operational readiness register

**Status:** DRAFT evidence reconciliation, **not** accepted Production sign-off  
**Version / date:** 1.0 / 20 November 2026  
**Pinned Phase 9 code:** `1755b18a287f91238f64c97560db212a3aedf36c`  
**Scope:** the 17 sidebar modules visible to Owner; other role-dependent application functions remain under their approved existing plans.

## Immutable governance: no deviation and no repeat work

This is an **additive acceptance index** alongside the existing OneSystemsERP plan and OSERP-PROJ-UBOQ-001 Universal Master Plan v2.2. It **does not** change scope, amend accepted code, override original release gates, restore data, request new migrations, or reopen ACCEPTED/CLOSED/FROZEN modules.

- Preserve original acceptance source SHA, environment, evidence digest, scope and owner decision. Historical tests remain **REUSED PASS** only if relevant code/dependencies/environment are unchanged or their accepted scope still applies.
- `ROUTE_PRESENT` is not a claim of function-level success, security acceptance or Production readiness. The 17 route page files were verified at the pinned SHA.
- If an evidence link is missing, record `EVIDENCE_TO_LINK`, **not** FAIL and **not** blanket PASS. Locate original acceptance receipts before considering any repeated tests.
- Run **only** missing or directly affected test cases for a new integration, a genuinely changed dependency, an unsupported accepted environment or a reproduced defect. Every proposed retest must state what changed.
- Production release identity, secure authentication, safe recovery, staged deployment and owner approval remain separate gates. Zero future user support requests cannot be guaranteed; aim for no **known release-blocking user-facing defects** with understandable errors and operational support.
- Do not infer whole-ERP CLOSED/FROZEN from Universal BOQ Phase 9 acceptance.

## A. Sidebar-to-source-to-acceptance matrix

**Route/source verification:** every listed path has a corresponding `src/app/**/page.tsx` at the pinned SHA. The role/capability key is from `src/components/layout/Sidebar.tsx`. A sidebar key is not itself proof of server-side authorization.

| ID | Sidebar module | Route | Sidebar permission | Source entry |
|---|---|---|---|---|
| 01 | Dashboard | `/` | `DASHBOARD` | VERIFIED page file |
| 02 | Executive | `/executive/home` | `PROJECT_MANAGEMENT` | VERIFIED page file |
| 03 | Projects | `/projects` | `PROJECT_MANAGEMENT` | VERIFIED page file |
| 04 | Procurement | `/procurement` | `PROCUREMENT` | VERIFIED page file |
| 05 | Inventory | `/inventory` | `INVENTORY` | VERIFIED page file |
| 06 | Material Issuance | `/material-issuance` | `MATERIAL_ISSUANCE` | VERIFIED page file |
| 07 | Finance | `/finance` | `FINANCE` | VERIFIED page file |
| 08 | Subcontracting | `/subcontracting` | `SUBCONTRACTING` | VERIFIED page file |
| 09 | Accomplishments | `/accomplishments` | `ACCOMPLISHMENTS` | VERIFIED page file |
| 10 | Project Scheduling | `/scheduling` | `PROJECT_MANAGEMENT` | VERIFIED page file |
| 11 | Payroll | `/payroll` | `PAYROLL` | VERIFIED page file |
| 12 | Equipment | `/equipment` | `EQUIPMENT` | VERIFIED page file |
| 13 | Variation Orders | `/variation-orders` | `VARIATION_ORDERS` | VERIFIED page file |
| 14 | Reports | `/reports` | `REPORTS` | VERIFIED page file |
| 15 | Documents | `/documents` | `DOCUMENTS` | VERIFIED page file |
| 16 | Knowledge Center | `/knowledge-center` | `KNOWLEDGE_CENTER` | VERIFIED page file |
| 17 | Users | `/users` | `SYSTEM_ROLES` | VERIFIED page file |

**Per-module evidence fields** (never fill with guesses): `acceptedBaselineSha`, `acceptedReceiptUri`, `acceptedEnvironment`, `validatedModuleScope`, `unchangedDependencies`, `releaseSha`, `newDeltaCheckUri`, `productionDeploymentIdentity`, `outstandingBlocker`, `ownerDisposition`, `signOffDate`.

**Valid state vocabulary:** `ACCEPTED_FROZEN`, `REUSED_PASS`, `NEW_PASS`, `PARTIAL`, `EVIDENCE_TO_LINK`, `BLOCKED`, `NOT_APPLICABLE`. Do not automatically downgrade accepted modules because their receipts have not yet been copied into this register.

## B. Each module's user-critical pathway and selective next evidence

### M01 — Dashboard

- **Critical business acceptance:** Role-scoped KPIs, actionable counts and truthful unavailable-metric display.
- **Already identified:** DEF-02 narrow Preview dashboard-stats response 200; not full Production PASS.
- **Narrow next evidence action:** Link accepted receipts; only targeted changed KPI/role check.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M02 — Executive

- **Critical business acceptance:** Executive portfolio totals, project visibility, confidential profit/cost views.
- **Already identified:** Entry page/manual inspected; exact per-module acceptance receipt not linked.
- **Narrow next evidence action:** Link prior accepted portfolio evidence.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M03 — Projects

- **Critical business acceptance:** Project-first creation; creator assignment; profile, workspace and per-project isolation.
- **Already identified:** Phase 9 targeted local 38/38, 13/13 PostgreSQL, 7/7 actions; positive Preview browser UAT pending.
- **Narrow next evidence action:** Complete changed Phase 9 Preview positive-path UAT.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M04 — Procurement

- **Critical business acceptance:** Authorized MR -> canvass -> PO with approved budget/BOQ guards.
- **Already identified:** Existing/frozen module preserved per Owner governance; exact receipt unlinked.
- **Narrow next evidence action:** Link accepted MR/PO receipt; only impacted UBOQ handoff.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M05 — Inventory

- **Critical business acceptance:** PO receipt, stock quantity/cost balance, issue reconciliation.
- **Already identified:** Source route/manual; prior accepted receipt not yet attached.
- **Narrow next evidence action:** Link accepted inventory receipt; only changed handoff.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M06 — Material Issuance

- **Critical business acceptance:** Authorized MIS; stock and project charge reconciliation; prevent duplicate posting.
- **Already identified:** Route/manual inspected; per-module receipt unlinked.
- **Narrow next evidence action:** Link accepted issue ledger; targeted delta only.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M07 — Finance

- **Critical business acceptance:** Expense/ledger, payables, approvals, accurate project cost and reports.
- **Already identified:** Module preserved; Preview dashboard may mark inaccessible metrics Unavailable; not proof of Finance failure.
- **Narrow next evidence action:** Link accepted finance evidence; no blanket 96-table grants.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M08 — Subcontracting

- **Critical business acceptance:** Subcontracts/job orders, billing, retention, project link.
- **Already identified:** Route/manual present; dashboard totalSubcontractors can be Unavailable in Preview.
- **Narrow next evidence action:** Link accepted contract/job-order workflow evidence.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M09 — Accomplishments

- **Critical business acceptance:** Source-backed completion quantities, approvals and progress billing linkage.
- **Already identified:** Route/manual; accepted per-module UAT receipt not yet linked.
- **Narrow next evidence action:** Link accepted accomplishment billing evidence; verify affected handoff only.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M10 — Project Scheduling

- **Critical business acceptance:** BOQ allocation, WBS/CPM, approvals/baseline revisions and T7 EVM.
- **Already identified:** Frozen scheduling preserved; new Delta 2 local combined 20/20; targeted negative Preview 5/5; positive T7 acceptance pending.
- **Narrow next evidence action:** Positive Preview link persistence/T7 acceptance; no scheduling engine rewrite.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M11 — Payroll

- **Critical business acceptance:** Workers/DTR payroll calculation, approval, project allocation.
- **Already identified:** Route/manual; historic XID rollover migration #39 local receipt; per-module Production receipt not linked.
- **Narrow next evidence action:** Link frozen Payroll acceptance; only proven affected path.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M12 — Equipment

- **Critical business acceptance:** Fleet/assets, deployment to projects and equipment-cost records.
- **Already identified:** Route/manual present; receipt not linked.
- **Narrow next evidence action:** Link accepted equipment receipt.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M13 — Variation Orders

- **Critical business acceptance:** Documented VO approval, baseline impact and revision provenance.
- **Already identified:** Route/manual present; receipt not linked.
- **Narrow next evidence action:** Link approved VO controls; only affected baseline integration.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M14 — Reports

- **Critical business acceptance:** Accurate role-scoped print/export/financial/operational reports.
- **Already identified:** Route and existing operational manual; per-report receipt not linked.
- **Narrow next evidence action:** Link accepted reports; new T7/T0-T12 only if affected.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M15 — Documents

- **Critical business acceptance:** Categorized NOA/NTP/contract upload, immutable SHA-256/vault and authorized retrieval.
- **Already identified:** Phase 9 local and narrow negative Preview checks; positive browser and DOCX/PDF/PNG extraction pending.
- **Narrow next evidence action:** Complete remaining exact-SHA Preview document tests.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M16 — Knowledge Center

- **Critical business acceptance:** Approved SOP/knowledge retrieval, role limits and graceful integration errors.
- **Already identified:** Route/training/SOP documentation; external AI fallback acceptance not linked.
- **Narrow next evidence action:** Link existing module acceptance; only applicable provider delta.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

### M17 — Users

- **Critical business acceptance:** User onboarding, role assignment, guest restriction, audit trails.
- **Already identified:** Owner Issue #4 reports RBAC 71/71 local and 6/6 Preview, validated SHA not established.
- **Narrow next evidence action:** Preserve RBAC, link historic receipt, separate auth security PR #3 gate.
- **Local | Preview | Production:** original accepted receipt(s) with exact identity to be linked separately. Current register does not change their acceptance status.

## C. Evidence already established (with original scope preserved)

- Accepted Universal BOQ T0–T12/R2 source files: **13/13 unchanged** in the accepted source ledger; this is a source integrity claim, not whole-ERP functional acceptance.
- Delta 1 PR #18 and Delta 2 PR #19 merged into Phase 9 development branch at `1755b18a287f91238f64c97560db212a3aedf36c`; **20/20 combined local focused tests** and **5/5 targeted live Preview negative/security checks** reported PASS. Their genuine positive-path browser UAT is not yet established by these results.
- Phase 9 earlier LOCAL 38/38 control-flow, 13/13 PostgreSQL and 7/7 action; Track A hosted API 43/43 and DB 9/9; Phase 7 19/19 Preview at its historic commit. Reuse only their established environment/source scope.
- Owner [Issue #4](jburns2372-sys/OneSystemsErp/issues/4) reports 71/71 RBAC local and 6/6 Preview PASS but lacks exact validated SHA; preserve controls and reconcile evidence before any claim beyond its stated scope.
- The current overarching [Phase 9 PR #2](jburns2372-sys/OneSystemsErp/pull/2) remains separate from main/Production; [Phase 8 auth PR #3](jburns2372-sys/OneSystemsErp/pull/3) is a separate security release assessment.
- DEF-05: unrelated Preview-wide privilege findings do not authorize a broad 96-table grant. Only a proven release-critical operational blocker is eligible for a narrowly reviewed exception.

## D. Avoiding avoidable user support incidents: evidence-based release criteria

| Quality control | Evidence expectation; reuse receipts where unaffected |
|---|---|
| Navigation & role boundaries | Correct route; active roles see permitted actions; denied access is clear, not a broken page or data leak |
| Core workflow | The approved transaction completes, persists, reloads and has a clear status or useful validation message |
| Financial/quantity integrity | Amounts and quantities reconcile; duplicate retry does not double-post; signed baselines remain protected |
| Secure cross-module handoff | Project ID, identity, RBAC and source provenance remain correct across changed interfaces |
| Error handling | No known unhandled user-visible 500 for approved critical flows, empty records, stale login, missing rights or unsupported format |
| Operational readiness | Exact deployment SHA, environment identity, health, error logging, backup/restore, rollback and support runbook references |
| Evidence-backed release | Every known blocking defect is resolved or formally held from release; owner signs exact candidate only |

These are **acceptance proof points**, not permission to expand development scope or rerun full suites on frozen modules.

## E. Changed cross-module boundaries requiring precise positive-path evidence

| Boundary | Acceptance requirement | Reuse rule |
|---|---|---|
| Projects -> Documents/Universal BOQ | Project first, atomic creator access, private immutable source, DRAFT only until human authorized approval | Phase 9 exact-SHA browser positive path outstanding |
| Approved BOQ -> Scheduling/T7 EVM | Correct phase/activity identity, link persistence, no duplicate/foreign linkage, actual T7 output | Delta 2 targeted negative tests are not positive workflow PASS |
| Procurement -> Inventory -> Material Issuance | MR/PO, receipts, stock and MIS quantities reconcile | Use frozen historical receipts unless this interface demonstrably changed |
| Accomplishments -> Billing -> Finance | Approved quantities and revenue/cost posting stay correct without duplicate bill | Use accepted receipts; target affected integration only |
| Payroll/Equipment/Subcontracting -> Project costs | Project-scoped charges and authorized postings | Reuse accepted modules unless proven impacted |
| Users/RBAC -> every route | Project isolation and real actor permissions apply on server, not only sidebar | Historical 71/71 and 6/6 as scoped; secure auth release gate separate |
| Reports/Executive/Knowledge -> canonical records | Accurate, role-safe data, honest unavailable values | Reuse accepted reports; test new/affected T7/T0–T12 sources |

## F. Existing release gates; no new roadmap

1. Finish only missing Phase 9 Preview DOCX, native PDF and PNG/OCR extraction smoke checks and the Owner's authenticated positive-path browser workflow.
2. Verify actual Visual Mapping, source integrity, approval controls, schedule link persistence and T7 report at the final reviewed candidate SHA. If a supported approval path lacks the link hook, demonstrate and correct the narrow UBOQ-only integration.
3. Reconcile the five materially different project fixtures required by `docs/architecture/multi-project-acceptance-strategy.md` before claiming universal deployability; reuse any unchanged accepted fixture evidence.
4. Follow existing security/recovery/Production gates in Issue #4 and the Universal Master Plan; require exact deployed identity, rollback and authorized release.
5. **Whole application sign-off:** document accepted receipts for these 17 visible modules and any other required role-dependent functions under the approved plan. Keep Phase 9 release acceptance separate from whole-ERP acceptance.

## G. Owner decision register (unfilled; never fabricate sign-off)

| Gate | Current state | Owner sign-off |
|---|---|---|
| 17 visible modules matched to code and approved scope | 17/17 source entry pages VERIFIED | NOT SIGNED |
| Accepted module receipts/SHAs/environments linked | EVIDENCE_TO_LINK | NOT SIGNED |
| Changed cross-module positive-path acceptance | PARTIAL, pending applicable Preview evidence | NOT SIGNED |
| No known open release-blocking defects | NOT ATTESTED | NOT SIGNED |
| Production candidate exact identity, recovery and operational acceptance | NOT VERIFIED FOR THIS RELEASE | NOT SIGNED |
| Universal BOQ release CLOSE/FREEZE | NOT AUTHORIZED | NOT SIGNED |
| Whole OneSystemsERP final CLOSE/FREEZE | NOT AUTHORIZED | NOT SIGNED |

## H. Auditable source references

- [Sidebar route & permission mapping](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/src/components/layout/Sidebar.tsx)
- [Operational manual](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/docs/OneSystemsERP_Updated_Operational_Manual.md)
- [Owner no-repeat governance issue](jburns2372-sys/OneSystemsErp/issues/4)
- [Phase 9 accepted baseline digest ledger](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/docs/uboq/phase9-accepted-baseline-ledger.json)
- [Phase 9 focused acceptance batch](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/docs/uboq/phase9-acceptance-batch.md)
- [Universal project intake architecture](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/docs/architecture/universal-project-intake-and-scheduling.md)
- [Five-fixture universal acceptance](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/docs/architecture/multi-project-acceptance-strategy.md)
- [Operations troubleshooting guide](jburns2372-sys/OneSystemsErp/blob/1755b18a287f91238f64c97560db212a3aedf36c/docs/OneSystemsERP_Updated_Troubleshooting_Guide.md)

**Audit note:** This is a documentation-only evidence index. It does not apply database changes, run acceptance tests, alter frozen modules, authorize Production release, or certify whole-ERP functionality.
