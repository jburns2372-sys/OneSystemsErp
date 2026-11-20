'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const ts = require('typescript');

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function loadTs(rel, mocks = {}) {
  const source = read(rel);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: rel,
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(transpiled, {
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      return require(id);
    },
    module: mod,
    exports: mod.exports,
    Buffer,
    console,
    process,
    URL,
    setTimeout,
    clearTimeout,
  });
  return mod.exports;
}

const reconciler = loadTs('src/lib/uboq/awarded-boq-reconciler.ts');
const guard = loadTs('src/lib/uboq/intake/security-guard.ts', {
  'node:crypto': crypto,
  'node:path': path,
  'node:zlib': zlib,
  xlsx: require('xlsx'),
});
const reader = loadTs('src/lib/uboq/intake/xlsx-streaming-reader.ts', {
  'node:stream': require('node:stream'),
  'node:zlib': zlib,
  './security-guard': guard,
});

function buildStoredZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const comp = zlib.deflateRawSync(raw);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(local, 30);
    locals.push(local, comp);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    nameBuf.copy(cd, 46);
    centrals.push(cd);

    offset += local.length + comp.length;
  }
  const cdBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cdBuf, eocd]);
}

function buildSyntheticXlsx(sheets) {
  const wbSheetsXml = sheets
    .map((s, idx) => `<sheet name="${s.name}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`)
    .join('');
  const relsXml = sheets
    .map(
      (_s, idx) =>
        `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
    )
    .join('');
  const entries = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>' },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${wbSheetsXml}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relsXml}</Relationships>` },
  ];
  sheets.forEach((s, idx) => entries.push({ name: `xl/worksheets/sheet${idx + 1}.xml`, data: s.xml }));
  return buildStoredZip(entries);
}

test('Awarded BOQ Rules 1-14: Clean multi-sheet workbook with headings, notes, VAT/discount, cross-sheet refs matches official contract', () => {
  const sheets = [
    {
      sheetName: 'BOQ - Part A',
      rows: [
        {
          rowNumber: 1,
          cells: [
            { colNumber: 1, cellRef: 'A1', text: 'Item No.', numOrText: 'Item No.', formula: null },
            { colNumber: 2, cellRef: 'B1', text: 'Description', numOrText: 'Description', formula: null },
            { colNumber: 3, cellRef: 'C1', text: 'Unit', numOrText: 'Unit', formula: null },
            { colNumber: 4, cellRef: 'D1', text: 'Qty', numOrText: 'Qty', formula: null },
            { colNumber: 5, cellRef: 'E1', text: 'Unit Price', numOrText: 'Unit Price', formula: null },
            { colNumber: 6, cellRef: 'F1', text: 'Amount', numOrText: 'Amount', formula: null },
          ],
        },
        {
          rowNumber: 2,
          cells: [
            { colNumber: 1, cellRef: 'A2', text: 'I', numOrText: 'I', formula: null },
            { colNumber: 2, cellRef: 'B2', text: 'GENERAL REQUIREMENTS', numOrText: 'GENERAL REQUIREMENTS', formula: null },
          ],
        },
        {
          rowNumber: 3,
          cells: [
            { colNumber: 2, cellRef: 'B3', text: 'Barangay Permits', numOrText: 'Barangay Permits', formula: null },
            { colNumber: 3, cellRef: 'C3', text: 'lot', numOrText: 'lot', formula: null },
            { colNumber: 4, cellRef: 'D3', text: '1', numOrText: 1, formula: null },
            { colNumber: 6, cellRef: 'F3', text: 'By Client', numOrText: 'By Client', formula: null },
          ],
        },
        {
          rowNumber: 4,
          cells: [
            { colNumber: 1, cellRef: 'A4', text: 'A.1', numOrText: 'A.1', formula: null },
            { colNumber: 2, cellRef: 'B4', text: 'Concrete Footing', numOrText: 'Concrete Footing', formula: null },
            { colNumber: 3, cellRef: 'C4', text: 'cu.m', numOrText: 'cu.m', formula: null },
            { colNumber: 4, cellRef: 'D4', text: '12.5', numOrText: 12.5, formula: null },
            { colNumber: 5, cellRef: 'E4', text: '4500', numOrText: 4500, formula: null },
            { colNumber: 6, cellRef: 'F4', text: '56250', numOrText: 56250, formula: '=D4*E4' },
          ],
        },
        {
          rowNumber: 5,
          cells: [
            { colNumber: 1, cellRef: 'A5', text: 'A.2', numOrText: 'A.2', formula: null },
            { colNumber: 2, cellRef: 'B5', text: 'Reinforcing Steel', numOrText: 'Reinforcing Steel', formula: null },
            { colNumber: 3, cellRef: 'C5', text: 'kg', numOrText: 'kg', formula: null },
            { colNumber: 4, cellRef: 'D5', text: '500', numOrText: 500, formula: null },
            { colNumber: 5, cellRef: 'E5', text: '85.5', numOrText: 85.5, formula: null },
            { colNumber: 6, cellRef: 'F5', text: '42750', numOrText: 42750, formula: '=ROUND(D5*E5, 2)' },
          ],
        },
        {
          rowNumber: 6,
          cells: [
            { colNumber: 2, cellRef: 'B6', text: 'Sub-Total Part A', numOrText: 'Sub-Total Part A', formula: null },
            { colNumber: 6, cellRef: 'F6', text: '99000', numOrText: 99000, formula: '=SUM(F4:F5)' },
          ],
        },
        {
          rowNumber: 7,
          cells: [
            { colNumber: 2, cellRef: 'B7', text: 'Provisional Sum (Testing)', numOrText: 'Provisional Sum (Testing)', formula: null },
            { colNumber: 6, cellRef: 'F7', text: '1000', numOrText: 1000, formula: null },
          ],
        },
        {
          rowNumber: 8,
          cells: [
            { colNumber: 2, cellRef: 'B8', text: '12% VAT', numOrText: '12% VAT', formula: null },
            { colNumber: 6, cellRef: 'F8', text: '12000', numOrText: 12000, formula: '=ROUND((F6+F7)*12%, 2)' },
          ],
        },
        {
          rowNumber: 9,
          cells: [
            { colNumber: 2, cellRef: 'B9', text: 'Less: Contractor Discount', numOrText: 'Less: Contractor Discount', formula: null },
            { colNumber: 6, cellRef: 'F9', text: '-2000', numOrText: -2000, formula: null },
          ],
        },
        {
          rowNumber: 10,
          cells: [
            { colNumber: 2, cellRef: 'B10', text: 'GRAND TOTAL', numOrText: 'GRAND TOTAL', formula: null },
            { colNumber: 6, cellRef: 'F10', text: '160000', numOrText: 160000, formula: "=F6+F7+F8+F9+'BOQ - Part B'!F2" },
          ],
        },
      ],
    },
    {
      sheetName: 'BOQ - Part B',
      rows: [
        {
          rowNumber: 1,
          cells: [
            { colNumber: 1, cellRef: 'A1', text: 'Item No.', numOrText: 'Item No.', formula: null },
            { colNumber: 2, cellRef: 'B1', text: 'Description', numOrText: 'Description', formula: null },
            { colNumber: 3, cellRef: 'C1', text: 'Unit', numOrText: 'Unit', formula: null },
            { colNumber: 4, cellRef: 'D1', text: 'Qty', numOrText: 'Qty', formula: null },
            { colNumber: 5, cellRef: 'E1', text: 'Unit Price', numOrText: 'Unit Price', formula: null },
            { colNumber: 6, cellRef: 'F1', text: 'Amount', numOrText: 'Amount', formula: null },
          ],
        },
        {
          rowNumber: 2,
          cells: [
            { colNumber: 1, cellRef: 'A2', text: 'B.1', numOrText: 'B.1', formula: null },
            { colNumber: 2, cellRef: 'B2', text: 'Electrical Rough-In', numOrText: 'Electrical Rough-In', formula: null },
            { colNumber: 3, cellRef: 'C2', text: 'lot', numOrText: 'lot', formula: null },
            { colNumber: 4, cellRef: 'D2', text: '2', numOrText: 2, formula: null },
            { colNumber: 5, cellRef: 'E2', text: '25000', numOrText: 25000, formula: null },
            { colNumber: 6, cellRef: 'F2', text: '50000', numOrText: 50000, formula: '=D2*E2' },
          ],
        },
      ],
    },
  ];

  // Official awarded contract matches -> exact plain-language success
  const matched = reconciler.verifyAwardedBoqWorkbook(sheets, { officialAwardedContractAmount: 160000 });
  assert.equal(matched.status, 'VERIFIED_MATCH');
  assert.equal(matched.headline, 'BOQ Verified — Total Matches Awarded Contract.');
  assert.equal(matched.calculationCheck, 'PASS');
  assert.equal(matched.formulaCheck, 'PASS');
  assert.equal(matched.recalculatedTotal, 160000);
  assert.equal(matched.officialAwardedContractAmount, 160000);
  assert.equal(matched.variance, 0);
  assert.equal(matched.counts.payItems, 3);
  assert.equal(matched.counts.headingsAndNotes, 2);
  assert.equal(matched.counts.priceComponents, 3);
  assert.equal(matched.counts.discrepancies, 0);

  // Rule 10 & 11: Absent/zero contract amount MUST NOT invent a value or claim a match
  const missingContract = reconciler.verifyAwardedBoqWorkbook(sheets, { officialAwardedContractAmount: 0 });
  assert.equal(missingContract.status, 'CONTRACT_AMOUNT_REQUIRED');
  assert.equal(missingContract.headline, 'Awarded contract amount required to complete reconciliation');
  assert.equal(missingContract.officialAwardedContractAmount, null);
  assert.equal(missingContract.variance, null);
  assert.equal(missingContract.recalculatedTotal, 160000);
  assert.equal(missingContract.workbookStatedGrandTotal, 160000);

  // Rule 13: Contract mismatch reported with exact variance
  const mismatch = reconciler.verifyAwardedBoqWorkbook(sheets, { officialAwardedContractAmount: 155000 });
  assert.equal(mismatch.status, 'DISCREPANCY_FOUND');
  assert.equal(mismatch.variance, 5000);
  assert.ok(mismatch.discrepancies.some((d) => d.code === 'CONTRACT_TOTAL_MISMATCH' && d.difference === 5000));
});

test('Awarded BOQ Rule 6 & 13: Detects arithmetic error, cached formula mismatch, #REF!, #DIV/0!, circular ref, and missing payable value', () => {
  const brokenSheets = [
    {
      sheetName: 'BOQ',
      rows: [
        {
          rowNumber: 1,
          cells: [
            { colNumber: 1, cellRef: 'A1', text: 'Item', numOrText: 'Item', formula: null },
            { colNumber: 2, cellRef: 'B1', text: 'Description', numOrText: 'Description', formula: null },
            { colNumber: 3, cellRef: 'C1', text: 'Unit', numOrText: 'Unit', formula: null },
            { colNumber: 4, cellRef: 'D1', text: 'Qty', numOrText: 'Qty', formula: null },
            { colNumber: 5, cellRef: 'E1', text: 'Unit Price', numOrText: 'Unit Price', formula: null },
            { colNumber: 6, cellRef: 'F1', text: 'Amount', numOrText: 'Amount', formula: null },
          ],
        },
        // Wrong line math (10 * 500 = 5000, but stated 5500) + cached formula mismatch
        {
          rowNumber: 2,
          cells: [
            { colNumber: 1, cellRef: 'A2', text: '1', numOrText: '1', formula: null },
            { colNumber: 2, cellRef: 'B2', text: 'Masonry', numOrText: 'Masonry', formula: null },
            { colNumber: 3, cellRef: 'C2', text: 'sq.m', numOrText: 'sq.m', formula: null },
            { colNumber: 4, cellRef: 'D2', text: '10', numOrText: 10, formula: null },
            { colNumber: 5, cellRef: 'E2', text: '500', numOrText: 500, formula: null },
            { colNumber: 6, cellRef: 'F2', text: '5500', numOrText: 5500, formula: '=D2*E2' },
          ],
        },
        // Broken #REF!
        {
          rowNumber: 3,
          cells: [
            { colNumber: 1, cellRef: 'A3', text: '2', numOrText: '2', formula: null },
            { colNumber: 2, cellRef: 'B3', text: 'Broken Ref Item', numOrText: 'Broken Ref Item', formula: null },
            { colNumber: 6, cellRef: 'F3', text: '#REF!', numOrText: '#REF!', formula: '=#REF!*2' },
          ],
        },
        // Missing unit price & amount on a payable row with qty=4
        {
          rowNumber: 4,
          cells: [
            { colNumber: 1, cellRef: 'A4', text: '3', numOrText: '3', formula: null },
            { colNumber: 2, cellRef: 'B4', text: 'Unpriced Payable Item', numOrText: 'Unpriced Payable Item', formula: null },
            { colNumber: 3, cellRef: 'C4', text: 'pcs', numOrText: 'pcs', formula: null },
            { colNumber: 4, cellRef: 'D4', text: '4', numOrText: 4, formula: null },
          ],
        },
        // Division by zero
        {
          rowNumber: 5,
          cells: [
            { colNumber: 2, cellRef: 'B5', text: 'Div Zero Check', numOrText: 'Div Zero Check', formula: null },
            { colNumber: 6, cellRef: 'F5', text: '0', numOrText: 0, formula: '=100/0' },
          ],
        },
        // Circular reference
        {
          rowNumber: 6,
          cells: [
            { colNumber: 2, cellRef: 'B6', text: 'Circular Check', numOrText: 'Circular Check', formula: null },
            { colNumber: 6, cellRef: 'F6', text: '0', numOrText: 0, formula: '=F6+1' },
          ],
        },
      ],
    },
  ];

  const rep = reconciler.verifyAwardedBoqWorkbook(brokenSheets, { officialAwardedContractAmount: 5000 });
  assert.equal(rep.status, 'DISCREPANCY_FOUND');
  assert.equal(rep.calculationCheck, 'FAIL');
  assert.equal(rep.formulaCheck, 'FAIL');
  const codes = new Set(rep.discrepancies.map((d) => d.code));
  assert.ok(codes.has('FORMULA_CACHED_VALUE_MISMATCH'));
  assert.ok(codes.has('LINE_CALCULATION_MISMATCH'));
  assert.ok(codes.has('FORMULA_BROKEN_REFERENCE'));
  assert.ok(codes.has('MISSING_PAYABLE_VALUE'));
  assert.ok(codes.has('FORMULA_ERROR_VALUE'));
  assert.ok(codes.has('FORMULA_CIRCULAR_REFERENCE'));
});

test('Shared OOXML formulas (<f t="shared" si="0"/>) translate relative row offsets accurately during streaming XLSX read', async () => {
  const sheetXml = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Item</t></is></c><c r="B1" t="inlineStr"><is><t>Description</t></is></c><c r="C1" t="inlineStr"><is><t>Unit</t></is></c><c r="D1" t="inlineStr"><is><t>Qty</t></is></c><c r="E1" t="inlineStr"><is><t>Unit Price</t></is></c><c r="F1" t="inlineStr"><is><t>Amount</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>1</t></is></c><c r="B2" t="inlineStr"><is><t>Excavation</t></is></c><c r="C2" t="inlineStr"><is><t>cu.m</t></is></c><c r="D2"><v>10</v></c><c r="E2"><v>250</v></c><c r="F2"><f t="shared" ref="F2:F3" si="0">D2*E2</f><v>2500</v></c></row>
    <row r="3"><c r="A3" t="inlineStr"><is><t>2</t></is></c><c r="B3" t="inlineStr"><is><t>Backfill</t></is></c><c r="C3" t="inlineStr"><is><t>cu.m</t></is></c><c r="D3"><v>20</v></c><c r="E3"><v>300</v></c><c r="F3"><f t="shared" si="0"/><v>6000</v></c></row>
    <row r="4"><c r="B4" t="inlineStr"><is><t>GRAND TOTAL</t></is></c><c r="F4"><f>SUM(F2:F3)</f><v>8500</v></c></row>
  </sheetData></worksheet>`;
  const buf = buildSyntheticXlsx([{ name: 'BOQ', xml: sheetXml }]);
  const sheets = [];
  await reader.streamVerifiedXlsxWorksheets(buf, (sh) => sheets.push({ sheetName: sh.sheetName, rows: sh.rows }));
  assert.equal(sheets[0].rows[2].cells.find((c) => c.cellRef === 'F3').formula, '=D3*E3');
  const rep = reconciler.verifyAwardedBoqWorkbook(sheets, { officialAwardedContractAmount: 8500 });
  assert.equal(rep.status, 'VERIFIED_MATCH');
  assert.equal(rep.formulaCheck, 'PASS');
  assert.equal(rep.counts.validFormulas, 3);
  assert.equal(rep.counts.cachedValueMismatches, 0);
});

test('Authorized Workspace BOQ Bridge enforces reconciliation, blocks role preview, and NEVER auto-creates PRRs/POs/Payments/VOs', async () => {
  const bridge = loadTs('src/lib/uboq/adapters/workspace-boq-bridge.ts', {
    '../security/stage-rbac': { assertUboqStageAuthorization: async () => true },
    '../project-ownership': {
      applyProjectRlsSessionVars: async () => {},
      uboqRlsStorage: { getStore: () => null },
    },
    '../awarded-boq-reconciler': reconciler,
  });

  const makeMockPrisma = (contractAmount) => {
    const insertedBoq = [];
    const auditLogs = [];
    let forbiddenAutoPostCalled = false;
    const tx = {
      awardedBOQItem: {
        count: async () => insertedBoq.length,
        create: async ({ data }) => { insertedBoq.push(data); return { id: `boq-${insertedBoq.length}`, ...data }; },
      },
      auditLog: {
        create: async ({ data }) => { auditLogs.push(data); return data; },
      },
      uboqProcurementResourceRequirement: { create: async () => { forbiddenAutoPostCalled = true; } },
      purchaseOrder: { create: async () => { forbiddenAutoPostCalled = true; } },
      materialRequest: { create: async () => { forbiddenAutoPostCalled = true; } },
      variationOrder: { create: async () => { forbiddenAutoPostCalled = true; } },
    };
    return {
      insertedBoq,
      auditLogs,
      wasForbiddenCalled: () => forbiddenAutoPostCalled,
      prisma: {
        project: {
          findUnique: async () => ({ id: 'proj-1', name: 'Test Project', contractAmount, boqLocked: false }),
        },
        uboqSourceDocument: {
          findFirst: async () => ({
            id: 'doc-1',
            projectId: 'proj-1',
            fileName: 'awarded.xlsx',
            sha256Hash: 'a'.repeat(64),
            metadataJson: {},
            candidates: [
              {
                id: 'c1',
                sourceRowNumber: 2,
                sourceCellRef: 'BOQ!A2',
                rawFormulaText: null,
                section: { sheetOrPageRef: 'BOQ' },
                parsedJson: { mappedFields: { item_code: 'I', work_description: 'GENERAL REQUIREMENTS' } },
              },
              {
                id: 'c2',
                sourceRowNumber: 3,
                sourceCellRef: 'BOQ!A3',
                rawFormulaText: '{"contract_line_amount":"=D3*E3"}',
                section: { sheetOrPageRef: 'BOQ' },
                parsedJson: {
                  mappedFields: {
                    item_code: '1.1',
                    work_description: 'Concrete Works',
                    unit: 'cu.m',
                    approved_qty: 10,
                    contract_unit_rate: 5000,
                    contract_line_amount: 50000,
                  },
                },
              },
            ],
          }),
        },
        $transaction: async (fn) => fn(tx),
      },
    };
  };

  // 1. Blocked during role preview
  await assert.rejects(
    () =>
      bridge.populateWorkspaceAwardedBoqFromVerifiedDocument(makeMockPrisma(50000).prisma, {
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        actorUserId: 'u1',
        actorRole: 'SUPER_ADMIN',
        simulatedRole: 'PROJECT_MANAGER',
        confirmationNote: 'Reconciled awarded contract BOQ',
      }),
    /UBOQ_ROLE_PREVIEW_BLOCKED/
  );

  // 2. Blocked when official contractAmount is 0 (PGH safeguard!)
  await assert.rejects(
    () =>
      bridge.populateWorkspaceAwardedBoqFromVerifiedDocument(makeMockPrisma(0).prisma, {
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        actorUserId: 'u1',
        actorRole: 'SUPER_ADMIN',
        confirmationNote: 'Reconciled awarded contract BOQ',
      }),
    /UBOQ_AWARDED_CONTRACT_AMOUNT_REQUIRED/
  );

  // 3. Blocked when recalculated total != official contract amount
  await assert.rejects(
    () =>
      bridge.populateWorkspaceAwardedBoqFromVerifiedDocument(makeMockPrisma(48000).prisma, {
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        actorUserId: 'u1',
        actorRole: 'SUPER_ADMIN',
        confirmationNote: 'Reconciled awarded contract BOQ',
      }),
    /UBOQ_AWARDED_BOQ_DISCREPANCIES_UNRESOLVED/
  );

  // 4. Succeeds cleanly on exact VERIFIED_MATCH, populates AwardedBOQItem + AuditLog, ZERO auto-posted PRRs/POs/VOs
  const okMock = makeMockPrisma(50000);
  const res = await bridge.populateWorkspaceAwardedBoqFromVerifiedDocument(okMock.prisma, {
    projectId: 'proj-1',
    sourceDocumentId: 'doc-1',
    actorUserId: 'u1',
    actorRole: 'SUPER_ADMIN',
    confirmationNote: 'Verified awarded contract BOQ',
  });
  assert.equal(res.insertedRowCount, 2);
  assert.equal(res.payItemCount, 1);
  assert.equal(res.headingCount, 1);
  assert.equal(res.reconciledTotal, 50000);
  assert.equal(res.officialAwardedContractAmount, 50000);
  assert.equal(okMock.auditLogs.length, 1);
  assert.equal(okMock.wasForbiddenCalled(), false);
});

test('July Project Workspace parity & signed RLS preserved in src/app/projects/[id]/page.tsx', () => {
  const pageSrc = read('src/app/projects/[id]/page.tsx');
  assert.match(pageSrc, /verifyOperationalSession/);
  assert.match(pageSrc, /withUboqRlsContext/);
  assert.match(pageSrc, /AwardedBoqReconciliationPanel/);
  assert.match(pageSrc, /Project Summary/);
  assert.match(pageSrc, /Contract Value & BOQ/);
  assert.match(pageSrc, /Procurement Benchmark/);
  assert.match(pageSrc, /Master Materials List/);
  assert.match(pageSrc, /Profitability Center/);
  assert.match(pageSrc, /Materials Control/);
  assert.match(pageSrc, /\/scheduling/);
  assert.match(pageSrc, /withUboqRlsContext\(rlsCtx,\s*\(\)\s*=>\s*ProjectSummaryTab/);
  assert.match(pageSrc, /withUboqRlsContext\(rlsCtx,\s*\(\)\s*=>\s*BOQConsolidationTab/);
  assert.match(pageSrc, /withUboqRlsContext\(rlsCtx,\s*\(\)\s*=>\s*ProjectMaterialsControlTab/);
});

test('All 13/13 accepted R2 canonical baseline source files remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(read('docs/uboq/phase9-accepted-baseline-ledger.json'));
  for (const s of ledger.acceptedSources) {
    const raw = read(s.path).replace(/\r\n/g, '\n');
    const actual = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `Modified frozen baseline file: ${s.path}`);
  }
});
