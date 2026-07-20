# Gate 8D Activity Duration Evidence

## Overview
All 14 activities and their exact durations were recovered directly from `scripts/gate8-execute.ts` (lines 178-193), which served as the historical proof of the acyclic schedule network. The durations were explicitly defined to mathematically align with the total 128 elapsed days calculated between the project start date (2026-06-12) and target finish date (2026-10-18).

## Derivation Formula and Verification
- **Calendar**: 7 days a week, no holidays (ProjectCalendar)
- **Start Date**: 2026-06-12 (Inclusive)
- **Calculated Finish Date**: 2026-10-18
- **Days Elapsed**: 128 days (129 calendar dates inclusive)
- **Derivation Logic**: The critical path consists of serial sequences. E.g., `ACT_1` -> `ACT_2` -> `ACT_4` -> `ACT_6` -> `ACT_8` -> `ACT_11` -> `ACT_12`. 
  - Durations: 14 + 21 + 14 + 30 + 14 + 21 + 14 = 128.
  - This perfectly fits the 128 days without artificial clamping.

## 14 Activities List

| Source Key | Name | Assigned Phase | Duration | Unit | Type | Calendar | Critical | Allocated |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT_1` | Mobilization and Site Prep | PH_1 | 14 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_2` | Roughing-ins (Mechanical) | PH_2 | 21 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_3` | Roughing-ins (Electrical) | PH_3 | 21 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_4` | Equipment Installation (Mechanical) | PH_4 | 14 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_5` | Equipment Installation (Electrical) | PH_5 | 14 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_6` | Piping and Ducting Works | PH_6 | 30 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_7` | Wiring and Cabling Works | PH_7 | 30 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_8` | Fixtures and Devices (Mechanical) | PH_8 | 14 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_9` | Fixtures and Devices (Electrical) | PH_9 | 14 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_10`| Finishes and Trims | PH_10 | 30 | Days | LOE | 7-Day | No | Supported |
| `ACT_11`| Testing and Commissioning | PH_11 | 21 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_12`| Project Acceptance and Demobilization | PH_12 | 14 | Days | DRIVING | 7-Day | Yes | Supported |
| `ACT_13`| Project Management & Supervision | PH_1 | 128| Days | LOE | 7-Day | No | Supported |
| `ACT_14`| Punchlisting | PH_11 | 21 | Days | DRIVING | 7-Day | No | Supported |

All constraints, logic logic, and sequence constraints align strictly with the accepted historical deterministic proposal (e.g., `uat-v3-gate8c-deterministic-proposal.json`).
