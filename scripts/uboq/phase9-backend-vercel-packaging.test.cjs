'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const BACKEND_ROOT = path.resolve(ROOT, 'apps', 'aws-backend');

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

  const apiEntry = fs.readFileSync(path.join(BACKEND_ROOT, 'api', 'index.ts'), 'utf8');
  assert.match(apiEntry, /export\s*\{\s*default\s*\}\s*from\s*['"]\.\.\/src\/index['"]/);

  const indexSrc = fs.readFileSync(path.join(BACKEND_ROOT, 'src', 'index.ts'), 'utf8');
  assert.match(indexSrc, /if\s*\(\s*!process\.env\.VERCEL\s*\)/);
  assert.match(indexSrc, /export\s+default\s+app\b/);

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
