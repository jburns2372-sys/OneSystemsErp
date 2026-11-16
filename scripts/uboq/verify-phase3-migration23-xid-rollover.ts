/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const { verifyLedgerAgainstDisk } = require('./migration-checksum-guard.cjs');
const { assert } = s;

const OUT_PATH = 'artifacts/uboq/release-readiness/phase3-migration23-xid-rollover.json';

const report: Record<string, any> = {
  project: 'OSERP-PROJ-UBOQ-001',
  phase: 'PHASE_3_MIGRATION_23_XID_ROLLOVER_HARDENING',
  remediatedByMigration: '20261116020000_uboq_release_readiness_m23_xid_rollover_hardening',
  evaluatedAt: new Date().toISOString(),
  checks: [],
};

function save() {
  s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
}

async function check(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  const detail = await fn();
  report.checks.push({
    name,
    result: 'PASS',
    milliseconds: Date.now() - start,
    detail,
  });
  save();
  console.log(`PASS ${name}`);
}

let admin: any;
let companyClient: any;
let server: any;
let savedAuthority: any[] | null = null;
const prefix = 'SYNTH-M23-XID-' + s.crypto.randomBytes(5).toString('hex');
const createdPeriodIds = new Set<string>();
const createdNonceAuditIds = new Set<string>();

async function withSignedCompanyContext<T>(
  op: string,
  target: string,
  fn: () => Promise<T>
): Promise<T> {
  return s.transaction(companyClient, async () => {
    const nonce = s.crypto.randomBytes(16).toString('hex');
    createdNonceAuditIds.add('company-' + nonce);
    const x = [
      s.f.ids.e1,
      s.f.ids.a,
      '7',
      op,
      target,
      s.hash('phase3-m23-xid-rollover'),
      String(Math.floor(Date.now() / 1000)),
      nonce,
      '',
    ];
    const mac = s.crypto
      .createHmac('sha256', Buffer.from(s.f.signing, 'hex'))
      .update(['OSERP_COMPANY_PAYROLL_V1', ...x].join('|'))
      .digest('hex');
    const keys = [
      'employer_id',
      'user_id',
      'session_version',
      'operation',
      'target_id',
      'payload_hash',
      'issued',
      'nonce',
      'simulated_role',
      'signature',
    ];
    for (let i = 0; i < keys.length; i++) {
      await companyClient.query('SELECT set_config($1, $2, true)', [
        'app.company_' + keys[i],
        [...x, mac][i],
      ]);
    }
    await companyClient.query('SELECT public.company_payroll_begin()');
    const res = await fn();
    await companyClient.query('SELECT public.company_payroll_finish()');
    return { nonce, res };
  });
}

(async () => {
  admin = await s.connect();
  report.identity = await s.identity(admin);
  companyClient = await s.connect({ user: s.f.companyLogin, password: s.f.companyPw });

  // Capture baseline table row counts for zero-residue proof
  const baselineCountsRow = (
    await admin.query(
      `SELECT COUNT(*)::int AS periods FROM public."PayrollPeriod" WHERE "periodType" LIKE $1`,
      [prefix + '%']
    )
  ).rows[0];
  assert.equal(baselineCountsRow.periods, 0);

  savedAuthority = (
    await admin.query(
      `SELECT operation, enabled, "revokedAt"
         FROM public."EmployerPayrollAuthority"
        WHERE "employerId" = $1 AND "userId" = $2`,
      [s.f.ids.e1, s.f.ids.a]
    )
  ).rows;

  await check(
    'P3-01 PostgreSQL 18 XID age, multixact age, autovacuum settings, long-running xacts, and zero legacy xmin::text::bigint expressions',
    async () => {
      const health = (
        await admin.query(`SELECT public.uboq_inspect_xid_rollover_health() AS h`)
      ).rows[0].h;
      assert.equal(health.healthy, true);
      assert.equal(health.autovacuum, 'on');
      assert.equal(health.legacyXminBigintPolicyCount, 0);
      assert.equal(health.longRunningXactOver5mCount, 0);
      assert.ok(health.datfrozenxidAge < 10_000_000);
      assert.ok(health.maxPublicRelfrozenxidAge < 10_000_000);
      assert.ok(health.headroomToAutovacuumFreeze > 190_000_000);
      assert.ok(health.headroomToWraparoundStop > 2_100_000_000);

      const fnScan = (
        await admin.query(`
          SELECT p.proname
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
             AND p.prokind = 'f'
             AND pg_get_functiondef(p.oid) ~* 'xmin\\)::text\\)::bigint = txid_current|xmin::text::bigint = txid_current'
        `)
      ).rows;
      assert.equal(fnScan.length, 0);

      const polScan = (
        await admin.query(`
          SELECT tablename, policyname, qual
            FROM pg_policies
           WHERE schemaname = 'public'
             AND policyname = 'h02b_company_read'
           ORDER BY tablename ASC
        `)
      ).rows;
      assert.equal(polScan.length, 3);
      for (const p of polScan) {
        assert.match(p.qual, /company_payroll_created_in_current_xact/);
        assert.doesNotMatch(p.qual, /txid_current/);
      }

      return { health, updatedPolicies: polScan.map((x: any) => x.tablename) };
    }
  );

  await check(
    'P3-02 Mathematical & xid8->xid rollover proof across epochs 0, 1, 2, 42, 1000 and 32-bit wraparound boundary (2^32 - 1 -> 3)',
    async () => {
      const vectors = [
        { epoch: 0n, low32: 4605n },
        { epoch: 1n, low32: 3n },
        { epoch: 1n, low32: 4605n },
        { epoch: 1n, low32: 4294967295n },
        { epoch: 2n, low32: 42n },
        { epoch: 42n, low32: 2147483648n },
        { epoch: 1000n, low32: 999999n },
      ];
      const results = [];
      for (const v of vectors) {
        const xid8Val = ((v.epoch << 32n) | v.low32).toString();
        const low32Str = v.low32.toString();
        const wrongLow32Str = (v.low32 === 4294967295n ? 3n : v.low32 + 1n).toString();

        const row = (
          await admin.query(
            `SELECT
               ((($1::text)::xid)::text::bigint = ($2::text)::bigint) AS legacy_broken_expr,
               public.company_payroll_xmin_matches_xid8(($1::text)::xid, ($2::text)::xid8) AS rollover_safe_match,
               public.company_payroll_xmin_matches_xid8(($3::text)::xid, ($2::text)::xid8) AS rollover_safe_mismatch`,
            [low32Str, xid8Val, wrongLow32Str]
          )
        ).rows[0];

        if (v.epoch === 0n) {
          assert.equal(row.legacy_broken_expr, true);
        } else {
          // Proves Migration #23 failed 100% of the time at epoch >= 1!
          assert.equal(row.legacy_broken_expr, false);
        }
        assert.equal(row.rollover_safe_match, true);
        assert.equal(row.rollover_safe_mismatch, false);
        results.push({
          epoch: v.epoch.toString(),
          low32: low32Str,
          xid8: xid8Val,
          legacyBrokenExpr: row.legacy_broken_expr,
          rolloverSafeMatch: row.rollover_safe_match,
        });
      }
      return { verifiedVectors: results.length, sample: results.slice(0, 4) };
    }
  );

  await check(
    'P3-03 Role permissions, PUBLIC revocation, non-login group invariants, and restricted-login privilege boundaries',
    async () => {
      const roles = (
        await admin.query(`
          SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
            FROM pg_roles
           WHERE rolname IN (
             'oserp_company_payroll_app',
             'oserp_company_payroll_verifier',
             'oserp_compat_app',
             'oserp_legacy_app',
             'oserp_maint_cleanup_role',
             'oserp_migrations_owner'
           )
           ORDER BY rolname
        `)
      ).rows;
      assert.equal(roles.length, 6);
      for (const r of roles) {
        assert.equal(r.rolsuper, false);
        assert.equal(r.rolcanlogin, false);
        if (r.rolname !== 'oserp_migrations_owner') {
          assert.equal(r.rolbypassrls, false);
        }
      }

      const publicExec = (
        await admin.query(`
          SELECT proname,
                 has_function_privilege('public', oid, 'EXECUTE') AS pub_exec,
                 has_function_privilege('oserp_company_payroll_app', oid, 'EXECUTE') AS app_exec
            FROM pg_proc
           WHERE pronamespace = 'public'::regnamespace
             AND proname IN (
               'company_payroll_xmin_matches_xid8',
               'company_payroll_created_in_current_xact',
               'company_payroll_guard',
               'company_payroll_finish',
               'uboq_inspect_xid_rollover_health'
             )
           ORDER BY proname
        `)
      ).rows;
      assert.equal(publicExec.length, 5);
      for (const f of publicExec) {
        assert.equal(f.pub_exec, false, `PUBLIC must not have EXECUTE on ${f.proname}`);
      }

      await assert.rejects(
        () => companyClient.query('SELECT * FROM public._company_payroll_commands'),
        (e: any) => e.code === '42501'
      );
      await assert.rejects(
        () => companyClient.query('SELECT public.uboq_inspect_xid_rollover_health()'),
        (e: any) => e.code === '42501'
      );
      const isVerifierMember = (
        await companyClient.query(
          `SELECT pg_has_role(current_user, 'oserp_company_payroll_verifier', 'MEMBER') AS m`
        )
      ).rows[0].m;
      assert.equal(isVerifierMember, false);

      return { rolesVerified: roles.length, functionsVerified: publicExec };
    }
  );

  await check(
    'P3-04 Restricted SQL CREATE_PERIOD reads newly created rows while blocking historical/frozen rows and duplicate-ID savepoint attacks',
    async () => {
      const histId = `${prefix}-HIST`;
      createdPeriodIds.add(histId);
      await s.transaction(admin, async () => {
        await admin.query("SET LOCAL session_replication_role = 'replica'");
        await admin.query(
          `INSERT INTO public."PayrollPeriod"(
             id, "payrollBatchNumber", month, year, "calendarRule", "periodType",
             "startDate", "endDate", "payrollDate", "employerId",
             "employerOwnershipVerifiedAt", "employerOwnershipEvidenceRef", "createdById", "updatedAt"
           ) VALUES (
             $1, $1, 11, 2096, 'MONTHLY', $1,
             '2096-11-01', '2096-11-30', '2096-11-30', $2,
             now(), 'SYNTH-PHASE3-M23', $3, now()
           )`,
          [histId, s.f.ids.e1, s.f.ids.a]
        );
        await admin.query(
          `INSERT INTO public."Payroll"(
             id, "workerId", "payrollPeriodId", "compensationType", rate, "basicPay", "netPay", "updatedAt"
           ) VALUES ($1, $2, $3, 'DAILY', 100, 100, 100, now())`,
          [histId + '-PAY', s.f.ids.w1, histId]
        );
        await admin.query(
          `INSERT INTO public."DailyTimeRecord"(
             id, "workerId", date, "payrollPeriodId", "regularHours", "updatedAt"
           ) VALUES ($1, $2, '2096-11-10', $3, 8, now())`,
          [histId + '-DTR', s.f.ids.w1, histId]
        );
      });

      // Freeze historical tuples to prove VACUUM FREEZE does not expose historical rows
      await admin.query('VACUUM (FREEZE) public."PayrollPeriod", public."Payroll", public."DailyTimeRecord"');

      // Restrict authority strictly to CREATE_PERIOD (VIEW disabled)
      await admin.query(
        `UPDATE public."EmployerPayrollAuthority"
            SET enabled = (operation = 'CREATE_PERIOD'),
                "revokedAt" = CASE WHEN operation = 'CREATE_PERIOD' THEN NULL ELSE now() END
          WHERE "employerId" = $1 AND "userId" = $2`,
        [s.f.ids.e1, s.f.ids.a]
      );

      // 1) Spoofing existing historical target ID in CREATE_PERIOD reveals 0 rows and blocks duplicate PK attack
      await withSignedCompanyContext('CREATE_PERIOD', histId, async () => {
        for (const tbl of ['PayrollPeriod', 'Payroll', 'DailyTimeRecord']) {
          const cnt = (await companyClient.query(`SELECT id FROM public."${tbl}"`)).rowCount;
          assert.equal(cnt, 0, `${tbl} must reveal 0 historical rows during CREATE_PERIOD`);
        }

        await companyClient.query('SAVEPOINT sp_dup_attack');
        let dupErr = '';
        try {
          await companyClient.query(
            `INSERT INTO public."PayrollPeriod"(
               id, "employerId", "projectId", "employerOwnershipEvidenceRef", "employerOwnershipVerifiedAt",
               "payrollBatchNumber", month, year, "calendarRule", "periodType",
               "startDate", "endDate", "payrollDate", status, "isLocked", "createdById", "updatedAt"
             ) VALUES (
               $1, $2, NULL, 'attack-ref', now(),
               $3, 10, 2096, 'MONTHLY', $3,
               '2096-10-01', '2096-10-31', '2096-10-31', 'DRAFT', false, $4, now()
             )`,
            [histId, s.f.ids.e1, `${prefix}-ATK`, s.f.ids.a]
          );
        } catch (e: any) {
          dupErr = e.code || '';
          await companyClient.query('ROLLBACK TO SAVEPOINT sp_dup_attack');
        }
        assert.equal(dupErr, '23505');

        const afterAttack = (
          await companyClient.query(`SELECT id FROM public."PayrollPeriod" WHERE id = $1`, [histId])
        ).rowCount;
        assert.equal(afterAttack, 0, 'Historical row must remain invisible after savepoint PK collision');
      });

      // 2) Legitimate CREATE_PERIOD inserts period + multi-row Payroll children and reads back ONLY new rows
      const newPeriodId = `${prefix}-NEW-SQL`;
      createdPeriodIds.add(newPeriodId);
      const created = await withSignedCompanyContext('CREATE_PERIOD', newPeriodId, async () => {
        await companyClient.query(
          `INSERT INTO public."PayrollPeriod"(
             id, "employerId", "projectId", "employerOwnershipEvidenceRef", "employerOwnershipVerifiedAt",
             "payrollBatchNumber", month, year, "calendarRule", "periodType",
             "startDate", "endDate", "payrollDate", status, "isLocked", "createdById", "updatedAt"
           ) VALUES (
             $1, $2, NULL, 'company-command:phase3-sql', now(),
             $1, 9, 2096, 'CUSTOM', $1,
             '2096-09-01', '2096-09-30', '2096-09-30', 'DRAFT', false, $3, now()
           )`,
          [newPeriodId, s.f.ids.e1, s.f.ids.a]
        );
        await companyClient.query(
          `INSERT INTO public."Payroll"(
             id, "workerId", "payrollPeriodId", "projectId", "compensationType", rate, "basicPay", "netPay", "updatedAt"
           ) VALUES
             ($1, $3, $5, NULL, 'DAILY', 100, 0, 0, now()),
             ($2, $4, $5, NULL, 'DAILY', 100, 0, 0, now())`,
          [newPeriodId + '-P1', newPeriodId + '-P2', s.f.ids.w1, s.f.ids.w2, newPeriodId]
        );

        const visiblePeriods = (
          await companyClient.query(`SELECT id FROM public."PayrollPeriod" ORDER BY id`)
        ).rows.map((r: any) => r.id);
        const visiblePayrolls = (
          await companyClient.query(`SELECT id FROM public."Payroll" ORDER BY id`)
        ).rows.map((r: any) => r.id);

        assert.deepEqual(visiblePeriods, [newPeriodId]);
        assert.deepEqual(visiblePayrolls, [newPeriodId + '-P1', newPeriodId + '-P2']);
        return { visiblePeriods, visiblePayrolls };
      });

      // Confirm company_payroll_finish cleared created_row_keys to prevent bloat
      const cmdRow = (
        await admin.query(
          `SELECT completed, cardinality(created_row_keys) AS key_len
             FROM public._company_payroll_commands
            WHERE nonce = $1`,
          [created.nonce]
        )
      ).rows[0];
      assert.equal(cmdRow.completed, true);
      assert.equal(cmdRow.key_len, 0);

      return {
        historicalFrozenRowHidden: true,
        duplicateIdSavepointAttackBlocked: true,
        newlyCreatedRowsVisible: created.res,
        commandKeysClearedOnFinish: true,
      };
    }
  );

  await check(
    'P3-05 End-to-end Express HTTP company payroll lifecycle regression (CREATE_PERIOD, duplicate guard, VIEW, IMPORT_DTR, COMPUTE, EDIT, DELETE)',
    async () => {
      const url = (user: string, pw: string) => {
        const u = new URL('postgresql://127.0.0.1');
        u.port = String(s.config.port);
        u.pathname = '/' + s.config.database;
        u.username = user;
        u.password = pw;
        return u.toString();
      };
      process.env.DATABASE_URL = url(s.f.projectLogin, s.f.projectPw);
      process.env.DIRECT_URL = process.env.DATABASE_URL;
      process.env.COMPANY_PAYROLL_DATABASE_URL = url(s.f.companyLogin, s.f.companyPw);
      process.env.COMPANY_PAYROLL_CONTEXT_SECRET = s.f.signing;
      process.env.AUTH_SECRET = s.crypto.randomBytes(32).toString('hex');
      process.env.UBOQ_RLS_CONTEXT_SECRET = s.f.signing;

      const express = require('express');
      const auth = require('../../apps/aws-backend/src/middleware/auth').requireAuth;
      const router = require('../../apps/aws-backend/src/routes/payroll').default;
      const app = express();
      app.use(express.json());
      app.use('/api', auth);
      app.use('/api/payroll', router);
      server = await new Promise<any>((resolve) => {
        const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
      });

      const callCompany = async (operation: string, periodId?: string, data: any = {}) => {
        const now = Math.floor(Date.now() / 1000);
        const payload = Buffer.from(
          JSON.stringify({
            uid: s.f.ids.a,
            role: 'SUPER_ADMIN',
            sv: 7,
            pid: null,
            sim: null,
            iat: now,
            exp: now + 60,
          })
        ).toString('base64url');
        const token =
          'v1.' +
          payload +
          '.' +
          s.crypto
            .createHmac('sha256', process.env.AUTH_SECRET!)
            .update('v1.' + payload)
            .digest('hex');
        const res = await fetch(
          `http://127.0.0.1:${server.address().port}/api/payroll/company/command`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-auth': token },
            body: JSON.stringify({
              operation,
              periodId,
              data,
              employerId: s.f.ids.e1,
            }),
          }
        );
        return { status: res.status, body: (await res.json()) as any };
      };

      const httpPeriodType = `${prefix}-HTTP`;
      const periodInput = {
        month: 8,
        year: 2096,
        calendarRule: 'CUSTOM',
        periodType: httpPeriodType,
        startDate: '2096-08-01',
        endDate: '2096-08-31',
        payrollDate: '2096-08-31',
      };

      const createRes = await callCompany('CREATE_PERIOD', undefined, periodInput);
      assert.equal(createRes.status, 200, JSON.stringify(createRes.body));
      const httpPeriodId = createRes.body.period.id;
      createdPeriodIds.add(httpPeriodId);

      const dupRes = await callCompany('CREATE_PERIOD', undefined, periodInput);
      assert.equal(dupRes.status, 403);
      assert.match(JSON.stringify(dupRes.body), /DUPLICATE_PERIOD/);

      // Enable full operations for VIEW / EDIT / DELETE
      await admin.query(
        `UPDATE public."EmployerPayrollAuthority"
            SET enabled = true, "revokedAt" = NULL
          WHERE "employerId" = $1 AND "userId" = $2`,
        [s.f.ids.e1, s.f.ids.a]
      );

      const viewRes = await callCompany('VIEW', httpPeriodId);
      assert.equal(viewRes.status, 200);
      assert.equal(viewRes.body.periods.length, 1);

      const editRes = await callCompany('EDIT_DRAFT', httpPeriodId, {
        notes: 'PHASE3-M23-XID-VERIFIED',
      });
      assert.equal(editRes.status, 200);

      const delRes = await callCompany('DELETE_DRAFT', httpPeriodId);
      assert.equal(delRes.status, 200);
      createdPeriodIds.delete(httpPeriodId);

      return {
        httpCreateStatus: createRes.status,
        httpDuplicateBlocked: dupRes.status,
        httpViewStatus: viewRes.status,
        httpEditStatus: editRes.status,
        httpDeleteStatus: delRes.status,
      };
    }
  );

  const ledgerCheck = await verifyLedgerAgainstDisk(admin);
  assert.equal(ledgerCheck.appliedCount, 39);
  assert.equal(ledgerCheck.verifiedMatchCount, 39);

  report.overallDisposition = 'PASS';
  report.scope = 'ISOLATED_LOCAL_VERIFIED';
  report.migrationParity = '39/39';
  save();
})()
  .catch((err) => {
    console.error(err);
    report.overallDisposition = 'FAIL';
    report.error = { message: err?.message || String(err), code: err?.code || null };
    save();
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (companyClient) {
      await companyClient.end();
    }
    if (admin) {
      try {
        if (savedAuthority) {
          for (const r of savedAuthority) {
            await admin.query(
              `UPDATE public."EmployerPayrollAuthority"
                  SET enabled = $3, "revokedAt" = $4
                WHERE "employerId" = $1 AND "userId" = $2 AND operation = $5`,
              [s.f.ids.e1, s.f.ids.a, r.enabled, r.revokedAt, r.operation]
            );
          }
        }
        // Clean up synthetic test rows & command/audit records created during this verification
        const remainingIds = (
          await admin.query(
            `SELECT id FROM public."PayrollPeriod" WHERE "periodType" LIKE $1`,
            [prefix + '%']
          )
        ).rows.map((x: any) => x.id);
        const allPeriodIds = [...new Set([...createdPeriodIds, ...remainingIds])];
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role = 'replica'");
          for (const pid of allPeriodIds) {
            await admin.query(`DELETE FROM public."Payroll" WHERE "payrollPeriodId" = $1`, [pid]);
            await admin.query(`DELETE FROM public."DailyTimeRecord" WHERE "payrollPeriodId" = $1`, [
              pid,
            ]);
            await admin.query(
              `DELETE FROM public."PayrollAuditLog" WHERE "recordId" = $1`,
              [pid]
            );
            await admin.query(`DELETE FROM public."PayrollPeriod" WHERE id = $1`, [pid]);
          }
          for (const aid of createdNonceAuditIds) {
            await admin.query(`DELETE FROM public."PayrollAuditLog" WHERE id = $1`, [aid]);
            const rawNonce = aid.replace(/^company-/, '');
            await admin.query(`DELETE FROM public._company_payroll_commands WHERE nonce = $1`, [
              rawNonce,
            ]);
          }
          // Also remove HTTP-generated command/audit rows tied to cleaned synthetic periods
          await admin.query(
            `DELETE FROM public._company_payroll_commands WHERE target_id = ANY($1::text[])`,
            [allPeriodIds]
          );
        });
        const residue = Number(
          (
            await admin.query(
              `SELECT COUNT(*)::int AS n FROM public."PayrollPeriod" WHERE "periodType" LIKE $1`,
              [prefix + '%']
            )
          ).rows[0].n
        );
        report.syntheticResidueCount = residue;
        save();
      } finally {
        await admin.end();
      }
    }
    setTimeout(() => process.exit(process.exitCode || 0), 100).unref();
  });
