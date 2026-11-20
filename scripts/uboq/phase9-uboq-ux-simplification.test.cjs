'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), 'utf8');

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
      const base = path.resolve(path.dirname(absPath), specifier);
      for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          return loadTsModule(path.relative(ROOT, c), mocks);
        }
      }
    }
    if (specifier.startsWith('@/')) {
      const base = path.resolve(ROOT, 'src', specifier.slice(2));
      for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          return loadTsModule(path.relative(ROOT, c), mocks);
        }
      }
    }
    throw new Error(`Unexpected unmocked import "${specifier}" from ${relPath}`);
  };

  new vm.Script(`(function(exports, require, module, __filename, __dirname) {\n${compiled}\n})`, {
    filename: absPath,
  }).runInThisContext()(mod.exports, localRequire, mod, absPath, path.dirname(absPath));
  return mod.exports;
}

const ux = loadTsModule('src/lib/uboq/ux-helpers.ts');

test('UX Helpers: extractReadableBoqRow maps raw candidates into readable ERP BOQ columns', () => {
  const row = ux.extractReadableBoqRow({
    id: 'c-1',
    sourceDocumentId: 'doc-1',
    sourceRowNumber: 2,
    sourceCellRef: 'IMAGE_PAGE_1!R2',
    rawHeadingText: null,
    mappedCanonicalId: null,
    rawValueText: null,
    rawFormulaText: null,
    parsedJson: {
      effectiveMappedFields: {
        item_code: '1.1',
        work_description: 'Concrete Footing',
        approved_qty: 10,
        unit: 'cu.m',
        contract_unit_rate: 5000,
      },
      cellCoordinates: { work_description: 'x=30,y=130' },
    },
    confidenceScore: 0.86,
    extractionMethod: 'OCR_RASTER',
    requiresHumanReview: true,
    reviewDecision: 'PENDING',
    reviewedById: null,
    reviewedAt: null,
    reviewNotes: null,
    sheetOrPageRef: 'IMAGE_PAGE_1',
  });

  assert.equal(row.itemCode, '1.1');
  assert.equal(row.description, 'Concrete Footing');
  assert.equal(row.quantity, 10);
  assert.equal(row.unit, 'cu.m');
  assert.equal(row.unitPrice, 5000);
  assert.equal(row.amount, 50000);
  assert.equal(row.statusLabel, 'Needs Review');
  assert.equal(row.needsAttention, true);
  assert.match(row.issueSummary, /86% read certainty/);
  assert.deepEqual(row.coordinates, { work_description: 'x=30,y=130' });
});

test('UX Helpers: computeUboqWorkflowState separates Candidate Accepted, DRAFT Ready, and Snapshot Approved', () => {
  const inReview = ux.computeUboqWorkflowState({
    sourceDocuments: [{
      id: 'd-1',
      candidates: [
        { reviewDecision: 'HUMAN_VERIFIED', requiresHumanReview: false },
        { reviewDecision: 'PENDING', requiresHumanReview: true },
      ],
    }],
    exceptions: [],
    snapshots: [{ id: 's-1', status: 'DRAFT' }],
  });
  assert.equal(inReview.acceptedCandidates, 1);
  assert.equal(inReview.pendingCandidates, 1);
  assert.equal(inReview.isDraftReadyForApproval, false);
  assert.equal(inReview.hasApprovedSnapshot, false);
  assert.equal(inReview.steps.find((s) => s.id === 'review').status, 'current');

  const draftReady = ux.computeUboqWorkflowState({
    sourceDocuments: [{
      id: 'd-1',
      candidates: [
        { reviewDecision: 'HUMAN_VERIFIED', requiresHumanReview: false },
        { reviewDecision: 'HUMAN_VERIFIED', requiresHumanReview: false },
      ],
    }],
    exceptions: [],
    snapshots: [{ id: 's-1', status: 'DRAFT' }],
  });
  assert.equal(draftReady.isDraftReadyForApproval, true);
  assert.equal(draftReady.hasApprovedSnapshot, false);
  assert.equal(draftReady.steps.find((s) => s.id === 'approve').status, 'current');

  const approved = ux.computeUboqWorkflowState({
    sourceDocuments: [{
      id: 'd-1',
      candidates: [{ reviewDecision: 'HUMAN_VERIFIED', requiresHumanReview: false }],
    }],
    exceptions: [],
    snapshots: [{ id: 's-1', status: 'APPROVED' }],
    hasLinkedSchedule: false,
  });
  assert.equal(approved.hasApprovedSnapshot, true);
  assert.equal(approved.isDraftReadyForApproval, false);
  assert.equal(approved.steps.find((s) => s.id === 'schedule').status, 'current');
});

test('UX Helpers: resolveEffectiveHeaderAccessContext shows real role cleanly and prevents non-admin simulation display', () => {
  const pmWithStaleCookie = ux.resolveEffectiveHeaderAccessContext('PROJECT_MANAGER', 'PROJECT_DIRECTOR');
  assert.equal(pmWithStaleCookie.isSimulating, false);
  assert.equal(pmWithStaleCookie.activePreviewRoleCode, null);
  assert.equal(pmWithStaleCookie.effectiveRoleCode, 'PROJECT_MANAGER');
  assert.equal(pmWithStaleCookie.realRoleLabel, 'Project Manager');

  const adminPreviewing = ux.resolveEffectiveHeaderAccessContext('SUPER_ADMIN', 'PROJECT_DIRECTOR');
  assert.equal(adminPreviewing.isSimulating, true);
  assert.equal(adminPreviewing.activePreviewRoleCode, 'PROJECT_DIRECTOR');
  assert.equal(adminPreviewing.activePreviewRoleLabel, 'Project Director');
  assert.equal(adminPreviewing.realRoleLabel, 'Super Admin');
  assert.equal(adminPreviewing.isGlobalProjectReader, true);

  const adminNoSim = ux.resolveEffectiveHeaderAccessContext('SUPER_ADMIN', 'SUPER_ADMIN');
  assert.equal(adminNoSim.isSimulating, false);
});

test('UX Helpers: formatFriendlyUboqError translates internal error codes into plain ERP user messages', () => {
  assert.match(ux.formatFriendlyUboqError(new Error('UBOQ_SOD_VIOLATION: preparer cannot self-approve')), /Maker-checker/i);
  assert.match(ux.formatFriendlyUboqError(new Error('UBOQ_RBAC_FORBIDDEN: denied')), /does not have permission/i);
  assert.match(ux.formatFriendlyUboqError(new Error('UBOQ_REVIEW_NOTES_REQUIRED: notes')), /short review note/i);
  assert.doesNotMatch(ux.formatFriendlyUboqError(new Error('PrismaClientKnownRequestError /var/task/db')), /Prisma|\/var\/task/);
});

test('Task 3 & 4: VisualMappingReviewClient stays DRAFT-only with Advanced Tools hidden by default; SnapshotApprovalPanel enforces explicit RBAC confirmation', () => {
  const reviewUi = read('src/app/projects/[id]/uboq/VisualMappingReviewClient.tsx');
  assert.doesNotMatch(reviewUi, /approveUboqSnapshotAction|approveOperationalSnapshotAndPrrs/);
  assert.match(reviewUi, /const \[showAdvanced, setShowAdvanced\] = useState<boolean>\(false\)/);
  assert.match(reviewUi, /Advanced Tools/);
  assert.match(reviewUi, /uboq-mobile-cards/);
  assert.match(reviewUi, /APPROVED BASELINE LOCK/);

  const approvalUi = read('src/app/projects/[id]/uboq/SnapshotApprovalPanel.tsx');
  assert.match(approvalUi, /approveUboqSnapshotAction/);
  assert.match(approvalUi, /role="dialog"/);
  assert.match(approvalUi, /confirmedChecked/);
  assert.match(approvalUi, /isSimulatingRole/);
  assert.match(approvalUi, /isSelfPreparer/);
  assert.match(approvalUi, /Maker-checker/);

  const pageSrc = read('src/app/projects/[id]/uboq/page.tsx');
  assert.match(pageSrc, /UBOQ_SNAPSHOT_APPROVE/);
  assert.match(pageSrc, /simulatedRole: accessContext\.activePreviewRoleCode/);
  assert.match(pageSrc, /Back to Project/);
  assert.match(pageSrc, /Scheduling/);
});

test('Task 5: Topbar and ActiveProjectSelector display real effective access context without granting privileges', () => {
  const topbarSrc = read('src/components/layout/Topbar.tsx');
  assert.match(topbarSrc, /resolveEffectiveHeaderAccessContext/);
  assert.match(topbarSrc, /assignmentStatus: \{ in: \['active', 'ACTIVE'\] \}/);
  assert.match(topbarSrc, /managerId: user\.id/);
  assert.match(topbarSrc, /ExitRolePreviewButton/);
  assert.doesNotMatch(topbarSrc, /SIMULATING:/);

  const selectorSrc = read('src/components/layout/ActiveProjectSelector.tsx');
  assert.doesNotMatch(selectorSrc, /No Project Assignments/);
  assert.doesNotMatch(selectorSrc, /No projects created yet/);
  assert.match(selectorSrc, /Select a Project/);
  assert.match(selectorSrc, /No assigned projects/);
});

test('P0: createProjectProfile enforces durable cross-instance idempotency via server-derived UUID + Postgres 23505 ownership verification', async () => {
  const realCrypto = require('node:crypto');
  const committedProjects = new Map(); // id -> ownerUserId

  function createFreshInstance(actorUserId) {
    let txAttempts = 0;
    const db = {
      rolePermission: { findFirst: async () => ({ id: 'grant-1' }) },
      project: {
        findFirst: async ({ where }) => {
          const owner = committedProjects.get(where.id);
          return owner === where.userAssignments.some.userId ? { id: where.id } : null;
        },
      },
      $transaction: async (fn) => {
        txAttempts += 1;
        return fn({
          $queryRaw: async (_strings, projectId) => {
            if (committedProjects.has(projectId)) {
              const dupErr = new Error('duplicate key value violates unique constraint "Project_pkey"');
              dupErr.code = '23505';
              throw dupErr;
            }
            committedProjects.set(projectId, actorUserId);
            return [{ phase9_create_project_profile: projectId }];
          },
        });
      },
    };
    const mod = loadTsModule('src/app/actions/project-intake.ts', {
      '@/lib/prisma': { prisma: db },
      '@/lib/dal/auth': { verifyOperationalSession: async () => ({ userId: actorUserId, role: 'SUPER_ADMIN', sessionVersion: 1 }) },
      'node:crypto': realCrypto,
      '@/lib/uboq/project-ownership': { applyProjectRlsSessionVars: async () => {} },
    });
    return { mod, getTxAttempts: () => txAttempts };
  }

  const makeForm = (token) => {
    const f = new FormData();
    f.set('name', 'P0 Durable Project');
    f.set('sector', 'CORPORATE');
    f.set('submissionToken', token);
    return f;
  };

  // Same user across TWO separate serverless instances with same submissionToken -> same projectId, 1 DB row
  const token = '12345678-1234-4123-8123-1234567890ab';
  const instA = createFreshInstance('owner-1');
  const instB = createFreshInstance('owner-1');
  const rA = await instA.mod.createProjectProfile(makeForm(token));
  const rB = await instB.mod.createProjectProfile(makeForm(token));
  assert.equal(rA.projectId, rB.projectId);
  assert.equal(committedProjects.size, 1, 'cross-instance retry must never create a duplicate project');

  // Different user with the same token derives a DIFFERENT server-bound UUID (no cross-user collision/attach)
  const instOther = createFreshInstance('other-user-2');
  const rOther = await instOther.mod.createProjectProfile(makeForm(token));
  assert.notEqual(rOther.projectId, rA.projectId);
  assert.equal(committedProjects.size, 2);
});

test('DPWH multi-sheet classification distinguishes BOQ sheets from supporting DUPA/Summary/ABC sheets', () => {
  assert.equal(ux.classifySourceSheet('BOQ - Part A', null).kind, 'BOQ');
  assert.equal(ux.classifySourceSheet('Bill of Quantities', null).kind, 'BOQ');
  assert.equal(ux.classifySourceSheet('Part B - Earthworks', null).kind, 'BOQ');
  assert.equal(ux.classifySourceSheet('DUPA', null).kind, 'SUPPORTING');
  assert.equal(ux.classifySourceSheet('Summary of Quantities', null).kind, 'SUPPORTING');
  assert.equal(ux.classifySourceSheet('ABC Computation', null).kind, 'SUPPORTING');
  assert.equal(ux.classifySourceSheet('General Notes', null).kind, 'SUPPORTING');
});

test('P0 & P1: ProjectStartButton avoids router.push+refresh hang, blocks duplicate submits, and Documents landing restores familiar workflow', () => {
  const startBtn = read('src/app/projects/ProjectStartButton.tsx');
  assert.doesNotMatch(startBtn, /router\.refresh\(\)/, 'must not call router.refresh() alongside router.push()');
  assert.doesNotMatch(startBtn, /startTransition/, 'must not nest React 19 form transition with router.push');
  assert.match(startBtn, /onSubmit=\{handleSubmit\}/);
  assert.match(startBtn, /inFlightRef/);
  assert.match(startBtn, /submissionToken/);
  assert.match(startBtn, /Open Project Documents/);
  assert.match(startBtn, /window\.location\.assign/);

  const docsPage = read('src/app/projects/[id]/documents/page.tsx');
  assert.match(docsPage, /Back to Project/);
  assert.match(docsPage, /Review BOQ/);
  assert.match(docsPage, /Scheduling/);

  const docsClient = read('src/app/projects/[id]/documents/ProjectDocumentIntakeClient.tsx');
  assert.match(docsClient, /Continue to Step 2: Review BOQ Items/);
});

test('Task 7: all 13/13 accepted R2 canonical baseline source files remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(read('docs/uboq/phase9-accepted-baseline-ledger.json'));
  for (const s of ledger.acceptedSources) {
    const raw = read(s.path).replace(/\r\n/g, '\n');
    const actual = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `Modified frozen baseline file: ${s.path}`);
  }
});
