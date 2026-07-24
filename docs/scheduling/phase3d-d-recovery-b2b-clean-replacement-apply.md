# Phase 3D-D Recovery B2B: Clean Replacement Apply

**Mode:** CONTROLLED APPLY
**Date:** 2026-07-14
**Project ID:** cmrjo4msn0000vc9c7s65o3lt
**Contaminated Schedule ID:** cmrjou0ne0001vcf01eju4dh8

---

## 1. Development Database Confirmation
Target confirmed. Script executed against the development environment database.

## 2. Recovery Idempotency Result
PASSED. Idempotency Key: `2bc862d32756399a2493b0f765eb6266c6fde6b2c33b53fb83205ceb3daba8ae`

## 3. Source Preflight Result
PASSED. Source verified (Status: `ACTIVE_BASELINE`, RowVersion: 90, etc.)

## 4. Recovery Transaction Result
COMMITTED SUCCESSFULLY.

## 5. Recovery Timestamp
`2026-07-14T04:52:00Z` (approximate transaction execution time)

## 6. Recovery Actor
System Administrator / Authorized Recovery Actor

## 7. Contaminated Schedule Previous Status
`ACTIVE_BASELINE`

## 8. Contaminated Schedule New Status
`ARCHIVED_BASELINE`

## 9. Contaminated Schedule Previous rowVersion
90

## 10. Contaminated Schedule New rowVersion
91

## 11. Historical Activation Count
10 records

## 12. Invalidated Activation Count
10 records invalidated (`isAuthoritative = false`)

## 13. Authoritative Activation Count
0

## 14. Existing Evidence Revision Preservation
PRESERVED. (`cmrjqp9680004vcso7x97dla1` remains untouched)

## 15. Clean Candidate Schedule ID
`clean-candidate-1784004755783`

## 16. Clean Candidate Initial Workflow Status
`AI_GENERATED_DRAFT`

## 17. Clean Candidate Final Workflow Status
`READY_FOR_REVIEW`

## 18. Clean Candidate rowVersion
2 (starts at 1, incremented by 1 during validation)

## 19. WBS Clone Count
13

## 20. Phase Count
12

## 21. Activity Clone Count
14

## 22. Dependency Clone Count
11

## 23. Allocation Clone Count
326

## 24. WBS Remapping Result
VERIFIED. All nodes remapped to new schedule ID.

## 25. Activity Remapping Result
VERIFIED. All activities remapped to new schedule ID and new WBS IDs.

## 26. Dependency Remapping Result
VERIFIED. All dependencies remapped to new activity IDs.

## 27. Allocation Remapping Result
VERIFIED. All allocations remapped to new activity IDs.

## 28. BOQ-Reference Preservation Result
VERIFIED. Original `awardedBoqItemId` references preserved.

## 29. BOQ Coverage
326 of 326

## 30. Awarded Amount
43,106,674.89

## 31. Scheduled Amount
43,106,674.89

## 32. Exact Difference
0.00

## 33. Contract Dates
2026-06-12 to 2026-12-09

## 34. Natural Calculated Completion
2026-10-18T00:00:00.000Z

## 35. Final Calculated Completion
2026-10-18T00:00:00.000Z

## 36. Testing and Commissioning Result
Verified present.

## 37. Project Acceptance and Demobilization Result
Verified final.

## 38. Approval-Copy Count
0

## 39. Activation-Copy Count
0

## 40. Baseline-Code Result
null

## 41. Activation-Field Result
null

## 42. Recovery Lineage
`parentScheduleId`: `cmrjou0ne0001vcf01eju4dh8`
`previousBaselineId`: null

## 43. PostgreSQL Read-Back Result
PASSED.

## 44. Active Baseline Count After Recovery
0

## 45. Valid Authoritative Baseline Count
0

## 46. Confirmation No BL-001 Was Assigned
CONFIRMED.

## 47. Confirmation No Technical Review Began
CONFIRMED. (Status stopped at `READY_FOR_REVIEW`)

## 48. Confirmation No Baseline Activation Occurred
CONFIRMED.

## 49. Final Result
**READY_FOR_PHASE_3D_D_RECOVERY_B3**
