import crypto from 'node:crypto';
import type {
  Prisma,
  PrismaClient,
  UboqFulfillmentChannel,
  UboqResourceClass,
  UboqSectorType,
} from '@prisma/client';
import { extractUniversalDocumentPackage } from '../intake/parsers';
import { CANONICAL_FIELD_MAP, resolveCanonicalFieldId } from '../field-catalog';
import { normalizeUom } from '../uom-registry';
import {
  buildSafePhaseConsolidation,
  computeSpecSignatureHash,
  evaluateResourceTakeoffRequirement,
  type ConsolidatedGroupPreview,
  type PhaseBoqInputLine,
} from '../validation-engine';
import {
  computeAgencyEstimateBreakdown,
  STANDARD_TAX_PROFILES,
  type TaxPricingProfileConfig,
} from '../tax-engine';
import {
  applyLedgerDeltaOnLockedAccount,
  type LockedResourceRow,
} from '../resource-ledger';
import { resolveUboqVaultStorageProvider } from '../storage/vault-storage';
import { assertUboqStageAuthorization } from '../security/stage-rbac';
import { applyProjectRlsSessionVars, uboqRlsStorage } from '../project-ownership';

export interface ResourceTakeoffSpecInput {
  readonly consolidatedItemCodeOrDesc: string;
  readonly resourceCode: string;
  readonly resourceDescription: string;
  readonly resourceSpec: string;
  readonly resourceUnitRaw: string;
  readonly resourceClass?: UboqResourceClass;
  readonly fulfillmentChannel?: UboqFulfillmentChannel;
  readonly takeoffBasis: 'CONTRACTOR_DETAILED_DUPA' | 'SUMMARY_ONLY_VERIFIED';
  readonly resourceCoeff?: number | null;
  readonly summaryVerifiedQty?: number | null;
  readonly benchmarkUnitCost: number;
  readonly targetResourceUnitCost?: number;
}

interface StagedValidatedTakeoff {
  readonly targetGroupKey: string;
  readonly resourceCode: string;
  readonly resourceDescription: string;
  readonly resourceSpec: string;
  readonly specSignatureHash: string;
  readonly resourceClass: UboqResourceClass;
  readonly fulfillmentChannel: UboqFulfillmentChannel;
  readonly resourceUomNormalized: string;
  readonly uomDimensionFamily: string;
  readonly takeoffBasis: 'CONTRACTOR_DETAILED_DUPA' | 'SUMMARY_ONLY_VERIFIED';
  readonly resourceCoeff: number | null;
  readonly workQuantityBasis: number | null;
  readonly summaryVerifiedQty: number | null;
  readonly requiredQty: number;
  readonly benchmarkUnitCost: number;
  readonly targetResourceUnitCost: number;
  readonly procurementBudget: number;
}

interface StagedIntakeOptionsMetadata {
  readonly sectorType?: UboqSectorType;
  readonly clientName?: string;
  readonly contractRef?: string;
  readonly taxProfileCode?: string;
  readonly resourceTakeoffs?: ResourceTakeoffSpecInput[];
}

const NUMERIC_CANONICAL_FIELD_IDS = new Set([
  'approved_qty',
  'original_qty',
  'contract_unit_rate',
  'contract_line_amount',
  'agency_edc_amt',
  'agency_abc',
  'estimate_material_cost',
  'estimate_labor_cost',
  'estimate_equipment_cost',
  'estimated_direct_cost',
  'ocm_rate',
  'ocm_amount',
  'contingency_ocm',
  'contractor_profit_rate',
  'contractor_profit_amt',
  'estimate_vat_rate',
  'estimate_vat_amt',
  'estimated_indirect_cost',
  'estimated_total_unit_cost',
  'estimated_total_amount',
  'resource_coeff',
  'resource_summary_qty',
  'resource_required_qty',
  'target_resource_cost',
  'procurement_budget',
]);

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

function toFiniteNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₱$,\s]/g, '').trim();
    if (!cleaned || cleaned === '-' || cleaned === '—') return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function toPositiveFiniteNumber(val: unknown): number | null {
  const n = toFiniteNumber(val);
  return n !== null && n > 0 ? n : null;
}

function buildPhaseInputLineFromCandidateFields(params: {
  lineIndex: number;
  candidateId: string;
  sheetOrPageRef: string | null;
  sourceCellRef: string | null;
  fields: Record<string, unknown>;
}): PhaseBoqInputLine | null {
  const { lineIndex, candidateId, sheetOrPageRef, sourceCellRef, fields } = params;
  const workDescription = String(fields.work_description ?? '').trim();
  const unitRaw = String(fields.unit ?? '').trim();
  const approvedQty = toFiniteNumber(fields.approved_qty);
  const contractUnitRate = toFiniteNumber(fields.contract_unit_rate);

  if (!workDescription || !unitRaw || approvedQty === null || contractUnitRate === null) {
    return null;
  }

  const rawPhase = String(fields.phase_code ?? '').trim();
  const resolvedPhase =
    rawPhase && rawPhase.toUpperCase() !== 'GENERAL'
      ? rawPhase
      : String(sheetOrPageRef || 'PHASE-1').trim();

  const origQty = toFiniteNumber(fields.original_qty);
  const statedLineAmount = toFiniteNumber(fields.contract_line_amount);
  const sourcedEdc =
    toPositiveFiniteNumber(fields.agency_edc_amt) ??
    toPositiveFiniteNumber(fields.estimated_direct_cost);
  // R1-M02: Map agencyAbc STRICTLY from explicit sourced agency_abc — NEVER from derived estimated_total_amount!
  const sourcedAbc = toPositiveFiniteNumber(fields.agency_abc);

  return {
    lineKey: `LINE-${lineIndex + 1}`,
    itemCode: String(fields.item_code || `ITEM-${lineIndex + 1}`).trim(),
    phaseCode: resolvedPhase,
    sectionCode: fields.section_code ? String(fields.section_code).trim() : null,
    workDescription,
    specification: fields.specification ? String(fields.specification).trim() : null,
    unitRaw,
    originalQty: origQty !== null ? origQty : approvedQty,
    approvedQty,
    contractUnitRate,
    contractLineAmount: statedLineAmount !== null ? statedLineAmount : undefined,
    estimatedDirectCost: sourcedEdc,
    agencyAbc: sourcedAbc,
    sourceSheetName: sheetOrPageRef,
    sourceCellRef,
    extractionCandidateId: candidateId,
  };
}

function mapLockedAccountRow(r: Record<string, unknown>): LockedResourceRow {
  return {
    id: String(r.id),
    projectId: String(r.projectId),
    consolidatedBoqItemId: String(r.consolidatedBoqItemId),
    resourceCode: String(r.resourceCode),
    resourceUomNormalized: String(r.resourceUomNormalized),
    activeApprovedPrId: r.activeApprovedPrId ? String(r.activeApprovedPrId) : null,
    activeApprovedQty: Number(r.activeApprovedQty),
    allocatedUsableStockQty: Number(r.allocatedUsableStockQty),
    openMrReservedQty: Number(r.openMrReservedQty),
    openCommittedPoQty: Number(r.openCommittedPoQty),
    deliveredReceivedQty: Number(r.deliveredReceivedQty),
    consumedIssuedQty: Number(r.consumedIssuedQty),
    damagedReturnedQty: Number(r.damagedReturnedQty),
    availablePhysicalStockQty: Number(r.availablePhysicalStockQty),
    remainingProcurementQty: Number(r.remainingProcurementQty),
    isOvercommittedByRevision: Boolean(r.isOvercommittedByRevision),
    overcommittedQty: Number(r.overcommittedQty),
    targetResourceUnitCost: Number(r.targetResourceUnitCost),
    rowVersion: Number(r.rowVersion),
  };
}

/**
 * Shared verified staging helper used by both deterministic initial ingestion and
 * post-human-review draft regeneration (R1-H01, R1-M02, H05, H06).
 */
async function stageVerifiedPhaseLinesIntoDraftSnapshot(
  prisma: PrismaClient,
  params: {
    projectId: string;
    sourceDocumentId: string;
    sourceSha256Hash: string;
    preparedByUserId: string;
    phaseInputs: PhaseBoqInputLine[];
    sectorType?: UboqSectorType;
    clientName?: string;
    contractRef?: string;
    taxProfileCode?: string;
    resourceTakeoffs?: ResourceTakeoffSpecInput[];
    supersedePriorDraftForDocument?: boolean;
  }
) {
  const { groups, issues } = buildSafePhaseConsolidation(params.phaseInputs);
  const blockingIssues = issues.filter((i) => i.severity === 'BLOCKING');
  if (blockingIssues.length > 0) {
    for (const bi of blockingIssues) {
      await prisma.uboqValidationException.create({
        data: {
          projectId: params.projectId,
          ruleCode: bi.ruleCode,
          severity: bi.severity,
          entityType: bi.entityType,
          entityId: bi.entityId ?? null,
          message: bi.message,
        },
      });
    }
    throw new Error(
      `UBOQ_CONSOLIDATION_VALIDATION_FAILED: ${blockingIssues.map((b) => `${b.ruleCode}: ${b.message}`).join('; ')}`
    );
  }

  // H06: Validate resourceTakeoffs strictly against consolidated groups WITHOUT any default fallback to groups[0]!
  const stagedTakeoffs: StagedValidatedTakeoff[] = [];
  if (params.resourceTakeoffs && params.resourceTakeoffs.length > 0) {
    for (const rt of params.resourceTakeoffs) {
      const needle = (rt.consolidatedItemCodeOrDesc || '').trim();
      const needleLower = needle.toLowerCase();
      const matches = groups.filter((g) => {
        const descLower = g.canonicalDescription.trim().toLowerCase();
        const specLower = (g.specification || '').trim().toLowerCase();
        const descAndSpecLower = specLower ? `${descLower} | ${specLower}` : descLower;
        return g.groupKey === needle || descLower === needleLower || descAndSpecLower === needleLower;
      });

      if (matches.length !== 1) {
        const ruleCode = matches.length === 0 ? 'VAL-PRR-UNMATCHED-GROUP' : 'VAL-PRR-AMBIGUOUS-GROUP';
        const message =
          matches.length === 0
            ? `Resource takeoff "${rt.resourceCode}" target "${rt.consolidatedItemCodeOrDesc}" did not match any consolidated work scope group`
            : `Resource takeoff "${rt.resourceCode}" target "${rt.consolidatedItemCodeOrDesc}" matched ${matches.length} consolidated groups ambiguously`;
        await prisma.uboqValidationException.create({
          data: {
            projectId: params.projectId,
            ruleCode,
            severity: 'BLOCKING',
            entityType: 'RESOURCE_TAKEOFF',
            entityId: rt.resourceCode,
            message,
          },
        });
        throw new Error(`UBOQ_UNMATCHED_RESOURCE_TAKEOFF_GROUP [${ruleCode}]: ${message}`);
      }

      const matchedGrp = matches[0];
      const resUom = normalizeUom(rt.resourceUnitRaw, rt.resourceSpec);
      const resSpecHash = computeSpecSignatureHash(rt.resourceDescription, rt.resourceSpec);
      const evalRes = evaluateResourceTakeoffRequirement({
        resourceCode: rt.resourceCode,
        takeoffBasis: rt.takeoffBasis,
        resourceCoeff: rt.resourceCoeff,
        workQuantityBasis: Number(matchedGrp.totalApprovedQty),
        summaryVerifiedQty: rt.summaryVerifiedQty,
      });
      const blockTakeoff = evalRes.issues.find((i) => i.severity === 'BLOCKING');
      if (blockTakeoff) {
        await prisma.uboqValidationException.create({
          data: {
            projectId: params.projectId,
            ruleCode: blockTakeoff.ruleCode,
            severity: 'BLOCKING',
            entityType: blockTakeoff.entityType,
            entityId: rt.resourceCode,
            message: blockTakeoff.message,
          },
        });
        throw new Error(`UBOQ_TAKEOFF_BLOCKED [${blockTakeoff.ruleCode}]: ${blockTakeoff.message}`);
      }

      stagedTakeoffs.push({
        targetGroupKey: matchedGrp.groupKey,
        resourceCode: rt.resourceCode,
        resourceDescription: rt.resourceDescription,
        resourceSpec: rt.resourceSpec,
        specSignatureHash: resSpecHash,
        resourceClass: rt.resourceClass ?? 'MATERIAL',
        fulfillmentChannel: rt.fulfillmentChannel ?? 'SUPPLIER_PO',
        resourceUomNormalized: resUom.normalizedCode,
        uomDimensionFamily: resUom.dimensionFamily,
        takeoffBasis: rt.takeoffBasis,
        resourceCoeff: rt.resourceCoeff ?? null,
        workQuantityBasis:
          rt.takeoffBasis === 'CONTRACTOR_DETAILED_DUPA' ? Number(matchedGrp.totalApprovedQty) : null,
        summaryVerifiedQty: rt.summaryVerifiedQty ?? null,
        requiredQty: evalRes.requiredQty,
        benchmarkUnitCost: rt.benchmarkUnitCost,
        targetResourceUnitCost: rt.targetResourceUnitCost ?? rt.benchmarkUnitCost,
        procurementBudget: Number((evalRes.requiredQty * rt.benchmarkUnitCost).toFixed(2)),
      });
    }
  }

  const profileCfg: TaxPricingProfileConfig =
    STANDARD_TAX_PROFILES[params.taxProfileCode ?? ''] ??
    (params.sectorType === 'CORPORATE'
      ? STANDARD_TAX_PROFILES.CORP_PH_VAT_EXCL_12
      : params.sectorType === 'PRIVATE'
        ? STANDARD_TAX_PROFILES.PRIVATE_NON_VAT_EXEMPT
        : STANDARD_TAX_PROFILES.GOV_PH_DUPA_5PCT_EST);

  // H05: Stage DRAFT Operational Snapshot & Phase Lines ONLY — ZERO mutations to live AwardedBOQItem,
  // ConsolidatedBOQItem, BOQMapping, Project.uboqGovernanceEnabled, or UboqCanonicalResourceAccount!
  const stagedResult = await prisma.$transaction(async (tx) => {
    const rlsStore = uboqRlsStorage.getStore();
    if (rlsStore && !rlsStore.inInteractiveTx) {
      await applyProjectRlsSessionVars(tx, rlsStore);
    }

    if (params.supersedePriorDraftForDocument) {
      await tx.uboqOperationalSnapshot.updateMany({
        where: {
          projectId: params.projectId,
          sourceDocumentId: params.sourceDocumentId,
          status: 'DRAFT',
        },
        data: { status: 'SUPERSEDED' },
      });
    }

    const taxProfile = await tx.uboqTaxPricingProfile.upsert({
      where: {
        projectId_profileCode_versionCode: {
          projectId: params.projectId,
          profileCode: profileCfg.profileCode,
          versionCode: profileCfg.versionCode,
        },
      },
      update: {},
      create: {
        projectId: params.projectId,
        profileCode: profileCfg.profileCode,
        versionCode: profileCfg.versionCode,
        sectorType: profileCfg.sectorType,
        estimateVatComponentRate: profileCfg.estimateVatComponentRate,
        estimateVatBaseMode: profileCfg.estimateVatBaseMode,
        outputVatRate: profileCfg.outputVatRate,
        salesVatCategory: profileCfg.salesVatCategory,
        contractVatInclusive: profileCfg.contractVatInclusive,
        govVatWithholdingRate: profileCfg.govVatWithholdingRate,
        ewtRate: profileCfg.ewtRate,
        ocmRate: profileCfg.ocmRate,
        contractorProfitRate: profileCfg.contractorProfitRate,
        contingencyRate: profileCfg.contingencyRate,
        retentionRate: profileCfg.retentionRate,
        advanceRecoupmentRate: profileCfg.advanceRecoupmentRate,
      },
    });

    const latestSnap = await tx.uboqOperationalSnapshot.findFirst({
      where: { projectId: params.projectId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVer = (latestSnap?.versionNumber ?? 0) + 1;
    const canonicalHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          sha: params.sourceSha256Hash,
          phaseInputs: params.phaseInputs.map((p) => ({
            candidateId: p.extractionCandidateId ?? null,
            phaseCode: p.phaseCode,
            itemCode: p.itemCode,
            unitRaw: p.unitRaw,
            approvedQty: p.approvedQty,
            contractUnitRate: p.contractUnitRate,
          })),
          groups,
          stagedTakeoffs,
        })
      )
      .digest('hex');

    const snapshot = await tx.uboqOperationalSnapshot.create({
      data: {
        projectId: params.projectId,
        sourceDocumentId: params.sourceDocumentId,
        versionNumber: nextVer,
        versionLabel: `v${nextVer}.0`,
        status: 'DRAFT',
        supersedesSnapshotId: latestSnap?.id ?? null,
        canonicalHash,
        stagedConsolidationJson: groups as unknown as Prisma.InputJsonValue,
        stagedTakeoffsJson: stagedTakeoffs as unknown as Prisma.InputJsonValue,
        preparedById: params.preparedByUserId,
      },
    });

    const totalContractRev = groups.reduce((s, g) => s + g.totalContractAmount, 0);
    const totalContractExVat =
      profileCfg.outputVatRate > 0 && profileCfg.contractVatInclusive
        ? Number((totalContractRev / (1 + profileCfg.outputVatRate)).toFixed(2))
        : Number(totalContractRev.toFixed(2));

    await tx.uboqContractAuthority.create({
      data: {
        projectId: params.projectId,
        taxProfileId: taxProfile.id,
        sectorType: profileCfg.sectorType,
        clientName: params.clientName ?? 'Project Owner',
        contractRef: params.contractRef ?? `CTR-${params.projectId}`,
        contractVatBasis: profileCfg.contractVatInclusive ? 'VAT_INCLUSIVE' : 'VAT_EXCLUSIVE',
        awardedRevenue: totalContractRev,
        awardedRevenueExVat: totalContractExVat,
        currentContractValue: totalContractRev,
        status: 'DRAFT',
      },
    });

    for (const pIn of params.phaseInputs) {
      const uomDef = normalizeUom(pIn.unitRaw, pIn.specification);
      const specHash = computeSpecSignatureHash(pIn.workDescription, pIn.specification);
      const amt = pIn.contractLineAmount ?? Number((pIn.approvedQty * pIn.contractUnitRate).toFixed(2));
      const amtExVat =
        profileCfg.outputVatRate > 0 && profileCfg.contractVatInclusive
          ? Number((amt / (1 + profileCfg.outputVatRate)).toFixed(2))
          : amt;

      const hasSourceEdc =
        typeof pIn.estimatedDirectCost === 'number' &&
        Number.isFinite(pIn.estimatedDirectCost) &&
        pIn.estimatedDirectCost > 0;
      const hasSourceAbc =
        typeof pIn.agencyAbc === 'number' &&
        Number.isFinite(pIn.agencyAbc) &&
        pIn.agencyAbc > 0;

      // R1-M02: Distinguish authoritative source-evidenced ABC from direct-cost-only derived estimates!
      const agencyEstimateStatus =
        hasSourceEdc && hasSourceAbc
          ? 'SOURCE_EVIDENCED'
          : hasSourceEdc && !hasSourceAbc
            ? 'DIRECT_COST_ONLY_DERIVED'
            : !hasSourceEdc && hasSourceAbc
              ? 'NEEDS_REVIEW'
              : 'SOURCE_NOT_PROVIDED';

      const uboqPhase = await tx.uboqAwardedPhaseLine.create({
        data: {
          projectId: params.projectId,
          snapshotId: snapshot.id,
          awardedBoqItemId: null, // H05: Materialized into live AwardedBOQItem strictly upon snapshot approval!
          sourceDocumentId: params.sourceDocumentId,
          extractionCandidateId: pIn.extractionCandidateId ?? null, // R1-H01: Immutable L2 candidate provenance link!
          sourceSheetName: pIn.sourceSheetName ?? null,
          sourceCellRef: pIn.sourceCellRef ?? null,
          itemCode: pIn.itemCode,
          phaseCode: pIn.phaseCode,
          sectionCode: pIn.sectionCode ?? null,
          workDescription: pIn.workDescription,
          specification: pIn.specification ?? null,
          specSignatureHash: specHash,
          unitRaw: pIn.unitRaw,
          unitNormalized: uomDef.normalizedCode,
          uomDimensionFamily: uomDef.dimensionFamily,
          pricingType: pIn.pricingType ?? 'UNIT_PRICE',
          originalQty: pIn.originalQty,
          approvedQty: pIn.approvedQty,
          contractUnitRate: pIn.contractUnitRate,
          contractLineAmount: amt,
          contractAmountExVat: amtExVat,
          agencyEstimateStatus,
        },
      });

      // H06 & R1-M02: Persist Agency Estimate Baseline ONLY when evidenced in source — NEVER invent amt * 0.78,
      // and NEVER populate authoritative agencyAbcAmt from derived estimatedTotalAmount!
      if (hasSourceEdc && pIn.estimatedDirectCost) {
        const agencyEst = computeAgencyEstimateBreakdown(pIn.estimatedDirectCost, profileCfg);
        await tx.uboqAgencyEstimateBaseline.create({
          data: {
            projectId: params.projectId,
            phaseLineId: uboqPhase.id,
            agencyEdcAmt: agencyEst.estimatedDirectCost,
            agencyAbcAmt: hasSourceAbc ? pIn.agencyAbc! : null,
            estimatedDirectCost: agencyEst.estimatedDirectCost,
            ocmAmount: agencyEst.ocmAmount,
            contingencyOcm: agencyEst.contingencyOcm,
            contractorProfitAmt: agencyEst.contractorProfitAmt,
            estimateVatAmt: agencyEst.estimateVatAmt,
            estimatedIndirectCost: agencyEst.estimatedIndirectCost,
            estimatedTotalAmount: agencyEst.estimatedTotalAmount,
          },
        });
      } else if (!hasSourceEdc && hasSourceAbc && pIn.agencyAbc) {
        await tx.uboqAgencyEstimateBaseline.create({
          data: {
            projectId: params.projectId,
            phaseLineId: uboqPhase.id,
            agencyEdcAmt: null,
            agencyAbcAmt: pIn.agencyAbc,
            estimatedDirectCost: 0,
            ocmAmount: 0,
            contingencyOcm: 0,
            contractorProfitAmt: 0,
            estimateVatAmt: 0,
            estimatedIndirectCost: 0,
            estimatedTotalAmount: 0,
          },
        });
        await tx.uboqValidationException.create({
          data: {
            projectId: params.projectId,
            snapshotId: snapshot.id,
            ruleCode: 'VAL-EST-PARTIAL-ABC-ONLY',
            severity: 'WARNING',
            entityType: 'PHASE_LINE_AGENCY_ESTIMATE',
            entityId: uboqPhase.id,
            message: `Phase line ${pIn.phaseCode}:${pIn.itemCode} provided agency ABC without direct cost breakdown; marked NEEDS_REVIEW without fabricating direct cost.`,
          },
        });
      }
    }

    return { snapshot };
  });

  return {
    snapshot: stagedResult.snapshot,
    groups,
    stagedTakeoffsCount: stagedTakeoffs.length,
  };
}

/**
 * Ingests a document into the private immutable L0 vault, stages L1/L2 extraction candidates,
 * validates Phase BOQ consolidation + resource takeoffs, and stages an isolated DRAFT Operational Snapshot
 * WITHOUT mutating live operative BOQ, Consolidated BOQ, BOQMapping, or Canonical Resource Account tables (H01, H02, H04, H05, H06, M01, R1-H01, R1-M02).
 */
export async function ingestAndStageProjectUboqPackage(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    projectId: string;
    uploadedByUserId: string;
    fileName: string;
    buffer: Buffer;
    documentRole?: string;
    sectorType?: UboqSectorType;
    clientName?: string;
    contractRef?: string;
    taxProfileCode?: string;
    explicitPhaseLines?: PhaseBoqInputLine[];
    resourceTakeoffs?: ResourceTakeoffSpecInput[];
    allowDuplicateNewRevision?: boolean;
  }
) {
  const prisma = prismaInput as PrismaClient;
  const docRole = params.documentRole ?? 'CONTRACT_BOQ';

  // H04: Enforce stage-specific RBAC & PBAC on document intake
  await assertUboqStageAuthorization(prisma, {
    userId: params.uploadedByUserId,
    projectId: params.projectId,
    capability: 'UBOQ_INTAKE_STAGE',
  });

  // R1-H01: Reject unverified caller-supplied explicitPhaseLines — every operational BOQ line MUST derive from L0/L1/L2 provenance!
  if (params.explicitPhaseLines !== undefined && params.explicitPhaseLines !== null) {
    throw new Error(
      'UBOQ_UNVERIFIED_EXPLICIT_PHASE_LINES_FORBIDDEN: Manually supplied explicitPhaseLines cannot bypass L0/L1/L2 extraction and human-review provenance'
    );
  }

  // H01 / H10: Genuine document security inspection + native PDF / OCR / XLSX / XLS / CSV extraction
  const extracted = await extractUniversalDocumentPackage(params.fileName, params.buffer);
  if (extracted.blockingErrors.length > 0) {
    throw new Error(`UBOQ_INTAKE_SECURITY_BLOCKED: ${extracted.blockingErrors.join('; ')}`);
  }

  const vaultProvider = resolveUboqVaultStorageProvider();

  // M01 & R1-H01: Idempotent duplicate source upload check BEFORE writing duplicate sections/candidates/snapshots
  const findExistingDocument = () => prisma.uboqSourceDocument.findUnique({
    where: {
      projectId_sha256Hash_documentRole: {
        projectId: params.projectId,
        sha256Hash: extracted.security.sha256Hash,
        documentRole: docRole,
      },
    },
    include: {
      candidates: {
        include: { section: { select: { sheetOrPageRef: true } } },
        orderBy: [{ sourceRowNumber: 'asc' }, { createdAt: 'asc' }],
      },
      snapshots: {
        where: { status: { in: ['APPROVED', 'DRAFT', 'UNDER_REVIEW'] } },
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
  });

  const replayDocument = async (existingDoc: NonNullable<Awaited<ReturnType<typeof findExistingDocument>>>) => {
    // Verify immutable vault integrity on replay
    await vaultProvider.getAndVerify({
      storageUri: existingDoc.storageUri,
      expectedProjectId: params.projectId,
      expectedSha256Hash: existingDoc.sha256Hash,
    });
    const unresolvedHumanReviewCount = existingDoc.candidates.filter(
      (c) =>
        c.requiresHumanReview &&
        !['HUMAN_VERIFIED', 'HUMAN_EXCLUDED', 'AUTO_VERIFIED_DETERMINISTIC'].includes(c.reviewDecision)
    ).length;
    return {
      duplicateIdempotentReplay: true,
      sourceDocument: existingDoc,
      extractedCandidateCount: existingDoc.candidates.length,
      requiresHumanReviewCount: unresolvedHumanReviewCount,
      snapshot: existingDoc.snapshots[0] ?? null,
      consolidatedGroups: [],
      createdAccounts: [],
      createdPrrs: [],
    };
  };

  const existingDoc = await findExistingDocument();
  if (existingDoc && !params.allowDuplicateNewRevision) {
    return replayDocument(existingDoc);
  }

  // H02: Persist binary to private immutable vault with immediate SHA-256 read-back verification
  const vaultReceipt = existingDoc
    ? {
        storageUri: existingDoc.storageUri,
        backend: vaultProvider.backendName,
        sha256Hash: existingDoc.sha256Hash,
        verifiedReadBackSha256: existingDoc.sha256Hash,
        byteSize: existingDoc.byteSize,
        newlyCreated: false,
      }
    : await vaultProvider.putImmutableAndVerify({
        projectId: params.projectId,
        sha256Hash: extracted.security.sha256Hash,
        fileName: params.fileName,
        mimeType: extracted.security.canonicalMimeType,
        buffer: params.buffer,
      });

  let sourceDocIdForOrphanGuard: string | null = existingDoc?.id ?? null;

  try {
    const stagedIntakeOptions: StagedIntakeOptionsMetadata = {
      sectorType: params.sectorType,
      clientName: params.clientName,
      contractRef: params.contractRef,
      taxProfileCode: params.taxProfileCode,
      resourceTakeoffs: params.resourceTakeoffs,
    };

    // Persist L0 Source Document + L1 Sections + L2 Candidates (only once per unique source document)
    const persistedDocBundle = existingDoc
      ? {
          sourceDoc: existingDoc,
          persistedCandidates: existingDoc.candidates.map((c) => {
            const pJson =
              c.parsedJson && typeof c.parsedJson === 'object'
                ? (c.parsedJson as Record<string, unknown>)
                : {};
            const effFields = (pJson.effectiveCanonicalFields ?? pJson.mappedFields ?? {}) as Record<
              string,
              unknown
            >;
            return {
              id: c.id,
              sheetOrPageRef: c.section?.sheetOrPageRef ?? null,
              sourceCellRef: c.sourceCellRef,
              requiresHumanReview: c.requiresHumanReview,
              reviewDecision: c.reviewDecision,
              fields: effFields,
            };
          }),
        }
      : await prisma.$transaction(async (tx) => {
          const rlsStore = uboqRlsStorage.getStore();
          if (rlsStore && !rlsStore.inInteractiveTx) {
            await applyProjectRlsSessionVars(tx, rlsStore);
          }

          const compactVerification = extracted.awardedBoqVerification
            ? {
                calculationCheck: extracted.awardedBoqVerification.calculationCheck,
                formulaCheck: extracted.awardedBoqVerification.formulaCheck,
                workbookStatedGrandTotal: extracted.awardedBoqVerification.workbookStatedGrandTotal,
                recalculatedTotal: extracted.awardedBoqVerification.recalculatedTotal,
                roundingDecimals: extracted.awardedBoqVerification.roundingDecimals,
                counts: extracted.awardedBoqVerification.counts,
                priceComponents: extracted.awardedBoqVerification.priceComponents,
                discrepancies: extracted.awardedBoqVerification.discrepancies.slice(0, 100),
              }
            : null;

          const createdDoc = await tx.uboqSourceDocument.create({
            data: {
              projectId: params.projectId,
              fileName: params.fileName,
              mimeType: extracted.security.canonicalMimeType,
              byteSize: params.buffer.length,
              sha256Hash: extracted.security.sha256Hash,
              magicSignature: extracted.security.magicSignature,
              storageUri: vaultReceipt.storageUri,
              documentRole: docRole,
              uploadedById: params.uploadedByUserId,
              isLockedImmutable: true,
              metadataJson: {
                detectedFormat: extracted.security.detectedFormat,
                vaultBackend: vaultReceipt.backend,
                stagedIntakeOptions,
                ...(compactVerification ? { awardedBoqVerification: compactVerification } : {}),
              } as unknown as Prisma.InputJsonValue,
            },
          });

          const sectionByRef = new Map<string, string>();
          for (const sec of extracted.sections) {
            const s = await tx.uboqDocumentSection.create({
              data: {
                sourceDocumentId: createdDoc.id,
                sectionType: sec.sectionType,
                sheetOrPageRef: sec.sheetOrPageRef,
                sectionTitle: sec.sectionTitle,
                displayOrder: sec.displayOrder,
                layoutMetaJson: sec.headerMap,
              },
            });
            sectionByRef.set(sec.sheetOrPageRef, s.id);
          }

          const createdCandidates: Array<{
            id: string;
            sheetOrPageRef: string | null;
            sourceCellRef: string | null;
            requiresHumanReview: boolean;
            reviewDecision: string;
            fields: Record<string, unknown>;
          }> = [];

          for (const cand of extracted.candidates) {
            const reviewDecision = cand.requiresHumanReview
              ? 'PENDING_HUMAN_REVIEW'
              : 'AUTO_VERIFIED_DETERMINISTIC';
            const dbCand = await tx.uboqExtractionCandidate.create({
              data: {
                sourceDocumentId: createdDoc.id,
                sectionId: sectionByRef.get(cand.sheetOrPageRef) ?? null,
                sourceRowNumber: cand.sourceRowNumber,
                sourceCellRef: cand.sourceCellRef,
                mappedCanonicalId: Object.keys(cand.mappedFields).join(','),
                rawValueText: JSON.stringify(cand.mappedFields),
                rawFormulaText: Object.keys(cand.rawFormulas).length > 0 ? JSON.stringify(cand.rawFormulas) : null,
                parsedJson: {
                  mappedFields: cand.mappedFields,
                  cellCoordinates: cand.cellCoordinates ?? {},
                  ...(cand.rowClassification ? { rowClassification: cand.rowClassification } : {}),
                } as unknown as Prisma.InputJsonValue,
                confidenceScore: cand.confidenceScore,
                extractionMethod: cand.extractionMethod,
                requiresHumanReview: cand.requiresHumanReview,
                reviewDecision,
              },
            });
            createdCandidates.push({
              id: dbCand.id,
              sheetOrPageRef: cand.sheetOrPageRef,
              sourceCellRef: cand.sourceCellRef,
              requiresHumanReview: cand.requiresHumanReview,
              reviewDecision,
              fields: cand.mappedFields,
            });
          }

          return { sourceDoc: createdDoc, persistedCandidates: createdCandidates };
        });

    const { sourceDoc, persistedCandidates } = persistedDocBundle;
    sourceDocIdForOrphanGuard = sourceDoc.id;

    const unresolvedHumanReviewCount = persistedCandidates.filter(
      (c) =>
        c.requiresHumanReview &&
        !['HUMAN_VERIFIED', 'HUMAN_EXCLUDED', 'AUTO_VERIFIED_DETERMINISTIC'].includes(c.reviewDecision)
    ).length;

    // R1-H01: If ANY candidate requires human review and is unresolved, hold in L2 human-review queue
    // (`snapshot: null`) until reviewed & regenerated via `regenerateDraftSnapshotFromVerifiedDocument`!
    if (unresolvedHumanReviewCount > 0) {
      return {
        duplicateIdempotentReplay: false,
        sourceDocument: sourceDoc,
        extractedCandidateCount: persistedCandidates.length,
        requiresHumanReviewCount: unresolvedHumanReviewCount,
        snapshot: null,
        consolidatedGroups: [],
        createdAccounts: [],
        createdPrrs: [],
      };
    }

    const phaseInputs: PhaseBoqInputLine[] = [];
    for (const c of persistedCandidates) {
      if (c.reviewDecision === 'HUMAN_EXCLUDED') continue;
      const line = buildPhaseInputLineFromCandidateFields({
        lineIndex: phaseInputs.length,
        candidateId: c.id,
        sheetOrPageRef: c.sheetOrPageRef,
        sourceCellRef: c.sourceCellRef,
        fields: c.fields,
      });
      if (line) {
        phaseInputs.push(line);
      }
    }

    if (phaseInputs.length === 0) {
      return {
        duplicateIdempotentReplay: false,
        sourceDocument: sourceDoc,
        extractedCandidateCount: persistedCandidates.length,
        requiresHumanReviewCount: 0,
        snapshot: null,
        consolidatedGroups: [],
        createdAccounts: [],
        createdPrrs: [],
      };
    }

    const staged = await stageVerifiedPhaseLinesIntoDraftSnapshot(prisma, {
      projectId: params.projectId,
      sourceDocumentId: sourceDoc.id,
      sourceSha256Hash: sourceDoc.sha256Hash,
      preparedByUserId: params.uploadedByUserId,
      phaseInputs,
      sectorType: params.sectorType,
      clientName: params.clientName,
      contractRef: params.contractRef,
      taxProfileCode: params.taxProfileCode,
      resourceTakeoffs: params.resourceTakeoffs,
      supersedePriorDraftForDocument: false,
    });

    return {
      duplicateIdempotentReplay: false,
      sourceDocument: sourceDoc,
      extractedCandidateCount: persistedCandidates.length,
      requiresHumanReviewCount: 0,
      snapshot: staged.snapshot,
      stagedConsolidationPreview: staged.groups,
      stagedTakeoffsCount: staged.stagedTakeoffsCount,
      consolidatedGroups: [],
      createdAccounts: [],
      createdPrrs: [],
    };
  } catch (err) {
    if (!sourceDocIdForOrphanGuard && err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      // The unique source constraint arbitrates concurrent initial uploads. The loser
      // must not stage a second financial snapshot or delete the winner's object.
      const winner = await findExistingDocument();
      if (winner) return replayDocument(winner);
    }
    // A concurrent category/request may reference this content-addressed object.
    // Leave possible orphans to reference-aware reconciliation, never inline deletion.
    throw err;
  }
}

/**
 * Resolves a staged L2 extraction candidate requiring human review with validated canonical field
 * remapping + human value corrections while preserving 100% immutable raw OCR/parser provenance (R1-H01).
 */
export async function resolveExtractionCandidateHumanReview(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    projectId: string;
    candidateId: string;
    reviewerUserId: string;
    decision: 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED';
    reviewNotes: string;
    canonicalFieldRemap?: Record<string, string>;
    correctedMappedFields?: Record<string, string | number | null>;
  }
) {
  const prisma = prismaInput as PrismaClient;
  await assertUboqStageAuthorization(prisma, {
    userId: params.reviewerUserId,
    projectId: params.projectId,
    capability: 'UBOQ_HUMAN_REVIEW_RESOLVE',
  });

  if (!params.reviewNotes?.trim()) {
    throw new Error('UBOQ_REVIEW_NOTES_REQUIRED: Human review resolution requires explicit audit notes');
  }
  if (params.decision !== 'HUMAN_VERIFIED' && params.decision !== 'HUMAN_EXCLUDED') {
    throw new Error(`UBOQ_INVALID_REVIEW_DECISION: Unsupported decision "${String(params.decision)}"`);
  }

  const existing = await prisma.uboqExtractionCandidate.findUnique({
    where: { id: params.candidateId },
    include: { sourceDocument: { select: { id: true, projectId: true } } },
  });
  if (!existing || existing.sourceDocument.projectId !== params.projectId) {
    throw new Error('UBOQ_CANDIDATE_NOT_FOUND_FOR_PROJECT');
  }

  if (await prisma.uboqOperationalSnapshot.count({ where: {
    approvedAt: { not: null },
    OR: [{ sourceDocumentId: existing.sourceDocumentId }, { phaseLines: { some: { sourceDocumentId: existing.sourceDocumentId } } }],
  } })) throw new Error('UBOQ_APPROVED_EVIDENCE_IMMUTABLE: use a new source revision');

  const prevJson =
    existing.parsedJson && typeof existing.parsedJson === 'object'
      ? (existing.parsedJson as Record<string, unknown>)
      : {};

  // Immutable original extraction map — NEVER overwritten in rawValueText or parsedJson.mappedFields!
  const originalMappedFields: Record<string, string | number | null> =
    prevJson.mappedFields && typeof prevJson.mappedFields === 'object'
      ? { ...(prevJson.mappedFields as Record<string, string | number | null>) }
      : {};

  const effectiveFields: Record<string, string | number | null> = { ...originalMappedFields };
  const normalizedRemap: Record<string, string> = {};
  const normalizedCorrections: Record<string, string | number | null> = {};

  if (params.canonicalFieldRemap) {
    for (const [rawSrc, rawTarget] of Object.entries(params.canonicalFieldRemap)) {
      const targetCanon = resolveCanonicalFieldId(String(rawTarget || ''));
      if (!targetCanon || !CANONICAL_FIELD_MAP.has(targetCanon)) {
        throw new Error(
          `UBOQ_INVALID_CANONICAL_REMAP_FIELD: Target field "${rawTarget}" is not in the 129-field canonical registry`
        );
      }
      const srcCanon = resolveCanonicalFieldId(String(rawSrc || '')) ?? String(rawSrc || '').trim();
      if (!srcCanon) {
        throw new Error('UBOQ_INVALID_CANONICAL_REMAP_FIELD: Empty source field key');
      }
      normalizedRemap[srcCanon] = targetCanon;
      if (Object.prototype.hasOwnProperty.call(originalMappedFields, srcCanon) && srcCanon !== targetCanon) {
        const movedVal = originalMappedFields[srcCanon];
        if (NUMERIC_CANONICAL_FIELD_IDS.has(targetCanon) && movedVal !== null && movedVal !== '') {
          const num = toFiniteNumber(movedVal);
          if (num === null) {
            throw new Error(
              `UBOQ_INVALID_VERIFIED_CANDIDATE_FIELDS: Remapped field "${targetCanon}" requires a valid finite number`
            );
          }
          effectiveFields[targetCanon] = num;
        } else {
          effectiveFields[targetCanon] = movedVal;
        }
        delete effectiveFields[srcCanon];
      }
    }
  }

  if (params.correctedMappedFields) {
    for (const [rawKey, rawVal] of Object.entries(params.correctedMappedFields)) {
      const canonKey = resolveCanonicalFieldId(String(rawKey || ''));
      if (!canonKey || !CANONICAL_FIELD_MAP.has(canonKey)) {
        throw new Error(
          `UBOQ_INVALID_CANONICAL_REMAP_FIELD: Corrected field "${rawKey}" is not in the 129-field canonical registry`
        );
      }
      if (rawVal === null || rawVal === undefined || rawVal === '') {
        normalizedCorrections[canonKey] = null;
        effectiveFields[canonKey] = null;
      } else if (NUMERIC_CANONICAL_FIELD_IDS.has(canonKey)) {
        const num = toFiniteNumber(rawVal);
        if (num === null) {
          throw new Error(
            `UBOQ_INVALID_VERIFIED_CANDIDATE_FIELDS: Numeric canonical field "${canonKey}" received invalid value "${String(rawVal)}"`
          );
        }
        normalizedCorrections[canonKey] = num;
        effectiveFields[canonKey] = num;
      } else {
        const strVal = String(rawVal).trim();
        normalizedCorrections[canonKey] = strVal;
        effectiveFields[canonKey] = strVal;
      }
    }
  }

  if (params.decision === 'HUMAN_VERIFIED') {
    const desc = String(effectiveFields.work_description ?? '').trim();
    const unit = String(effectiveFields.unit ?? '').trim();
    const qty = toFiniteNumber(effectiveFields.approved_qty);
    const rate = toFiniteNumber(effectiveFields.contract_unit_rate);

    const resDesc = String(effectiveFields.resource_description ?? '').trim();
    const resUnit = String(effectiveFields.resource_unit ?? '').trim();

    const isValidBoqLine = Boolean(desc && unit && qty !== null && qty > 0 && rate !== null && rate >= 0);
    const isValidResourceLine = Boolean(resDesc && resUnit);

    if (!isValidBoqLine && !isValidResourceLine) {
      throw new Error(
        'UBOQ_INVALID_VERIFIED_CANDIDATE_FIELDS: HUMAN_VERIFIED candidate requires non-empty work_description, valid unit, approved_qty > 0, and contract_unit_rate >= 0'
      );
    }
    if (isValidBoqLine) {
      normalizeUom(unit, effectiveFields.specification ? String(effectiveFields.specification) : null);
    }
    if (isValidResourceLine) {
      normalizeUom(resUnit, effectiveFields.resource_spec ? String(effectiveFields.resource_spec) : null);
    }
  }

  const updatedCanonicalList = Object.keys(effectiveFields)
    .filter((k) => effectiveFields[k] !== null && effectiveFields[k] !== undefined && effectiveFields[k] !== '')
    .join(',');

  return prisma.uboqExtractionCandidate.update({
    where: { id: existing.id },
    data: {
      mappedCanonicalId: updatedCanonicalList || existing.mappedCanonicalId,
      reviewDecision: params.decision,
      reviewedById: params.reviewerUserId,
      reviewedAt: new Date(),
      reviewNotes: params.reviewNotes.trim(),
      parsedJson: {
        ...prevJson,
        mappedFields: originalMappedFields,
        canonicalFieldRemap: normalizedRemap,
        humanCorrectedFields: normalizedCorrections,
        effectiveCanonicalFields: effectiveFields,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Regenerates a staged DRAFT Operational Snapshot from an L0 source document's verified L2 extraction
 * candidates after human review & canonical remapping, preserving immutable source provenance (R1-H01).
 */
export async function regenerateDraftSnapshotFromVerifiedDocument(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    projectId: string;
    sourceDocumentId: string;
    preparedByUserId: string;
    sectorType?: UboqSectorType;
    clientName?: string;
    contractRef?: string;
    taxProfileCode?: string;
    resourceTakeoffs?: ResourceTakeoffSpecInput[];
  }
) {
  const prisma = prismaInput as PrismaClient;
  await assertUboqStageAuthorization(prisma, {
    userId: params.preparedByUserId,
    projectId: params.projectId,
    capability: 'UBOQ_INTAKE_STAGE',
  });

  const sourceDoc = await prisma.uboqSourceDocument.findUnique({
    where: { id: params.sourceDocumentId },
    include: {
      candidates: {
        include: { section: { select: { sheetOrPageRef: true } } },
        orderBy: [{ sourceRowNumber: 'asc' }, { createdAt: 'asc' }],
      },
      snapshots: {
        where: { status: 'APPROVED' },
        take: 1,
      },
    },
  });

  if (!sourceDoc || sourceDoc.projectId !== params.projectId) {
    throw new Error('UBOQ_SOURCE_DOCUMENT_NOT_FOUND_FOR_PROJECT');
  }
  if (sourceDoc.snapshots.length > 0) {
    throw new Error(
      `UBOQ_SNAPSHOT_INVALID_STATE: Source document ${sourceDoc.id} is already promoted to APPROVED snapshot ${sourceDoc.snapshots[0].id}`
    );
  }

  // Verify immutable L0 vault binary before regenerating draft snapshot
  const vaultProvider = resolveUboqVaultStorageProvider();
  await vaultProvider.getAndVerify({
    storageUri: sourceDoc.storageUri,
    expectedProjectId: params.projectId,
    expectedSha256Hash: sourceDoc.sha256Hash,
  });

  const pendingReviewCount = sourceDoc.candidates.filter(
    (c) =>
      c.requiresHumanReview &&
      !['HUMAN_VERIFIED', 'HUMAN_EXCLUDED', 'AUTO_VERIFIED_DETERMINISTIC'].includes(c.reviewDecision)
  ).length;
  if (pendingReviewCount > 0) {
    throw new Error(
      `UBOQ_DRAFT_REGEN_BLOCKED_PENDING_REVIEW: Source document ${sourceDoc.id} still has ${pendingReviewCount} unresolved extraction candidate(s) requiring human review`
    );
  }

  const phaseInputs: PhaseBoqInputLine[] = [];
  for (const cand of sourceDoc.candidates) {
    if (
      cand.reviewDecision !== 'AUTO_VERIFIED_DETERMINISTIC' &&
      cand.reviewDecision !== 'HUMAN_VERIFIED'
    ) {
      continue;
    }
    const pJson =
      cand.parsedJson && typeof cand.parsedJson === 'object'
        ? (cand.parsedJson as Record<string, unknown>)
        : {};
    const effectiveFields = (pJson.effectiveCanonicalFields ?? pJson.mappedFields ?? {}) as Record<
      string,
      unknown
    >;

    const line = buildPhaseInputLineFromCandidateFields({
      lineIndex: phaseInputs.length,
      candidateId: cand.id,
      sheetOrPageRef: cand.section?.sheetOrPageRef ?? null,
      sourceCellRef: cand.sourceCellRef,
      fields: effectiveFields,
    });
    if (line) {
      phaseInputs.push(line);
    }
  }

  if (phaseInputs.length === 0) {
    throw new Error(
      `UBOQ_DRAFT_REGEN_NO_VERIFIED_LINES: Source document ${sourceDoc.id} has 0 verified BOQ pay-item lines to stage`
    );
  }

  const docMeta =
    sourceDoc.metadataJson && typeof sourceDoc.metadataJson === 'object'
      ? (sourceDoc.metadataJson as Record<string, unknown>)
      : {};
  const savedOpts =
    docMeta.stagedIntakeOptions && typeof docMeta.stagedIntakeOptions === 'object'
      ? (docMeta.stagedIntakeOptions as StagedIntakeOptionsMetadata)
      : {};

  const staged = await stageVerifiedPhaseLinesIntoDraftSnapshot(prisma, {
    projectId: params.projectId,
    sourceDocumentId: sourceDoc.id,
    sourceSha256Hash: sourceDoc.sha256Hash,
    preparedByUserId: params.preparedByUserId,
    phaseInputs,
    sectorType: params.sectorType ?? savedOpts.sectorType,
    clientName: params.clientName ?? savedOpts.clientName,
    contractRef: params.contractRef ?? savedOpts.contractRef,
    taxProfileCode: params.taxProfileCode ?? savedOpts.taxProfileCode,
    resourceTakeoffs: params.resourceTakeoffs ?? savedOpts.resourceTakeoffs,
    supersedePriorDraftForDocument: true,
  });

  return {
    sourceDocument: sourceDoc,
    verifiedLineCount: phaseInputs.length,
    snapshot: staged.snapshot,
    stagedConsolidationPreview: staged.groups,
    stagedTakeoffsCount: staged.stagedTakeoffsCount,
  };
}

/**
 * Resolves an OPEN UBOQ validation exception with mandatory audit note & stage RBAC (H04 / H09).
 */
export async function resolveUboqValidationException(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    projectId: string;
    exceptionId: string;
    resolverUserId: string;
    resolutionNote: string;
  }
) {
  const prisma = prismaInput as PrismaClient;
  await assertUboqStageAuthorization(prisma, {
    userId: params.resolverUserId,
    projectId: params.projectId,
    capability: 'UBOQ_HUMAN_REVIEW_RESOLVE',
  });

  if (!params.resolutionNote?.trim()) {
    throw new Error('UBOQ_RESOLUTION_NOTE_REQUIRED: Validation exception resolution requires audit notes');
  }

  const existing = await prisma.uboqValidationException.findUnique({
    where: { id: params.exceptionId },
  });
  if (!existing || existing.projectId !== params.projectId) {
    throw new Error('UBOQ_EXCEPTION_NOT_FOUND_FOR_PROJECT');
  }

  return prisma.uboqValidationException.update({
    where: { id: existing.id },
    data: {
      status: 'RESOLVED',
      resolvedById: params.resolverUserId,
      resolvedAt: new Date(),
      resolutionNote: params.resolutionNote.trim(),
    },
  });
}

/**
 * Approves a DRAFT Operational Snapshot, materializes operative AwardedBOQItem + ConsolidatedBOQItem +
 * BOQMapping + UboqCanonicalResourceAccount + APPROVED PRRs + Ledger Entries inside ONE SINGLE atomic
 * PostgreSQL transaction, enforcing Maker-Checker SoD, stage RBAC, and preflight human-review / exception gates (H04, H05, H07, H09).
 */
export async function approveOperationalSnapshotAndPrrs(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    snapshotId: string;
    approverUserId: string;
    __testInjectFailureAfterConsolidation?: boolean;
  }
) {
  const prisma = prismaInput as PrismaClient;
  const snapPre = await prisma.uboqOperationalSnapshot.findUnique({
    where: { id: params.snapshotId },
    select: {
      id: true,
      projectId: true,
      preparedById: true,
      status: true,
      sourceDocumentId: true,
    },
  });
  if (!snapPre) {
    throw new Error('UBOQ_SNAPSHOT_NOT_FOUND');
  }

  // H04: Enforce stage-specific RBAC & PBAC on snapshot approval
  await assertUboqStageAuthorization(prisma, {
    userId: params.approverUserId,
    projectId: snapPre.projectId,
    capability: 'UBOQ_SNAPSHOT_APPROVE',
  });

  // VAL-20: Maker-Checker Segregation of Duties
  if (snapPre.preparedById === params.approverUserId) {
    throw new Error('UBOQ_SOD_VIOLATION: Operational Snapshot preparer cannot self-approve snapshot (VAL-20)');
  }

  // G02-R3: Verify the immutable source bytes again at the approval boundary.
  if (!snapPre.sourceDocumentId) throw new Error('UBOQ_SOURCE_REQUIRED');
  const approvalSource = await prisma.uboqSourceDocument.findUnique({ where: { id: snapPre.sourceDocumentId } });
  if (!approvalSource || approvalSource.projectId !== snapPre.projectId) throw new Error('UBOQ_SOURCE_DOCUMENT_NOT_FOUND_FOR_PROJECT');
  await resolveUboqVaultStorageProvider().getAndVerify({
    storageUri: approvalSource.storageUri,
    expectedProjectId: snapPre.projectId,
    expectedSha256Hash: approvalSource.sha256Hash,
  });

  // H09: Single all-or-nothing PostgreSQL transaction for snapshot + BOQ promotion + PRR approval
  return prisma.$transaction(
    async (tx) => {
      const rlsStore = uboqRlsStorage.getStore();
      if (rlsStore && !rlsStore.inInteractiveTx) {
        await applyProjectRlsSessionVars(tx, rlsStore);
      } else if (!rlsStore) {
        const approverUser = await tx.user.findUnique({
          where: { id: params.approverUserId },
          select: { sessionVersion: true },
        });
        await applyProjectRlsSessionVars(tx, {
          projectId: snapPre.projectId,
          userId: params.approverUserId,
          sessionVersion: approverUser?.sessionVersion ?? 0,
        });
      }

      await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '5000ms'`);
      const txIdRows = await tx.$queryRaw<Array<{ tx_id: string }>>`SELECT pg_current_xact_id()::text AS tx_id`;
      const txId = txIdRows[0]?.tx_id ?? String(Date.now());

      const lockedSnapRows = await tx.$queryRaw<Array<Record<string, unknown>>>`
        SELECT id, "projectId", "sourceDocumentId", status, "preparedById", "supersedesSnapshotId"
        FROM "UboqOperationalSnapshot"
        WHERE id = ${params.snapshotId}
        FOR UPDATE
      `;
      if (lockedSnapRows.length === 0) {
        throw new Error('UBOQ_SNAPSHOT_NOT_FOUND');
      }

      const snap = await tx.uboqOperationalSnapshot.findUnique({
        where: { id: params.snapshotId },
        include: {
          phaseLines: { orderBy: { createdAt: 'asc' } },
          requirements: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!snap) throw new Error('UBOQ_SNAPSHOT_NOT_FOUND');

      if (snap.status === 'APPROVED') {
        const existingGroups = await tx.uboqConsolidationGroup.findMany({ where: { projectId: snap.projectId } });
        const existingAccounts = await tx.uboqCanonicalResourceAccount.findMany({ where: { projectId: snap.projectId } });
        const existingPrrs = await tx.uboqProcurementResourceRequirement.findMany({ where: { snapshotId: snap.id } });
        return {
          snapshot: snap,
          consolidatedGroups: existingGroups,
          createdAccounts: existingAccounts,
          approvedPrrResults: existingPrrs.map((prr) => ({
            prr,
            account: existingAccounts.find((a) => a.id === prr.canonicalResourceId) ?? null,
          })),
        };
      }
      if (snap.status !== 'DRAFT' && snap.status !== 'UNDER_REVIEW') {
        throw new Error(`UBOQ_SNAPSHOT_INVALID_STATE: Cannot approve snapshot in status ${snap.status}`);
      }
      if (snap.preparedById === params.approverUserId) {
        throw new Error('UBOQ_SOD_VIOLATION: Operational Snapshot preparer cannot self-approve snapshot (VAL-20)');
      }

      // H09 Preflight Gate 1: Reject if any linked source document has unresolved human-review extraction candidates
      const linkedDocIds = [
        ...new Set(
          [snap.sourceDocumentId, ...snap.phaseLines.map((p) => p.sourceDocumentId)].filter(
            (v): v is string => Boolean(v)
          )
        ),
      ];
      if (linkedDocIds.length > 0) {
        const pendingReviewCount = await tx.uboqExtractionCandidate.count({
          where: {
            sourceDocumentId: { in: linkedDocIds },
            requiresHumanReview: true,
            reviewDecision: { notIn: ['HUMAN_VERIFIED', 'HUMAN_EXCLUDED', 'AUTO_VERIFIED_DETERMINISTIC'] },
          },
        });
        if (pendingReviewCount > 0) {
          throw new Error(
            `UBOQ_APPROVAL_BLOCKED_PENDING_HUMAN_REVIEW: Snapshot ${snap.id} has ${pendingReviewCount} unresolved extraction candidate(s) requiring human review`
          );
        }
      }

      // H09 Preflight Gate 2: Reject if project has any OPEN BLOCKING validation exceptions
      const openBlockingCount = await tx.uboqValidationException.count({
        where: {
          projectId: snap.projectId,
          status: 'OPEN',
          severity: 'BLOCKING',
        },
      });
      if (openBlockingCount > 0) {
        throw new Error(
          `UBOQ_APPROVAL_BLOCKED_OPEN_EXCEPTIONS: Project ${snap.projectId} has ${openBlockingCount} OPEN BLOCKING validation exception(s)`
        );
      }

      const now = new Date();

      // Supersede prior approved snapshot(s) on this project
      await tx.uboqOperationalSnapshot.updateMany({
        where: {
          projectId: snap.projectId,
          status: 'APPROVED',
          id: { not: snap.id },
        },
        data: { status: 'SUPERSEDED' },
      });

      // Promote ContractAuthority & TaxPricingProfile FIRST so approved snapshot links to APPROVED authority
      const draftAuthority = await tx.uboqContractAuthority.findFirst({
        where: { projectId: snap.projectId, status: 'DRAFT' },
        orderBy: { createdAt: 'desc' },
      });
      let resolvedContractAuthorityId: string | null = snap.contractAuthorityId ?? null;
      if (draftAuthority) {
        await tx.uboqContractAuthority.update({
          where: { id: draftAuthority.id },
          data: {
            status: 'APPROVED',
            approvedById: params.approverUserId,
            approvedAt: now,
          },
        });
        resolvedContractAuthorityId = draftAuthority.id;
        if (draftAuthority.taxProfileId) {
          await tx.uboqTaxPricingProfile.update({
            where: { id: draftAuthority.taxProfileId },
            data: {
              isImmutableApproved: true,
              approvedById: params.approverUserId,
              approvedAt: now,
            },
          });
        }
      } else if (!resolvedContractAuthorityId) {
        const latestApprovedAuth = await tx.uboqContractAuthority.findFirst({
          where: { projectId: snap.projectId, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });
        resolvedContractAuthorityId = latestApprovedAuth?.id ?? null;
      }

      // Mark current snapshot APPROVED inside tx (required before calling uboq_promote_approved_consolidated_group)
      const approvedSnap = await tx.uboqOperationalSnapshot.update({
        where: { id: snap.id },
        data: {
          status: 'APPROVED',
          ...(resolvedContractAuthorityId ? { contractAuthorityId: resolvedContractAuthorityId } : {}),
          reviewedById: params.approverUserId,
          reviewedAt: now,
          approvedById: params.approverUserId,
          approvedAt: now,
        },
      });

      await tx.project.update({
        where: { id: snap.projectId },
        data: { uboqGovernanceEnabled: true },
      });

      // Materialize / update operative AwardedBOQItem rows for each staged UboqAwardedPhaseLine
      const awardedIdByPhaseLineId = new Map<string, string>();
      const phaseLineByLineKey = new Map<string, { phaseLineId: string; awardedBoqItemId: string }>();

      for (let idx = 0; idx < snap.phaseLines.length; idx++) {
        const pLine = snap.phaseLines[idx];
        const compositeCode = `${pLine.phaseCode}:${pLine.itemCode}`;
        let awardedId = pLine.awardedBoqItemId;

        if (!awardedId) {
          const existingAwarded = await tx.awardedBOQItem.findFirst({
            where: { projectId: snap.projectId, itemCode: compositeCode },
          });
          if (existingAwarded) {
            const updatedAwarded = await tx.awardedBOQItem.update({
              where: { id: existingAwarded.id },
              data: {
                revisedContractQuantity: Number(pLine.approvedQty),
                revisedContractUnitPrice: Number(pLine.contractUnitRate),
                revisedContractAmount: Number(pLine.contractLineAmount),
              },
            });
            awardedId = updatedAwarded.id;
          } else {
            const createdAwarded = await tx.awardedBOQItem.create({
              data: {
                projectId: snap.projectId,
                itemCode: compositeCode,
                category: pLine.phaseCode,
                description: pLine.workDescription,
                unit: pLine.unitNormalized,
                quantity: Number(pLine.approvedQty),
                combinedUnitCost: Number(pLine.contractUnitRate),
                totalCost: Number(pLine.contractLineAmount),
                remainingQuantity: Number(pLine.approvedQty),
                balanceAmount: Number(pLine.contractLineAmount),
                revisedContractQuantity: Number(pLine.approvedQty),
                revisedContractUnitPrice: Number(pLine.contractUnitRate),
                revisedContractAmount: Number(pLine.contractLineAmount),
              },
            });
            awardedId = createdAwarded.id;
          }

          await tx.uboqAwardedPhaseLine.update({
            where: { id: pLine.id },
            data: { awardedBoqItemId: awardedId },
          });
        }

        awardedIdByPhaseLineId.set(pLine.id, awardedId);
        phaseLineByLineKey.set(`LINE-${idx + 1}`, { phaseLineId: pLine.id, awardedBoqItemId: awardedId });
        phaseLineByLineKey.set(`${pLine.phaseCode}:${pLine.itemCode}`, {
          phaseLineId: pLine.id,
          awardedBoqItemId: awardedId,
        });
      }

      // Reconstruct or read staged consolidation groups
      const stagedGroups: ConsolidatedGroupPreview[] = Array.isArray(snap.stagedConsolidationJson)
        ? (snap.stagedConsolidationJson as unknown as ConsolidatedGroupPreview[])
        : buildSafePhaseConsolidation(
            snap.phaseLines.map((p, idx) => ({
              lineKey: `LINE-${idx + 1}`,
              itemCode: p.itemCode,
              phaseCode: p.phaseCode,
              sectionCode: p.sectionCode,
              workDescription: p.workDescription,
              specification: p.specification,
              unitRaw: p.unitRaw,
              originalQty: Number(p.originalQty),
              approvedQty: Number(p.approvedQty),
              contractUnitRate: Number(p.contractUnitRate),
              contractLineAmount: Number(p.contractLineAmount),
              extractionCandidateId: p.extractionCandidateId,
            }))
          ).groups;

      const promotedGroups: Array<{
        uboqGroup: Awaited<ReturnType<typeof tx.uboqConsolidationGroup.create>>;
        consolidatedBoqItemId: string;
        preview: ConsolidatedGroupPreview;
      }> = [];
      const consolidatedBoqIdByGroupKey = new Map<string, string>();

      for (const grp of stagedGroups) {
        const existingGroup = await tx.uboqConsolidationGroup.findUnique({
          where: {
            projectId_specSignatureHash_unitNormalized: {
              projectId: snap.projectId,
              specSignatureHash: grp.specSignatureHash,
              unitNormalized: grp.unitNormalized,
            },
          },
        });

        let consolidatedBoqItemId: string;
        let uboqGroup;

        if (existingGroup) {
          consolidatedBoqItemId = existingGroup.consolidatedBoqItemId;
          uboqGroup = await tx.uboqConsolidationGroup.update({
            where: { id: existingGroup.id },
            data: {
              totalApprovedQty: grp.totalApprovedQty,
              weightedUnitRate: grp.weightedUnitRate,
              totalContractAmount: grp.totalContractAmount,
            },
          });
          // H07: Promote via verified DB function (validates RLS + signed proof, APPROVED snapshot, SoD, approver role, 0 pending reviews/exceptions)
          await tx.$executeRaw`SELECT uboq_promote_approved_consolidated_group(
            ${approvedSnap.id}::text,
            ${uboqGroup.id}::text
          )`;
        } else {
          const consBoq = await tx.consolidatedBOQItem.create({
            data: {
              projectId: snap.projectId,
              itemCode: grp.groupKey,
              category: 'CONSOLIDATED_UBOQ',
              description: grp.canonicalDescription,
              unit: grp.unitNormalized,
              quantity: grp.totalApprovedQty,
              revisedQuantity: grp.totalApprovedQty,
              unitCost: grp.weightedUnitRate,
              totalCost: grp.totalContractAmount,
              revisedTotalCost: grp.totalContractAmount,
              remainingBenchmarkQuantity: grp.totalApprovedQty,
              isUboqResourceGoverned: true,
            },
          });
          consolidatedBoqItemId = consBoq.id;

          uboqGroup = await tx.uboqConsolidationGroup.create({
            data: {
              projectId: snap.projectId,
              consolidatedBoqItemId,
              groupCode: grp.groupKey,
              canonicalDescription: grp.canonicalDescription,
              specification: grp.specification || null,
              specSignatureHash: grp.specSignatureHash,
              unitNormalized: grp.unitNormalized,
              uomDimensionFamily: grp.uomDimensionFamily as never,
              totalApprovedQty: grp.totalApprovedQty,
              weightedUnitRate: grp.weightedUnitRate,
              totalContractAmount: grp.totalContractAmount,
            },
          });
        }

        for (const link of grp.memberLinks) {
          const ref =
            phaseLineByLineKey.get(link.lineKey) ??
            phaseLineByLineKey.get(`${link.phaseCode}:${link.itemCode}`) ??
            (() => {
              const matchedPhase = snap.phaseLines.find(
                (p) => p.phaseCode === link.phaseCode && p.itemCode === link.itemCode
              );
              return matchedPhase
                ? {
                    phaseLineId: matchedPhase.id,
                    awardedBoqItemId: awardedIdByPhaseLineId.get(matchedPhase.id)!,
                  }
                : null;
            })();

          if (ref) {
            await tx.uboqConsolidationLink.upsert({
              where: {
                consolidationGroupId_phaseLineId: {
                  consolidationGroupId: uboqGroup.id,
                  phaseLineId: ref.phaseLineId,
                },
              },
              update: {
                allocatedQty: link.allocatedQtyInGroupUom,
                allocationWeightPct: link.allocationWeightPct,
              },
              create: {
                consolidationGroupId: uboqGroup.id,
                phaseLineId: ref.phaseLineId,
                allocatedQty: link.allocatedQtyInGroupUom,
                allocationWeightPct: link.allocationWeightPct,
              },
            });

            const existingMap = await tx.bOQMapping.findFirst({
              where: {
                awardedBoqItemId: ref.awardedBoqItemId,
                consolidatedBoqItemId,
              },
            });
            if (existingMap) {
              await tx.bOQMapping.update({
                where: { id: existingMap.id },
                data: {
                  allocationPercentage: link.allocationWeightPct,
                  allocationQuantity: link.allocatedQtyInGroupUom,
                  status: 'APPROVED',
                },
              });
            } else {
              await tx.bOQMapping.create({
                data: {
                  mappingType: 'UBOQ_CONSOLIDATION',
                  allocationPercentage: link.allocationWeightPct,
                  allocationQuantity: link.allocatedQtyInGroupUom,
                  awardedBoqItemId: ref.awardedBoqItemId,
                  consolidatedBoqItemId,
                  status: 'APPROVED',
                },
              });
            }
          }
        }

        consolidatedBoqIdByGroupKey.set(grp.groupKey, consolidatedBoqItemId);
        consolidatedBoqIdByGroupKey.set(uboqGroup.groupCode, consolidatedBoqItemId);
        promotedGroups.push({ uboqGroup, consolidatedBoqItemId, preview: grp });
      }

      // H09 testability: Deterministic mid-transaction fault injection hook to prove full rollback
      if (params.__testInjectFailureAfterConsolidation) {
        throw new Error(
          'UBOQ_INJECTED_ATOMIC_APPROVAL_FAILURE: Simulated mid-approval failure after consolidation promotion'
        );
      }

      // Materialize & approve staged resource takeoffs inside the SAME PostgreSQL transaction!
      const stagedTakeoffs: StagedValidatedTakeoff[] = Array.isArray(snap.stagedTakeoffsJson)
        ? (snap.stagedTakeoffsJson as unknown as StagedValidatedTakeoff[])
        : [];

      const approvedPrrResults: Array<{ account: LockedResourceRow; prr: unknown }> = [];
      const createdAccounts: unknown[] = [];

      for (const st of stagedTakeoffs) {
        const consolidatedBoqItemId = consolidatedBoqIdByGroupKey.get(st.targetGroupKey);
        if (!consolidatedBoqItemId) {
          throw new Error(
            `UBOQ_UNMATCHED_RESOURCE_TAKEOFF_GROUP: Staged takeoff "${st.resourceCode}" group "${st.targetGroupKey}" missing on promotion`
          );
        }

        const acctRecord = await tx.uboqCanonicalResourceAccount.upsert({
          where: {
            projectId_consolidatedBoqItemId_specSignatureHash_resourceUomNormalized: {
              projectId: snap.projectId,
              consolidatedBoqItemId,
              specSignatureHash: st.specSignatureHash,
              resourceUomNormalized: st.resourceUomNormalized,
            },
          },
          update: {
            targetResourceUnitCost: st.targetResourceUnitCost,
          },
          create: {
            projectId: snap.projectId,
            consolidatedBoqItemId,
            resourceCode: st.resourceCode,
            resourceDescription: st.resourceDescription,
            resourceSpec: st.resourceSpec,
            specSignatureHash: st.specSignatureHash,
            resourceClass: st.resourceClass,
            fulfillmentChannel: st.fulfillmentChannel,
            resourceUomNormalized: st.resourceUomNormalized,
            uomDimensionFamily: st.uomDimensionFamily as never,
            targetResourceUnitCost: st.targetResourceUnitCost,
          },
        });
        createdAccounts.push(acctRecord);

        const lockedRows = await tx.$queryRaw<Array<Record<string, unknown>>>`
          SELECT *
          FROM "UboqCanonicalResourceAccount"
          WHERE id = ${acctRecord.id}
          FOR UPDATE
        `;
        const lockedAcct = mapLockedAccountRow(lockedRows[0]);

        const latestPrr = await tx.uboqProcurementResourceRequirement.findFirst({
          where: { canonicalResourceId: lockedAcct.id },
          orderBy: { versionNumber: 'desc' },
        });
        const nextPrrVer = (latestPrr?.versionNumber ?? 0) + 1;

        if (lockedAcct.activeApprovedPrId) {
          await tx.uboqProcurementResourceRequirement.update({
            where: { id: lockedAcct.activeApprovedPrId },
            data: { status: 'SUPERSEDED' },
          });
        }

        const approvedPrr = await tx.uboqProcurementResourceRequirement.create({
          data: {
            canonicalResourceId: lockedAcct.id,
            projectId: snap.projectId,
            consolidatedBoqItemId,
            snapshotId: approvedSnap.id,
            versionNumber: nextPrrVer,
            supersedesId: latestPrr?.id ?? null,
            status: 'APPROVED',
            takeoffBasis: st.takeoffBasis,
            resourceCoeff: st.resourceCoeff,
            workQuantityBasis: st.workQuantityBasis,
            summaryVerifiedQty: st.summaryVerifiedQty,
            requiredQty: st.requiredQty,
            benchmarkUnitCost: st.benchmarkUnitCost,
            procurementBudget: st.procurementBudget,
            sourceDocumentId: snap.sourceDocumentId,
            preparedById: snap.preparedById,
            reviewedById: params.approverUserId,
            approvedById: params.approverUserId,
            approvedAt: now,
          },
        });

        const deltaApproved = round4(Number(approvedPrr.requiredQty) - lockedAcct.activeApprovedQty);
        const updatedAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, lockedAcct, {
          prrSnapshotId: approvedPrr.id,
          eventType: lockedAcct.activeApprovedPrId ? 'PRR_SUPERSEDED' : 'PRR_APPROVED',
          sourceModule: 'UBOQ_PRR',
          sourceHeaderId: approvedPrr.id,
          sourceLineId: approvedPrr.id,
          idempotencyKey: `PRR_APPROVE:${approvedPrr.id}:v${approvedPrr.versionNumber}`,
          qtyDeltaApproved: deltaApproved,
          newActiveApprovedPrId: approvedPrr.id,
          unitCostSnapshot: Number(approvedPrr.benchmarkUnitCost),
          actorUserId: params.approverUserId,
          remarks: `Approved PRR v${approvedPrr.versionNumber} (${Number(approvedPrr.requiredQty)} ${lockedAcct.resourceUomNormalized})`,
        });

        approvedPrrResults.push({ account: updatedAcct, prr: approvedPrr });
      }

      // Also approve any explicitly pre-staged UNDER_REVIEW PRR rows linked to snap.id inside the SAME tx
      const pendingPreStagedPrrs = snap.requirements.filter((r) => r.status === 'UNDER_REVIEW');
      if (pendingPreStagedPrrs.length > 0) {
        const sortedIds = [...new Set(pendingPreStagedPrrs.map((r) => r.canonicalResourceId))].sort();
        const lockedRows = await tx.$queryRaw<Array<Record<string, unknown>>>`
          SELECT *
          FROM "UboqCanonicalResourceAccount"
          WHERE id = ANY(${sortedIds}::text[])
          ORDER BY id ASC
          FOR UPDATE
        `;
        const acctMap = new Map<string, LockedResourceRow>();
        for (const r of lockedRows) acctMap.set(String(r.id), mapLockedAccountRow(r));

        for (const prr of pendingPreStagedPrrs) {
          if (prr.preparedById === params.approverUserId) {
            throw new Error('UBOQ_SOD_VIOLATION: PRR preparer cannot self-approve PRR (VAL-20)');
          }
          const lockedAcct = acctMap.get(prr.canonicalResourceId);
          if (!lockedAcct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

          if (lockedAcct.activeApprovedPrId && lockedAcct.activeApprovedPrId !== prr.id) {
            await tx.uboqProcurementResourceRequirement.update({
              where: { id: lockedAcct.activeApprovedPrId },
              data: { status: 'SUPERSEDED' },
            });
          }

          const approvedPrr = await tx.uboqProcurementResourceRequirement.update({
            where: { id: prr.id },
            data: {
              status: 'APPROVED',
              reviewedById: params.approverUserId,
              approvedById: params.approverUserId,
              approvedAt: now,
            },
          });

          const deltaApproved = round4(Number(prr.requiredQty) - lockedAcct.activeApprovedQty);
          const updatedAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, lockedAcct, {
            prrSnapshotId: prr.id,
            eventType: lockedAcct.activeApprovedPrId ? 'PRR_SUPERSEDED' : 'PRR_APPROVED',
            sourceModule: 'UBOQ_PRR',
            sourceHeaderId: prr.id,
            sourceLineId: prr.id,
            idempotencyKey: `PRR_APPROVE:${prr.id}:v${prr.versionNumber}`,
            qtyDeltaApproved: deltaApproved,
            newActiveApprovedPrId: prr.id,
            unitCostSnapshot: Number(prr.benchmarkUnitCost),
            actorUserId: params.approverUserId,
            remarks: `Approved PRR v${prr.versionNumber} (${Number(prr.requiredQty)} ${lockedAcct.resourceUomNormalized})`,
          });
          acctMap.set(lockedAcct.id, updatedAcct);
          approvedPrrResults.push({ account: updatedAcct, prr: approvedPrr });
        }
      }

      return {
        snapshot: approvedSnap,
        consolidatedGroups: promotedGroups,
        createdAccounts,
        approvedPrrResults,
      };
    },
    { maxWait: 5000, timeout: 30000 }
  );
}

/** Fork a review revision while retaining the original approved evidence and vault binary. */
export async function forkApprovedSourceReviewRevision(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: { projectId: string; sourceDocumentId: string; preparedByUserId: string }
) {
  const prisma = prismaInput as PrismaClient;
  await assertUboqStageAuthorization(prisma, { userId: params.preparedByUserId, projectId: params.projectId, capability: 'UBOQ_INTAKE_STAGE' });
  const source = await prisma.uboqSourceDocument.findUnique({ where: { id: params.sourceDocumentId }, include: { sections: true, candidates: true } });
  if (!source || source.projectId !== params.projectId) throw new Error('UBOQ_SOURCE_DOCUMENT_NOT_FOUND_FOR_PROJECT');
  const approved = await prisma.uboqOperationalSnapshot.count({ where: { sourceDocumentId: source.id, approvedAt: { not: null } } });
  if (!approved) throw new Error('UBOQ_REVIEW_REVISION_REQUIRES_APPROVED_SOURCE');
  await resolveUboqVaultStorageProvider().getAndVerify({ storageUri: source.storageUri, expectedProjectId: params.projectId, expectedSha256Hash: source.sha256Hash });
  return prisma.$transaction(async tx => {
    const ctx = uboqRlsStorage.getStore();
    if (ctx && !ctx.inInteractiveTx) await applyProjectRlsSessionVars(tx, ctx);
    const metadata = source.metadataJson && typeof source.metadataJson === 'object' ? source.metadataJson as Record<string, unknown> : {};
    const revision = await tx.uboqSourceDocument.create({ data: {
      projectId: source.projectId, fileName: source.fileName, mimeType: source.mimeType,
      byteSize: source.byteSize, sha256Hash: source.sha256Hash, magicSignature: source.magicSignature,
      storageUri: source.storageUri, uploadedById: params.preparedByUserId, isLockedImmutable: true,
      documentRole: source.documentRole.split(':REVIEW_REVISION:')[0] + ':REVIEW_REVISION:' + crypto.randomUUID(),
      metadataJson: { ...metadata, reviewRevisionOf: source.id } as Prisma.InputJsonValue,
    } });
    const sections = new Map<string, string>();
    for (const section of source.sections) {
      const { id, sourceDocumentId: _doc, ...data } = section;
      const copy = await tx.uboqDocumentSection.create({ data: { ...data, layoutMetaJson: data.layoutMetaJson === null ? undefined : data.layoutMetaJson as Prisma.InputJsonValue, sourceDocumentId: revision.id } });
      sections.set(id, copy.id);
    }
    for (const candidate of source.candidates) {
      const { id: _id, sourceDocumentId: _doc, sectionId, createdAt: _created, parsedJson, ...data } = candidate;
      const parsed = parsedJson && typeof parsedJson === 'object' ? parsedJson as Record<string, unknown> : {};
      const { effectiveCanonicalFields: _effective, humanCorrectedFields: _corrected, canonicalFieldRemap: _remap, ...raw } = parsed;
      await tx.uboqExtractionCandidate.create({ data: {
        ...data, sourceDocumentId: revision.id, sectionId: sectionId ? sections.get(sectionId) : null,
        parsedJson: raw as Prisma.InputJsonValue, requiresHumanReview: true, reviewDecision: 'PENDING_HUMAN_REVIEW',
        reviewedById: null, reviewedAt: null, reviewNotes: null,
      } });
    }
    return revision;
  });
}
