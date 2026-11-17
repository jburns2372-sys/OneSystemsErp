'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
const test = require('node:test');
const assert = require('node:assert/strict');

function provider(user) {
  let captured;
  const calls = { compare: 0, update: 0 };
  const compiled = ts.transpileModule(fs.readFileSync('src/auth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const prisma = { user: {
    findFirst: async () => user,
    update: async () => { calls.update++; return user; },
  } };
  const dependencies = {
    'next-auth': { __esModule: true, default: config => { captured = config; return {}; } },
    'next-auth/providers/credentials': { __esModule: true, default: config => config },
    'bcryptjs': { __esModule: true, default: { compare: async (...args) => {
      calls.compare++; return bcrypt.compare(...args);
    } } },
    '@/lib/prisma': { prisma },
    './auth.config': { authConfig: {} },
  };
  vm.runInNewContext(compiled, { exports: {}, console: { log() {} },
    require: name => { assert.ok(dependencies[name], 'Unexpected auth dependency'); return dependencies[name]; } });
  return { authorize: captured.providers[0].authorize, calls };
}
function account(extra) {
  return { id: 'synthetic-test-account', role: 'SUPER_ADMIN', status: 'ACTIVE', lockedUntil: null,
    passwordHash: null, sessionVersion: 2, mustChangePassword: false, failedLoginAttempts: 0, ...extra };
}
test('unactivated account returns credential rejection without bcrypt or a forbidden write', async () => {
  const p = provider(account());
  const result = await p.authorize({ email: 'synthetic@example.invalid', password: crypto.randomBytes(24).toString('hex') });
  assert.equal(result, null);
  assert.deepEqual(p.calls, { compare: 0, update: 0 });
});
test('activated account with valid password authenticates without failed-attempt writes', async () => {
  const secret = crypto.randomBytes(24).toString('hex');
  const p = provider(account({ passwordHash: await bcrypt.hash(secret, 10) }));
  const result = await p.authorize({ email: 'synthetic@example.invalid', password: secret });
  assert.equal(result.role, 'SUPER_ADMIN');
  assert.equal(result.sessionVersion, 2);
  assert.equal(result.mustChangePassword, false);
  assert.deepEqual(p.calls, { compare: 1, update: 0 });
});
test('wrong password on an activated account still follows existing failed-attempt semantics', async () => {
  const p = provider(account({ passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10) }));
  assert.equal(await p.authorize({ email: 'synthetic@example.invalid', password: crypto.randomBytes(24).toString('hex') }), null);
  assert.deepEqual(p.calls, { compare: 1, update: 1 });
});
