# Progress Billing & Accomplishment - Logic & Validation Reference

This document serves as a permanent reference for the formulas, validation criteria, data generation logic, and bug-prevention mechanisms implemented in the Progress Billing system.

## 1. Successive Billing Generation Logic (`+ Create Billing`)

When you create a new Progress Billing from a previously locked file, the system executes the following automated data transfers to strictly preserve mathematical integrity and the native spreadsheet format:

*   **Previous Amount Transfer (Column 11):** 
    The system extracts the `Accomplishment To Date` (Column 13) from the old billing and drops it directly into the `PREVIOUS` column (Column 11) of the newly created file.
*   **Total Preservation (Column 10):**
    The `Total To Date` (Column 10) is fully carried over and preserved from the source file. It is **not** zeroed out.
*   **This Period Formula Injection (Column 12):**
    The system injects a native Excel formula into `THIS PERIOD` (Column 12): `=[Total To Date] - [Previous]`. Because the Total is preserved and the Previous is updated, the resulting calculation for a newly opened, untouched billing correctly yields `0`.

## 2. Grid-Level Formulas & Calculations

While editing a billing inside the Accomplishment Grid, the system instantly recalculates the following values upon every user input:

*   **Column 11 (THIS PERIOD Amount)**
    `THIS PERIOD = Total Accomplishment (Col 10) - PREVIOUS (Col 11)`
*   **Column 12 (ACCOMPLISHMENT TO DATE Amount)**
    `ACCOMPLISHMENT TO DATE = Total Accomplishment (Col 10)`
*   **Column 13 (Accomplishment %)**
    `% = (ACCOMPLISHMENT TO DATE / TOTAL PROJECT COST) * 100`
*   **Column 6 (Weighted %)**
    `Weighted % = (Total Item Cost / TOTAL PROJECT COST) * 100`

## 3. Data Entry Validation & Locking Criteria

The system rigidly enforces the following checks to prevent mathematical errors, over-billing, and logical inconsistencies:

*   **Completed Item Lock:**
    If an item's `Remarks` column (Column 15) is marked as `"Completed"`, the system strictly disables the cell. You cannot input new percentages or quantities for a fully completed item.
*   **Percentage Over-Billing Lock (1 Lot / Assy Items):**
    *   The system calculates `Total Percentage = (Previous Amount / Unit Cost) * 100 + New Input %`.
    *   If `Total Percentage > 100%`, the input is blocked and an alert is shown.
*   **Quantity Over-Billing Lock (Per Unit Items):**
    *   The system calculates `Total Quantity = (Previous Amount / Unit Cost) + New Input Quantity`.
    *   If `Total Quantity > Awarded BOQ (Col 4)`, the input is blocked and an alert is shown.
*   **Automatic '1 Lot' Completion:**
    If you enter an input for a `1 Lot` item that fulfills the remaining balance (leaving the input field blank natively in the spreadsheet), the system automatically populates `This Period` with the correct balance to reach exactly 100%.

## 4. Status Automation (Remarks Column)

The `Remarks` column (Column 15) is fully automated and updates in real-time as you type:

*   **Completed:** If `ACCOMPLISHMENT TO DATE (Col 13) >= Total Item Cost (Col 6) - 0.01`
*   **Ongoing:** Any item with a `Total Item Cost > 0` that has not yet reached completion. Items are marked as "Ongoing" by default, even before progress is logged.
*   **Blank:** Headers and unpriced items (Total Item Cost = 0) strictly remain blank.

## 5. File Structure Preservation (Anti-Corruption)

To prevent the `.xlsx` files from becoming corrupted or misaligned over multiple saves (such as the duplicated `TOTAL PROJECT COST` row bug):

*   **Empty Row Preservation:** The grid no longer strips out empty rows from the Excel template. By strictly keeping the empty rows in memory, the system ensures a flawless 1-to-1 row map when overwriting the file.
*   **Duplicate Row Hiding:** If an older file was already corrupted by the shifting bug and contains multiple trailing `TOTAL PROJECT COST` rows, the grid actively filters out the duplicates during load, ensuring the UI remains pristine.
