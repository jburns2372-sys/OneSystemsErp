'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { config, identity, account, activate, TARGET } = require('./activate-preview-super-admin.cjs');

function fixture(overrides = {}) {
  const user = { id: TARGET.userId, email: TARGET.email, role: 'SUPER_ADMIN', status: 'ACTIVE',
    passwordHash: null, mustChangePassword: true, sessionVersion: 1, plaintext_null: true,
    passwordChangedAt: null, ...overrides.user };
  const calls = [];
  const db = { async query(sql, params) {
    calls.push({ sql, params });
    if (sql.includes('current_database()')) return { rows: [{ database: TARGET.database,
      project_id: TARGET.projectId, branch_id: TARGET.branchId, endpoint_id: TARGET.endpointId,
      migrations: 39, unfinished: 0, ...overrides.identity }] };
    if (sql.includes('FROM "User"')) return { rows: overrides.duplicate ? [{ ...user }, { ...user }] : [{ ...user }] };
    if (sql.startsWith('UPDATE "User"')) {
      user.passwordHash = params[0]; user.mustChangePassword = false; user.sessionVersion += 1;
      user.passwordChangedAt = new Date(); return { rowCount: 1 };
    }
    if (sql.includes('INSERT INTO "AuditLog"') && overrides.auditFails) throw new Error('simulated audit rejection');
    if (sql.includes('SELECT count(*)')) return { rows: [{ n: 0 }] };
    return { rows: [] };
  } };
  return { db, calls, user };
}
const fresh = () => crypto.randomBytes(24).toString('base64url');

test('rejects localhost, other endpoints, and wrong database before connecting', () => {
  for (const uri of ['postgresql://localhost/oserp_uboq_preview',
    'postgresql://ep-other.us-east-1.aws.neon.tech/oserp_uboq_preview',
    'postgresql://ep-small-paper-bcyvlhat.c-16.us-east-1.aws.neon.tech/neondb']) {
    assert.throws(() => config(uri), /PREVIEW_TARGET_MISMATCH/);
  }
});
test('fails closed for each mismatched live database identity component', async () => {
  for (const key of ['project_id', 'branch_id', 'endpoint_id', 'database']) {
    await assert.rejects(identity(fixture({ identity: { [key]: 'unexpected' } }).db), /DATABASE_IDENTITY_UNVERIFIED/);
  }
});
test('rejects duplicate accounts and changes to account ID, role, or status', async () => {
  await assert.rejects(account(fixture({ duplicate: true }).db), /EXPECTED_EXACTLY_ONE/);
  for (const user of [{ id: 'another-user' }, { role: 'ADMIN' }, { status: 'DISABLED' }]) {
    await assert.rejects(account(fixture({ user }).db), /OWNER_ACCOUNT_IDENTITY_MISMATCH/);
  }
});
test('existing password policy rejects invalid input before transaction or writes', async () => {
  const f = fixture();
  await assert.rejects(activate(f.db, ''), /APPLICATION_PASSWORD_POLICY_REJECTED/);
  await assert.rejects(activate(f.db, 'x'.repeat(73)), /PASSWORD_EXCEEDS_BCRYPT/);
  assert.equal(f.calls.length, 0);
});
test('already activated account cannot be overwritten', async () => {
  const f = fixture({ user: { passwordHash: 'existing', mustChangePassword: false } });
  await assert.rejects(activate(f.db, fresh()), /ACCOUNT_ALREADY_ACTIVATED/);
  assert.ok(f.calls.some(c => c.sql === 'ROLLBACK'));
  assert.ok(!f.calls.some(c => c.sql.startsWith('UPDATE')));
});
test('audit failure requests rollback and never commits', async () => {
  const f = fixture({ auditFails: true });
  await assert.rejects(activate(f.db, fresh()), /simulated audit rejection/);
  assert.ok(f.calls.some(c => c.sql === 'ROLLBACK'));
  assert.ok(!f.calls.some(c => c.sql === 'COMMIT'));
});
test('activation uses one guarded account update, revokes tokens, audits, and commits', async () => {
  const f = fixture();
  const result = await activate(f.db, fresh());
  assert.equal(result.passwordHashPresent, true);
  assert.equal(result.sessionVersion, 2);
  assert.equal(result.mustChangePassword, false);
  assert.equal(result.role, 'SUPER_ADMIN');
  assert.equal(result.status, 'ACTIVE');
  assert.ok(!Object.hasOwn(result, 'passwordHash'));
  assert.equal(f.calls.filter(c => c.sql.startsWith('UPDATE "User"')).length, 1);
  assert.ok(f.calls.some(c => c.sql.includes('"PasswordRecoveryToken" SET "revokedAt"')));
  assert.ok(f.calls.some(c => c.sql.includes("'PASSWORD_RECOVERY_COMPLETED'")));
  assert.equal(f.calls.at(-1).sql, 'COMMIT');
});
