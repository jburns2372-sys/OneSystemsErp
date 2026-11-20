'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = process.cwd();

function loadTsModule(relPath, mocks = {}) {
  const absPath = path.resolve(ROOT, relPath);
  const src = fs.readFileSync(absPath, 'utf8');
  const compiled = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: absPath,
  }).outputText;

  const mod = { exports: {} };
  const localRequire = (specifier) => {
    if (Object.prototype.hasOwnProperty.call(mocks, specifier)) {
      return mocks[specifier];
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const resolvedBase = path.resolve(path.dirname(absPath), specifier);
      const candidates = [
        resolvedBase,
        `${resolvedBase}.ts`,
        `${resolvedBase}.tsx`,
        path.join(resolvedBase, 'index.ts'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          const rel = path.relative(ROOT, c);
          return loadTsModule(rel, mocks);
        }
      }
    }
    if (specifier.startsWith('@/')) {
      const resolvedBase = path.resolve(ROOT, 'src', specifier.slice(2));
      const candidates = [
        resolvedBase,
        `${resolvedBase}.ts`,
        `${resolvedBase}.tsx`,
        path.join(resolvedBase, 'index.ts'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          const rel = path.relative(ROOT, c);
          return loadTsModule(rel, mocks);
        }
      }
    }
    throw new Error(`Unexpected unmocked import "${specifier}" from ${relPath}`);
  };

  const fn = new vm.Script(
    `(function(exports, require, module, __filename, __dirname) {\n${compiled}\n})`,
    { filename: absPath }
  ).runInThisContext();
  fn(mod.exports, localRequire, mod, absPath, path.dirname(absPath));
  return mod.exports;
}

const visualMapping = loadTsModule('src/lib/uboq/visual-mapping.ts');

test('Delta 1: extractVisualColumnSummaries extracts columns, sample values, coordinates, and avg confidence', () => {
  const summaries = visualMapping.extractVisualColumnSummaries([
    {
      id: 'cand-1',
      sourceDocumentId: 'doc-1',
      sourceRowNumber: 5,
      sourceCellRef: 'A5',
      rawHeadingText: null,
      mappedCanonicalId: null,
      rawValueText: null,
      rawFormulaText: '=D5*E5',
      parsedJson: {
        mappedFields: { col_desc: 'Concrete Class A', approved_qty: 25, col_uom: 'cu.m.' },
        cellCoordinates: { col_desc: 'B5', approved_qty: 'D5', col_uom: 'C5' },
      },
      confidenceScore: 0.8,
      extractionMethod: 'DETERMINISTIC_PARSER',
      requiresHumanReview: true,
      reviewDecision: 'PENDING',
      reviewedById: null,
      reviewedAt: null,
      reviewNotes: null,
    },
    {
      id: 'cand-2',
      sourceDocumentId: 'doc-1',
      sourceRowNumber: 6,
      sourceCellRef: 'A6',
      rawHeadingText: null,
      mappedCanonicalId: null,
      rawValueText: null,
      rawFormulaText: null,
      parsedJson: {
        effectiveMappedFields: { col_desc: 'Rebar Grade 60', approved_qty: 100 },
        cellCoordinates: { col_desc: 'B6', approved_qty: 'D6' },
      },
      confidenceScore: 1.0,
      extractionMethod: 'DETERMINISTIC_PARSER',
      requiresHumanReview: false,
      reviewDecision: 'HUMAN_VERIFIED',
      reviewedById: 'u-1',
      reviewedAt: '2026-11-19T00:00:00Z',
      reviewNotes: 'ok',
    },
  ]);

  assert.equal(summaries.length, 3);
  const descCol = summaries.find((s) => s.sourceColumnKey === 'col_desc');
  assert.ok(descCol);
  assert.equal(descCol.sampleValue, 'Concrete Class A');
  assert.equal(descCol.sampleCoordinate, 'B5');
  assert.equal(descCol.candidateCount, 2);
  assert.equal(descCol.avgConfidence, 0.9);
  assert.equal(descCol.currentCanonicalFieldId, null);

  const qtyCol = summaries.find((s) => s.sourceColumnKey === 'approved_qty');
  assert.equal(qtyCol.currentCanonicalFieldId, 'approved_qty');
});

test('Delta 1: validateVisualColumnMapping accepts valid remaps, strips no-ops, rejects invalid & conflicting mappings', () => {
  // Valid remap + identity no-op + unmapped
  const ok = visualMapping.validateVisualColumnMapping({
    col_desc: 'work_description',
    col_uom: 'unit',
    approved_qty: 'approved_qty',
    col_notes: '',
  });
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.conflicts, []);
  assert.deepEqual(ok.normalizedRemap, {
    col_desc: 'work_description',
    col_uom: 'unit',
  });

  // Conflicting mapping: two source columns mapped to work_description
  const conflict = visualMapping.validateVisualColumnMapping({
    col_a: 'work_description',
    col_b: 'description', // alias of work_description
  });
  assert.equal(conflict.valid, false);
  assert.equal(conflict.conflicts.length, 1);
  assert.equal(conflict.conflicts[0].targetFieldId, 'work_description');
  assert.match(conflict.errors[0], /UBOQ_CONFLICTING_COLUMN_MAPPING/);

  // Invalid canonical field
  const invalidField = visualMapping.validateVisualColumnMapping({
    col_x: 'nonexistent_hacked_field',
  });
  assert.equal(invalidField.valid, false);
  assert.match(invalidField.errors[0], /UBOQ_INVALID_CANONICAL_FIELD/);

  // Empty source column key
  const emptySrc = visualMapping.validateVisualColumnMapping({
    '   ': 'work_description',
  });
  assert.equal(emptySrc.valid, false);
  assert.match(emptySrc.errors[0], /UBOQ_INVALID_SOURCE_COLUMN/);
});

test('Delta 1: portable mapping profiles validate schema, round-trip cleanly, and reject invalid/conflicting JSON', () => {
  const profile = visualMapping.buildPortableMappingProfile({
    profileName: 'DPWH Standard BOQ v1',
    sectorType: 'GOVERNMENT',
    columnMap: { col_item: 'item_code', col_desc: 'work_description', col_qty: 'approved_qty' },
  });
  assert.equal(profile.schemaVersion, 'UBOQ_INPUT_MAPPING_PROFILE_V1');
  const parsed = visualMapping.parsePortableMappingProfile(JSON.stringify(profile));
  assert.equal(parsed.profileName, 'DPWH Standard BOQ v1');
  assert.equal(parsed.sectorType, 'GOVERNMENT');
  assert.deepEqual(parsed.columnMap, {
    col_item: 'item_code',
    col_desc: 'work_description',
    col_qty: 'approved_qty',
  });

  assert.throws(() => visualMapping.parsePortableMappingProfile('{bad json'), /UBOQ_INVALID_PROFILE_JSON/);
  assert.throws(
    () => visualMapping.parsePortableMappingProfile(JSON.stringify({ schemaVersion: 'WRONG', profileName: 'x', columnMap: {} })),
    /UBOQ_UNSUPPORTED_PROFILE_VERSION/
  );
  assert.throws(
    () =>
      visualMapping.buildPortableMappingProfile({
        profileName: 'Bad Conflict',
        columnMap: { a: 'unit', b: 'uom' },
      }),
    /UBOQ_CONFLICTING_COLUMN_MAPPING/
  );
});

function buildActionsModule({
  actor = { userId: 'u-reviewer', sessionVersion: 2, role: 'PROJECT_MANAGER' },
  stageAuthError = null,
  sourceDoc = { id: 'doc-1', projectId: 'proj-1', sha256Hash: 'a'.repeat(64) },
  ownedCandidates = [{ id: 'cand-1' }, { id: 'cand-2' }],
  calls = { reviewCalls: [], exceptionCalls: [], approveCalls: [], regenerateCalls: [], revalidated: [] },
} = {}) {
  const mod = loadTsModule('src/app/actions/uboq/index.ts', {
    'next/cache': { revalidatePath: (p) => calls.revalidated.push(p) },
    '@/lib/dal/auth': { verifyOperationalSession: async () => actor },
    '@/lib/prisma': {
      prisma: {
        uboqSourceDocument: { findUnique: async () => sourceDoc },
        uboqExtractionCandidate: { findMany: async () => ownedCandidates },
      },
    },
    '@/lib/uboq/project-ownership': {
      assertProjectGraphOwnership: async () => {},
      withUboqRlsContext: async (_ctx, fn) => fn(),
    },
    '@/lib/uboq/security/stage-rbac': {
      assertUboqStageAuthorization: async () => {
        if (stageAuthError) throw stageAuthError;
      },
    },
    '@/lib/uboq/security/redact-payload': {
      redactUboqPayloadForRole: (payload) => payload,
    },
    '@/lib/uboq/resource-ledger': {
      allocateVerifiedOpeningStockAtomically: async () => {
        throw new Error('should not be called');
      },
    },
    '@/lib/uboq/adapters/schedule-link-adapter': {
      syncUboqScheduleActivityLinks: async () => {
        throw new Error('should not be called');
      },
      tryAutoSyncProjectScheduleLinks: async () => ({ synced: false, scheduleId: null, reason: 'MOCKED' }),
    },
    '@/lib/uboq/adapters/snapshot-orchestrator': {
      approveOperationalSnapshotAndPrrs: async () => {
        calls.approveCalls.push(true);
        throw new Error('AUTO_APPROVAL_MUST_NEVER_OCCUR');
      },
      ingestAndStageProjectUboqPackage: async () => {
        throw new Error('should not be called');
      },
      regenerateDraftSnapshotFromVerifiedDocument: async (_p, args) => {
        calls.regenerateCalls.push(args);
        return { snapshotId: 'snap-draft-2', status: 'DRAFT' };
      },
      resolveExtractionCandidateHumanReview: async (_p, args) => {
        calls.reviewCalls.push(args);
        return { id: args.candidateId, reviewDecision: args.decision };
      },
      resolveUboqValidationException: async (_p, args) => {
        calls.exceptionCalls.push(args);
        return { id: args.exceptionId, status: 'RESOLVED', resolutionNote: args.resolutionNote };
      },
    },
  });
  return { mod, calls };
}

test('Delta 1: applyVisualColumnMappingAction deduplicates candidates, preserves hash, blocks auto-approval', async () => {
  const { mod, calls } = buildActionsModule();
  const res = await mod.applyVisualColumnMappingAction({
    projectId: 'proj-1',
    sourceDocumentId: 'doc-1',
    candidateIds: ['cand-1', 'cand-2', 'cand-1'], // duplicate cand-1
    columnMap: { col_desc: 'work_description', col_uom: 'unit' },
    reviewNotes: 'Mapped vendor columns to canonical BOQ schema',
    decision: 'HUMAN_VERIFIED',
  });

  assert.equal(res.appliedCount, 2);
  assert.equal(res.skippedDuplicateCount, 1);
  assert.equal(res.sourceSha256Hash, 'a'.repeat(64));
  assert.equal(res.autoApproved, false);
  assert.equal(calls.reviewCalls.length, 2);
  assert.equal(calls.approveCalls.length, 0);
  assert.deepEqual(calls.reviewCalls[0].canonicalFieldRemap, {
    col_desc: 'work_description',
    col_uom: 'unit',
  });
  assert.deepEqual(calls.revalidated, ['/projects/proj-1/uboq']);
});

test('Delta 1: applyVisualColumnMappingAction supports HUMAN_EXCLUDED rejected candidates without auto-approval', async () => {
  const { mod, calls } = buildActionsModule({ ownedCandidates: [{ id: 'cand-bad' }] });
  const res = await mod.applyVisualColumnMappingAction({
    projectId: 'proj-1',
    sourceDocumentId: 'doc-1',
    candidateIds: ['cand-bad'],
    columnMap: {},
    reviewNotes: 'Excluded subtotal header row from BOQ staging',
    decision: 'HUMAN_EXCLUDED',
  });

  assert.equal(res.decision, 'HUMAN_EXCLUDED');
  assert.equal(res.appliedCount, 1);
  assert.equal(calls.reviewCalls[0].decision, 'HUMAN_EXCLUDED');
  assert.equal(calls.approveCalls.length, 0);
});

test('Delta 1: applyVisualColumnMappingAction rejects unauthenticated, unauthorized, invalid, conflicting, and cross-project inputs', async () => {
  // Unauthenticated
  const unauth = buildActionsModule({ actor: null });
  await assert.rejects(
    () =>
      unauth.mod.applyVisualColumnMappingAction({
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        candidateIds: ['cand-1'],
        columnMap: { a: 'unit' },
        reviewNotes: 'note',
      }),
    /UBOQ_UNAUTHORIZED/
  );

  // Unauthorized PBAC capability
  const forbidden = buildActionsModule({ stageAuthError: new Error('UBOQ_RBAC_FORBIDDEN: missing UBOQ_HUMAN_REVIEW_RESOLVE') });
  await assert.rejects(
    () =>
      forbidden.mod.applyVisualColumnMappingAction({
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        candidateIds: ['cand-1'],
        columnMap: { a: 'unit' },
        reviewNotes: 'note',
      }),
    /UBOQ_RBAC_FORBIDDEN/
  );

  // Cross-project source document denial
  const crossDoc = buildActionsModule({
    sourceDoc: { id: 'doc-foreign', projectId: 'proj-OTHER', sha256Hash: 'b'.repeat(64) },
  });
  await assert.rejects(
    () =>
      crossDoc.mod.applyVisualColumnMappingAction({
        projectId: 'proj-1',
        sourceDocumentId: 'doc-foreign',
        candidateIds: ['cand-1'],
        columnMap: { a: 'unit' },
        reviewNotes: 'note',
      }),
    /UBOQ_SOURCE_DOCUMENT_NOT_FOUND_FOR_PROJECT/
  );

  // Cross-project / cross-document candidate denial
  const crossCand = buildActionsModule({ ownedCandidates: [{ id: 'cand-1' }] }); // cand-foreign missing
  await assert.rejects(
    () =>
      crossCand.mod.applyVisualColumnMappingAction({
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        candidateIds: ['cand-1', 'cand-foreign'],
        columnMap: { a: 'unit' },
        reviewNotes: 'note',
      }),
    /UBOQ_CANDIDATE_NOT_FOUND_FOR_PROJECT/
  );

  // Conflicting mapping rejected before touching DB
  const conflict = buildActionsModule();
  await assert.rejects(
    () =>
      conflict.mod.applyVisualColumnMappingAction({
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        candidateIds: ['cand-1'],
        columnMap: { col1: 'unit', col2: 'uom' },
        reviewNotes: 'note',
      }),
    /UBOQ_CONFLICTING_COLUMN_MAPPING/
  );

  // Missing audit notes
  const noNotes = buildActionsModule();
  await assert.rejects(
    () =>
      noNotes.mod.applyVisualColumnMappingAction({
        projectId: 'proj-1',
        sourceDocumentId: 'doc-1',
        candidateIds: ['cand-1'],
        columnMap: { a: 'unit' },
        reviewNotes: '   ',
      }),
    /UBOQ_REVIEW_NOTES_REQUIRED/
  );
});

test('Delta 1: resolveUboqValidationExceptionAction enforces session, RLS context, and revalidation', async () => {
  const { mod, calls } = buildActionsModule();
  const res = await mod.resolveUboqValidationExceptionAction({
    projectId: 'proj-1',
    exceptionId: 'exc-1',
    resolutionNote: 'Verified unit conversion with QS engineer',
  });
  assert.equal(res.status, 'RESOLVED');
  assert.equal(calls.exceptionCalls.length, 1);
  assert.equal(calls.exceptionCalls[0].exceptionId, 'exc-1');
  assert.equal(calls.approveCalls.length, 0);
});

test('Delta 1: VisualMappingReviewClient enforces DRAFT-only human gate and never imports approval action', () => {
  const uiSrc = fs.readFileSync(
    path.resolve(ROOT, 'src/app/projects/[id]/uboq/VisualMappingReviewClient.tsx'),
    'utf8'
  );
  assert.doesNotMatch(uiSrc, /approveUboqSnapshotAction|approveOperationalSnapshotAndPrrs/);
  assert.match(uiSrc, /regenerateUboqDraftSnapshotAction/);
  assert.match(uiSrc, /applyVisualColumnMappingAction/);
  assert.match(uiSrc, /resolveUboqValidationExceptionAction/);
  assert.match(uiSrc, /APPROVED BASELINE LOCK/);
});

test('Delta 1: all 13/13 accepted R2 canonical baseline source files remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(
    fs.readFileSync(path.resolve(ROOT, 'docs/uboq/phase9-accepted-baseline-ledger.json'), 'utf8')
  );
  for (const s of ledger.acceptedSources) {
    const raw = fs.readFileSync(path.resolve(ROOT, s.path), 'utf8').replace(/\r\n/g, '\n');
    const actual = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `Accepted baseline source modified unexpectedly: ${s.path}`);
  }
});
