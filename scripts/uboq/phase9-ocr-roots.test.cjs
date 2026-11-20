'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = process.cwd();
const nm = [path.join(ROOT, 'node_modules'), path.resolve(ROOT, '../../node_modules')].find((c) => fs.existsSync(path.join(c, 'tesseract.js')));

function runProbe(body) {
  const probe = path.join(os.tmpdir(), `oserp-roots-probe-${process.pid}-${Date.now()}.ts`);
  const mod = path.resolve(ROOT, 'src/lib/uboq/intake/ocr-engine').replace(/\\/g, '/');
  fs.writeFileSync(
    probe,
    `import * as m from ${JSON.stringify(mod)};\n(async () => {\nconst out: any = {};\n${body}\nconsole.log('PROBE=' + JSON.stringify(out));\nprocess.exit(0);\n})().catch((e) => { console.error(e); process.exit(1); });\n`
  );
  try {
    const res = spawnSync(process.execPath, [path.join(nm, 'tsx/dist/cli.mjs'), probe], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
    const line = (res.stdout || '').split(/\r?\n/).find((l) => l.startsWith('PROBE='));
    assert.ok(line, res.stderr);
    return JSON.parse(line.slice(6));
  } finally { fs.rmSync(probe, { force: true }); }
}

test('OCR roots: assets resolve from a nested apps/aws-backend/node_modules layout reached by ancestor walk', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-layout-'));
  try {
    const base = path.join(tmp, 'apps', 'aws-backend', 'node_modules');
    fs.mkdirSync(path.join(base, '@tesseract.js-data', 'eng', '4.0.0_best_int'), { recursive: true });
    fs.copyFileSync(path.join(nm, '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'), path.join(base, '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'));
    fs.mkdirSync(path.join(base, 'tesseract.js/src/worker-script/node'), { recursive: true });
    fs.copyFileSync(path.join(nm, 'tesseract.js/src/worker-script/node/index.js'), path.join(base, 'tesseract.js/src/worker-script/node/index.js'));
    const deepCwd = path.join(tmp, 'apps', 'aws-backend', 'src', 'lib');
    fs.mkdirSync(deepCwd, { recursive: true });
    const out = runProbe(`
      const roots = m.nodeModulesRoots([${JSON.stringify(deepCwd)}]);
      out.lang = m.resolveOfflineTesseractLangPath(roots);
      out.worker = m.resolveTesseractWorkerScript(roots);
    `);
    assert.match(out.lang.replace(/\\/g, '/'), /apps\/aws-backend\/node_modules\/@tesseract\.js-data\/eng\/4\.0\.0_best_int$/);
    assert.match(out.worker.replace(/\\/g, '/'), /apps\/aws-backend\/node_modules\/tesseract\.js\/src\/worker-script\/node\/index\.js$/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('OCR roots: missing assets fail immediately with clean client error (NO paths/layout leaked) and log diagnostics server-side only', () => {
  const out = runProbe(`
    const errLogs: string[] = [];
    const origErr = console.error;
    console.error = (...args: unknown[]) => { errLogs.push(args.map(String).join(' ')); };
    const t = Date.now();
    try { m.resolveOfflineTesseractLangPath([]); } catch (e) { out.lang = (e as Error).message; }
    try { m.resolveTesseractWorkerScript([]); } catch (e) { out.worker = (e as Error).message; }
    out.ms = Date.now() - t;
    console.error = origErr;
    out.serverLogs = errLogs;
  `);
  // Client-facing thrown errors must contain ONLY clean codes — NEVER internal paths, cwd, or listings
  assert.equal(out.lang, 'UBOQ_OCR_TRAINEDDATA_MISSING: Offline @tesseract.js-data/eng traineddata not found');
  assert.equal(out.worker, 'UBOQ_OCR_WORKER_SCRIPT_MISSING: tesseract.js node worker script not found in deployed bundle');
  assert.doesNotMatch(out.lang + out.worker, /diagnostics=|cwd|moduleDir|existingRoots|cwdEntries|node_modules|[A-Z]:\\/i);
  assert.ok(out.ms < 2000);
  // Server-side console.error logs preserve non-secret layout diagnostics
  assert.equal(out.serverLogs.length, 2);
  assert.match(out.serverLogs[0], /\[UBOQ_OCR_TRAINEDDATA_MISSING\].*"cwd":/);
  assert.match(out.serverLogs[1], /\[UBOQ_OCR_WORKER_SCRIPT_MISSING\].*"existingRoots":/);
  assert.doesNotMatch(out.serverLogs.join(' '), /secret|token|password|AUTH_SECRET|postgres/i);

  // Shared ocr-engine.ts must NEVER contain static require.resolve(...gz) that breaks Next.js Turbopack
  const ocrSrc = fs.readFileSync(path.resolve(ROOT, 'src/lib/uboq/intake/ocr-engine.ts'), 'utf8');
  assert.doesNotMatch(ocrSrc, /require\.resolve\([^)]*\.gz/);
});

test('OCR runtime: bounded budget (< vercel maxDuration) + safe server-side stage trace on real PNG OCR', () => {
  const vcfg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'apps/aws-backend/vercel.json'), 'utf8'));
  const fnCfg = vcfg.functions['src/index.ts'];
  assert.equal(fnCfg.maxDuration, 60);
  assert.equal(fnCfg.memory, 2048);

  const out = runProbe(`
    const sharp = require(${JSON.stringify(path.join(nm, 'sharp'))});
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="180"><rect width="100%" height="100%" fill="white"/><text x="20" y="60" font-family="Arial" font-size="26" fill="black">1.1 | Concrete Footing | 10 | cu.m | 5000.00 | 50000.00</text></svg>';
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const traces: string[] = [];
    const origInfo = console.info;
    console.info = (...args: unknown[]) => { traces.push(args.map(String).join(' ')); };
    const grid = await m.runRasterImageOcr(png, 1);
    console.info = origInfo;
    out.initMs = m.UBOQ_OCR_INIT_TIMEOUT_MS;
    out.recMs = m.UBOQ_OCR_RECOGNIZE_TIMEOUT_MS;
    out.totalMs = m.UBOQ_OCR_TOTAL_BUDGET_MS;
    out.cleanupMs = m.UBOQ_OCR_CLEANUP_TIMEOUT_MS;
    out.rows = grid.rows.length;
    out.conf = grid.overallConfidence;
    out.traces = traces;
  `);

  assert.ok(out.initMs + out.recMs <= out.totalMs);
  assert.ok(out.totalMs + out.cleanupMs < fnCfg.maxDuration * 1000);
  assert.ok(out.rows >= 1, 'real OCR must recognize at least 1 row');
  assert.ok(out.conf > 0.3, 'real OCR must report genuine confidence');

  const stages = out.traces
    .filter((l) => l.includes('[UBOQ_OCR_TRACE]'))
    .map((l) => JSON.parse(l.slice(l.indexOf('{'))));
  const stageNames = stages.map((s) => s.stage);
  for (const required of [
    'request_received',
    'image_preprocessing_completed',
    'traineddata_verified',
    'worker_script_verified',
    'create_worker_started',
    'create_worker_completed',
    'recognize_started',
    'recognize_completed',
    'worker_cleanup_completed',
  ]) {
    assert.ok(stageNames.includes(required), `missing required trace stage: ${required}`);
  }
  const joined = out.traces.join(' ');
  assert.doesNotMatch(joined, /node_modules|Concrete|Footing|50000|AUTH_SECRET|postgres|[A-Z]:\\/i);
});

test('OCR runtime: real worker_threads stall is actively terminated and crash rejects cleanly with zero path leak', () => {
  const stallScript = path.join(os.tmpdir(), `oserp-ocr-stall-${process.pid}.cjs`);
  const crashScript = path.join(os.tmpdir(), `oserp-ocr-crash-${process.pid}.cjs`);
  fs.writeFileSync(stallScript, 'setInterval(() => {}, 1000);\n');
  fs.writeFileSync(crashScript, 'throw new Error("simulated /var/task/secret/path failure");\n');
  try {
    const out = runProbe(`
      const t1 = Date.now();
      try {
        await m.executeBoundedTesseractWorker({
          workerPath: ${JSON.stringify(stallScript)},
          langPath: '',
          normalizedPng: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
          pageNumber: 1,
          startedAt: t1,
          initTimeoutMs: 250,
          recognizeTimeoutMs: 250,
          totalBudgetMs: 500,
        });
      } catch (e) {
        out.stallErr = (e as Error).message;
        out.stallMs = Date.now() - t1;
      }
      const t2 = Date.now();
      try {
        await m.executeBoundedTesseractWorker({
          workerPath: ${JSON.stringify(crashScript)},
          langPath: '',
          normalizedPng: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
          pageNumber: 1,
          startedAt: t2,
          initTimeoutMs: 3000,
          recognizeTimeoutMs: 3000,
          totalBudgetMs: 5000,
        });
      } catch (e) {
        out.crashErr = (e as Error).message;
        out.crashMs = Date.now() - t2;
      }
    `);
    assert.match(out.stallErr, /^UBOQ_OCR_TIMEOUT: OCR stage=create_worker_load exceeded/);
    assert.ok(out.stallMs < 3500, `stalled worker must terminate promptly (got ${out.stallMs}ms)`);
    assert.match(out.crashErr, /^UBOQ_OCR_WORKER_FAILED: OCR stage=worker_thread_(error|exit) failed$/);
    assert.doesNotMatch(out.crashErr + out.stallErr, /\/var\/task|secret|node_modules|[A-Z]:\\/i);
    assert.ok(out.crashMs < 3000, `crashed worker must reject promptly (got ${out.crashMs}ms)`);
  } finally {
    fs.rmSync(stallScript, { force: true });
    fs.rmSync(crashScript, { force: true });
  }
});
