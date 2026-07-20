# PGH Reference Reconstruction Fixture

## Purpose

Preserve the current PGH project as a controlled historical recovery and acceptance fixture. This ensures that the current active Gates 8D through 12D continue unmodified.

## Classification

`REFERENCE_PROJECT_RECOVERY_AND_ACCEPTANCE_FIXTURE`

## PGH-Specific Values

The following values are project-specific and must never be treated as application-wide defaults:

- Project ID: `cmrirhhw30000ic0406v47smb`
- Locked BOQ rows: 326
- Locked BOQ total: PHP 43,106,674.89
- Canonicalization: `BOQ_CANONICAL_V1`
- Blueprint: `HISTORICAL_VALIDATED_V1`
- Checksum: `514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17`

## Required Schedule Structure

- ProjectSchedule = 1
- ScheduleWBS = 13 total nodes
- Root WBS = 1
- Phases = 12
- ScheduleActivity = 14
- ScheduleDependency = 11
- ScheduleBOQAllocation = 326
- CPM finish = 2026-10-18

Required final phases:
- Phase 11: Testing and Commissioning
- Phase 12: Project Acceptance and Demobilization

## Replay Isolation

These PGH-specific variables remain only in explicit reconstruction mode (e.g. `GATE8D_REPLAY_MODE`), controlled UAT fixtures, regression tests, historical recovery evidence, and the PGH reference blueprint. They must not be embedded in normal production project creation or schedule generation.
