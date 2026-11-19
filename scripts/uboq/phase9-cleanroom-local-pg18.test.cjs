'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = process.cwd();
const INVENTORY_SQL_PATH = path.resolve(ROOT, 'scripts/uboq/phase9-cleanroom-inventory.sql');
const PREFLIGHT_DOC_PATH = path.resolve(ROOT, 'docs/uboq/phase9-cleanroom-preflight.md');
const CLEANROOM_RUNNER_PATH = path.resolve(ROOT, 'scripts/uboq/run-phase9-cleanroom-local-pg18.cjs');
const PHASE9_MIGRATION_REL = 'prisma/migrations/20261118090000_phase9_project_creator_bootstrap/migration.sql';
const PHASE9_MIGRATION_PATH = path.resolve(ROOT, PHASE9_MIGRATION_REL);

test('phase9-cleanroom-inventory.sql enforces in-script ON_ERROR_STOP, branch/loopback guard, fail-closed role closure, and proconfig redaction', () => {
  const sql = fs.readFileSync(INVENTORY_SQL_PATH, 'utf8');

  // Must enforce ON_ERROR_STOP in-script and session read-only mode
  assert.match(sql, /^\\set\s+ON_ERROR_STOP\s+on\b/m);
  assert.match(sql, /SET\s+default_transaction_read_only\s*=\s*on\s*;/i);

  // Must verify Neon project + disposable branch IDs on Preview AND loopback 127.0.0.1 on local cleanroom
  assert.match(sql, /current_setting\('neon\.project_id',\s*true\)\s*=\s*'long-recipe-20782583'/);
  assert.match(sql, /current_setting\('neon\.branch_id',\s*true\)\s*=\s*'br-restless-dust-bc1a91f4'/);
  assert.match(sql, /host\(inet_server_addr\(\)\)\s*=\s*'127\.0\.0\.1'/);
  assert.match(sql, /current_setting\('transaction_read_only'\)\s*=\s*'on'/);

  // Must audit runtime operational roles, recursive pg_auth_members closure, and fail-closed violation guard
  assert.match(sql, /WITH\s+RECURSIVE\s+membership_closure\s+AS/i);
  assert.match(sql, /pg_auth_members/);
  assert.match(sql, /effective_set_path/);
  assert.match(sql, /effective_inherit_path/);
  assert.match(sql, /effective_admin_path/);
  assert.match(sql, /PASS_ALL_ROLE_AND_CLOSURE_INVARIANTS/);
  assert.match(sql, /UNAUTHORIZED_LOGIN_OSERP_GRANT_OR_ADMIN:/);
  assert.match(sql, /UNAUTHORIZED_OSERP_ADMIN_HOLDER:/);

  // Must NOT select raw `p.proconfig AS` values; only whitelisted search_path + setting names
  assert.doesNotMatch(sql, /p\.proconfig\s+AS\s+function_settings/i);
  assert.match(sql, /split_part\(cfg,\s*'=',\s*1\)\s*=\s*'search_path'/);
  assert.match(sql, /AS\s+setting_names_only/);

  // Strip SQL line comments and psql meta-commands before asserting zero DML/DDL/role-switching statements
  const executableSql = sql
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, '').replace(/^\\.*$/, ''))
    .join('\n');
  assert.doesNotMatch(executableSql, /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|COPY)\b/i);
  assert.doesNotMatch(executableSql, /\bSET\s+(LOCAL\s+)?ROLE\b/i);
});

test('phase9-cleanroom-preflight.md enforces env -i, PGSSLMODE=verify-full, 0700 private dump dir, and explicit target binding', () => {
  const doc = fs.readFileSync(PREFLIGHT_DOC_PATH, 'utf8');

  assert.match(doc, /env\s+-i\s+PATH="\$PATH"/);
  assert.match(doc, /PGGSSENCMODE=disable/);
  assert.match(doc, /PGSSLMODE=verify-full/);
  assert.match(doc, /PGSSLROOTCERT="\$SYSTEM_CA_BUNDLE"/);
  assert.match(doc, /PGPASSFILE="\$PGPASS_FILE"/);
  assert.doesNotMatch(doc, /PGPASSWORD=/);
  assert.match(doc, /pwd\s+-P/);
  assert.match(doc, /mktemp\s+-d/);
  assert.match(doc, /chmod\s+700\s+"\$RAW_SCRATCH_DIR"/);
  assert.match(doc, /git\s+-C\s+"\$PRIVATE_SCRATCH_DIR"\s+rev-parse\s+--is-inside-work-tree/);
  assert.match(doc, /chmod\s+600\s+"\$PRIVATE_DUMP_FILE"/);
  assert.match(doc, /-h\s+"\$PREVIEW_DISPOSABLE_HOST"\s+-p\s+"\$PREVIEW_DISPOSABLE_PORT"/);
  assert.match(doc, /-d\s+oserp_uboq_preview\s+[\s\\]*-f\s+scripts\/uboq\/phase9-cleanroom-inventory\.sql/);
  assert.match(doc, /long-recipe-20782583/);
  assert.match(doc, /br-restless-dust-bc1a91f4/);
  assert.match(doc, /#01077965/);
  assert.doesNotMatch(doc, /npg_[A-Za-z0-9]+|postgresql:\/\/[^\s`<]+@[^\s`]+/i);
});

test('cleanroom runner pins independent checksums, sanitizes libpq env, verifies NOLOGIN & live restored RLS, and preserves build safety', () => {
  const headSql = execFileSync('git', ['show', `HEAD:${PHASE9_MIGRATION_REL}`], { cwd: ROOT });
  const diskSql = fs.readFileSync(PHASE9_MIGRATION_PATH);
  assert.equal(
    diskSql.toString('utf8').replaceAll('\r\n', '\n'),
    headSql.toString('utf8').replaceAll('\r\n', '\n'),
    'Approved Phase 9 migration SQL must remain byte-equivalent to reviewed specification'
  );

  const pkg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.build, 'prisma generate && next build');

  const runnerSrc = fs.readFileSync(CLEANROOM_RUNNER_PATH, 'utf8');
  assert.doesNotMatch(runnerSrc, /npg_[A-Za-z0-9]+|\.neon\.tech/i);
  assert.match(runnerSrc, /PINNED_APPROVED_BASE_SHA\s*=\s*'e51be896907620d3c0945d779af37ca99151219c'/);
  assert.match(runnerSrc, /PINNED_PHASE9_MIGRATION_SHA256\s*=\s*[\r\n\s]*'89ad5e8bcbbaf33564d0f4a77ffd39874ec2496b85d3140b52c30e82733f27df'/);
  assert.match(runnerSrc, /function\s+buildCleanChildEnv\(/);
  assert.match(runnerSrc, /PGHOSTADDR:\s*'127\.0\.0\.1'/);
  assert.match(runnerSrc, /not permitted to log in/);
  assert.match(runnerSrc, /project_force_rls:\s*true/);
  assert.match(runnerSrc, /pua_force_rls:\s*true/);
  assert.match(runnerSrc, /to_regprocedure\('public\.phase9_create_project_profile\(text,text,text,text,text,text,text\)'\)/);
  assert.match(runnerSrc, /phase9_fn_any_overload/);
  assert.match(runnerSrc, /tamperedHmacProof/);
});

test('legacy mutations.ts:createProject fails closed with zero DB/Blob side effects while preserving reusable July BOQ actions', async () => {
  const ts = require('typescript');
  const vm = require('node:vm');

  const mutationsPath = path.resolve(ROOT, 'src/app/actions/mutations.ts');
  const mutationsSrc = fs.readFileSync(mutationsPath, 'utf8');
  const newProjectBtnPath = path.resolve(ROOT, 'src/app/projects/NewProjectButton.tsx');
  const newProjectBtnSrc = fs.readFileSync(newProjectBtnPath, 'utf8');

  // NewProjectButton must delegate to ProjectStartButton and never import or call legacy createProject
  const executableBtnSrc = newProjectBtnSrc
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(executableBtnSrc, /actions\/mutations/);
  assert.doesNotMatch(executableBtnSrc, /\bcreateProject\b/);
  assert.match(executableBtnSrc, /from '\.\/ProjectStartButton'/);

  // Reusable July BOQ / procurement actions in mutations.ts remain preserved
  assert.match(mutationsSrc, /export async function uploadProcurementBenchmark\(/);

  // Execute transpiled createProject in a sandbox where any DB/cookie/Blob call throws immediately
  const createProjectMatch = mutationsSrc.match(
    /export async function createProject\([\s\S]*?\n\}/
  );
  assert.ok(createProjectMatch, 'createProject fail-closed export must exist');
  assert.doesNotMatch(createProjectMatch[0], /simulatedRole|prisma\.project\.create|access:\s*'public'/);

  const transpiled = ts.transpileModule(createProjectMatch[0], {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exportsObj = {};
  vm.runInNewContext(
    transpiled,
    { exports: exportsObj, FormData, Error },
    { filename: 'createProject-stub.js' }
  );

  const form = new FormData();
  form.set('name', 'Bypass Attempt');
  form.set('simulatedRole', 'SUPER_ADMIN');
  await assert.rejects(
    () => exportsObj.createProject(form),
    /LEGACY_CREATE_PROJECT_DISABLED/
  );
});
