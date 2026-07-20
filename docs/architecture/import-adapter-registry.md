# Import Adapter Registry

Create independent adapters for the following source formats:
- XLSX
- XLS
- CSV
- native PDF tables
- scanned PDF
- image-based BOQ
- DOCX tables
- approved OneSystemsERP master templates
- user-defined source formats

## Adapter Requirements
- Every adapter must output the same Canonical Project and BOQ structures.
- Downstream approval, locking, scheduling, and baseline services must not depend on the original document format.
- Each adapter must preserve source lineage so that every canonical value can be traced to its originating sheet, page, cell, or row.

## Visual Column-Mapping Profiles

Allow successful mappings from the visual mapping interface to be saved as reusable mapping profiles.
Fields may include:
- profile name
- agency
- client
- document type
- file type
- workbook sheet
- header row
- data start row
- item-code mapping
- description mapping
- unit mapping
- quantity mapping
- unit-cost mapping
- amount mapping
- category detection
- subtotal handling
- grand-total detection
- version
- effective date
- approval status

Mapping profiles may be associated with a government agency, client, consultant, contractor, document title, workbook structure, source system, or known template version.
