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
  fs.writeFileSync(probe, `import * as m from ${JSON.stringify(mod)};\nconst out: any = {};\n${body}\nconsole.log('PROBE=' + JSON.stringify(out));\nprocess.exit(0);\n`);
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
