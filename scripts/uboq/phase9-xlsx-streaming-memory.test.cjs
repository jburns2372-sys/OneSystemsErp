'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const nm = [path.join(ROOT, 'node_modules'), path.resolve(ROOT, '../../node_modules')].find((c) =>
  fs.existsSync(path.join(c, 'tsx'))
);
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), 'utf8');

/** Builds a clean, spec-compliant ZIP archive (store or deflate) in memory for synthetic XLSX tests. */
function buildZip(entries) {
  const localParts = [];
  const cdParts = [];
  let offset = 0;

  // Standard CRC-32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c >>> 0;
  }
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  for (const { name, data, deflate = true } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const rawBuf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const compBuf = deflate ? zlib.deflateRawSync(rawBuf) : rawBuf;
    const method = deflate ? 8 : 0;
    const crc = crc32(rawBuf);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(compBuf.length, 18);
    lh.writeUInt32LE(rawBuf.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    localParts.push(lh, nameBuf, compBuf);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compBuf.length, 20);
    cd.writeUInt32LE(rawBuf.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt32LE(offset, 42);
    cdParts.push(cd, nameBuf);

    offset += lh.length + nameBuf.length + compBuf.length;
  }

  const cdBuf = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, cdBuf, eocd]);
}

function buildSyntheticXlsx({ sheets, sharedStrings = [], extraZipEntries = [] }) {
  const sheetXmlTags = sheets
    .map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');
  const relTags = sheets
    .map((_s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join('');
  const sstXml = `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">${sharedStrings
    .map((s) => `<si><t>${s}</t></si>`)
    .join('')}</sst>`;

  const zipEntries = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>' },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetXmlTags}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relTags}</Relationships>` },
    { name: 'xl/sharedStrings.xml', data: sstXml },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml })),
    ...extraZipEntries,
  ];
  return buildZip(zipEntries);
}

function runTsxProbe(body, { maxOldSpaceMB = 256 } = {}) {
  const probe = path.join(os.tmpdir(), `oserp-xlsx-probe-${process.pid}-${Date.now()}.ts`);
  const parsersMod = path.resolve(ROOT, 'src/lib/uboq/intake/parsers').replace(/\\/g, '/');
  const streamMod = path.resolve(ROOT, 'src/lib/uboq/intake/xlsx-streaming-reader').replace(/\\/g, '/');
  fs.writeFileSync(
    probe,
    `import * as parsers from ${JSON.stringify(parsersMod)};\nimport * as reader from ${JSON.stringify(streamMod)};\n(async () => {\nconst out: any = {};\n${body}\nconsole.log('PROBE=' + JSON.stringify(out));\nprocess.exit(0);\n})().catch((e) => { console.error(e); process.exit(1); });\n`
  );
  try {
    const res = spawnSync(
      process.execPath,
      [`--max-old-space-size=${maxOldSpaceMB}`, path.join(nm, 'tsx/dist/cli.mjs'), probe],
      { cwd: ROOT, encoding: 'utf8', timeout: 30000 }
    );
    const line = (res.stdout || '').split(/\r?\n/).find((l) => l.startsWith('PROBE='));
    assert.ok(line, `probe failed (exit=${res.status}): ${res.stderr}`);
    return JSON.parse(line.slice(6));
  } finally {
    fs.rmSync(probe, { force: true });
  }
}

test('P0 OOM regression: <col max="16384"/> + 120 externalLinks + 500 BOQ rows finishes in bounded memory (<256MB cap)', () => {
  const sst = ['Item No', 'Work Description', 'Unit', 'Qty', 'Unit Price', 'Amount', 'Concrete Footing', 'm3'];
  const rowXmlParts = [
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c></row>',
  ];
  for (let r = 2; r <= 501; r++) {
    rowXmlParts.push(
      `<row r="${r}"><c r="A${r}" t="inlineStr"><is><t>1.${r - 1}</t></is></c><c r="B${r}" t="s"><v>6</v></c><c r="C${r}" t="s"><v>7</v></c><c r="D${r}"><v>10</v></c><c r="E${r}"><v>5000</v></c><c r="F${r}"><f>D${r}*E${r}</f><v>50000</v></c></row>`
    );
  }
  const sheetXml = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:F501"/><cols><col min="1" max="6" width="20" style="1"/><col min="7" max="16384" width="12" style="1"/></cols><sheetData>${rowXmlParts.join('')}</sheetData></worksheet>`;
  const extraExternalLinks = Array.from({ length: 120 }, (_, i) => ({
    name: `xl/externalLinks/externalLink${i + 1}.xml`,
    data: `<externalLink>${'X'.repeat(4096)}</externalLink>`,
  }));
  const xlsxBuf = buildSyntheticXlsx({
    sheets: [{ name: 'BOQ', xml: sheetXml }],
    sharedStrings: sst,
    extraZipEntries: extraExternalLinks,
  });
  const tmpFile = path.join(os.tmpdir(), `oserp-oom-reg-${process.pid}.xlsx`);
  fs.writeFileSync(tmpFile, xlsxBuf);

  try {
    const out = runTsxProbe(
      `
      const fs = require('node:fs');
      const buf = fs.readFileSync(${JSON.stringify(tmpFile)});
      const t0 = Date.now();
      const stats = await reader.streamVerifiedXlsxWorksheets(buf, () => {});
      const ext = await parsers.extractUniversalDocumentPackage('pgh-oom-regression.xlsx', buf);
      out.ms = Date.now() - t0;
      out.heapMB = +(process.memoryUsage().heapUsed / 1048576).toFixed(1);
      out.skipped = stats.skippedNonDataEntries;
      out.candidates = ext.candidates.length;
      out.blocking = ext.blockingErrors;
      out.first = ext.candidates[0];
      `,
      { maxOldSpaceMB: 256 }
    );
    assert.equal(out.candidates, 500, 'all 500 BOQ rows must be extracted without silent truncation');
    assert.deepEqual(out.blocking, []);
    assert.ok(out.skipped >= 120, `expected >=120 skipped externalLinks entries, got ${out.skipped}`);
    assert.ok(out.heapMB < 180, `heap must stay well under 256MB cap (got ${out.heapMB}MB)`);
    assert.equal(out.first.sourceCellRef, 'BOQ!A2');
    assert.equal(out.first.rawFormulas.contract_line_amount, '=D2*E2');
    assert.equal(out.first.mappedFields.contract_line_amount, 50000);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
});

test('Complex multi-sheet DPWH workbook preserves sheet lineage, formulas, and catches formula DDE injection', () => {
  const sst = ['Item Code', 'Description', 'Unit', 'Qty', 'Unit Price', 'Amount', 'Site Clearing', 'sq.m', 'Rebar Works', 'kg'];
  const sheetA = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>A.1</t></is></c><c r="B2" t="s"><v>6</v></c><c r="C2" t="s"><v>7</v></c><c r="D2"><v>100</v></c><c r="E2"><v>250</v></c><c r="F2"><f>D2*E2</f><v>25000</v></c></row>
  </sheetData></worksheet>`;
  const sheetB = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>B.1</t></is></c><c r="B2" t="s"><v>8</v></c><c r="C2" t="s"><v>9</v></c><c r="D2"><v>500</v></c><c r="E2"><v>80</v></c><c r="F2"><f>D2*E2</f><v>40000</v></c></row>
  </sheetData></worksheet>`;
  const sheetNotes = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>General Notes</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>All works conform to DPWH Blue Book</t></is></c></row>
  </sheetData></worksheet>`;
  const multiBuf = buildSyntheticXlsx({
    sheets: [
      { name: 'BOQ - Part A', xml: sheetA },
      { name: 'BOQ - Part B', xml: sheetB },
      { name: 'General Notes', xml: sheetNotes },
    ],
    sharedStrings: sst,
  });

  const ddeSheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>1.1</t></is></c><c r="B2" t="str"><f>CMD|'/C calc'!A0</f><v>evil</v></c><c r="C2" t="s"><v>7</v></c><c r="D2"><v>1</v></c></row>
  </sheetData></worksheet>`;
  const ddeBuf = buildSyntheticXlsx({ sheets: [{ name: 'BOQ', xml: ddeSheet }], sharedStrings: sst });

  const tmpMulti = path.join(os.tmpdir(), `oserp-multi-${process.pid}.xlsx`);
  const tmpDde = path.join(os.tmpdir(), `oserp-dde-${process.pid}.xlsx`);
  fs.writeFileSync(tmpMulti, multiBuf);
  fs.writeFileSync(tmpDde, ddeBuf);

  try {
    const out = runTsxProbe(`
      const fs = require('node:fs');
      const mRes = await parsers.extractUniversalDocumentPackage('dpwh-multi.xlsx', fs.readFileSync(${JSON.stringify(tmpMulti)}));
      const dRes = await parsers.extractUniversalDocumentPackage('dde-test.xlsx', fs.readFileSync(${JSON.stringify(tmpDde)}));
      out.multiSheets = mRes.sections.map((s) => s.sheetOrPageRef);
      out.multiCandidates = mRes.candidates.map((c) => ({ sheet: c.sheetOrPageRef, ref: c.sourceCellRef, desc: c.mappedFields.work_description, amt: c.mappedFields.contract_line_amount }));
      out.ddeAlerts = dRes.candidates.flatMap((c) => c.securityAlerts);
      out.ddeBlocking = dRes.blockingErrors;
    `);
    assert.deepEqual(out.multiSheets, ['BOQ - Part A', 'BOQ - Part B', 'General Notes']);
    // General Notes has no BOQ headers so zero unrelated supporting-sheet rows leak as BOQ candidates
    assert.equal(out.multiCandidates.length, 2);
    assert.equal(out.multiCandidates[0].ref, 'BOQ - Part A!A2');
    assert.equal(out.multiCandidates[1].ref, 'BOQ - Part B!A2');
    assert.ok(
      out.ddeBlocking.some((e) => e.includes('UBOQ_VAL01_FORMULA_INJECTION')),
      `Expected DDE formula injection to be blocked, got blocking=${JSON.stringify(out.ddeBlocking)}`
    );
  } finally {
    fs.rmSync(tmpMulti, { force: true });
    fs.rmSync(tmpDde, { force: true });
  }
});

test('Explicit aggregate resource limits fail cleanly with UBOQ_XLSX_LIMIT_EXCEEDED (never OOM or silent truncation)', () => {
  const sheetXml = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Item</t></is></c><c r="B1" t="inlineStr"><is><t>Desc</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>1</t></is></c><c r="B2" t="inlineStr"><is><t>Row 2</t></is></c></row>
    <row r="3"><c r="A3" t="inlineStr"><is><t>2</t></is></c><c r="B3" t="inlineStr"><is><t>Row 3</t></is></c></row>
  </sheetData></worksheet>`;
  const buf = buildSyntheticXlsx({ sheets: [{ name: 'BOQ', xml: sheetXml }] });
  const tmpFile = path.join(os.tmpdir(), `oserp-lim-${process.pid}.xlsx`);
  fs.writeFileSync(tmpFile, buf);

  try {
    const out = runTsxProbe(`
      const fs = require('node:fs');
      const buf = fs.readFileSync(${JSON.stringify(tmpFile)});
      try {
        await reader.streamVerifiedXlsxWorksheets(buf, () => {}, { maxTotalCells: 3 });
      } catch (e) { out.cellErr = (e as Error).message; }
      try {
        await reader.streamVerifiedXlsxWorksheets(buf, () => {}, { maxSheetRows: 2 });
      } catch (e) { out.rowErr = (e as Error).message; }
    `);
    assert.match(out.cellErr, /^UBOQ_XLSX_LIMIT_EXCEEDED:/);
    assert.match(out.rowErr, /^UBOQ_XLSX_LIMIT_EXCEEDED:/);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
});

test('Priority 5: Topbar binds signed RLS context for activeProjectId and avoids false "No projects created yet" message', () => {
  const topbar = read('src/components/layout/Topbar.tsx');
  assert.match(topbar, /withUboqRlsContext/);
  assert.match(topbar, /activeProjectId/);
  const selector = read('src/components/layout/ActiveProjectSelector.tsx');
  assert.doesNotMatch(selector, /No projects created yet/);
  assert.match(selector, /router\.refresh\(\)/);
  const startBtn = read('src/app/projects/ProjectStartButton.tsx');
  assert.match(startBtn, /setActiveProjectCookie/);
  const intakeRoute = read('src/app/api/uboq/intake/route.ts');
  assert.match(intakeRoute, /UBOQ_XLSX_LIMIT_EXCEEDED/);
  assert.match(intakeRoute, /422/);
});

test('13/13 accepted R2 canonical baseline source files remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(read('docs/uboq/phase9-accepted-baseline-ledger.json'));
  for (const s of ledger.acceptedSources) {
    const raw = read(s.path).replace(/\r\n/g, '\n');
    const actual = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `Modified frozen baseline file: ${s.path}`);
  }
});
