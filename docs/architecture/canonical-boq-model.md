# Canonical BOQ Model

Every uploaded document format must be normalized into one canonical internal model.

## Canonical Project Intake

Must support:
- project name
- project reference number
- client
- location
- project type
- contract start date
- contract completion date
- contract duration
- awarded contract amount
- source document identity
- source file type
- source sheet or page
- source section
- source row
- source confidence
- extraction warnings

## Canonical BOQ Line Model

Must support:
- stable source identity
- item code
- category
- subcategory
- discipline
- system
- location
- description
- unit
- quantity
- unit cost
- authoritative amount
- lot or measured-item classification
- source sheet or page
- source row
- source lineage
- confidence score
- mapping status
- validation status
- exception reason
- user-approved override
- canonical sequence

## Calculation and Decimal Rules

Use `Prisma.Decimal` for all quantities, unit costs, amounts, category totals and grand totals. The authoritative source amount must be preserved. Do not silently replace the source amount with `quantity × unitCost` (that computation may be used only as a diagnostic comparison).
