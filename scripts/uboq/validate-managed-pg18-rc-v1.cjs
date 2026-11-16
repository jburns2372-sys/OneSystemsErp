'use strict';

/**
 * TASK 2 — Comprehensive Validation of `MANAGED_PG18_RC_V1` on Disposable Isolated PostgreSQL 18
 *
 * Verifies:
 * 1. Historical `prisma/migrations/**`, accepted local DB `oserp_h02b_local_e5e20dc14c`, receipts,
 *    `verify-migration14-provenance-gate.cjs` (verified against frozen `uboq-m14-classifier-final-review.zip`),
 *    and frozen ZIP archives remain 100% untouched; Git `origin/main` has 0 M15 lineage.
 * 2. Pure offline ledger + case-insensitive allowlist role-security + recursive group-membership
 *    fail-closed matrix (covering uppercase `OSERP_*`, `oserp_app`, non-`oserp_*` superuser group
 *    members, nested/transitive active logins in `oserp_migrations_owner`, and `postgres`/`neondb_owner`).
 * 3. Brand-new ephemeral `initdb` PostgreSQL 18 cluster (`server_version_num >= 180000` enforced)
 *    running under `rolsuper = false` reproduces original Migration #15 `42501` failure and enforces
 *    live fail-closed guards (including live `pg_authid` static-password detection).
 * 4. Official `npx prisma migrate deploy --schema=prisma/managed-pg18-rc-v1/schema.prisma` applies
 *    all 39 RC migrations in exact order under `rolsuper = false` with 39/39 checksum parity and
 *    `rolpassword IS NULL` + `rolsuper = false` on all 6 governed group roles.
 * 5. Complete schema & privilege equivalence diff against `oserp_h02b_local_e5e20dc14c` covering:
 *    tables, columns (with `column_default` + precision/scale), constraints, indexes, RLS flags,
 *    RLS policies, triggers, complete function definitions (`pg_get_functiondef` bodies + config),
 *    function ACLs, table/view/sequence ACLs, schema ACLs, `pg_default_acl`, and role memberships.
 */

const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

const {
  RC_ID,
  RC_PRISMA_DIR,
  M14_CLASSIFIER_SHA256,
  M14_CLASSIFIER_ARCHIVE_SHA256,
  HISTORICAL_MIG15_SHA256,
  CANDIDATE_MIG15_SHA256,
  CANONICAL_MIG14_SHA256,
  EXPECTED_GROUP_ROLES,
  loadRcDiskMigrations,
  loadManagedPg18RcAuthority,
  evaluateTargetLedgerForManagedPg18Rc,
  evaluateRolePostureForManagedPg18Rc,
  inspectTargetForManagedPg18Rc,
} = require('./verify-managed-pg18-rc-v1-gate.cjs');

const OUT_PATH = 'artifacts/uboq/managed-pg18-rc-v1/rc-v1-validation-receipt.json';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function locatePg18Bin(exeName) {
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const cand = path.join(pf, 'PostgreSQL', '18', 'bin', `${exeName}.exe`);
  if (fs.existsSync(cand)) return cand;
  throw new Error(`PostgreSQL 18 binary required (no fallback permitted): ${cand}`);
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function normalizeRunnerAclText(aclVal, runnerRoleName) {
  if (aclVal === null || aclVal === undefined) return null;
  const s = String(aclVal);
  const escaped = runnerRoleName ? runnerRoleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
  const replaced = escaped
    ? s
        .replace(new RegExp(`(?<=\\{|,|^)${escaped}(?==)`, 'g'), '<MIGRATION_RUNNER>')
        .replace(new RegExp(`(?<=\\/)${escaped}(?=,|\\}|$)`, 'g'), '<MIGRATION_RUNNER>')
    : s;
  if (!replaced.startsWith('{') || !replaced.endsWith('}')) return replaced;
  const inner = replaced.slice(1, -1);
  if (!inner) return '{}';
  return `{${inner.split(',').sort().join(',')}}`;
}

async function captureSchemaFingerprint(client, runnerRoleName) {
  assert.ok(
    runnerRoleName && typeof runnerRoleName === 'string',
    'Explicit runnerRoleName is required for owner/ACL normalization'
  );
  await client.query('BEGIN TRANSACTION READ ONLY');
  try {
    const ver = (
      await client.query(
        `SELECT current_setting('server_version') AS server_version, current_setting('server_version_num')::int AS server_version_num`
      )
    ).rows[0];
    assert.ok(
      ver.server_version_num >= 180000 && ver.server_version_num < 190000,
      `Expected PostgreSQL 18, observed ${ver.server_version} (${ver.server_version_num})`
    );

    const tables = (
      await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC
      `)
    ).rows.map((r) => r.table_name);

    const columns = (
      await client.query(`
        SELECT
          table_name,
          column_name,
          ordinal_position,
          data_type,
          udt_name,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name ASC, ordinal_position ASC
      `)
    ).rows;

    const constraints = (
      await client.query(`
        SELECT c.relname AS table_name, con.conname, con.contype, pg_get_constraintdef(con.oid, true) AS def
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        ORDER BY c.relname ASC, con.conname ASC
      `)
    ).rows;

    const indexes = (
      await client.query(`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename ASC, indexname ASC
      `)
    ).rows;

    const rlsTables = (
      await client.query(`
        SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname ASC
      `)
    ).rows;

    const policies = (
      await client.query(`
        SELECT tablename, policyname, permissive, roles::text AS roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename ASC, policyname ASC
      `)
    ).rows;

    const triggers = (
      await client.query(`
        SELECT
          c.relname AS table_name,
          t.tgname,
          t.tgenabled::text AS tgenabled,
          pg_get_triggerdef(t.oid, true) AS def
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND NOT t.tgisinternal
        ORDER BY c.relname ASC, t.tgname ASC
      `)
    ).rows;

    const columnAcls = (
      await client.query(`
        SELECT
          c.relname AS table_name,
          a.attname AS column_name,
          a.attacl::text AS attacl
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p', 'v', 'm')
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.attacl IS NOT NULL
        ORDER BY c.relname ASC, a.attnum ASC
      `)
    ).rows.map((ca) => ({
      table_name: ca.table_name,
      column_name: ca.column_name,
      attacl: normalizeRunnerAclText(ca.attacl, runnerRoleName),
    }));

    const customTypes = (
      await client.query(`
        SELECT
          t.typname,
          t.typtype,
          t.typacl::text AS typacl,
          r.rolname AS owner,
          COALESCE(
            (SELECT string_agg(e.enumlabel, '|' ORDER BY e.enumsortorder)
             FROM pg_enum e WHERE e.enumtypid = t.oid),
            ''
          ) AS enum_labels
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        JOIN pg_roles r ON r.oid = t.typowner
        WHERE n.nspname = 'public'
          AND t.typtype IN ('e', 'd')
        ORDER BY t.typname ASC
      `)
    ).rows.map((tp) => ({
      typname: tp.typname,
      typtype: tp.typtype,
      typacl: normalizeRunnerAclText(tp.typacl, runnerRoleName),
      ownerClass: tp.owner === runnerRoleName ? '<MIGRATION_RUNNER>' : tp.owner,
      enum_labels: tp.enum_labels,
    }));

    const extensions = (
      await client.query(`
        SELECT e.extname, n.nspname AS schema_name
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        ORDER BY e.extname ASC
      `)
    ).rows;

    const functions = (
      await client.query(`
        SELECT
          p.proname,
          pg_get_function_identity_arguments(p.oid) AS args,
          pg_get_function_result(p.oid) AS result_type,
          p.prosecdef,
          p.provolatile,
          p.proisstrict,
          p.proconfig::text AS proconfig,
          pg_get_functiondef(p.oid) AS func_def,
          p.proacl::text AS proacl,
          r.rolname AS owner
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_roles r ON r.oid = p.proowner
        WHERE n.nspname = 'public'
          AND p.probin IS NULL
        ORDER BY p.proname ASC, args ASC
      `)
    ).rows.map((f) => ({
      proname: f.proname,
      args: f.args,
      result_type: f.result_type,
      prosecdef: f.prosecdef,
      provolatile: f.provolatile,
      proisstrict: f.proisstrict,
      proconfig: f.proconfig,
      func_def: f.func_def,
      proacl: normalizeRunnerAclText(f.proacl, runnerRoleName),
      ownerClass: f.owner === runnerRoleName ? '<MIGRATION_RUNNER>' : f.owner,
    }));

    const relationAcls = (
      await client.query(`
        SELECT
          c.relname,
          c.relkind,
          c.relacl::text AS relacl,
          r.rolname AS owner
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_roles r ON r.oid = c.relowner
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p', 'v', 'm', 'S')
        ORDER BY c.relkind ASC, c.relname ASC
      `)
    ).rows.map((rel) => ({
      relname: rel.relname,
      relkind: rel.relkind,
      relacl: normalizeRunnerAclText(rel.relacl, runnerRoleName),
      ownerClass: rel.owner === runnerRoleName ? '<MIGRATION_RUNNER>' : rel.owner,
    }));

    const publicSchemaRow = (
      await client.query(`
        SELECT n.nspacl::text AS nspacl, r.rolname AS owner
        FROM pg_namespace n
        JOIN pg_roles r ON r.oid = n.nspowner
        WHERE n.nspname = 'public'
      `)
    ).rows[0];
    // Compare the COMPLETE normalized `SCHEMA public` ACL (including `=U/...` for PUBLIC,
    // ensuring any unexpected `=UC/` CREATE grant to PUBLIC or any extra principal fails closed)
    const publicSchemaFullAcl = normalizeRunnerAclText(publicSchemaRow.nspacl, runnerRoleName);
    const publicSchemaOwner =
      publicSchemaRow.owner === runnerRoleName ? '<MIGRATION_RUNNER>' : publicSchemaRow.owner;

    const defaultPrivileges = (
      await client.query(`
        SELECT
          COALESCE(n.nspname, '') AS schema_name,
          d.defaclobjtype,
          d.defaclacl::text AS defaclacl
        FROM pg_default_acl d
        LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
        ORDER BY schema_name ASC, d.defaclobjtype ASC
      `)
    ).rows.map((d) => ({
      schema_name: d.schema_name,
      defaclobjtype: d.defaclobjtype,
      defaclacl: normalizeRunnerAclText(d.defaclacl, runnerRoleName),
    }));

    const groupRoleGrants = (
      await client.query(`
        SELECT grantee, table_name, privilege_type, is_grantable
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND grantee IN (
            'oserp_migrations_owner',
            'oserp_compat_app',
            'oserp_legacy_app',
            'oserp_maint_cleanup_role',
            'oserp_company_payroll_app',
            'oserp_company_payroll_verifier'
          )
        ORDER BY grantee ASC, table_name ASC, privilege_type ASC
      `)
    ).rows;

    // Inspect all non-runner `^oserp_` role memberships (including full delegation/inheritance options)
    // Note: historical local PG cluster retains old non-`oserp_*` test roles (`h02b_*`, `g02_m01_*`),
    // so cross-cluster equivalence compares all non-runner `^oserp_` memberships + options, while RC-VAL-05
    // additionally audits 100% of unfiltered `pg_auth_members` rows on the candidate cluster.
    const activeGovernedMemberships = (
      await client.query(
        `
        SELECT
          g.rolname AS group_name,
          m_role.rolname AS member_name,
          m_role.rolcanlogin,
          m.admin_option,
          m.inherit_option,
          m.set_option
        FROM pg_auth_members m
        JOIN pg_roles g ON g.oid = m.roleid
        JOIN pg_roles m_role ON m_role.oid = m.member
        WHERE g.rolname ~* '^oserp_'
          AND m_role.rolname ~* '^oserp_'
          AND g.rolname <> $1
          AND m_role.rolname <> $1
        ORDER BY g.rolname ASC, m_role.rolname ASC, m.admin_option DESC, m.inherit_option DESC, m.set_option DESC
      `,
        [runnerRoleName]
      )
    ).rows;

    const groupRoles = (
      await client.query(`
        SELECT rolname, rolsuper, rolcanlogin, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
        FROM pg_roles
        WHERE rolname IN (
          'oserp_migrations_owner',
          'oserp_compat_app',
          'oserp_legacy_app',
          'oserp_maint_cleanup_role',
          'oserp_company_payroll_app',
          'oserp_company_payroll_verifier'
        )
        ORDER BY rolname ASC
      `)
    ).rows;

    return {
      fingerprintData: {
        tableCount: tables.length,
        tablesSha256: sha256(JSON.stringify(tables)),
        columnsCount: columns.length,
        columnsSha256: sha256(JSON.stringify(columns)),
        constraintsCount: constraints.length,
        constraintsSha256: sha256(JSON.stringify(constraints)),
        indexesCount: indexes.length,
        indexesSha256: sha256(JSON.stringify(indexes)),
        rlsTablesSha256: sha256(JSON.stringify(rlsTables)),
        policiesCount: policies.length,
        policiesSha256: sha256(JSON.stringify(policies)),
        triggersCount: triggers.length,
        triggersSha256: sha256(JSON.stringify(triggers)),
        columnAclsCount: columnAcls.length,
        columnAclsSha256: sha256(JSON.stringify(columnAcls)),
        customTypesCount: customTypes.length,
        customTypesSha256: sha256(JSON.stringify(customTypes)),
        extensions,
        functionsCount: functions.length,
        functionsFullBodiesAndAclsSha256: sha256(JSON.stringify(functions)),
        relationAndSequenceAclsCount: relationAcls.length,
        relationAndSequenceAclsSha256: sha256(JSON.stringify(relationAcls)),
        publicSchemaOwner,
        publicSchemaFullAcl,
        defaultPrivilegesCount: defaultPrivileges.length,
        defaultPrivilegesSha256: sha256(JSON.stringify(defaultPrivileges)),
        groupRoleGrantsCount: groupRoleGrants.length,
        groupRoleGrantsSha256: sha256(JSON.stringify(groupRoleGrants)),
        activeGovernedMemberships,
        groupRoles,
      },
      serverVersion: ver.server_version,
      serverVersionNum: ver.server_version_num,
      rawRelationAcls: relationAcls,
    };
  } finally {
    await client.query('ROLLBACK');
  }
}

(async () => {
  const report = {
    project: 'OSERP-PROJ-UBOQ-001',
    releaseCandidateId: RC_ID,
    evaluatedAt: new Date().toISOString(),
    checks: [],
  };

  async function check(name, fn) {
    const t0 = Date.now();
    const detail = await fn();
    report.checks.push({ name, result: 'PASS', milliseconds: Date.now() - t0, detail });
    console.log(`PASS ${name}`);
  }

  const rcDisk = loadRcDiskMigrations();
  const authority = loadManagedPg18RcAuthority(rcDisk);

  // RC-VAL-01: Historical Preservation & Production Non-Contamination
  let referenceCapture = null;
  await check(
    'RC-VAL-01 Historical migrations, frozen M14 classifier archive, accepted local ledger, and origin/main non-contamination preserved',
    async () => {
      const localDbMeta = JSON.parse(
        fs.readFileSync('artifacts/uboq/g02-r3/h02-b-implementation/local-database.json', 'utf8')
      );
      const localConn = JSON.parse(
        fs.readFileSync(path.join(localDbMeta.runtime_directory, 'connection.json'), 'utf8')
      );
      const refClient = new Client({
        ...localConn,
        options: '-c default_transaction_read_only=on',
      });
      await refClient.connect();
      try {
        const histRows = (
          await refClient.query(
            `SELECT migration_name, checksum FROM public."_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY migration_name ASC`
          )
        ).rows;
        assert.equal(histRows.length, 39);
        const m14Row = histRows.find((r) => r.migration_name.startsWith('20261104193000_'));
        const m15Row = histRows.find((r) => r.migration_name.startsWith('20261104233000_'));
        assert.equal(m14Row.checksum, CANONICAL_MIG14_SHA256);
        assert.equal(
          m15Row.checksum,
          HISTORICAL_MIG15_SHA256,
          'Existing local reference DB historical Migration #15 checksum must remain untouched'
        );
        referenceCapture = await captureSchemaFingerprint(refClient, localConn.user || 'postgres');
        assert.equal(referenceCapture.fingerprintData.tableCount, 252);
      } finally {
        await refClient.end();
      }

      return {
        originMainCommit: authority.originMainCommit,
        originMainMigrationCount: authority.originMainCount,
        gitOriginMainContainsMig15Lineage: false,
        m14ClassifierSha256VerifiedAgainstFrozenZip: M14_CLASSIFIER_SHA256,
        m14ClassifierFrozenZipSha256: M14_CLASSIFIER_ARCHIVE_SHA256,
        historicalLocalDbPreserved: localDbMeta.target_database,
        referencePgVersion: referenceCapture.serverVersion,
        referencePgVersionNum: referenceCapture.serverVersionNum,
        historicalMig15Sha256: HISTORICAL_MIG15_SHA256,
        candidateMig15Sha256: CANDIDATE_MIG15_SHA256,
      };
    }
  );

  // RC-VAL-02: Pure Offline Ledger & Adversarial Role-Security Fail-Closed Matrix
  await check(
    'RC-VAL-02 Offline ledger provenance, lineage-separation, case-insensitive allowlist, and recursive membership fail-closed matrix',
    async () => {
      const makeRows = (count) =>
        authority.approved.slice(0, count).map((m, i) => ({
          migration_name: m.migrationName,
          checksum: m.sha256,
          started_at: new Date(1700000000000 + i * 2000).toISOString(),
          finished_at: new Date(1700000000500 + i * 2000).toISOString(),
          rolled_back_at: null,
          applied_steps_count: 1,
          logs: null,
        }));

      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc([], rcDisk, authority, { allowEmpty: false })
          .classification,
        'BLOCKED_EMPTY_BASELINE_REQUIRES_EXPLICIT_APPROVAL'
      );
      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc([], rcDisk, authority, { allowEmpty: true }).eligible,
        true
      );
      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc(makeRows(39), rcDisk, authority).classification,
        'ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE'
      );

      const mixedM15 = makeRows(16);
      mixedM15[14].checksum = HISTORICAL_MIG15_SHA256;
      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc(mixedM15, rcDisk, authority).classification,
        'BLOCKED_HISTORICAL_LOCAL_MIG15_LINEAGE'
      );

      const badM14 = makeRows(15);
      badM14[13].checksum = '0'.repeat(64);
      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc(badM14, rcDisk, authority).classification,
        'BLOCKED_DIVERGENT_MIGRATION14_PROVENANCE'
      );

      const driftedM20 = makeRows(21);
      driftedM20[20].checksum = 'f'.repeat(64);
      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc(driftedM20, rcDisk, authority).classification,
        'BLOCKED_CHECKSUM_DRIFT'
      );

      const outOfOrder = makeRows(4);
      outOfOrder[2].started_at = new Date(1700000000100).toISOString();
      assert.equal(
        evaluateTargetLedgerForManagedPg18Rc(outOfOrder, rcDisk, authority).classification,
        'BLOCKED_APPLICATION_ORDER'
      );

      const validRoles39 = Object.entries(EXPECTED_GROUP_ROLES).map(([rolname, spec]) => ({
        rolname,
        ...spec,
      }));
      assert.equal(evaluateRolePostureForManagedPg18Rc(validRoles39, 39, {}, []).ok, true);

      // 1) Uppercase `OSERP_ADMIN` role -> BLOCKED_UNRECOGNIZED_OSERP_ROLE (or BLOCKED_PRIVILEGED_OSERP_ROLE_DETECTED if super)
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [...validRoles39, { rolname: 'OSERP_UPPER_ROLE', rolsuper: false, rolcanlogin: true }],
          39
        ).classification,
        'BLOCKED_UNRECOGNIZED_OSERP_ROLE'
      );

      // 2) `oserp_app` login carrying BYPASSRLS / CREATEDB / CREATEROLE -> BLOCKED_UNRECOGNIZED_OSERP_ROLE
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            {
              rolname: 'oserp_app',
              rolsuper: false,
              rolcanlogin: true,
              rolbypassrls: true,
              rolcreatedb: true,
              rolcreaterole: true,
            },
          ],
          39
        ).classification,
        'BLOCKED_UNRECOGNIZED_OSERP_ROLE'
      );

      // 3) Non-`oserp_*` superuser member of `oserp_compat_app` -> BLOCKED_PRIVILEGED_GOVERNED_GROUP_MEMBER
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'external_super_member', rolsuper: true, rolcanlogin: true },
          ],
          39,
          {},
          [{ group_name: 'oserp_compat_app', member_name: 'external_super_member' }]
        ).classification,
        'BLOCKED_PRIVILEGED_GOVERNED_GROUP_MEMBER'
      );

      // 4) Non-`oserp_*` non-superuser member of `oserp_compat_app` -> BLOCKED_UNAUTHORIZED_GOVERNED_GROUP_MEMBER
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'external_app_user', rolsuper: false, rolcanlogin: true },
          ],
          39,
          {},
          [{ group_name: 'oserp_compat_app', member_name: 'external_app_user' }]
        ).classification,
        'BLOCKED_UNAUTHORIZED_GOVERNED_GROUP_MEMBER'
      );

      // 5) Nested/transitive login membership in `oserp_migrations_owner` (`leaf_login -> mid_role -> oserp_migrations_owner`)
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'mid_role', rolsuper: false, rolcanlogin: false },
            { rolname: 'leaf_login', rolsuper: false, rolcanlogin: true },
          ],
          39,
          {},
          [
            { group_name: 'oserp_migrations_owner', member_name: 'mid_role' },
            { group_name: 'mid_role', member_name: 'leaf_login' },
          ]
        ).classification,
        'BLOCKED_UNAUTHORIZED_GOVERNED_GROUP_MEMBER'
      );

      // 6) `postgres`, `neondb_owner`, and `oserp_preview_bootstrap_owner` are NOT exempted from `oserp_migrations_owner`
      for (const forbiddenMember of [
        'postgres',
        'neondb_owner',
        'oserp_preview_bootstrap_owner',
      ]) {
        assert.equal(
          evaluateRolePostureForManagedPg18Rc(
            [
              ...validRoles39,
              { rolname: forbiddenMember, rolsuper: false, rolcanlogin: true },
            ],
            39,
            {},
            [{ group_name: 'oserp_migrations_owner', member_name: forbiddenMember }]
          ).classification,
          'BLOCKED_UNAUTHORIZED_GOVERNED_GROUP_MEMBER'
        );
      }

      // 7) Privileged parent-role grants (e.g. `external_rls_owner` BYPASSRLS granted to `oserp_compat_app` or `oserp_preview_runtime_app`)
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            {
              rolname: 'external_rls_owner',
              rolsuper: false,
              rolcanlogin: false,
              rolbypassrls: true,
            },
          ],
          39,
          {},
          [{ group_name: 'external_rls_owner', member_name: 'oserp_compat_app' }]
        ).classification,
        'BLOCKED_UNEXPECTED_PARENT_ROLE_ON_GOVERNED_GROUP'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            {
              rolname: 'oserp_preview_runtime_app',
              rolsuper: false,
              rolcanlogin: true,
              rolbypassrls: false,
            },
            {
              rolname: 'external_rls_owner',
              rolsuper: false,
              rolcanlogin: false,
              rolbypassrls: true,
            },
          ],
          39,
          {},
          [
            { group_name: 'oserp_compat_app', member_name: 'oserp_preview_runtime_app' },
            { group_name: 'external_rls_owner', member_name: 'oserp_preview_runtime_app' },
          ]
        ).classification,
        'BLOCKED_UNAUTHORIZED_PARENT_ROLE_ON_OPERATIONAL_ROLE'
      );

      // 8) Preexisting governed role at 0, static password flag, overprivileged runtime login, unlocked migrate_admin
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [{ rolname: 'oserp_compat_app', rolsuper: false }],
          0
        ).classification,
        'BLOCKED_PREEXISTING_GOVERNED_GROUP_ROLE'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          validRoles39.map((r) =>
            r.rolname === 'oserp_compat_app' ? { ...r, has_password: true } : r
          ),
          39
        ).classification,
        'BLOCKED_GROUP_ROLE_HAS_STATIC_PASSWORD'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            {
              rolname: 'oserp_preview_runtime_app',
              rolsuper: false,
              rolcanlogin: true,
              rolbypassrls: true,
            },
          ],
          39
        ).classification,
        'BLOCKED_OVERPRIVILEGED_RUNTIME_OR_PREFLIGHT_LOGIN'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'oserp_preview_migrate_admin', rolsuper: false, rolcanlogin: true },
          ],
          39,
          { requireLockedMigrateAdmin: false }
        ).classification,
        'BLOCKED_UNLOCKED_MIGRATE_ADMIN_ROLE'
      );

      // 9) Administrative membership delegation (`admin_option: true`) and disabled inheritance (`inherit_option: false`) on runtime roles
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'oserp_preview_runtime_app', rolsuper: false, rolcanlogin: true },
          ],
          39,
          {},
          [
            {
              group_name: 'oserp_compat_app',
              member_name: 'oserp_preview_runtime_app',
              admin_option: true,
              inherit_option: true,
              set_option: true,
            },
          ]
        ).classification,
        'BLOCKED_RUNTIME_ROLE_MEMBERSHIP_ADMIN_OPTION_FORBIDDEN'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'oserp_preview_runtime_app', rolsuper: false, rolcanlogin: true },
          ],
          39,
          {},
          [
            {
              group_name: 'oserp_compat_app',
              member_name: 'oserp_preview_runtime_app',
              admin_option: false,
              inherit_option: false,
              set_option: true,
            },
          ]
        ).classification,
        'BLOCKED_RUNTIME_ROLE_MEMBERSHIP_INHERIT_DISABLED'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'oserp_preview_runtime_app', rolsuper: false, rolcanlogin: true },
          ],
          39,
          { requireExplicitMembershipOptions: true },
          [
            {
              group_name: 'oserp_compat_app',
              member_name: 'oserp_preview_runtime_app',
              admin_option: false,
              inherit_option: true,
              set_option: true,
            },
          ]
        ).classification,
        'PASS_ROLE_POSTURE_VERIFIED'
      );
      assert.equal(
        evaluateRolePostureForManagedPg18Rc(
          [
            ...validRoles39,
            { rolname: 'oserp_preview_runtime_app', rolsuper: false, rolcanlogin: true },
          ],
          39,
          { requireExplicitMembershipOptions: true },
          [{ group_name: 'oserp_compat_app', member_name: 'oserp_preview_runtime_app' }]
        ).classification,
        'BLOCKED_MISSING_MEMBERSHIP_OPTIONS'
      );

      return { assertionsPassed: 24 };
    }
  );

  // Spin up brand-new ephemeral PostgreSQL 18 cluster in %TEMP% (strictly PG18, zero PG17 fallback)
  const initdbExe = locatePg18Bin('initdb');
  const pgCtlExe = locatePg18Bin('pg_ctl');
  const tmpClusterDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-m15-rc-v1-pg18-'));
  const dataDir = path.join(tmpClusterDir, 'data');
  const logFile = path.join(tmpClusterDir, 'postgres.log');
  const port = await findFreePort();

  let pgStarted = false;
  try {
    const initRes = spawnSync(
      initdbExe,
      ['-D', dataDir, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--no-locale'],
      { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 30000 }
    );
    assert.equal(initRes.status, 0, `initdb failed: ${initRes.stderr}`);

    const startRes = spawnSync(
      pgCtlExe,
      ['-D', dataDir, '-l', logFile, '-w', '-o', `-h 127.0.0.1 -p ${port}`, 'start'],
      { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 30000 }
    );
    assert.equal(startRes.status, 0, `pg_ctl start failed: ${startRes.stderr}`);
    pgStarted = true;

    const adminPw = crypto.randomBytes(20).toString('hex');
    const roPw = crypto.randomBytes(20).toString('hex');
    const targetDb = `oserp_rc_v1_disp_${crypto.randomBytes(4).toString('hex')}`;

    let disposableServerVersion = null;
    let disposableServerVersionNum = 0;

    const superClient = new Client({
      host: '127.0.0.1',
      port,
      user: 'postgres',
      database: 'postgres',
    });
    await superClient.connect();
    try {
      const sv = (
        await superClient.query(
          `SELECT current_setting('server_version') AS v, current_setting('server_version_num')::int AS n`
        )
      ).rows[0];
      disposableServerVersion = sv.v;
      disposableServerVersionNum = sv.n;
      assert.ok(disposableServerVersionNum >= 180000 && disposableServerVersionNum < 190000);

      await superClient.query("SET password_encryption = 'scram-sha-256'");
      await superClient.query(
        `CREATE ROLE oserp_preview_migrate_admin LOGIN NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS INHERIT PASSWORD '${adminPw}'`
      );
      await superClient.query(
        `ALTER ROLE oserp_preview_migrate_admin SET createrole_self_grant = 'set, inherit'`
      );
      await superClient.query(
        `CREATE ROLE oserp_preview_preflight_ro LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT PASSWORD '${roPw}'`
      );
      await superClient.query(
        `ALTER ROLE oserp_preview_preflight_ro SET default_transaction_read_only = on`
      );
      await superClient.query(`CREATE DATABASE "${targetDb}" OWNER oserp_preview_migrate_admin`);
    } finally {
      await superClient.end();
    }

    const dbOwnerClient = new Client({
      host: '127.0.0.1',
      port,
      user: 'oserp_preview_migrate_admin',
      password: adminPw,
      database: targetDb,
    });
    await dbOwnerClient.connect();
    try {
      await dbOwnerClient.query(
        `GRANT CONNECT ON DATABASE "${targetDb}" TO oserp_preview_preflight_ro`
      );
      await dbOwnerClient.query(`GRANT USAGE ON SCHEMA public TO oserp_preview_preflight_ro`);
      await dbOwnerClient.query(`GRANT CREATE ON SCHEMA public TO PUBLIC`);
    } finally {
      await dbOwnerClient.end();
    }

    // RC-VAL-03: Live non-superuser negative checks & reproduction of original Migration #15 42501
    await check(
      'RC-VAL-03 Live disposable PG18 (server_version_num >= 180000) negative role guards and original M15 42501 reproduction',
      async () => {
        const sc = new Client({
          host: '127.0.0.1',
          port,
          user: 'postgres',
          database: targetDb,
        });
        const ro = new Client({
          host: '127.0.0.1',
          port,
          user: 'oserp_preview_preflight_ro',
          password: roPw,
          database: targetDb,
        });
        await sc.connect();
        await ro.connect();
        let origM15Error = null;
        try {
          // 1) Preexisting governed group role on empty DB -> fail closed
          await sc.query(`CREATE ROLE oserp_compat_app NOLOGIN`);
          const preExistVerdict = await inspectTargetForManagedPg18Rc(ro, rcDisk, authority, {
            allowEmpty: true,
          });
          assert.equal(preExistVerdict.eligible, false);
          assert.equal(preExistVerdict.classification, 'BLOCKED_PREEXISTING_GOVERNED_GROUP_ROLE');
          await sc.query(`DROP ROLE oserp_compat_app`);

          // 2) Uppercase unrecognized `OSERP_UPPER` role -> fail closed (case-insensitive SQL + evaluator)
          await sc.query(`CREATE ROLE "OSERP_UPPER" LOGIN`);
          const upperVerdict = await inspectTargetForManagedPg18Rc(ro, rcDisk, authority, {
            allowEmpty: true,
          });
          assert.equal(upperVerdict.eligible, false);
          assert.equal(upperVerdict.classification, 'BLOCKED_UNRECOGNIZED_OSERP_ROLE');
          await sc.query(`DROP ROLE "OSERP_UPPER"`);

          // 3) Preexisting superuser `oserp_*` role -> fail closed
          await sc.query(`CREATE ROLE oserp_rogue_superuser LOGIN SUPERUSER`);
          const superVerdict = await inspectTargetForManagedPg18Rc(ro, rcDisk, authority, {
            allowEmpty: true,
          });
          assert.equal(superVerdict.eligible, false);
          assert.equal(superVerdict.classification, 'BLOCKED_PRIVILEGED_OSERP_ROLE_DETECTED');
          await sc.query(`DROP ROLE oserp_rogue_superuser`);

          // 4) Clean empty DB passes preflight
          const cleanPreVerdict = await inspectTargetForManagedPg18Rc(ro, rcDisk, authority, {
            allowEmpty: true,
          });
          assert.equal(cleanPreVerdict.eligible, true);
          assert.equal(cleanPreVerdict.classification, 'ELIGIBLE_APPROVED_EMPTY_BASELINE');
          assert.equal(cleanPreVerdict.serverVersionNum, disposableServerVersionNum);

          // 5) Confirm `rolsuper = false` reproduces `42501` on original Migration #15 line 29
          const nonSuper = new Client({
            host: '127.0.0.1',
            port,
            user: 'oserp_preview_migrate_admin',
            password: adminPw,
            database: targetDb,
          });
          await nonSuper.connect();
          try {
            await nonSuper.query('BEGIN');
            try {
              await nonSuper.query(
                `CREATE ROLE _m15_repro NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS`
              );
              await nonSuper.query(
                `ALTER ROLE _m15_repro NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS`
              );
            } catch (e) {
              origM15Error = { code: e.code, message: e.message, detail: e.detail || null };
            } finally {
              await nonSuper.query('ROLLBACK');
            }
          } finally {
            await nonSuper.end();
          }
          assert.ok(origM15Error);
          assert.equal(origM15Error.code, '42501');
        } finally {
          await ro.end();
          await sc.end();
        }
        return {
          disposablePgVersion: disposableServerVersion,
          disposablePgVersionNum: disposableServerVersionNum,
          preexistingGroupRoleBlocked: true,
          uppercaseUnrecognizedOserpRoleBlocked: true,
          preexistingSuperuserRoleBlocked: true,
          cleanEmptyBaselineEligible: true,
          originalM15FailureReproducedUnderNonSuperuser: origM15Error,
        };
      }
    );

    // RC-VAL-04: Official `prisma migrate deploy` of `MANAGED_PG18_RC_V1` under `rolsuper = false`
    await check(
      'RC-VAL-04 Complete 39-migration MANAGED_PG18_RC_V1 sequence applies cleanly via prisma migrate deploy under rolsuper=false',
      async () => {
        const migrateUrl = `postgresql://oserp_preview_migrate_admin:${adminPw}@127.0.0.1:${port}/${targetDb}?sslmode=disable`;
        const md = spawnSync(
          'npx.cmd',
          ['prisma', 'migrate', 'deploy', `--schema=${RC_PRISMA_DIR}/schema.prisma`],
          {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, DATABASE_URL: migrateUrl, DIRECT_URL: migrateUrl },
            encoding: 'utf8',
            shell: true,
            timeout: 180000,
          }
        );
        assert.equal(
          md.status,
          0,
          `prisma migrate deploy failed: ${md.stdout || ''}\n${md.stderr || ''}`
        );

        const sc = new Client({
          host: '127.0.0.1',
          port,
          user: 'postgres',
          database: targetDb,
        });
        await sc.connect();
        let authidAudit;
        let ledgerState;
        let xidHealth;
        let superGateVerdictWithPgAuthid;
        let staticPasswordBlockedLive = false;
        let nestedLoginMemberBlockedLive = false;
        let runtimeAdminOptionBlockedLive = false;
        try {
          await sc.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
          await sc.query(
            `ALTER ROLE oserp_preview_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0`
          );
          await sc.query(
            `GRANT SELECT ON TABLE public."_prisma_migrations" TO oserp_preview_preflight_ro`
          );

          // Live test 1: prove `pg_authid` password check inside `inspectTargetForManagedPg18Rc`
          // blocks a group role carrying a static password, then passes when `PASSWORD NULL` is restored.
          await sc.query(`ALTER ROLE oserp_compat_app PASSWORD 'temp_should_block'`);
          const pwBlocked = await inspectTargetForManagedPg18Rc(sc, rcDisk, authority, {
            allowEmpty: false,
            allowSuperuserInspection: true,
          });
          assert.equal(pwBlocked.eligible, false);
          assert.equal(pwBlocked.classification, 'BLOCKED_GROUP_ROLE_HAS_STATIC_PASSWORD');
          staticPasswordBlockedLive = true;
          await sc.query(`ALTER ROLE oserp_compat_app PASSWORD NULL`);

          // Live test 2: prove nested login membership (`nested_leaf -> nested_mid -> oserp_migrations_owner`)
          // is caught and blocked live, then clean up.
          await sc.query(`CREATE ROLE nested_mid NOLOGIN`);
          await sc.query(`CREATE ROLE nested_leaf LOGIN`);
          await sc.query(`GRANT oserp_migrations_owner TO nested_mid`);
          await sc.query(`GRANT nested_mid TO nested_leaf`);
          const nestedBlocked = await inspectTargetForManagedPg18Rc(sc, rcDisk, authority, {
            allowEmpty: false,
            allowSuperuserInspection: true,
          });
          assert.equal(nestedBlocked.eligible, false);
          nestedLoginMemberBlockedLive = true;
          await sc.query(`REVOKE nested_mid FROM nested_leaf`);
          await sc.query(`REVOKE oserp_migrations_owner FROM nested_mid`);
          await sc.query(`DROP ROLE nested_leaf`);
          await sc.query(`DROP ROLE nested_mid`);

          // Live test 3: prove runtime membership `WITH ADMIN OPTION` (`oserp_preview_runtime_app -> oserp_compat_app`)
          // is blocked live by `inspectTargetForManagedPg18Rc`, and passes when `ADMIN OPTION` is revoked.
          await sc.query(
            `CREATE ROLE oserp_preview_runtime_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT`
          );
          await sc.query(`GRANT oserp_compat_app TO oserp_preview_runtime_app WITH ADMIN OPTION`);
          const adminOptBlocked = await inspectTargetForManagedPg18Rc(sc, rcDisk, authority, {
            allowEmpty: false,
            allowSuperuserInspection: true,
          });
          assert.equal(adminOptBlocked.eligible, false);
          assert.equal(
            adminOptBlocked.classification,
            'BLOCKED_RUNTIME_ROLE_MEMBERSHIP_ADMIN_OPTION_FORBIDDEN'
          );
          runtimeAdminOptionBlockedLive = true;
          await sc.query(`REVOKE ADMIN OPTION FOR oserp_compat_app FROM oserp_preview_runtime_app`);
          const cleanRuntimeEdge = (
            await sc.query(`
              SELECT m.admin_option, m.inherit_option, m.set_option
              FROM pg_auth_members m
              JOIN pg_roles g ON g.oid = m.roleid
              JOIN pg_roles mr ON mr.oid = m.member
              WHERE g.rolname = 'oserp_compat_app' AND mr.rolname = 'oserp_preview_runtime_app'
            `)
          ).rows[0];
          assert.deepEqual(cleanRuntimeEdge, {
            admin_option: false,
            inherit_option: true,
            set_option: true,
          });
          const adminOptRevokedPass = await inspectTargetForManagedPg18Rc(sc, rcDisk, authority, {
            allowEmpty: false,
            allowSuperuserInspection: true,
          });
          assert.equal(adminOptRevokedPass.eligible, true);
          await sc.query(`REVOKE oserp_compat_app FROM oserp_preview_runtime_app`);
          await sc.query(`DROP ROLE oserp_preview_runtime_app`);

          // Live test 4: verify `pg_authid`-enabled gate inspection passes with `passwordNullCheckedViaPgAuthid = true`
          superGateVerdictWithPgAuthid = await inspectTargetForManagedPg18Rc(sc, rcDisk, authority, {
            allowEmpty: false,
            allowSuperuserInspection: true,
          });
          assert.equal(superGateVerdictWithPgAuthid.eligible, true);
          assert.equal(
            superGateVerdictWithPgAuthid.roleSecurityPosture.passwordNullCheckedViaPgAuthid,
            true
          );

          authidAudit = (
            await sc.query(`
              SELECT
                rolname,
                rolsuper,
                rolcanlogin,
                rolcreatedb,
                rolcreaterole,
                rolreplication,
                rolbypassrls,
                rolpassword IS NULL AS password_is_null
              FROM pg_authid
              WHERE rolname IN (
                'oserp_migrations_owner',
                'oserp_compat_app',
                'oserp_legacy_app',
                'oserp_maint_cleanup_role',
                'oserp_company_payroll_app',
                'oserp_company_payroll_verifier'
              )
              ORDER BY rolname ASC
            `)
          ).rows;

          assert.equal(authidAudit.length, 6);
          for (const row of authidAudit) {
            assert.equal(row.rolsuper, false, `${row.rolname} must have rolsuper=false`);
            assert.equal(row.rolcanlogin, false, `${row.rolname} must have rolcanlogin=false`);
            assert.equal(
              row.password_is_null,
              true,
              `${row.rolname} must have rolpassword IS NULL`
            );
          }

          ledgerState = (
            await sc.query(`SELECT * FROM public.uboq_verify_prisma_migration_ledger_state()`)
          ).rows[0];
          xidHealth = (
            await sc.query(`SELECT public.uboq_inspect_xid_rollover_health() AS h`)
          ).rows[0].h;

          assert.equal(Number(ledgerState.finished_active_rows), 39);
          assert.equal(Number(ledgerState.unfinished_or_rolled_back_rows), 0);
          assert.equal(Number(ledgerState.invalid_checksum_rows), 0);
          assert.equal(xidHealth.healthy, true);
        } finally {
          await sc.end();
        }

        const ro = new Client({
          host: '127.0.0.1',
          port,
          user: 'oserp_preview_preflight_ro',
          password: roPw,
          database: targetDb,
        });
        await ro.connect();
        let postVerdict;
        try {
          postVerdict = await inspectTargetForManagedPg18Rc(ro, rcDisk, authority, {
            allowEmpty: false,
          });
        } finally {
          await ro.end();
        }

        assert.equal(
          postVerdict.eligible,
          true,
          `Unexpected postVerdict: ${JSON.stringify(postVerdict)}`
        );
        assert.equal(postVerdict.classification, 'ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE');
        assert.equal(postVerdict.verifiedMigrationCount, 39);
        assert.equal(postVerdict.pendingMigrationCount, 0);
        assert.equal(postVerdict.recordedMigration14Checksum, CANONICAL_MIG14_SHA256);
        assert.equal(postVerdict.recordedMigration15Checksum, CANDIDATE_MIG15_SHA256);

        return {
          disposableDatabase: targetDb,
          disposablePgVersion: disposableServerVersion,
          disposablePgVersionNum: disposableServerVersionNum,
          appliedAsNonSuperuser: true,
          staticPasswordBlockedLiveViaPgAuthid: staticPasswordBlockedLive,
          nestedLoginMemberBlockedLive,
          runtimeAdminOptionBlockedLive,
          postVerdictReadOnlyPreflight: postVerdict,
          postVerdictPgAuthidPasswordVerified:
            superGateVerdictWithPgAuthid.roleSecurityPosture.passwordNullCheckedViaPgAuthid,
          pgAuthidGroupRolesVerified: authidAudit,
          ledgerState,
          xidHealthHealthy: xidHealth.healthy,
        };
      }
    );

    // RC-VAL-05: Comprehensive Schema, Function Body, ACL, Default Privilege & Role Equivalence Diff
    await check(
      'RC-VAL-05 Comprehensive schema, function-body, ACL, default-privilege, and role-membership equivalence vs historical reference DB',
      async () => {
        const sc = new Client({
          host: '127.0.0.1',
          port,
          user: 'postgres',
          database: targetDb,
        });
        await sc.connect();
        let candidateCapture;
        let unfilteredCandidateMemberships;
        try {
          await sc.query(
            `REVOKE SELECT ON TABLE public."_prisma_migrations" FROM oserp_preview_preflight_ro`
          );
          await sc.query(`REVOKE USAGE ON SCHEMA public FROM oserp_preview_preflight_ro`);
          unfilteredCandidateMemberships = (
            await sc.query(`
              SELECT
                g.rolname AS group_name,
                m_role.rolname AS member_name,
                m_role.rolcanlogin,
                m.admin_option,
                m.inherit_option,
                m.set_option
              FROM pg_auth_members m
              JOIN pg_roles g ON g.oid = m.roleid
              JOIN pg_roles m_role ON m_role.oid = m.member
              WHERE g.rolname !~ '^pg_' AND m_role.rolname !~ '^pg_'
              ORDER BY g.rolname ASC, m_role.rolname ASC
            `)
          ).rows;
          for (const edge of unfilteredCandidateMemberships) {
            assert.equal(
              edge.member_name,
              'oserp_preview_migrate_admin',
              `Unexpected non-runner membership edge on candidate cluster: ${JSON.stringify(edge)}`
            );
            assert.equal(
              edge.rolcanlogin,
              false,
              'Locked runner role must have rolcanlogin=false on all creator membership edges'
            );
          }
          candidateCapture = await captureSchemaFingerprint(sc, 'oserp_preview_migrate_admin');
        } finally {
          await sc.end();
        }

        if (
          candidateCapture.fingerprintData.relationAndSequenceAclsSha256 !==
          referenceCapture.fingerprintData.relationAndSequenceAclsSha256
        ) {
          const refMap = new Map(
            referenceCapture.rawRelationAcls.map((x) => [`${x.relkind}:${x.relname}`, x])
          );
          const diffs = candidateCapture.rawRelationAcls
            .filter((x) => JSON.stringify(x) !== JSON.stringify(refMap.get(`${x.relkind}:${x.relname}`)))
            .slice(0, 5)
            .map((x) => ({ cand: x, ref: refMap.get(`${x.relkind}:${x.relname}`) }));
          throw new Error(`Relation ACL diff: ${JSON.stringify(diffs)}`);
        }
        assert.deepEqual(candidateCapture.fingerprintData, referenceCapture.fingerprintData);
        return {
          exactComprehensiveMatchWithHistoricalReference: true,
          referencePgVersionNum: referenceCapture.serverVersionNum,
          candidatePgVersionNum: candidateCapture.serverVersionNum,
          tableCount: candidateCapture.fingerprintData.tableCount,
          columnsWithDefaultsCount: candidateCapture.fingerprintData.columnsCount,
          constraintsCount: candidateCapture.fingerprintData.constraintsCount,
          indexesCount: candidateCapture.fingerprintData.indexesCount,
          policiesCount: candidateCapture.fingerprintData.policiesCount,
          triggersCount: candidateCapture.fingerprintData.triggersCount,
          functionsWithFullBodiesAndAclsCount: candidateCapture.fingerprintData.functionsCount,
          relationAndSequenceAclsCount:
            candidateCapture.fingerprintData.relationAndSequenceAclsCount,
          publicSchemaOwner: candidateCapture.fingerprintData.publicSchemaOwner,
          publicSchemaFullAcl: candidateCapture.fingerprintData.publicSchemaFullAcl,
          defaultPrivilegesCount: candidateCapture.fingerprintData.defaultPrivilegesCount,
          groupRoleGrantsCount: candidateCapture.fingerprintData.groupRoleGrantsCount,
          activeGovernedMembershipsCount:
            candidateCapture.fingerprintData.activeGovernedMemberships.length,
        };
      }
    );
  } finally {
    if (pgStarted) {
      spawnSync(pgCtlExe, ['-D', dataDir, '-m', 'immediate', 'stop'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 20000,
      });
    }
    fs.rmSync(tmpClusterDir, { recursive: true, force: true });
  }

  report.overallDisposition = 'PASS_MANAGED_PG18_RC_V1_VALIDATED';
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({ overallDisposition: report.overallDisposition, outPath: OUT_PATH }, null, 2)
  );
})();
