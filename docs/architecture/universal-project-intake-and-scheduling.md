# Universal Project Intake and Scheduling Engine

## 1. Architectural Classification

Separate the system into five distinct layers:
A. Reusable platform controls
B. Format-specific document extraction adapters
C. Canonical project and BOQ normalization
D. Dynamic project-specific schedule generation
E. PGH historical recovery and regression fixture

## 2. Reusable Platform Controls

The following controls must be universally reusable across all projects:
- Auth.js authentication
- project-scoped PBAC
- role and capability enforcement
- user and project assignments
- Prisma.Decimal financial processing
- authoritative BOQ approval and locking
- actor provenance
- operational approval records
- AuditLog
- idempotency
- optimistic concurrency
- advisory locking where applicable
- schedule review workflow
- staged approvals
- baseline activation
- immutable active baselines
- revision cloning
- backup and recovery controls

These controls must not contain PGH-specific project IDs, amounts, checksums, dates, row counts, WBS counts, activity counts, or dependency counts.

## 3. Universal New-Project Workflow

1. Create the project.
2. Enter project dates and awarded contract amount.
3. Upload the awarded Program of Works and/or Bill of Quantity.
4. Detect the source document type and layout.
5. Extract source rows and project information.
6. Map extracted data into the canonical BOQ model.
7. Present validation warnings and mapping exceptions.
8. Allow authorized user review and correction.
9. Reconcile the canonical BOQ against the awarded contract amount.
10. Approve and lock the authoritative BOQ.
11. Generate a project-specific schedule.
12. Conduct technical, contract and financial review.
13. Complete staged approvals.
14. Activate the approved baseline.
15. Manage revisions without mutating the active baseline.

## 4. Visual Column-Mapping Workflow

Provide an authorized visual mapping interface to map unknown documents into the Canonical BOQ Model. Show fields mapped, location, extracted value, confidence score, warning, proposed transformation, and user approval status. Allow mappings to be saved as reusable profiles.

## 5. Universal Financial Reconciliation

Required accepted result for every project:
Canonical BOQ total = Approved awarded contract amount
Difference = 0.00

## 6. Project-Agnostic Schedule Generation

The engine must dynamically analyze and determine the WBS structure, activity durations, dependencies, testing, commissioning, and final acceptance phases based on the project disciplines, scope, scale, lead-time rules, and calendar constraints.

## 7. Dynamic Schedule Review

Generated schedules must be reviewed manually.
Lifecycle:
`AI_GENERATED_DRAFT` -> `READY_FOR_REVIEW` -> `UNDER_TECHNICAL_REVIEW` -> `TECHNICALLY_APPROVED` -> `PENDING_BASELINE_APPROVAL` -> `ACTIVE_BASELINE`

## 8. Required Separation of Modes

Maintain a strict separation between PRODUCTION MODE and RECONSTRUCTION MODE. Normal workflow does not require RECONSTRUCTION MODE environment variables.

## 9. Component Classification

- **Reusable now**: PBAC, authentication, baseline architecture, audit logging.
- **Reusable after refactor**: AI rule heuristics.
- **PGH-specific**: `cmrirhhw30000ic0406v47smb`, row counts, specific WBS hierarchy.
- **Reconstruction-only**: `GATE8D_REPLAY_MODE`, explicit id/seed scripts.
- **New universal component required**: Extractors, Adapters, Dynamic Schedule Engine, Mapping Workflow.
