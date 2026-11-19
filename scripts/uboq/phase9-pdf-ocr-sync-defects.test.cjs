'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.resolve(ROOT, p), 'utf8');

test('P9-DEF-PDF-01 / OCR-01: REAL extraction — native PDF rows, PNG OCR text+confidence, bounded worker termination', () => {
  const tsxCli = [
    path.resolve(ROOT, 'node_modules/tsx/dist/cli.mjs'),
    path.resolve(ROOT, '../../node_modules/tsx/dist/cli.mjs'),
  ].find((p) => fs.existsSync(p));
  assert.ok(tsxCli, 'tsx runner not found');
  const res = spawnSync(process.execPath, [tsxCli, 'scripts/uboq/phase9-real-extraction-harness.ts'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000,
  });
  const line = (res.stdout || '').split(/\r?\n/).find((l) => l.startsWith('HARNESS_RESULT='));
  assert.ok(line, `harness produced no result: ${res.stderr}`);
  const out = JSON.parse(line.slice('HARNESS_RESULT='.length));

  // Native PDF: actual BOQ rows with canonical fields and PDF coordinates (not just "no error")
  assert.deepEqual(out.pdf.blockingErrors, []);
  assert.equal(out.pdf.candidateCount, 2);
  assert.deepEqual(out.pdf.methods, ['NATIVE_PDF_PARSER']);
  assert.equal(out.pdf.sample[0].fields.item_code, '900(1)');
  assert.equal(out.pdf.sample[0].fields.approved_qty, 50);
  assert.equal(out.pdf.sample[0].fields.contract_line_amount, 325000);
  assert.match(out.pdf.sample[0].ref, /PAGE_1!.*x=40,y=715/);
  assert.equal(out.pdf.sample[1].fields.work_description, 'Reinforcing Steel Grade 60');

  // PNG OCR: real raster OCR ran to completion in bounded time; low-confidence output keeps human review ON
  assert.deepEqual(out.png.blockingErrors, []);
  assert.deepEqual(out.png.methods, ['OCR_RASTER']);
  assert.ok(out.png.ms < 60000, 'OCR must finish well inside the bounded timeout');
  assert.ok(out.png.candidateCount >= 1);
  for (const c of out.png.sample) {
    if (c.conf < 0.9) assert.equal(c.review, true, 'low-confidence OCR must require human review');
  }

  // Bounded timeout: rejects with UBOQ_OCR_TIMEOUT AND invokes worker termination hook
  assert.equal(out.timeout.terminated, true);
  assert.match(out.timeout.timeoutError, /UBOQ_OCR_TIMEOUT/);
  assert.ok(out.timeout.elapsedMs < 5000);
});

test('P9-DEF-PDF-01: parsers use embedded pdf-parse worker (no runtime .mjs file dependency); scanner preserved', () => {
  const src = read('src/lib/uboq/intake/parsers.ts');
  assert.match(src, /import\('pdf-parse\/worker'\)/);
  assert.match(src, /PDFParse\.setWorker\(workerModule\.getData\(\)\)/);
  assert.match(src, /scanUploadedDocumentSecurity/);
  const ocr = read('src/lib/uboq/intake/ocr-engine.ts');
  assert.match(ocr, /workerPath/);
  assert.match(ocr, /UBOQ_OCR_INIT_TIMEOUT_MS/);
  assert.match(ocr, /terminateWorker/);
});

test('P9-DEF-OCR-01: serverless asset tracing declared for Next routes and Express backend', () => {
  const cfg = read('next.config.ts');
  assert.match(cfg, /outputFileTracingIncludes/);
  assert.match(cfg, /\/api\/uboq\/intake/);
  assert.match(cfg, /tesseract\.js-core/);
  assert.match(cfg, /@tesseract\.js-data\/eng\/4\.0\.0_best_int/);
  const hints = read('apps/aws-backend/src/lib/uboq/ocrAssetTracing.ts');
  assert.match(hints, /require\.resolve\('tesseract\.js\/src\/worker-script\/node\/index\.js'\)/);
  assert.match(hints, /eng\.traineddata\.gz/);
  assert.match(read('apps/aws-backend/src/routes/uboq.ts'), /registerOcrAssetTracingHints/);
});

test('P9-DEF-SYNC-01: Next /api/uboq/intake APPROVE_SNAPSHOT uses same sync hook, authorization and idempotent adapter', () => {
  const route = read('src/app/api/uboq/intake/route.ts');
  const approveBlock = route.slice(route.indexOf("action === 'APPROVE_SNAPSHOT'"), route.indexOf("action === 'SYNC_SCHEDULE_LINKS'"));
  assert.match(approveBlock, /UBOQ_SNAPSHOT_APPROVE/);
  assert.match(approveBlock, /snap\.projectId !== projectId/);
  assert.match(approveBlock, /tryAutoSyncProjectScheduleLinks/);
  assert.match(approveBlock, /scheduleLinkSync/);
  // consistency with the other two approval entry points
  assert.match(read('src/app/actions/uboq/index.ts'), /tryAutoSyncProjectScheduleLinks/);
  assert.match(read('apps/aws-backend/src/routes/uboq.ts'), /const scheduleLinkSync = await tryAutoSyncProjectScheduleLinks/);
  // schedule-created-AFTER-approval path (authorized, explicit synced:false reporting)
  const syncBlock = route.slice(route.indexOf("action === 'SYNC_SCHEDULE_LINKS'"));
  assert.match(syncBlock, /UBOQ_INTAKE_STAGE/);
  assert.match(syncBlock, /tryAutoSyncProjectScheduleLinks/);
  assert.match(read('apps/aws-backend/src/routes/uboq.ts'), /'\/project\/:projectId\/sync-schedule-links'/);
  // frozen scheduling internals untouched
  assert.doesNotMatch(route, /scheduleWorkflow|aiOrchestrator|classificationEngine/);
});

test('13/13 accepted R2 canonical baseline sources remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(read('docs/uboq/phase9-accepted-baseline-ledger.json'));
  for (const s of ledger.acceptedSources) {
    const raw = read(s.path).replace(/\r\n/g, '\n');
    const actual = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `modified: ${s.path}`);
  }
});
