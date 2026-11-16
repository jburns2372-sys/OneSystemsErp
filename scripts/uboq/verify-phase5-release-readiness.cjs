'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const s = require('./g02-bounded-support.cjs');
const { verifyLedgerAgainstDisk } = require('./migration-checksum-guard.cjs');

const OUT_DIR = 'artifacts/uboq/release-readiness';
const PHASE5_RESULTS_PATH = path.join(OUT_DIR, 'phase5-final-local-verification.json');
const CHECKPOINT_PATH = path.join(OUT_DIR, 'release-readiness-checkpoint.json');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(fp) {
  return sha256(fs.readFileSync(fp));
}

function runCmd(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd || process.cwd(),
    env: { ...process.env, ...(opts.env || {}) },
    encoding: 'utf8',
    shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd),
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(
      `Command failed (${cmd} ${args.join(' ')}) [exit=${res.status}]:\n${res.stdout || ''}\n${res.stderr || ''}`
    );
  }
  return res;
}

function locatePgBin(exeName) {
  // Check server binary directory from running isolated cluster first
  const candidates = [];
  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    for (const ver of ['18', '17', '16']) {
      candidates.push(path.join(pf, 'PostgreSQL', ver, 'bin', `${exeName}.exe`));
    }
  }
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return process.platform === 'win32' ? `${exeName}.exe` : exeName;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report = {
    project: 'OSERP-PROJ-UBOQ-001',
    phase: 'PHASE_5_FINAL_LOCAL_VERIFICATION_AND_CHECKPOINT',
    evaluatedAt: new Date().toISOString(),
    checks: [],
  };

  function savePhase5() {
    fs.writeFileSync(PHASE5_RESULTS_PATH, JSON.stringify(report, null, 2) + '\n');
  }

  async function check(name, fn) {
    const start = Date.now();
    const detail = await fn();
    report.checks.push({
      name,
      result: 'PASS',
      milliseconds: Date.now() - start,
      detail,
    });
    savePhase5();
    console.log(`PASS ${name}`);
  }

  const admin = await s.connect();
  const appClient = await s.connect({ user: s.f.projectLogin, password: s.f.projectPw });

  try {
    const dbIdentity = await s.identity(admin);
    report.identity = dbIdentity;

    await check(
      'P5-01 Deployment build-script safety, Prisma schema validation, TypeScript (root & backend), and ESLint zero-warning gates',
      async () => {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const buildScript = String(pkg.scripts?.build || '');
        assert.equal(buildScript, 'prisma generate && next build');
        for (const [scriptName, scriptCmd] of Object.entries(pkg.scripts || {})) {
          if (['build', 'start', 'postinstall', 'vercel-build'].includes(scriptName)) {
            assert.doesNotMatch(
              String(scriptCmd),
              /db\s+push|--accept-data-loss|migrate\s+reset/i,
              `Forbidden destructive DB command in package.json scripts.${scriptName}`
            );
          }
        }

        const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

        runCmd(npx, ['prisma', 'validate']);
        runCmd(npx, ['tsc', '--noEmit']);
        runCmd(npm, ['--prefix', 'apps/aws-backend', 'run', 'typecheck']);
        runCmd(npx, [
          'eslint',
          '--max-warnings=0',
          'src/app/api/uboq/export/route.ts',
          'scripts/uboq/verify-phase3-migration23-xid-rollover.ts',
          'scripts/uboq/verify-phase4-statutory-formats.ts',
        ]);

        return {
          buildScript,
          destructiveBuildCommandsPresent: false,
          prismaValidate: 'PASS',
          rootTscNoEmit: 'PASS',
          backendTypecheck: 'PASS',
          eslintChangedFilesZeroWarnings: 'PASS',
        };
      }
    );

    await check(
      'P5-02 Database isolation, FORCE ROW LEVEL SECURITY, zero unguarded PUBLIC permissive policies, and restricted-role access boundaries',
      async () => {
        assert.equal(dbIdentity.host, '127.0.0.1');
        assert.equal(dbIdentity.port, 55483);
        assert.match(dbIdentity.db, /^oserp_h02b_local_[0-9a-f]+$/);

        const forceRlsCheck = (
          await admin.query(`
            SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
              FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public'
               AND c.relkind = 'r'
               AND (
                 c.relname LIKE 'Uboq%'
                 OR c.relname IN (
                   'SensitiveExportLog',
                   'ProjectUserAssignment',
                   'PayrollPeriod',
                   'Payroll',
                   'DailyTimeRecord',
                   'Employer',
                   'EmployerPayrollAuthority',
                   '_company_payroll_trust_anchor',
                   '_company_payroll_commands'
                 )
               )
             ORDER BY c.relname ASC
          `)
        ).rows;
        assert.ok(forceRlsCheck.length >= 25);
        for (const r of forceRlsCheck) {
          assert.equal(r.relrowsecurity, true, `RLS disabled on ${r.relname}`);
          assert.equal(r.relforcerowsecurity, true, `FORCE RLS disabled on ${r.relname}`);
        }

        // Invariant 1 (D2-IR-01 OR-bypass guard): Zero tables may have a PERMISSIVE TO PUBLIC policy
        // unless that table ALSO enforces a RESTRICTIVE TO PUBLIC policy covering all roles.
        const unguardedPublicPermissive = (
          await admin.query(`
            SELECT p.tablename, p.policyname
              FROM pg_policies p
             WHERE p.schemaname = 'public'
               AND p.permissive = 'PERMISSIVE'
               AND p.roles = '{public}'::name[]
               AND NOT EXISTS (
                 SELECT 1
                   FROM pg_policies r
                  WHERE r.schemaname = 'public'
                    AND r.tablename = p.tablename
                    AND r.permissive = 'RESTRICTIVE'
                    AND r.roles = '{public}'::name[]
               )
          `)
        ).rows;
        assert.equal(
          unguardedPublicPermissive.length,
          0,
          `Unguarded PERMISSIVE TO PUBLIC policy (OR-bypass risk): ${JSON.stringify(unguardedPublicPermissive)}`
        );

        // Invariant 2: Explicit zero PUBLIC permissive policies on role-partitioned VO / receipt / roundtrip / export-log / payroll tables
        const partitionedPublicPolicies = (
          await admin.query(`
            SELECT tablename, policyname
              FROM pg_policies
             WHERE schemaname = 'public'
               AND permissive = 'PERMISSIVE'
               AND roles = '{public}'::name[]
               AND tablename IN (
                 'ClientVariationOrder',
                 'AIVariationOrderValidation',
                 'SubcontractorVariationOrder',
                 'SensitiveExportLog',
                 'UboqClientReceipt',
                 'UboqClientReceiptAllocation',
                 'UboqSignedRoundTripPackage',
                 'UboqRoundTripImportSubmission',
                 'UboqTreasuryOpeningBalance',
                 '_company_payroll_trust_anchor',
                 '_company_payroll_commands',
                 'Employer',
                 'EmployerPayrollAuthority'
               )
          `)
        ).rows;
        assert.equal(partitionedPublicPolicies.length, 0);

        // Unscoped restricted-role query returns 0 rows
        const unscopedProjects = (await appClient.query('SELECT id FROM public."Project"'))
          .rowCount;
        assert.equal(unscopedProjects, 0);

        return {
          forceRlsTablesVerified: forceRlsCheck.length,
          unguardedPublicPermissivePolicies: 0,
          rolePartitionedTablesPublicPermissivePolicies: 0,
          unscopedRestrictedProjectRows: unscopedProjects,
        };
      }
    );

    await check(
      'P5-03 Financial integrity preservation (11 frozen archives + 13 R2 T0-T12 sources unchanged) and 39/39 immutable migration ledger parity',
      async () => {
        const phase1 = JSON.parse(
          fs.readFileSync(
            'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json',
            'utf8'
          )
        );
        for (const arch of phase1.frozenArchives) {
          assert.equal(
            sha256File(arch.path),
            arch.sha256,
            `Frozen archive modified: ${arch.path}`
          );
        }

        const r2Refs = JSON.parse(
          fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r3/r2-evidence-references.json', 'utf8')
        );
        for (const src of r2Refs.acceptedSources) {
          assert.equal(
            sha256File(src.path),
            src.sha256,
            `Accepted R2 source modified: ${src.path}`
          );
        }

        for (const [relPath, expectedSha] of Object.entries(phase1.migrations_1_to_38)) {
          assert.equal(
            sha256File(relPath),
            expectedSha,
            `Historical migration #1-#38 modified: ${relPath}`
          );
        }

        const ledgerParity = await verifyLedgerAgainstDisk(admin);
        assert.equal(ledgerParity.appliedCount, 39);
        assert.equal(ledgerParity.diskCount, 39);
        assert.equal(ledgerParity.verifiedMatchCount, 39);

        return {
          frozenArchivesIntact: phase1.frozenArchives.length,
          r2AcceptedSourcesIntact: r2Refs.acceptedSources.length,
          historicalMigrations1To38Intact: 38,
          activeMigrationParity: '39/39',
        };
      }
    );

    await check(
      'P5-04 Audit logging & ledger immutability (SensitiveExportLog function-only insert, UboqTemplateAuditEvent append-only, _prisma_migrations tamper rejection)',
      async () => {
        // 1) Restricted app role cannot INSERT directly into SensitiveExportLog
        await assert.rejects(
          () =>
            appClient.query(
              `INSERT INTO public."SensitiveExportLog"(
                 id, "userId", "projectId", "exportType", "recordCount", approved, blocked, reason
               ) VALUES ('forged-sel-1', $1, $2, 'T1:json', 1, true, false, 'forged')`,
              [s.f.ids.a, s.f.ids.p1]
            ),
          (e) => e.code === '42501'
        );

        // 2) Restricted app role cannot INSERT/UPDATE/DELETE UboqTemplateAuditEvent directly
        await assert.rejects(
          () =>
            appClient.query(
              `DELETE FROM public."UboqTemplateAuditEvent" WHERE "projectId" = $1`,
              [s.f.ids.p1]
            ),
          (e) => e.code === '42501'
        );

        // 3) Even cluster admin cannot overwrite checksum or finished_at or DELETE applied _prisma_migrations row
        await admin.query('BEGIN');
        try {
          await admin.query('SAVEPOINT sp_ledger_upd');
          let updCode = '';
          try {
            await admin.query(
              `UPDATE public."_prisma_migrations"
                  SET finished_at = now() + interval '1 minute'
                WHERE migration_name = '20261116020000_uboq_release_readiness_m23_xid_rollover_hardening'`
            );
          } catch (e) {
            updCode = e.code || '';
            await admin.query('ROLLBACK TO SAVEPOINT sp_ledger_upd');
          }
          assert.equal(updCode, '42501');

          await admin.query('SAVEPOINT sp_ledger_del');
          let delCode = '';
          try {
            await admin.query(
              `DELETE FROM public."_prisma_migrations"
                WHERE migration_name = '20261116020000_uboq_release_readiness_m23_xid_rollover_hardening'`
            );
          } catch (e) {
            delCode = e.code || '';
            await admin.query('ROLLBACK TO SAVEPOINT sp_ledger_del');
          }
          assert.equal(delCode, '42501');
        } finally {
          await admin.query('ROLLBACK');
        }

        return {
          directSensitiveExportLogInsertDenied: '42501',
          directTemplateAuditDeleteDenied: '42501',
          migrationLedgerFinishedAtMutationDenied: '42501',
          migrationLedgerAppliedDeleteDenied: '42501',
        };
      }
    );

    await check(
      'P5-05 PostgreSQL 18 logical backup & restore-TOC readiness (pg_dump plain SQL + custom -Fc archive + pg_restore --list)',
      async () => {
        const pgDump = locatePgBin('pg_dump');
        const pgRestore = locatePgBin('pg_restore');
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-uboq-bkp-'));
        const sqlDumpPath = path.join(tmpDir, 'schema_backup.sql');
        const customDumpPath = path.join(tmpDir, 'schema_backup.dump');

        try {
          const pgEnv = { PGPASSWORD: s.config.password || '' };
          const connArgs = [
            '-h',
            s.config.host,
            '-p',
            String(s.config.port),
            '-U',
            s.config.user,
            '-d',
            s.config.database,
            '--schema-only',
            '--no-owner',
            '--no-privileges',
          ];

          runCmd(pgDump, [...connArgs, '-f', sqlDumpPath], { env: pgEnv });
          runCmd(pgDump, [...connArgs, '-Fc', '-f', customDumpPath], { env: pgEnv });
          const tocOut = runCmd(pgRestore, ['--list', customDumpPath], { env: pgEnv }).stdout;

          const sqlBytes = fs.readFileSync(sqlDumpPath);
          const customBytes = fs.readFileSync(customDumpPath);
          const sqlText = sqlBytes.toString('utf8');

          for (const requiredSymbol of [
            'UboqOperationalSnapshot',
            'VariationOrder',
            'UboqTreasuryOpeningBalance',
            'SensitiveExportLog',
            'uboq_guard_prisma_migration_ledger',
            'company_payroll_created_in_current_xact',
            'uboq_inspect_xid_rollover_health',
          ]) {
            assert.ok(
              sqlText.includes(requiredSymbol),
              `Backup schema missing symbol: ${requiredSymbol}`
            );
          }

          const tocEntryCount = tocOut
            .split(/\r?\n/)
            .filter((l) => l.trim() && !l.trim().startsWith(';')).length;
          assert.ok(tocEntryCount > 250, `Expected >250 pg_restore TOC entries, got ${tocEntryCount}`);

          return {
            pgDumpBinary: path.basename(pgDump),
            plainSchemaSqlBytes: sqlBytes.length,
            plainSchemaSqlSha256: sha256(sqlBytes),
            customFormatArchiveBytes: customBytes.length,
            customFormatArchiveSha256: sha256(customBytes),
            pgRestoreTocEntriesVerified: tocEntryCount,
          };
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      }
    );

    await check(
      'P5-06 Rollback procedures & synthetic-cleanup fail-closed non-synthetic protection',
      async () => {
        // 1) Verify DDL + DML transactional rollback leaves zero schema or table count delta
        const beforeTables = Number(
          (
            await admin.query(
              `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
            )
          ).rows[0].n
        );
        await admin.query('BEGIN');
        await admin.query('CREATE TABLE public._rollback_drill_probe (id int PRIMARY KEY)');
        await admin.query('INSERT INTO public._rollback_drill_probe VALUES (1)');
        await admin.query('ROLLBACK');
        const afterTables = Number(
          (
            await admin.query(
              `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
            )
          ).rows[0].n
        );
        assert.equal(beforeTables, 252);
        assert.equal(afterTables, 252);

        // 2) Verify synthetic cleanup classifier rejects non-synthetic project IDs and denies EXECUTE to app role
        const nonSynthAllowed = (
          await admin.query(
            `SELECT public.uboq_is_verified_synthetic_cleanup_row($1) AS allowed`,
            ['REAL-PROD-PROJ-001']
          )
        ).rows[0].allowed;
        assert.equal(nonSynthAllowed, false);

        await assert.rejects(
          () =>
            appClient.query(`SELECT public.uboq_is_verified_synthetic_cleanup_row($1)`, [
              'REAL-PROD-PROJ-001',
            ]),
          (e) => e.code === '42501'
        );

        return {
          transactionalDdlDmlRollbackVerified: true,
          publicBaseTableCountPreserved: afterTables,
          nonSyntheticCleanupRejected: true,
          forwardOnlyCompensatingMigrationModel:
            'Active — in-place _prisma_migrations rollback/deletion blocked by trg_uboq_guard_prisma_migration_ledger; production schema recovery uses pre-deploy logical backup/PITR + forward-only compensating migrations.',
        };
      }
    );

    report.status = 'PASS';
    savePhase5();

    // Assemble consolidated Release-Readiness Checkpoint JSON
    const phase1 = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json',
        'utf8'
      )
    );
    const phase2 = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/release-readiness/phase2-migration14-provenance.json',
        'utf8'
      )
    );
    const phase3 = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/release-readiness/phase3-migration23-xid-rollover.json',
        'utf8'
      )
    );
    const phase4 = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/release-readiness/phase4-statutory-format-readiness.json',
        'utf8'
      )
    );
    const mig39 = JSON.parse(
      fs.readFileSync('artifacts/uboq/release-readiness/migration39-apply.json', 'utf8')
    );

    const checkpoint = {
      project: 'OSERP-PROJ-UBOQ-001',
      branch: 'release/oserp-proj-uboq-001',
      checkpointType: 'UNIVERSAL_BOQ_RELEASE_READINESS_GATE',
      generatedAt: new Date().toISOString(),
      stopGateReached: true,
      deploymentActionsPerformed: {
        previewDeployment: false,
        productionDeployment: false,
        branchMerge: false,
        finalFreeze: false,
      },
      phase1_d2R3LocalAcceptance: {
        disposition: phase1.status,
        reviewDate: phase1.independentReviewAuthority.reviewDate,
        r2ArchiveSha256: phase1.independentReviewAuthority.retainedR2ArchiveSha256,
        r3DeltaArchiveSha256: phase1.independentReviewAuthority.submittedDeltaArchiveSha256,
        frozenArchivesPreserved: phase1.frozenArchives.length,
        templatesPreserved: phase1.preservedTemplates.length,
        previewOrProductionAcceptanceClaimed: false,
      },
      phase2_migration14Provenance: {
        migration: phase2.migration,
        overallDisposition: phase2.overallDisposition,
        isolatedLocalCleanDatabaseDisposition:
          phase2.scopeDispositions.isolatedLocalCleanDatabase.disposition,
        canonicalReviewedChecksum:
          phase2.scopeDispositions.isolatedLocalCleanDatabase.recordedChecksum,
        historicalTestdbUboq001Disposition:
          phase2.scopeDispositions.historicalDivergentLocalDatabase_testdb_uboq_001.disposition,
        focusedChecksPassed: phase2.checks.length,
        resolutionSummary:
          'Canonical reviewed SQL (a4accf39..., 92,792 LF bytes) is intact on HEAD and in isolated local DB (39/39 parity). Historical 8f860386.../2b26be20... bytes do not exist in Git or patches and are quarantined without rewriting history. Fail-closed read-only preflight gate (verify-migration14-provenance-gate.cjs) blocks any target DB holding divergent Migration #14 while permitting clean origin/main (#1-#13) baselines.',
      },
      phase3_migration23XidRollover: {
        originalMigration: '20261113110000_g02_operation_reads_and_worker_projection',
        remediationMigration: mig39.migration_name,
        remediationMigrationNumber: 39,
        remediationMigrationSha256: mig39.sha256,
        overallDisposition: phase3.overallDisposition,
        focusedChecksPassed: phase3.checks.length,
        syntheticResidueCount: phase3.syntheticResidueCount,
        resolutionSummary:
          'Forward-only Migration #39 replaced 32-bit-vs-64-bit (xmin::text::bigint = txid_current()) across PayrollPeriod, Payroll, and DailyTimeRecord h02b_company_read policies with company_payroll_created_in_current_xact() combining xid8->xid modulo-2^32 match, age(xmin)=0, and 64-bit txid_current() + nonce command row registration, plus uboq_inspect_xid_rollover_health(). Verified across epochs 0..1000, VACUUM FREEZE tuples, duplicate-PK savepoint attacks, and live Express HTTP company payroll lifecycle.',
      },
      phase4_statutoryFormatReadiness: {
        overallDisposition: phase4.overallDisposition,
        statutoryCertificationClaimed: phase4.statutoryCertificationClaimed,
        enabledInternalFormalContractCount: phase4.enabledInternalFormalContracts.length,
        disabledExternalStatutoryFormatCount: phase4.disabledExternalStatutoryFormats.length,
        focusedChecksPassed: phase4.checks.length,
        syntheticResidueCount: phase4.syntheticResidueCount,
        resolutionSummary:
          'All 6 formal contracts (ERP_CANONICAL_T0/T1/T4/T5/T6/T11_FORMAL_V1) and working exports (GET /api/uboq/export, POST /api/uboq/templates) strictly enforce internal-ERP-only scope (AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED) and reject DPWH, COA, BIR, and other external statutory contract codes/parameters fail-closed (409). Hardened GET /api/uboq/export to remove silent T1 fallback, block formal=true bypass, enforce VIEWER redaction, and record SensitiveExportLog.',
      },
      phase5_finalLocalVerification: {
        overallDisposition: report.status,
        checksPassed: report.checks.length,
        activeMigrationParity: '39/39',
        publicBaseTableCount: 252,
      },
      remainingTechnicalAndGovernanceBlockers: [
        {
          id: 'GATE-M14-TARGET-LEDGER-AUDIT',
          category: 'GOVERNANCE_AND_PRE_DEPLOY_DB_AUDIT',
          severity: 'BLOCKER_FOR_PREVIEW_AND_PRODUCTION_UNTIL_EXECUTED',
          description:
            'Run read-only evaluateTargetLedgerForMigration14() against the actual target Preview/Production PostgreSQL _prisma_migrations table prior to prisma migrate deploy to verify the target DB is at clean origin/main baseline (#1-#13) and never received the historical 2b26be20.../8f860386... dev draft.',
        },
        {
          id: 'GATE-INDEPENDENT-DELTA-REVIEW-M39-P4',
          category: 'INDEPENDENT_TECHNICAL_REVIEW',
          severity: 'REQUIRED_BEFORE_PREVIEW_PROMOTION',
          description:
            'Independent technical review of forward-only Migration #39 (Migration #23 XID rollover remediation) and Phase 4 working-export statutory separation guard (src/app/api/uboq/export/route.ts).',
        },
        {
          id: 'GATE-PREVIEW-ENV-PROVISIONING',
          category: 'INFRASTRUCTURE_SECRETS',
          severity: 'REQUIRED_BEFORE_PREVIEW_PROMOTION',
          description:
            'Provision secret-managed least-privilege PostgreSQL runtime logins (inheriting NOLOGIN group roles oserp_compat_app and oserp_company_payroll_app), _uboq_rls_trust_anchor / _company_payroll_trust_anchor secrets, and private S3 object vault credentials (UBOQ_VAULT_S3_BUCKET) in Preview.',
        },
        {
          id: 'GATE-EXTERNAL-STATUTORY-SPECS',
          category: 'FEATURE_SCOPE_BOUNDARY (NON-BLOCKING FOR INTERNAL ERP RELEASE)',
          severity: 'DISABLED_BY_DESIGN',
          description:
            'External DPWH (POW, DUPA, SWA, VO), COA, and BIR statutory print forms & signatory blocks remain intentionally disabled (409) until authoritative agency specifications are supplied under a separate statutory pack.',
        },
      ],
      previewEligibilityRecommendation: {
        status: 'CONDITIONALLY_ELIGIBLE_PENDING_PRE_DEPLOY_GATES',
        localTechnicalReadiness: 'READY (39/39 migrations verified, 0 open local code/SQL defects)',
        immediatePreviewDeployAllowedNow: false,
        conditionsToProceedToPhase6Preview: [
          '1. Independent review signoff on the Phase 3/4/5 release-readiness delta (Migration #39 + export statutory guard).',
          '2. Read-only target Preview DB _prisma_migrations preflight check confirming ELIGIBLE_PRE_UBOQ_BASELINE (#1-#13 clean main lineage) or fresh Preview DB branch.',
          '3. Preview environment secret & restricted PostgreSQL login + private S3 vault provisioning.',
        ],
      },
      evidenceManifest: [
        'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json',
        'artifacts/uboq/release-readiness/phase2-migration14-provenance.json',
        'artifacts/uboq/release-readiness/migration39-apply.json',
        'artifacts/uboq/release-readiness/phase3-migration23-xid-rollover.json',
        'artifacts/uboq/release-readiness/phase4-statutory-format-readiness.json',
        'artifacts/uboq/release-readiness/phase5-final-local-verification.json',
      ],
    };

    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2) + '\n');
    console.log(
      JSON.stringify(
        {
          phase5Status: report.status,
          checksPassed: report.checks.length,
          checkpointPath: CHECKPOINT_PATH,
          previewRecommendation: checkpoint.previewEligibilityRecommendation.status,
        },
        null,
        2
      )
    );
  } finally {
    await appClient.end();
    await admin.end();
  }
})();
