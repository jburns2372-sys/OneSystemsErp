import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership, withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import VisualMappingReviewClient from './VisualMappingReviewClient';
import SnapshotApprovalPanel, { type SnapshotSummaryItem } from './SnapshotApprovalPanel';
import ReadOnlyAwardedBoqTable from './ReadOnlyAwardedBoqTable';
import AwardedBoqReconciliationPanel from '../AwardedBoqReconciliationPanel';
import ContractReconciliationBanner from '../ContractReconciliationBanner';
import {
  reconcileProjectContractDocuments,
  type ExtractedContractDocument,
} from '@/lib/uboq/contract-document-extractor';
import type { DocumentRelevanceAssessment } from '@/lib/uboq/project-relevance';
import {
  reconcileImportedAwardedBoqCandidates,
  type AwardedBoqVerificationReport,
} from '@/lib/uboq/awarded-boq-reconciler';
import type {
  VisualSourceDocumentRecord,
  VisualValidationExceptionRecord,
} from '@/lib/uboq/visual-mapping';
import {
  computeUboqWorkflowState,
  resolveEffectiveHeaderAccessContext,
} from '@/lib/uboq/ux-helpers';

export const dynamic = 'force-dynamic';

function extractSnapshotTotals(stagedConsolidationJson: unknown): {
  lineCount: number;
  estimatedTotalAmount: number | null;
} {
  if (!Array.isArray(stagedConsolidationJson) || stagedConsolidationJson.length === 0) {
    return { lineCount: 0, estimatedTotalAmount: null };
  }
  let total = 0;
  let hasAmount = false;
  for (const item of stagedConsolidationJson) {
    if (item && typeof item === 'object') {
      const amt = Number((item as { totalContractAmount?: unknown }).totalContractAmount);
      if (Number.isFinite(amt)) {
        total += amt;
        hasAmount = true;
      }
    }
  }
  return {
    lineCount: stagedConsolidationJson.length,
    estimatedTotalAmount: hasAmount ? Number(total.toFixed(2)) : null,
  };
}

export default async function ProjectUboqWorkbenchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const actor = await verifyOperationalSession();
  if (!actor) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const rawSimulatedRole = cookieStore.get('simulatedRole')?.value || null;
  const accessContext = resolveEffectiveHeaderAccessContext(actor.role, rawSimulatedRole);

  let dashboardData: Awaited<ReturnType<typeof loadPageData>>;
  async function loadPageData() {
    return withUboqRlsContext(
      { userId: actor!.userId, sessionVersion: actor!.sessionVersion, projectId },
      async () => {
        await assertUboqStageAuthorization(prisma, {
          userId: actor!.userId,
          projectId,
          capability: 'UBOQ_VIEW',
          simulatedRole: accessContext.activePreviewRoleCode,
        });
        await assertProjectGraphOwnership(prisma, {
          userId: actor!.userId,
          userRole: actor!.role,
          projectId,
        });
        return Promise.all([
          prisma.project.findUnique({
            where: { id: projectId },
            select: {
              id: true,
              name: true,
              contractNumber: true,
              contractAmount: true,
              boqLocked: true,
              uboqGovernanceEnabled: true,
              _count: { select: { awardedBoqItems: true } },
            },
          }),
          prisma.uboqContractAuthority.findFirst({
            where: { projectId },
            include: { taxProfile: true },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.uboqOperationalSnapshot.findMany({
            where: { projectId },
            orderBy: { versionNumber: 'desc' },
          }),
          prisma.uboqAwardedPhaseLine.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.uboqConsolidationGroup.findMany({
            where: { projectId },
            orderBy: { groupCode: 'asc' },
          }),
          prisma.uboqCanonicalResourceAccount.findMany({
            where: { projectId },
            include: { activeApprovedPr: true },
            orderBy: { resourceCode: 'asc' },
          }),
          prisma.uboqValidationException.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.uboqSourceDocument.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
              candidates: {
                orderBy: [{ sourceRowNumber: 'asc' }, { createdAt: 'asc' }],
                include: {
                  section: { select: { sectionTitle: true, sheetOrPageRef: true } },
                },
              },
            },
          }),
          assertUboqStageAuthorization(prisma, {
            userId: actor!.userId,
            projectId,
            capability: 'UBOQ_HUMAN_REVIEW_RESOLVE',
            simulatedRole: accessContext.activePreviewRoleCode,
          })
            .then(() => true)
            .catch(() => false),
          assertUboqStageAuthorization(prisma, {
            userId: actor!.userId,
            projectId,
            capability: 'UBOQ_SNAPSHOT_APPROVE',
            simulatedRole: accessContext.activePreviewRoleCode,
          })
            .then(() => true)
            .catch(() => false),
          assertUboqStageAuthorization(prisma, {
            userId: actor!.userId,
            projectId,
            capability: 'UBOQ_INTAKE_STAGE',
            simulatedRole: accessContext.activePreviewRoleCode,
          })
            .then(() => true)
            .catch(() => false),
          prisma.projectSchedule.findFirst({
            where: {
              projectId,
              workflowStatus: { notIn: ['REJECTED', 'SUPERSEDED_BASELINE', 'ARCHIVED_BASELINE'] },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, workflowStatus: true },
          }),
        ]);
      }
    );
  }

  try {
    dashboardData = await loadPageData();
  } catch {
    return (
      <main style={{ padding: '32px', maxWidth: '720px', margin: '0 auto', color: '#f8fafc' }}>
        <h1 style={{ color: '#fca5a5', fontSize: '1.35rem', marginBottom: '8px' }}>Project Access Restricted</h1>
        <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
          Your account does not currently have an active assignment to view this project&apos;s BOQ workspace.
        </p>
        <Link href="/projects" style={{ color: '#38bdf8', fontWeight: 600 }}>
          &larr; Back to Projects
        </Link>
      </main>
    );
  }

  const [
    project,
    contract,
    snapshots,
    phaseLines,
    consolidatedGroups,
    resourceAccounts,
    allExceptions,
    sourceDocumentsRaw,
    canReview,
    canApprove,
    canSyncSchedule,
    eligibleSchedule,
  ] = dashboardData;

  if (!project) {
    return (
      <main style={{ padding: '32px', color: '#fca5a5' }}>
        Project not found. <Link href="/projects" style={{ color: '#38bdf8' }}>&larr; Back to Projects</Link>
      </main>
    );
  }

  const approvedDocIds = new Set<string>();
  for (const s of snapshots) {
    if ((s.status === 'APPROVED' || s.approvedAt) && s.sourceDocumentId) {
      approvedDocIds.add(s.sourceDocumentId);
    }
  }

  const docNameById = new Map<string, string>(sourceDocumentsRaw.map((d) => [d.id, d.fileName]));

  const visualSourceDocuments: VisualSourceDocumentRecord[] = redactUboqPayloadForRole(
    sourceDocumentsRaw.map((doc) => ({
      id: doc.id,
      projectId: doc.projectId,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      byteSize: doc.byteSize,
      sha256Hash: doc.sha256Hash,
      documentRole: doc.documentRole,
      isLockedImmutable: doc.isLockedImmutable,
      isApprovedImmutable: approvedDocIds.has(doc.id),
      createdAt: doc.createdAt.toISOString(),
      candidates: doc.candidates.map((c) => ({
        id: c.id,
        sourceDocumentId: c.sourceDocumentId,
        sourceRowNumber: c.sourceRowNumber,
        sourceCellRef: c.sourceCellRef,
        rawHeadingText: c.rawHeadingText,
        mappedCanonicalId: c.mappedCanonicalId,
        rawValueText: c.rawValueText,
        rawFormulaText: c.rawFormulaText,
        parsedJson:
          c.parsedJson && typeof c.parsedJson === 'object' && !Array.isArray(c.parsedJson)
            ? (c.parsedJson as Record<string, unknown>)
            : null,
        confidenceScore: Number(c.confidenceScore),
        extractionMethod: c.extractionMethod,
        requiresHumanReview: c.requiresHumanReview,
        reviewDecision: c.reviewDecision,
        reviewedById: c.reviewedById,
        reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
        reviewNotes: c.reviewNotes,
        sectionTitle: c.section?.sectionTitle ?? null,
        sheetOrPageRef: c.section?.sheetOrPageRef ?? null,
      })),
    })),
    actor.role
  );

  const visualExceptions: VisualValidationExceptionRecord[] = allExceptions.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    snapshotId: e.snapshotId,
    ruleCode: e.ruleCode,
    severity: e.severity,
    entityType: e.entityType,
    entityId: e.entityId,
    message: e.message,
    status: e.status,
    resolvedById: e.resolvedById,
    resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : null,
    resolutionNote: e.resolutionNote,
    createdAt: e.createdAt.toISOString(),
  }));

  const safeAccounts = redactUboqPayloadForRole(
    resourceAccounts.map((a) => ({
      id: a.id,
      resourceCode: a.resourceCode,
      resourceDescription: a.resourceDescription,
      resourceSpec: a.resourceSpec,
      resourceUomNormalized: a.resourceUomNormalized,
      activeApprovedQty: Number(a.activeApprovedQty),
      allocatedUsableStockQty: Number(a.allocatedUsableStockQty),
      openMrReservedQty: Number(a.openMrReservedQty),
      openCommittedPoQty: Number(a.openCommittedPoQty),
      deliveredReceivedQty: Number(a.deliveredReceivedQty),
      consumedIssuedQty: Number(a.consumedIssuedQty),
      damagedReturnedQty: Number(a.damagedReturnedQty),
      availablePhysicalStockQty: Number(a.availablePhysicalStockQty),
      remainingProcurementQty: Number(a.remainingProcurementQty),
      targetResourceUnitCost: Number(a.targetResourceUnitCost),
    })),
    actor.role
  );

  const toSnapshotSummary = (s: (typeof snapshots)[number] | undefined): SnapshotSummaryItem | null => {
    if (!s) return null;
    const totals = extractSnapshotTotals(s.stagedConsolidationJson);
    return {
      id: s.id,
      versionNumber: s.versionNumber,
      versionLabel: s.versionLabel || `v${s.versionNumber}.0`,
      status: s.status,
      preparedById: s.preparedById ?? null,
      approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      sourceFileName: s.sourceDocumentId ? (docNameById.get(s.sourceDocumentId) ?? null) : null,
      lineCount: totals.lineCount || phaseLines.length,
      estimatedTotalAmount: totals.estimatedTotalAmount,
    };
  };

  const latestDraft = toSnapshotSummary(snapshots.find((s) => s.status === 'DRAFT'));
  const latestApproved = toSnapshotSummary(snapshots.find((s) => s.status === 'APPROVED'));

  const workflow = computeUboqWorkflowState({
    sourceDocuments: visualSourceDocuments,
    exceptions: visualExceptions,
    snapshots: snapshots.map((s) => ({ id: s.id, status: s.status })),
    hasLinkedSchedule: Boolean(eligibleSchedule),
  });

  const latestStatusLabel = latestApproved
    ? `Approved (${latestApproved.versionLabel})`
    : latestDraft
      ? `Draft (${latestDraft.versionLabel})`
      : 'No BOQ Saved Yet';

  const latestBoqDocRaw = sourceDocumentsRaw.find((d) => d.documentRole === 'CONTRACT_BOQ') ?? sourceDocumentsRaw[0] ?? null;
  // Separate review workflows (VisualMappingReviewClient + SnapshotApprovalPanel) are preserved
  // strictly for non-awarded draft estimates or proposed variations — NEVER for final Awarded BOQs.
  const isDraftEstimateOrVariationReview = Boolean(
    latestBoqDocRaw && ['AGENCY_ESTIMATE', 'DUPA', 'VARIATION_ORDER'].includes(latestBoqDocRaw.documentRole)
  );
  const boqVerification: AwardedBoqVerificationReport | null = latestBoqDocRaw
    ? (() => {
        const meta =
          latestBoqDocRaw.metadataJson && typeof latestBoqDocRaw.metadataJson === 'object'
            ? (latestBoqDocRaw.metadataJson as Record<string, unknown>)
            : {};
        const persistedSummary = (meta.awardedBoqVerification ?? null) as Partial<AwardedBoqVerificationReport> | null;
        return reconcileImportedAwardedBoqCandidates(
          latestBoqDocRaw.candidates.map((c) => {
            const pJson =
              c.parsedJson && typeof c.parsedJson === 'object' && !Array.isArray(c.parsedJson)
                ? (c.parsedJson as Record<string, unknown>)
                : {};
            const mapped = (pJson.effectiveCanonicalFields ?? pJson.mappedFields ?? {}) as Record<string, unknown>;
            const rowClassification =
              typeof pJson.rowClassification === 'string'
                ? (pJson.rowClassification as Parameters<typeof reconcileImportedAwardedBoqCandidates>[0][number]['rowClassification'])
                : null;
            return {
              id: c.id,
              sourceRowNumber: c.sourceRowNumber,
              sourceCellRef: c.sourceCellRef,
              sheetOrPageRef: c.section?.sheetOrPageRef ?? null,
              rawFormulaText: c.rawFormulaText,
              mappedFields: mapped,
              rowClassification,
            };
          }),
          {
            officialAwardedContractAmount: project.contractAmount || null,
            persistedWorkbookSummary: persistedSummary,
          }
        );
      })()
    : null;

  const extractedContractDocs: ExtractedContractDocument[] = [];
  const needsConfirmationDocs: Array<{ id: string; fileName: string; relevance: DocumentRelevanceAssessment }> = [];
  for (const doc of sourceDocumentsRaw) {
    const meta = doc.metadataJson && typeof doc.metadataJson === 'object' ? (doc.metadataJson as Record<string, unknown>) : null;
    if (meta?.contractExtraction && typeof meta.contractExtraction === 'object') {
      extractedContractDocs.push(meta.contractExtraction as ExtractedContractDocument);
    }
    if (meta?.projectRelevance && typeof meta.projectRelevance === 'object') {
      const rel = meta.projectRelevance as DocumentRelevanceAssessment;
      if (rel.status === 'NEEDS_CONFIRMATION') {
        needsConfirmationDocs.push({ id: doc.id, fileName: doc.fileName, relevance: rel });
      }
    }
  }
  const contractReconciliation =
    extractedContractDocs.length > 0
      ? reconcileProjectContractDocuments(extractedContractDocs, {
          boqRecalculatedTotal: boqVerification?.recalculatedTotal ?? null,
        })
      : null;

  return (
    <main style={{ padding: '20px clamp(14px, 3vw, 28px)', maxWidth: '1360px', margin: '0 auto', color: 'var(--text-primary, #f8fafc)' }}>
      {/* Project -> BOQ -> Scheduling Breadcrumb & Primary Navigation */}
      <nav
        aria-label="Project BOQ navigation"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.84rem', color: '#94a3b8' }}>
          <Link href="/projects" style={{ color: '#cbd5e1' }}>Projects</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/projects/${project.id}`} style={{ color: '#38bdf8', fontWeight: 600 }}>
            {project.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{ color: '#f8fafc', fontWeight: 700 }}>Universal BOQ</span>
          <span aria-hidden="true">&rarr;</span>
          <Link href={`/projects/${project.id}/scheduling`} style={{ color: '#cbd5e1' }}>
            Scheduling
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href={`/projects/${project.id}`}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            &larr; Back to Project
          </Link>
          <Link
            href={`/projects/${project.id}/documents`}
            style={{
              padding: '7px 13px',
              borderRadius: '8px',
              background: workflow.hasDocuments ? 'rgba(56, 189, 248, 0.14)' : '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: workflow.hasDocuments ? '#38bdf8' : '#0f172a',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {workflow.hasDocuments ? 'Upload New BOQ File' : 'Step 1: Upload BOQ File'}
          </Link>
          <Link
            href={`/projects/${project.id}/scheduling`}
            style={{
              padding: '7px 13px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Scheduling &rarr;
          </Link>
        </div>
      </nav>

      {/* Page Title & Guided Stage Banner */}
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', color: '#f8fafc' }}>
          BOQ Verification &amp; Contract Reconciliation
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          <strong style={{ color: '#e2e8f0' }}>{project.name}</strong> ({project.contractNumber || project.id})
          {contract ? ` · ${contract.sectorType}` : ''}
        </p>
      </header>

      <ContractReconciliationBanner
        reconciliation={contractReconciliation}
        needsConfirmationDocs={needsConfirmationDocs}
      />

      <AwardedBoqReconciliationPanel
        projectId={project.id}
        sourceDocument={
          latestBoqDocRaw
            ? {
                id: latestBoqDocRaw.id,
                fileName: latestBoqDocRaw.fileName,
                byteSize: latestBoqDocRaw.byteSize,
                sha256Hash: latestBoqDocRaw.sha256Hash,
                createdAt: latestBoqDocRaw.createdAt.toISOString(),
              }
            : null
        }
        verification={boqVerification}
        hasWorkspaceBoq={(project._count?.awardedBoqItems ?? 0) > 0}
        isBoqLocked={Boolean(project.boqLocked)}
        canPopulateWorkspaceBoq={canApprove}
        isSimulatingRole={accessContext.isSimulating}
        showWorkspaceCta
      />

      {/* Final Awarded BOQ: Read-Only Verification & Extracted BOQ Table (Zero Per-Item Approvals) */}
      {!isDraftEstimateOrVariationReview && latestBoqDocRaw && boqVerification && (
        <ReadOnlyAwardedBoqTable
          sourceFileName={latestBoqDocRaw.fileName}
          sourceSha256Hash={latestBoqDocRaw.sha256Hash}
          verification={boqVerification}
        />
      )}

      {/* Separate Review Workflow Preserved Strictly for Draft Estimates & Proposed Variations */}
      {isDraftEstimateOrVariationReview && (
        <>
          <ol
            aria-label="Draft estimate review steps"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 22px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
            }}
          >
            {workflow.steps.map((step) => {
              const isCurrent = step.status === 'current';
              const isDone = step.status === 'completed';
              return (
                <li
                  key={step.id}
                  aria-current={isCurrent ? 'step' : undefined}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isCurrent
                      ? 'rgba(56, 189, 248, 0.14)'
                      : isDone
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(15, 23, 42, 0.65)',
                    border: isCurrent
                      ? '1px solid rgba(56, 189, 248, 0.6)'
                      : isDone
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isDone ? '#10b981' : isCurrent ? '#38bdf8' : 'rgba(148,163,184,0.2)',
                        color: isDone || isCurrent ? '#022c22' : '#cbd5e1',
                      }}
                    >
                      {isDone ? '✓' : step.number}
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: isCurrent ? '#f8fafc' : '#e2e8f0' }}>
                      {step.label}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#94a3b8', paddingLeft: '30px' }}>
                    {step.shortHint}
                  </div>
                </li>
              );
            })}
          </ol>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Draft Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px', color: latestApproved ? '#34d399' : '#38bdf8' }}>
                {latestStatusLabel}
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Item Review Progress</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
                {workflow.totalCandidates > 0
                  ? `${workflow.acceptedCandidates} of ${workflow.totalCandidates} Accepted`
                  : 'No items uploaded yet'}
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Open Issues</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px', color: workflow.openExceptions > 0 ? '#fbbf24' : '#34d399' }}>
                {workflow.openExceptions === 0 ? 'All Clear (0)' : `${workflow.openExceptions} Open`}
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Next Step</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, marginTop: '4px', color: '#e2e8f0' }}>
                {workflow.stageHeadline}
              </div>
            </div>
          </div>

          <VisualMappingReviewClient
            projectId={project.id}
            sectorType={(contract?.sectorType as 'GOVERNMENT' | 'CORPORATE' | 'PRIVATE' | undefined) ?? null}
            taxProfileCode={contract?.taxProfile?.profileCode ?? null}
            sourceDocuments={visualSourceDocuments}
            exceptions={visualExceptions}
            canReview={canReview}
          />

          <SnapshotApprovalPanel
            projectId={project.id}
            projectName={project.name}
            projectRef={project.contractNumber || project.id}
            currentUserId={actor.userId}
            actorEmail={actor.email ?? 'Authenticated User'}
            actorRoleLabel={accessContext.realRoleLabel}
            canApprove={canApprove}
            canSyncSchedule={canSyncSchedule}
            isSimulatingRole={accessContext.isSimulating}
            totalCandidates={workflow.totalCandidates}
            acceptedCandidates={workflow.acceptedCandidates}
            pendingCandidates={workflow.pendingCandidates}
            blockingOpenExceptions={workflow.blockingOpenExceptions}
            latestDraft={latestDraft}
            latestApproved={latestApproved}
            eligibleScheduleId={eligibleSchedule?.id ?? null}
            eligibleScheduleName={eligibleSchedule?.name ?? null}
          />
        </>
      )}

      {/* Collapsible Resource & Procurement Stock Accounts (kept out of the way until populated) */}
      <details
        open={safeAccounts.length > 0}
        style={{
          marginBottom: '32px',
          padding: '16px 18px',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.96rem', color: '#e2e8f0' }}>
          Approved Resource &amp; Procurement Accounts ({safeAccounts.length})
          {consolidatedGroups.length > 0 ? ` · ${consolidatedGroups.length} Consolidated Group(s)` : ''}
        </summary>
        <div style={{ marginTop: '14px', overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#020617', color: '#cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Code</th>
                <th style={{ padding: '10px' }}>Material / Resource</th>
                <th style={{ padding: '10px' }}>Unit</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Approved Qty</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Available Stock</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Remaining to Procure</th>
              </tr>
            </thead>
            <tbody>
              {safeAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', color: '#94a3b8', textAlign: 'center' }}>
                    Resource and procurement balances will appear here once a BOQ Draft is approved.
                  </td>
                </tr>
              ) : (
                safeAccounts.map((a) => (
                  <tr key={a.id} style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{a.resourceCode}</td>
                    <td style={{ padding: '10px' }}>
                      <div>{a.resourceDescription}</div>
                      {a.resourceSpec && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.resourceSpec}</div>}
                    </td>
                    <td style={{ padding: '10px' }}>{a.resourceUomNormalized}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{a.activeApprovedQty.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>
                      {a.availablePhysicalStockQty.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>
                      {a.remainingProcurementQty.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </main>
  );
}
