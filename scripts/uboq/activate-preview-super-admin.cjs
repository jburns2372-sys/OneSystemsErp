'use strict';

// Owner-authorized activation of one existing Preview account. No Vercel API.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { createNeonWsClient, endPgClientBounded } = require('./neon-ws-transport.cjs');
require('tsx/cjs');
const { validatePasswordPolicy } = require('../../src/lib/passwordPolicy.ts');

const ROOT = path.resolve(__dirname, '../..');
const RECEIPT = path.join(ROOT, 'artifacts/uboq/phase8/preview-super-admin-activation-receipt.json');
const TARGET = Object.freeze({
  projectId: 'long-recipe-20782583',
  branchId: 'br-quiet-rice-bc1edkvd',
  endpointId: 'ep-small-paper-bcyvlhat',
  database: 'oserp_uboq_preview',
  userId: 'usr_owner_super_admin_1d29eee709f0',
  email: 'j.burns2372@gmail.com',
});
const HOSTS = ['ep-small-paper-bcyvlhat.c-16.us-east-1.aws.neon.tech',
  'ep-small-paper-bcyvlhat-pooler.c-16.us-east-1.aws.neon.tech'];
function guard(value, code) { if (!value) throw Object.assign(new Error(code), { safeCode: code }); }
function credential() {
  // DPAPI CurrentUser; plaintext is returned only to this child process's private pipe.
  try {
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      "Add-Type -AssemblyName System.Security; try { [Console]::Out.Write([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes('.env.preview-activation/credential.dpapi'),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))) } catch { exit 1 }"],
    { cwd: ROOT, encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch { throw Object.assign(new Error(), { safeCode: 'PREVIEW_DPAPI_CREDENTIAL_UNAVAILABLE' }); }
}
function config(raw) {
  let u;
  try { u = new URL(raw); } catch { guard(false, 'INVALID_CREDENTIAL_FORMAT'); }
  guard(['postgres:', 'postgresql:'].includes(u.protocol) && HOSTS.includes(u.hostname)
    && decodeURIComponent(u.pathname) === '/' + TARGET.database
    && (!u.port || u.port === '5432'), 'PREVIEW_TARGET_MISMATCH');
  guard(process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0', 'INSECURE_TLS_ENVIRONMENT');
  // Explicit TLS config avoids sslmode query parameters overriding certificate validation.
  return { host: u.hostname, port: 5432, database: TARGET.database,
    user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: true, servername: u.hostname },
    connectionTimeoutMillis: 12000, query_timeout: 15000,
    application_name: 'oserp_preview_owner_activation' };
}
async function identity(db) {
  const r = (await db.query(`SELECT current_database() AS database,
    current_setting('neon.project_id', true) AS project_id,
    current_setting('neon.branch_id', true) AS branch_id,
    current_setting('neon.endpoint_id', true) AS endpoint_id,
    (SELECT count(*)::int FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS migrations,
    (SELECT count(*)::int FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL) AS unfinished`)).rows[0];
  guard(r.database === TARGET.database && r.project_id === TARGET.projectId
    && r.branch_id === TARGET.branchId && r.endpoint_id === TARGET.endpointId, 'DATABASE_IDENTITY_UNVERIFIED');
  guard(r.migrations === 39 && r.unfinished === 0, 'PREVIEW_MIGRATION_STATE_MISMATCH');
  return { projectId: r.project_id, branchId: r.branch_id, endpointId: r.endpoint_id,
    database: r.database, finishedMigrations: r.migrations, verifiedAt: new Date().toISOString() };
}
async function account(db, lock = false) {
  const rows = (await db.query(`SELECT id, email, role, status, "passwordHash",
    "mustChangePassword", "sessionVersion", "passwordChangedAt", password IS NULL AS plaintext_null
    FROM "User" WHERE lower(email) = lower($1)${lock ? ' FOR UPDATE' : ''}`, [TARGET.email])).rows;
  guard(rows.length === 1, 'EXPECTED_EXACTLY_ONE_OWNER_ACCOUNT');
  const u = rows[0];
  guard(u.id === TARGET.userId && u.role === 'SUPER_ADMIN' && u.status === 'ACTIVE', 'OWNER_ACCOUNT_IDENTITY_MISMATCH');
  return u;
}
function safeAccount(u) {
  return { id: u.id, email: u.email, role: u.role, status: u.status,
    matchingAccounts: 1, passwordHashPresent: !!u.passwordHash,
    mustChangePassword: u.mustChangePassword, sessionVersion: u.sessionVersion,
    plaintextPasswordNull: u.plaintext_null };
}
function receiptWrite(r) {
  fs.mkdirSync(path.dirname(RECEIPT), { recursive: true });
  // A failed rerun or read-only preflight must never erase a completed activation receipt.
  if (fs.existsSync(RECEIPT)) {
    const previous = JSON.parse(fs.readFileSync(RECEIPT, 'utf8'));
    if (previous.passwordActivation === 'PASS' && r.passwordActivation !== 'PASS') {
      previous.lastAttempt = { recordedAt: r.recordedAt, blockers: r.blockers };
      r = previous;
    }
  }
  const temp = RECEIPT + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(r, null, 2) + '\n');
  fs.renameSync(temp, RECEIPT);
}
async function stdinPassword() {
  const chunks = []; let total = 0;
  try {
    for await (const c of process.stdin) { total += c.length; guard(total <= 4096, 'PASSWORD_INPUT_TOO_LARGE'); chunks.push(c); }
    const b = Buffer.concat(chunks);
    try {
      let frame;
      try { frame = JSON.parse(b.toString('utf8').replace(/^\uFEFF/, '')); }
      catch { guard(false, 'PRIVATE_INPUT_FRAME_INVALID'); }
      guard(frame?.version === 1 && typeof frame.value === 'string', 'PRIVATE_INPUT_FRAME_INVALID');
      return frame.value;
    } finally { b.fill(0); }
  } finally { chunks.forEach(c => c.fill(0)); }
}
async function activate(db, password) {
  const policy = validatePasswordPolicy(password, TARGET.email);
  guard(policy.valid, 'APPLICATION_PASSWORD_POLICY_REJECTED');
  // bcrypt uses at most 72 UTF-8 bytes. Reject truncation rather than silently accepting it.
  guard(Buffer.byteLength(password, 'utf8') <= 72, 'PASSWORD_EXCEEDS_BCRYPT_72_BYTE_LIMIT');
  let hash = await bcrypt.hash(password, 10);
  let committed = false;
  await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
  try {
    await identity(db);
    const before = await account(db, true);
    guard(before.passwordHash === null && before.mustChangePassword === true, 'ACCOUNT_ALREADY_ACTIVATED_OR_STATE_CHANGED');
    const result = await db.query(`UPDATE "User" SET "passwordHash"=$1, password=NULL,
      "passwordChangedAt"=now(), "mustChangePassword"=false, "sessionVersion"="sessionVersion"+1,
      "failedLoginAttempts"=0, "lockedUntil"=NULL, "updatedAt"=now()
      WHERE id=$2 AND role='SUPER_ADMIN' AND status='ACTIVE' AND "passwordHash" IS NULL
      AND "mustChangePassword"=true AND "sessionVersion"=$3`, [hash, TARGET.userId, before.sessionVersion]);
    guard(result.rowCount === 1, 'OWNER_UPDATE_COUNT_MISMATCH');
    // No recovery token is minted or falsely marked consumed. Revoke every outstanding token.
    await db.query(`UPDATE "PasswordRecoveryToken" SET "revokedAt"=now()
      WHERE "userId"=$1 AND "consumedAt" IS NULL AND "revokedAt" IS NULL`, [TARGET.userId]);
    await db.query(`INSERT INTO "AuditLog" (id,"userId","userRole","moduleName","actionType",remarks,"createdAt")
      VALUES ($1,$2,'SUPER_ADMIN','SECURITY','PASSWORD_RECOVERY_COMPLETED',$3,now())`,
    [crypto.randomUUID(), TARGET.userId, 'Owner-authorized Preview-only initial password activation via masked local console; no recovery token issued; outstanding tokens revoked.']);
    const after = await account(db);
    guard(!!after.passwordHash && await bcrypt.compare(password, after.passwordHash), 'BCRYPT_VERIFICATION_FAILED');
    guard(after.sessionVersion === before.sessionVersion + 1 && after.mustChangePassword === false
      && after.plaintext_null && !!after.passwordChangedAt, 'PASSWORD_RESET_SEMANTICS_FAILED');
    guard((await db.query(`SELECT count(*)::int AS n FROM "PasswordRecoveryToken"
      WHERE "userId"=$1 AND "consumedAt" IS NULL AND "revokedAt" IS NULL`, [TARGET.userId])).rows[0].n === 0,
    'RECOVERY_TOKENS_STILL_ACTIVE');
    await db.query('COMMIT'); committed = true;
    return safeAccount(after);
  } finally {
    hash = null;
    if (!committed) await db.query('ROLLBACK').catch(() => {});
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--stdin-self-test' && /^[a-f0-9]{64}$/.test(args[1] || '')) {
    let sample = await stdinPassword();
    const valid = crypto.createHash('sha256').update(sample, 'utf8').digest('hex') === args[1];
    const diagnostics = { startsWithBom: sample.charCodeAt(0) === 0xfeff, receivedUtf8Bytes: Buffer.byteLength(sample, 'utf8') };
    sample = null;
    console.log(valid ? 'WINDOWS_POWERSHELL_UTF8_PIPE_PASS' : 'WINDOWS_POWERSHELL_UTF8_PIPE_FAIL');
    if (!valid) console.log(JSON.stringify(diagnostics));
    process.exitCode = valid ? 0 : 1;
    return;
  }
  guard(args.length >= 1 && args.length <= 2 && ['--preflight', '--stdin-password'].includes(args[0])
    && (!args[1] || args[1] === '--wss'), 'USE_PREFLIGHT_OR_MASKED_LAUNCHER');
  const useWss = args[1] === '--wss';
  const r = { project: 'OSERP-PROJ-UBOQ-001', recordedAt: new Date().toISOString(),
    environment: 'preview_only', transport: useWss ? 'neon_websocket_tls_verified' : 'postgres_tls_verified', databaseIdentity: null, account: null,
    passwordActivation: 'PENDING', authenticationVerification: 'PENDING',
    personalLoginAcceptance: 'PENDING_OWNER_PERSONAL_LOGIN', administrativeAccess: 'PENDING',
    productionModified: false, blockers: [] };
  let db, password;
  let stage = 'LOCAL_CREDENTIAL';
  try {
    const raw = credential();
    const verifiedConfig = config(raw);
    db = useWss ? createNeonWsClient(raw, 'oserp_preview_owner_activation', {
      connectionTimeoutMillis: 20000, query_timeout: 20000,
    }) : new Client(verifiedConfig);
    db.on('error', () => {});
    stage = 'DATABASE_CONNECT';
    await db.connect();
    stage = 'DATABASE_IDENTITY';
    r.databaseIdentity = await identity(db);
    stage = 'OWNER_ACCOUNT_READ';
    const u = await account(db);
    r.account = safeAccount(u);
    guard(u.passwordHash === null && u.mustChangePassword === true, 'ACCOUNT_ALREADY_ACTIVATED_OR_STATE_CHANGED');
    if (args[0] === '--preflight') {
      r.blockers = ['OWNER_MASKED_PASSWORD_ENTRY_REQUIRED', 'OWNER_PERSONAL_LOGIN_REQUIRED'];
    } else {
      stage = 'OWNER_MASKED_INPUT';
      password = await stdinPassword();
      stage = 'ACTIVATION_TRANSACTION';
      r.account = await activate(db, password);
      r.passwordActivation = 'PASS';
      // Verify persisted state independently after commit, while the password is still only in memory.
      const persisted = await account(db);
      guard(!!persisted.passwordHash && await bcrypt.compare(password, persisted.passwordHash), 'POST_COMMIT_BCRYPT_VERIFICATION_FAILED');
      r.authenticationVerification = 'PASS';
      r.authenticationVerificationMethod = 'bcrypt.compare against persisted hash after commit';
      r.blockers = ['OWNER_PERSONAL_LOGIN_REQUIRED', 'OWNER_ADMINISTRATIVE_ACCESS_VERIFICATION_REQUIRED'];
    }
  } catch (e) {
    const known = ['EACCES','ECONNRESET','ETIMEDOUT','ECONNREFUSED','ENETUNREACH','EHOSTUNREACH','ENOTFOUND','EAI_AGAIN',
      'CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT','42501'];
    const code = e.code || e.cause?.code;
    const timeout = /timeout|timed out/i.test(e.message || '');
    r.blockers = [e.safeCode || (known.includes(code) ? code : timeout ? 'DATABASE_CONNECTION_OR_QUERY_TIMEOUT' : 'DATABASE_OPERATION_FAILED_DETAILS_SUPPRESSED')];
    r.failureStage = stage;
    r.safeErrorType = /^[A-Za-z]+Error$/.test(e.name || '') ? e.name : 'Error';
    if (r.passwordActivation !== 'PASS') r.passwordActivation = 'FAIL';
    process.exitCode = 1;
  } finally {
    password = null;
    if (db) await endPgClientBounded(db, 3000);
    receiptWrite(r);
    console.log(JSON.stringify(r));
  }
}
if (require.main === module) main().catch(() => { console.error('ACTIVATION_FAILED_DETAILS_SUPPRESSED'); process.exitCode=1; });
module.exports = { config, guard, identity, account, activate, TARGET, validatePasswordPolicy };
