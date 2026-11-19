'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const BACKEND_ROOT = path.resolve(ROOT, 'apps', 'aws-backend');

function findLegacyApiRoutes(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return findLegacyApiRoutes(filename);
    return entry.isFile()
      && /\.(?:[cm]?[jt]s|[jt]sx)$/i.test(entry.name)
      && !/\.d\.[cm]?ts$/i.test(entry.name)
      ? [path.relative(BACKEND_ROOT, filename)]
      : [];
  });
}

test('apps/aws-backend Vercel packaging is non-destructive and preserves native Express routes', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BACKEND_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts?.build, 'prisma generate --schema=../../prisma/schema.prisma');
  assert.equal(pkg.scripts?.postinstall, 'prisma generate --schema=../../prisma/schema.prisma');
  for (const [name, script] of Object.entries(pkg.scripts || {})) {
    assert.doesNotMatch(
      String(script),
      /db\s+push|--accept-data-loss|migrate\s+reset/i,
      `Backend script "${name}" must never run destructive database commands`
    );
  }

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(BACKEND_ROOT, 'vercel.json'), 'utf8'));
  assert.equal(vercelConfig.framework, 'express');
  assert.equal(vercelConfig.rewrites, undefined, 'Native Express routing must preserve /health and /api/* paths');

  const nativeEntry = path.join(BACKEND_ROOT, 'src', 'index.ts');
  assert.ok(fs.existsSync(nativeEntry), 'Native Express must have a discoverable src/index.ts entrypoint');
  const indexSrc = fs.readFileSync(nativeEntry, 'utf8');
  assert.match(indexSrc, /import\s+express\s+from\s*['"]express['"]/);
  assert.match(indexSrc, /if\s*\(\s*!process\.env\.VERCEL\s*\)/);
  assert.match(indexSrc, /export\s+default\s+app\b/);

  // Vercel emits separate functions for legacy api/ files. Those functions can
  // claim /api paths before the native Express app, leaving nested API routes at 404.
  assert.deepEqual(
    findLegacyApiRoutes(path.join(BACKEND_ROOT, 'api')).sort(),
    [],
    'Native Express must own /api/* routing; remove legacy api/ JS/TS function routes, including api/index.ts bridges'
  );

  for (const dep of [
    '@aws-sdk/client-cognito-identity-provider',
    '@tesseract.js-data/eng',
    'bcryptjs',
    'csv-parse',
    'next',
    'pdf-parse',
    'sharp',
    'tesseract.js',
    'xlsx',
  ]) {
    assert.ok(pkg.dependencies?.[dep], `apps/aws-backend/package.json must declare runtime dependency "${dep}"`);
  }

  for (const routeFile of ['documentActions.ts', 'accomplishmentFileActions.ts']) {
    const src = fs.readFileSync(path.join(BACKEND_ROOT, 'src', 'routes', routeFile), 'utf8');
    assert.match(src, /SERVERLESS_LEGACY_UPLOAD_UNSUPPORTED/, `${routeFile} must fail closed on Vercel serverless runtime`);
    assert.match(src, /status\(501\)/, `${routeFile} must return 501 for unsupported serverless base64 JSON uploads`);
  }

  const accSrc = fs.readFileSync(path.join(BACKEND_ROOT, 'src', 'routes', 'accomplishmentFileActions.ts'), 'utf8');
  assert.match(accSrc, /req\.path\.replace\(\/\\\/\+\$\/,\s*''\)\.toLowerCase\(\)/);
  for (const writePath of [
    '/uploadaccomplishmentfileaction',
    '/createworkingcopyaction',
    '/savefileeditaction',
    '/saveasnewaccomplishmentfileaction',
    '/createsuccessivebillingaction',
  ]) {
    assert.ok(
      accSrc.includes(`'${writePath}'`),
      `accomplishmentFileActions.ts serverless 501 middleware must cover normalized ${writePath}`
    );
  }
});
