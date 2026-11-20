import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership, applyProjectRlsSessionVars, withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import type { AwardedBoqRowClassification, AwardedBoqVerificationReport } from '@/lib/uboq/awarded-boq-reconciler';
import {
  buildMasterBoqDatasetFromSource,
  exportMasterReportToXlsxBuffer,
  MASTER_REPORT_PRESETS,
  previewOptionalInputMapping,
  projectMasterBoqReport,
  type MasterReportLayoutConfig,
  type MasterReportPurpose,
} from '@/lib/uboq/master-report-builder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MASTER_REPORT_TEMPLATE_CODE = 'MASTER_BOQ_REPORT';
const NO_CACHE = { 'Cache-Control': 'private, no-store' };

function isValidPurpose(v: unknown): v is MasterReportPurpose {
  return (
    v === 'BOQ_SUMMARY' ||
    v === 'ACCOMPLISHMENT_REPORT' ||
    v === 'PROGRESS_BILLING_WORKING_COPY' ||
    v === 'CUSTOM_REPORT'
  );
}

async function loadMasterContext(projectId: string, actor: { userId: string; role: string; sessionVersion: number }) {
  return withUboqRlsContext(
    { projectId, userId: actor.userId, sessionVersion: actor.sessionVersion },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        projectId,
        userId: actor.userId,
        capability: 'UBOQ_VIEW',
      });
      await assertProjectGraphOwnership(prisma, {
        projectId,
        userId: actor.userId,
        userRole: actor.role,
      });

      const [project, sourceDoc, savedRows] = await Promise.all([
        prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            client: true,
            location: true,
            contractNumber: true,
            contractAmount: true,
          },
        }),
        prisma.uboqSourceDocument.findFirst({
          where: { projectId, documentRole: 'CONTRACT_BOQ' },
          orderBy: { createdAt: 'desc' },
          include: {
            sections: {
              orderBy: { displayOrder: 'asc' },
              select: { id: true, sheetOrPageRef: true, sectionTitle: true, layoutMetaJson: true },
            },
            candidates: {
              orderBy: [{ sourceRowNumber: 'asc' }, { createdAt: 'asc' }],
              include: { section: { select: { sheetOrPageRef: true } } },
            },
          },
        }),
        prisma.uboqTemplateDefinition.findMany({
          where: {
            projectId,
            templateCode: MASTER_REPORT_TEMPLATE_CODE,
            isSystemPreset: false,
            OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actor.userId }],
          },
          orderBy: [{ updatedAt: 'desc' }, { versionNumber: 'desc' }],
          take: 100,
        }),
      ]);

      if (!project) return null;

      const candidates = (sourceDoc?.candidates ?? []).map((c) => {
        const pJson = c.parsedJson && typeof c.parsedJson === 'object' ? (c.parsedJson as Record<string, unknown>) : {};
        const mapped = (pJson.effectiveCanonicalFields ?? pJson.mappedFields ?? {}) as Record<string, unknown>;
        const rowClassification =
          typeof pJson.rowClassification === 'string'
            ? (pJson.rowClassification as AwardedBoqRowClassification)
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
      });

      const meta =
        sourceDoc?.metadataJson && typeof sourceDoc.metadataJson === 'object'
          ? (sourceDoc.metadataJson as Record<string, unknown>)
          : {};
      const persistedSummary = (meta.awardedBoqVerification ?? null) as Partial<AwardedBoqVerificationReport> | null;

      const dataset = sourceDoc
        ? buildMasterBoqDatasetFromSource({
            projectId: project.id,
            projectName: project.name,
            projectLocation: project.location,
            clientName: project.client,
            contractNumber: project.contractNumber,
            officialAwardedContractAmount: project.contractAmount || null,
            sourceDocumentId: sourceDoc.id,
            sourceFileName: sourceDoc.fileName,
            sourceSha256Hash: sourceDoc.sha256Hash,
            candidates,
            persistedWorkbookSummary: persistedSummary,
            hasVerifiedProgressRecords: false,
          })
        : null;

      const savedLayouts = savedRows.map((row) => {
        const grouping =
          row.groupingRulesJson && typeof row.groupingRulesJson === 'object' && !Array.isArray(row.groupingRulesJson)
            ? (row.groupingRulesJson as Record<string, unknown>)
            : {};
        const selectedColumns = Array.isArray(row.selectedFieldsJson)
          ? (row.selectedFieldsJson as unknown[]).filter((f): f is string => typeof f === 'string')
          : [];
        const headingAliases =
          row.headingAliasesJson && typeof row.headingAliasesJson === 'object' && !Array.isArray(row.headingAliasesJson)
            ? (row.headingAliasesJson as Record<string, string>)
            : {};
        return {
          id: row.id,
          layoutGroupId: row.layoutGroupId || row.id,
          versionNumber: row.versionNumber,
          name: row.templateName,
          sharingScope: row.sharingScope,
          createdAt: row.createdAt.toISOString(),
          config: {
            purpose: isValidPurpose(grouping.purpose) ? grouping.purpose : 'CUSTOM_REPORT',
            selectedColumns,
            headingAliases,
            selectedSections: Array.isArray(grouping.selectedSections)
              ? (grouping.selectedSections as string[])
              : [],
            includeHeadings: grouping.includeHeadings !== false,
            includeNotes: Boolean(grouping.includeNotes),
            includeSubtotals: Boolean(grouping.includeSubtotals),
            groupBySection: grouping.groupBySection !== false,
            reportTitle: typeof grouping.reportTitle === 'string' ? grouping.reportTitle : row.templateName,
            reportNumber: typeof grouping.reportNumber === 'string' ? grouping.reportNumber : '',
            periodEnding: typeof grouping.periodEnding === 'string' ? grouping.periodEnding : '',
            showSignatureBlock: Boolean(grouping.showSignatureBlock),
          } satisfies MasterReportLayoutConfig,
        };
      });

      const inputMapping = (sourceDoc?.sections ?? []).map((sec) => ({
        sectionId: sec.id,
        sheetOrPageRef: sec.sheetOrPageRef,
        sectionTitle: sec.sectionTitle,
        headerMap:
          sec.layoutMetaJson && typeof sec.layoutMetaJson === 'object' && !Array.isArray(sec.layoutMetaJson)
            ? (sec.layoutMetaJson as Record<string, string>)
            : {},
      }));

      return { project, dataset, candidates, savedLayouts, inputMapping };
    }
  );
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await verifyOperationalSession();
  if (!actor) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: NO_CACHE });

  const { id: projectId } = await context.params;
  try {
    const ctx = await loadMasterContext(projectId, actor);
    if (!ctx) return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404, headers: NO_CACHE });
    return NextResponse.json(
      {
        project: ctx.project,
        masterSource: ctx.dataset,
        savedLayouts: ctx.savedLayouts,
        inputMapping: ctx.inputMapping,
        presets: MASTER_REPORT_PRESETS,
      },
      { headers: NO_CACHE }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const forbidden = /UNAUTHORIZED|FORBIDDEN|RBAC|PBAC|DENIED/i.test(msg);
    return NextResponse.json(
      { error: forbidden ? 'ACCESS_DENIED' : 'MASTER_REPORT_LOAD_FAILED' },
      { status: forbidden ? 403 : 500, headers: NO_CACHE }
    );
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await verifyOperationalSession();
  if (!actor) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: NO_CACHE });

  const { id: projectId } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? '').trim().toUpperCase();

    const ctx = await loadMasterContext(projectId, actor);
    if (!ctx || !ctx.dataset) {
      return NextResponse.json({ error: 'MASTER_BOQ_SOURCE_NOT_FOUND' }, { status: 404, headers: NO_CACHE });
    }

    if (action === 'PREVIEW_INPUT_MAPPING') {
      const fieldRemap =
        body.fieldRemap && typeof body.fieldRemap === 'object' && !Array.isArray(body.fieldRemap)
          ? (body.fieldRemap as Record<string, string>)
          : {};
      const preview = previewOptionalInputMapping({
        candidates: ctx.candidates,
        fieldRemap,
        officialAwardedContractAmount: ctx.project.contractAmount || null,
      });
      return NextResponse.json({ preview }, { headers: NO_CACHE });
    }

    const rawConfig = (body.config && typeof body.config === 'object' ? body.config : {}) as Partial<MasterReportLayoutConfig>;
    const purpose: MasterReportPurpose = isValidPurpose(rawConfig.purpose) ? rawConfig.purpose : 'BOQ_SUMMARY';
    const preset = MASTER_REPORT_PRESETS[purpose];
    const config: MasterReportLayoutConfig = {
      purpose,
      selectedColumns:
        Array.isArray(rawConfig.selectedColumns) && rawConfig.selectedColumns.length > 0
          ? rawConfig.selectedColumns.map(String)
          : preset.selectedColumns,
      headingAliases:
        rawConfig.headingAliases && typeof rawConfig.headingAliases === 'object'
          ? (rawConfig.headingAliases as Record<string, string>)
          : {},
      selectedSections: Array.isArray(rawConfig.selectedSections) ? rawConfig.selectedSections.map(String) : [],
      includeHeadings: rawConfig.includeHeadings !== false,
      includeNotes: Boolean(rawConfig.includeNotes),
      includeSubtotals: Boolean(rawConfig.includeSubtotals),
      groupBySection: rawConfig.groupBySection !== false,
      reportTitle: String(rawConfig.reportTitle ?? preset.reportTitle).trim().slice(0, 140) || preset.reportTitle,
      reportNumber: String(rawConfig.reportNumber ?? '').trim().slice(0, 40),
      periodEnding: String(rawConfig.periodEnding ?? '').trim().slice(0, 60),
      showSignatureBlock: Boolean(rawConfig.showSignatureBlock),
    };

    if (action === 'EXPORT_XLSX') {
      const projected = projectMasterBoqReport(ctx.dataset, config);
      const buffer = await exportMasterReportToXlsxBuffer(ctx.dataset, projected);
      const safeName = `${purpose.toLowerCase()}_${ctx.project.id.slice(0, 12)}.xlsx`;
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          ...NO_CACHE,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    if (action === 'SAVE_LAYOUT' || action === 'DUPLICATE_LAYOUT') {
      const layoutName = String(body.layoutName ?? '').trim().slice(0, 120);
      if (layoutName.length < 2) {
        return NextResponse.json({ error: 'LAYOUT_NAME_REQUIRED' }, { status: 400, headers: NO_CACHE });
      }
      const sharingScope = body.sharingScope === 'PROJECT_SHARED' ? 'PROJECT_SHARED' : 'PRIVATE';
      const existingGroupId =
        action === 'SAVE_LAYOUT' && typeof body.layoutGroupId === 'string' && body.layoutGroupId.trim()
          ? body.layoutGroupId.trim()
          : null;
      const duplicatedFromId =
        action === 'DUPLICATE_LAYOUT' && typeof body.sourceLayoutId === 'string' && body.sourceLayoutId.trim()
          ? body.sourceLayoutId.trim()
          : null;

      const saved = await withUboqRlsContext(
        { projectId, userId: actor.userId, sessionVersion: actor.sessionVersion },
        async () =>
          prisma.$transaction(async (tx) => {
            await applyProjectRlsSessionVars(tx, {
              projectId,
              userId: actor.userId,
              sessionVersion: actor.sessionVersion,
            });
            let layoutGroupId = existingGroupId || `mrl_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;
            let nextVersion = 1;
            let supersedesId: string | null = null;
            if (existingGroupId) {
              const latest = await tx.uboqTemplateDefinition.findFirst({
                where: { projectId, layoutGroupId: existingGroupId },
                orderBy: { versionNumber: 'desc' },
                select: { id: true, versionNumber: true },
              });
              if (latest) {
                nextVersion = latest.versionNumber + 1;
                supersedesId = latest.id;
              } else {
                layoutGroupId = `mrl_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;
              }
            }
            const defHash = crypto
              .createHash('sha256')
              .update(JSON.stringify({ layoutName, config }), 'utf8')
              .digest('hex');

            return tx.uboqTemplateDefinition.create({
              data: {
                projectId,
                layoutGroupId,
                supersedesId,
                duplicatedFromId,
                sharingScope,
                definitionHash: defHash,
                changeSummary: action === 'DUPLICATE_LAYOUT' ? 'Duplicated layout' : `Saved v${nextVersion}`,
                templateCode: MASTER_REPORT_TEMPLATE_CODE,
                templateName: layoutName,
                rowGrain: 'PHASE_BOQ_LINE',
                selectedFieldsJson: config.selectedColumns as unknown as Prisma.InputJsonValue,
                headingAliasesJson: config.headingAliases as unknown as Prisma.InputJsonValue,
                groupingRulesJson: {
                  purpose: config.purpose,
                  selectedSections: config.selectedSections,
                  includeHeadings: config.includeHeadings,
                  includeNotes: config.includeNotes,
                  includeSubtotals: config.includeSubtotals,
                  groupBySection: config.groupBySection,
                  reportTitle: config.reportTitle,
                  reportNumber: config.reportNumber,
                  periodEnding: config.periodEnding,
                  showSignatureBlock: config.showSignatureBlock,
                } as unknown as Prisma.InputJsonValue,
                isSystemPreset: false,
                versionNumber: nextVersion,
                createdById: actor.userId,
              },
              select: { id: true, layoutGroupId: true, versionNumber: true, templateName: true, sharingScope: true, createdAt: true },
            });
          })
      );

      return NextResponse.json({ saved }, { status: 201, headers: NO_CACHE });
    }

    return NextResponse.json({ error: 'UNSUPPORTED_ACTION' }, { status: 400, headers: NO_CACHE });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const forbidden = /UNAUTHORIZED|FORBIDDEN|RBAC|PBAC|DENIED/i.test(msg);
    return NextResponse.json(
      { error: forbidden ? 'ACCESS_DENIED' : 'MASTER_REPORT_ACTION_FAILED' },
      { status: forbidden ? 403 : 400, headers: NO_CACHE }
    );
  }
}
