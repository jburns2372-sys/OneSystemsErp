# Phase 3D-D Recovery B2A: Clean Replacement Dry Run

**Mode:** READ-ONLY DRY RUN
**Date:** 2026-07-14
**Project ID:** cmrjo4msn0000vc9c7s65o3lt
**Contaminated Schedule ID:** cmrjou0ne0001vcf01eju4dh8

---

## 1. Development Database Confirmation
Target confirmed. Script executed against the development environment database.

## 2. Recovery B1 Protection Verification
`RECOVERY_B1_PROTECTIONS_CONFIRMED`.
- The partial index `BaselineActivation_one_authoritative_per_schedule` exists.
- The `activateScheduleBaseline` service enforces `Serializable` transactions, idempotency guards, and state/version constraints.

## 3. Contaminated Schedule Current Status
- `workflowStatus`: `ACTIVE_BASELINE`
- *Note:* `activatedAt` and `activatedById` are populated but `baselineCode` is missing.

## 4. Contaminated Schedule rowVersion
- `rowVersion`: 90

## 5. Historical Activation Count
- BaselineActivation Count: 10 records.

## 6. Authoritative Activation Count
- Valid authoritative activation count for the project: 0.

## 7. Structural-Source Validation
- WBS Roots: 1
- Phases: 12
- Activities: 14
- Dependencies: 11
- Allocations: 326
- Unique BOQ coverage: 326 of 326 (Missing: 0, Underallocated: 0, Overallocated: 0)
- Awarded: 43,106,674.89
- Scheduled: 43,106,674.89
- Difference: 0.00
- **Feasibility:** SCHEDULE_FEASIBLE

## 8. Existing Evidence Revision Classification
`PRESERVED_TEST_EVIDENCE_REVISION`
- Status: `AI_GENERATED_DRAFT`
- ID: `cmrjqp9680004vcso7x97dla1`
- WBS Count: 13
- Activity Count: 14
- Parent: `cmrjou0ne0001vcf01eju4dh8`
- Previous Baseline: `cmrjou0ne0001vcf01eju4dh8`

## 9. Proposed Archived Status
- `ARCHIVED_BASELINE`

## 10. Proposed Activation Invalidation Count
- 10 historical `BaselineActivation` records will be explicitly invalidated.

## 11. Proposed Recovery Audit Record
- `recoveryType`: INVALIDATED_DEVELOPMENT_TEST_BASELINE
- `reason`: DUPLICATE_TEST_ACTIVATIONS_AND_INCOMPLETE_HEADER_METADATA
- `previousStatus`: ACTIVE_BASELINE
- `newStatus`: ARCHIVED_BASELINE
- `historicalActivationCount`: 10
- `authoritativeActivationCount`: 0
- `originalRowVersion`: 90

## 12. Proposed Clean Candidate Project ID
- `cmrjo4msn0000vc9c7s65o3lt`

## 13. Proposed New Schedule Identifier Strategy
- Standard unique CUID/UUID generated for the new schedule and all mapped descendant IDs to guarantee structural isolation.

## 14. Proposed WBS Clone Count
- 13 nodes (1 root, 12 phases) mapped to new IDs.

## 15. Proposed Activity Clone Count
- 14 activities mapped to new IDs.

## 16. Proposed Dependency Clone Count
- 11 dependencies mapped to new activity IDs.

## 17. Proposed Allocation Clone Count
- 326 allocations mapped to new activity IDs.

## 18. Proposed BOQ Coverage
- 326 unique BOQ items fully preserved.

## 19. Proposed Financial Reconciliation
- 43,106,674.89 Scheduled vs 43,106,674.89 Awarded.

## 20. Proposed Date Values
- `projectStartDate`: 2026-06-12
- `projectCompletionDate`: 2026-12-09
- `baselineStartDate`: null
- `baselineFinishDate`: null
- `activatedAt`: null
- `activatedById`: null

## 21. Proposed Workflow Status After Creation
- `AI_GENERATED_DRAFT`

## 22. Proposed Workflow Status After Deterministic Validation
- `READY_FOR_REVIEW`

## 23. ID-Remapping Validation
- Verified: All cloned records correctly remap foreign keys to the new IDs without leaking source schedule identifiers.

## 24. Data-Exclusion Validation
- Verified: `ScheduleApproval`, `BaselineActivation`, idempotency keys, snapshot hashes, and baseline codes are strictly excluded from the clean clone candidate.

## 25. Lineage Semantics
- `parentScheduleId`: `cmrjou0ne0001vcf01eju4dh8`
- `previousBaselineId`: null (Recovery Replacement)

## 26. Unique-Constraint Conflict Result
- None found. 

## 27. Recovery Idempotency Key
- `2bc862d32756399a2493b0f765eb6266c6fde6b2c33b53fb83205ceb3daba8ae`

## 28. Exact Records Proposed for Insertion
- 1 `ProjectSchedule`
- 13 `ScheduleWBS`
- 14 `ScheduleActivity`
- 11 `ScheduleDependency`
- 326 `BoqAllocation`
- 1 Audit Record

## 29. Exact Records Proposed for Update
- 1 `ProjectSchedule` (`workflowStatus`: `ARCHIVED_BASELINE`, `rowVersion`: 91)
- 10 `BaselineActivation` (`isAuthoritative`: false, `invalidatedAt`: <controlled-timestamp>, `invalidationReason`: INVALIDATED_DUPLICATE_DEVELOPMENT_TEST_ACTIVATION)

## 30. Confirmation of Zero Database Writes
- Confirmed. Script explicitly bypasses all Prisma `create` / `update` functions in `--dry-run` mode.

## 31. Final Result
**READY_FOR_PHASE_3D_D_RECOVERY_B2_APPLY**
