'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');

const TEST_SECRET = 'phase9-bypass-synthetic-hmac-secret-0001';
const BYPASS = 'AbCdEfGhIjKlMnOpQrStUvWxYz012345'; // synthetic 32-char alnum test value
const BACKEND = 'https://backend-preview.example.vercel.app';
const FRONTEND_HOST = 'frontend-preview.example.vercel.app';

function loadTs(file, deps, env) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exportsObj = {};
  vm.runInNewContext(
    compiled.outputText,
    {
      exports: exportsObj,
      Buffer,
      Headers,
      URL,
      FormData,
      console,
      process: { env },
      require: (name) => {
        if (Object.hasOwn(deps, name)) return deps[name];
        throw new Error(`Unmocked dependency prohibited: ${name}`);
      },
    },
    { filename: file }
  );
  return exportsObj;
}

function load(env, backendUrl = BACKEND) {
  return loadTs(
    'src/lib/backendAuth.ts',
    {
      crypto,
      'next/headers': {
        cookies: async () => ({ get: () => undefined, getAll: () => [] }),
      },
      '@/lib/dal/auth': {
        verifySession: async () => ({ id: 'actor-1', role: 'PROJECT_MANAGER', sessionVersion: 3, mustChangePassword: false }),
      },
      '@/lib/backendUrl': {
        getBackendUrl: () => backendUrl,
        isTrustedFirstPartyBackendUrl: () => true,
      },
    },
    env
  );
}

const baseEnv = {
  AUTH_SECRET: TEST_SECRET,
  AWS_BACKEND_URL: BACKEND,
  AWS_BACKEND_PROTECTION_BYPASS_SECRET: BYPASS,
  VERCEL_ENV: 'preview',
  VERCEL_URL: FRONTEND_HOST,
};

test('Preview: bypass header forwarded only to pinned backend host, alongside HMAC auth', async () => {
  const mod = load(baseEnv);
  const built = await mod.buildAuthenticatedBackendRequest('/api/projects/dashboard-stats', {
    headers: { 'x-vercel-protection-bypass': 'caller-supplied-should-be-replaced' },
  });
  const h = new Headers(built.init.headers);
  assert.equal(h.get('x-vercel-protection-bypass'), BYPASS);
  assert.ok(h.get('x-internal-auth')?.startsWith('v1.'), 'HMAC x-internal-auth must still be sent');
  assert.equal(built.init.redirect, 'manual');
});

test('bypass is never forwarded in Production, local, non-pinned hosts, self host, http, or malformed secret', async () => {
  const cases = [
    ['production', { ...baseEnv, VERCEL_ENV: 'production' }, BACKEND],
    ['local', { ...baseEnv, VERCEL_ENV: undefined }, BACKEND],
    ['missing secret', { ...baseEnv, AWS_BACKEND_PROTECTION_BYPASS_SECRET: '' }, BACKEND],
    ['malformed secret', { ...baseEnv, AWS_BACKEND_PROTECTION_BYPASS_SECRET: 'short' }, BACKEND],
    ['self host', { ...baseEnv, AWS_BACKEND_URL: `https://${FRONTEND_HOST}` }, `https://${FRONTEND_HOST}`],
    ['http pinned', { ...baseEnv, AWS_BACKEND_URL: 'http://backend-preview.example.vercel.app' }, 'http://backend-preview.example.vercel.app'],
  ];
  for (const [label, env, url] of cases) {
    const mod = load(env, url);
    const built = await mod.buildAuthenticatedBackendRequest('/api/projects/dashboard-stats', {
      headers: { 'x-vercel-protection-bypass': 'caller-supplied' },
    });
    const h = new Headers(built.init.headers);
    assert.equal(h.get('x-vercel-protection-bypass'), null, `${label}: bypass must not be forwarded`);
  }

  const mod = load(baseEnv);
  assert.equal(mod.resolvePinnedPreviewBackendBypass('https://attacker.example.com/api/projects'), null);
  assert.equal(mod.resolvePinnedPreviewBackendBypass(`${BACKEND}.attacker.example/api`), null);
  assert.equal(mod.resolvePinnedPreviewBackendBypass(`${BACKEND}/api/uboq`), BYPASS);
});

test('bypass secret is server-only and never exposed via NEXT_PUBLIC_ or committed values', () => {
  const src = fs.readFileSync('src/lib/backendAuth.ts', 'utf8');
  assert.match(src, /process\.env\.AWS_BACKEND_PROTECTION_BYPASS_SECRET/);
  assert.doesNotMatch(src, /NEXT_PUBLIC_[A-Z_]*BYPASS/);
  let tracked = '';
  try {
    tracked = require('node:child_process')
      .execFileSync('git', ['grep', '-l', '-E', 'NEXT_PUBLIC_[A-Z_]*BYPASS', '--', 'src', 'apps'], { encoding: 'utf8' })
      .trim();
  } catch (err) {
    if (err.status !== 1) throw err; // exit 1 == no matches
  }
  assert.equal(tracked, '');
});
