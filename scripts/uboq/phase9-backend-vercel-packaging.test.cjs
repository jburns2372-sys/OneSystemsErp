'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const BACKEND_ROOT = path.resolve(ROOT, 'apps', 'aws-backend');

test('apps/aws-backend Vercel packaging is non-destructive and routes all paths to Express entrypoint', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BACKEND_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts?.build, 'prisma generate');
  assert.equal(pkg.scripts?.postinstall, 'prisma generate');
  for (const [name, script] of Object.entries(pkg.scripts || {})) {
    assert.doesNotMatch(
      String(script),
      /db\s+push|--accept-data-loss|migrate\s+reset/i,
      `Backend script "${name}" must never run destructive database commands`
    );
  }

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(BACKEND_ROOT, 'vercel.json'), 'utf8'));
  assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json must declare rewrites');
  assert.deepEqual(vercelConfig.rewrites, [{ source: '/(.*)', destination: '/api' }]);

  const apiEntry = fs.readFileSync(path.join(BACKEND_ROOT, 'api', 'index.ts'), 'utf8');
  assert.match(apiEntry, /export\s*\{\s*default\s*\}\s*from\s*['"]\.\.\/src\/index['"]/);

  const indexSrc = fs.readFileSync(path.join(BACKEND_ROOT, 'src', 'index.ts'), 'utf8');
  assert.match(indexSrc, /if\s*\(\s*!process\.env\.VERCEL\s*\)/);
  assert.match(indexSrc, /export\s+default\s+app\b/);
});
