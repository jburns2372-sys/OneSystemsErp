import crypto from 'node:crypto';
import type { PrismaClient, UboqFulfillmentChannel, UboqResourceClass, UboqSectorType } from '@prisma/client';
import { extractUniversalDocumentPackage } from '../intake/parsers';
import { normalizeUom } from '../uom-registry';
import {
  buildSafePhaseConsolidation,
  computeSpecSignatureHash,
  evaluateResourceTakeoffRequirement,
  type PhaseBoqInputLine,
} from '../validation-engine';
import {
  computeAgencyEstimateBreakdown,
  STANDARD_TAX_PROFILES,
  type TaxPricingProfileConfig,
} from '../tax-engine';
import { approvePrrVersionAtomically } from '../resource-ledger';

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

/**
 * Ingests a document into the L0 immutable vault, stages L1/L2 extraction candidates,
 * builds Phase BOQ + Consolidated BOQ (via uboq_sync_consolidated_snapshot), creates an Operational Snapshot,
 * and initializes Canonical Resource Accounts + PRRs without depending on any fixed layout or PGH data.
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
    ocrConfidenceOverride?: number;
    ocrTextLines?: string[];
  }
) {
  const prisma = prismaInput as PrismaClient;
  const extracted = await extractUniversalDocumentPackage(params.fileName, params.buffer, {
    ocrConfidenceOverride: params.ocrConfidenceOverride,
    ocrTextLines: params.ocrTextLines,
  });

  if (extracted.blockingErrors.length > 0) {
    throw new Error(`UBOQ_INTAKE_SECURITY_BLOCKED: ${extracted.blockingErrors.join('; ')}`);
  }

  // Persist L0 Source Document + L1 Sections + L2 Candidates
  const sourceDoc = await prisma.uboqSourceDocument.upsert({
    where: {
      projectId_sha256Hash_documentRole: {
        projectId: params.projectId,
        sha256Hash: extracted.security.sha256Hash,
        documentRole: params.documentRole ?? 'CONTRACT_BOQ',
      },
    },
    update: {},
    create: {
      projectId: params.projectId,
      fileName: params.fileName,
      mimeType: extracted.security.detectedFormat,
      byteSize: params.buffer.length,
      sha256Hash: extracted.security.sha256Hash,
      magicSignature: extracted.security.magicSignature,
      storageUri: `uboq-vault://${params.projectId}/${extracted.security.sha256Hash}/${params.fileName}`,
      documentRole: params.documentRole ?? 'CONTRACT_BOQ',
      uploadedById: params.uploadedByUserId,
      isLockedImmutable: true,
    },
  });

  const createdSections = [];
  for (const sec of extracted.sections) {
    const s = await prisma.uboqDocumentSection.create({
      data: {
        sourceDocumentId: sourceDoc.id,
        sectionType: sec.sectionType,
        sheetOrPageRef: sec.sheetOrPageRef,
        sectionTitle: sec.sectionTitle,
        displayOrder: sec.displayOrder,
        layoutMetaJson: sec.headerMap,
      },
    });
    createdSections.push(s);
  }

  const sectionByRef = new Map(createdSections.map((s) => [s.sheetOrPageRef, s.id]));
  for (const cand of extracted.candidates) {
    await prisma.uboqExtractionCandidate.create({
      data: {
        sourceDocumentId: sourceDoc.id,
        sectionId: sectionByRef.get(cand.sheetOrPageRef) ?? null,
        sourceRowNumber: cand.sourceRowNumber,
        sourceCellRef: cand.sourceCellRef,
        mappedCanonicalId: Object.keys(cand.mappedFields).join(','),
        rawValueText: JSON.stringify(cand.mappedFields),
        rawFormulaText: Object.keys(cand.rawFormulas).length > 0 ? JSON.stringify(cand.rawFormulas) : null,
        parsedJson: cand.mappedFields,
        confidenceScore: cand.confidenceScore,
        extractionMethod: cand.extractionMethod,
        requiresHumanReview: cand.requiresHumanReview,
        reviewDecision: cand.requiresHumanReview ? 'PENDING_HUMAN_REVIEW' : 'AUTO_VERIFIED_DETERMINISTIC',
      },
    });
  }

  // Derive PhaseBoqInputLine[] either from explicitPhaseLines or high-confidence deterministic candidates
  const phaseInputs: PhaseBoqInputLine[] =
    params.explicitPhaseLines ??
    extracted.candidates
      .filter(
        (c) =>
          !c.requiresHumanReview &&
          c.mappedFields.work_description &&
          c.mappedFields.unit &&
          typeof c.mappedFields.approved_qty === 'number' &&
          typeof c.mappedFields.contract_unit_rate === 'number'
      )
      .map((c, idx) => ({
        lineKey: `LINE-${idx + 1}`,
        itemCode: String(c.mappedFields.item_code || `ITEM-${idx + 1}`),
        phaseCode: String(c.mappedFields.phase_code || 'PHASE-1'),
        sectionCode: c.mappedFields.section_code ? String(c.mappedFields.section_code) : null,
        workDescription: String(c.mappedFields.work_description),
        specification: c.mappedFields.specification ? String(c.mappedFields.specification) : null,
        unitRaw: String(c.mappedFields.unit),
        originalQty: Number(c.mappedFields.original_qty ?? c.mappedFields.approved_qty),
        approvedQty: Number(c.mappedFields.approved_qty),
        contractUnitRate: Number(c.mappedFields.contract_unit_rate),
        contractLineAmount:
          typeof c.mappedFields.contract_line_amount === 'number' ? Number(c.mappedFields.contract_line_amount) : undefined,
      }));

  if (phaseInputs.length === 0) {
    // Low-confidence / OCR staged documents stop safely in L2 human review queue without fabricating BOQ lines!
    return {
      sourceDocument: sourceDoc,
      extractedCandidateCount: extracted.candidates.length,
      requiresHumanReviewCount: extracted.candidates.filter((c) => c.requiresHumanReview).length,
      snapshot: null,
      consolidatedGroups: [],
      createdAccounts: [],
      createdPrrs: [],
    };
  }

  const { groups, issues } = buildSafePhaseConsolidation(phaseInputs);
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
    throw new Error(`UBOQ_CONSOLIDATION_VALIDATION_FAILED: ${blockingIssues.map((b) => `${b.ruleCode}: ${b.message}`).join('; ')}`);
  }

  const profileCfg: TaxPricingProfileConfig =
    STANDARD_TAX_PROFILES[params.taxProfileCode ?? ''] ??
    (params.sectorType === 'CORPORATE'
      ? STANDARD_TAX_PROFILES.CORP_PH_VAT_EXCL_12
      : params.sectorType === 'PRIVATE'
        ? STANDARD_TAX_PROFILES.PRIVATE_NON_VAT_EXEMPT
        : STANDARD_TAX_PROFILES.GOV_PH_DUPA_5PCT_EST);

  const result = await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: params.projectId },
      data: { uboqGovernanceEnabled: true },
    });

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
      .update(JSON.stringify({ sha: extracted.security.sha256Hash, groups }))
      .digest('hex');

    const snapshot = await tx.uboqOperationalSnapshot.create({
      data: {
        projectId: params.projectId,
        versionNumber: nextVer,
        versionLabel: `v${nextVer}.0`,
        status: 'DRAFT',
        supersedesSnapshotId: latestSnap?.id ?? null,
        canonicalHash,
        preparedById: params.uploadedByUserId,
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

    // Create original phase AwardedBOQItem + UboqAwardedPhaseLine rows (never collapsing phases!)
    const phaseLineIdByKey = new Map<string, { phaseLineId: string; awardedBoqItemId: string }>();
    for (const pIn of phaseInputs) {
      const uomDef = normalizeUom(pIn.unitRaw, pIn.specification);
      const specHash = computeSpecSignatureHash(pIn.workDescription, pIn.specification);
      const amt = pIn.contractLineAmount ?? Number((pIn.approvedQty * pIn.contractUnitRate).toFixed(2));
      const amtExVat =
        profileCfg.outputVatRate > 0 && profileCfg.contractVatInclusive
          ? Number((amt / (1 + profileCfg.outputVatRate)).toFixed(2))
          : amt;

      const awardedItem = await tx.awardedBOQItem.create({
        data: {
          projectId: params.projectId,
          itemCode: `${pIn.phaseCode}:${pIn.itemCode}`,
          category: pIn.phaseCode,
          description: pIn.workDescription,
          unit: uomDef.normalizedCode,
          quantity: pIn.approvedQty,
          combinedUnitCost: pIn.contractUnitRate,
          totalCost: amt,
          remainingQuantity: pIn.approvedQty,
          balanceAmount: amt,
          revisedContractQuantity: pIn.approvedQty,
          revisedContractUnitPrice: pIn.contractUnitRate,
          revisedContractAmount: amt,
        },
      });

      const uboqPhase = await tx.uboqAwardedPhaseLine.create({
        data: {
          projectId: params.projectId,
          snapshotId: snapshot.id,
          awardedBoqItemId: awardedItem.id,
          sourceDocumentId: sourceDoc.id,
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
        },
      });

      // Record separated Agency Estimate Baseline row
      const agencyEst = computeAgencyEstimateBreakdown(amt * 0.78, profileCfg);
      await tx.uboqAgencyEstimateBaseline.create({
        data: {
          projectId: params.projectId,
          phaseLineId: uboqPhase.id,
          agencyEdcAmt: agencyEst.estimatedDirectCost,
          agencyAbcAmt: agencyEst.estimatedTotalAmount,
          estimatedDirectCost: agencyEst.estimatedDirectCost,
          ocmAmount: agencyEst.ocmAmount,
          contingencyOcm: agencyEst.contingencyOcm,
          contractorProfitAmt: agencyEst.contractorProfitAmt,
          estimateVatAmt: agencyEst.estimateVatAmt,
          estimatedIndirectCost: agencyEst.estimatedIndirectCost,
          estimatedTotalAmount: agencyEst.estimatedTotalAmount,
        },
      });

      phaseLineIdByKey.set(pIn.lineKey, { phaseLineId: uboqPhase.id, awardedBoqItemId: awardedItem.id });
    }

    // Upsert/Sync ConsolidatedBOQItem + UboqConsolidationGroup + UboqConsolidationLink
    const createdGroups = [];
    for (const grp of groups) {
      const existingGroup = await tx.uboqConsolidationGroup.findUnique({
        where: {
          projectId_specSignatureHash_unitNormalized: {
            projectId: params.projectId,
            specSignatureHash: grp.specSignatureHash,
            unitNormalized: grp.unitNormalized,
          },
        },
      });

      let consolidatedBoqItemId: string;
      let uboqGroup;

      if (existingGroup) {
        consolidatedBoqItemId = existingGroup.consolidatedBoqItemId;
        await tx.$executeRaw`SELECT uboq_sync_consolidated_snapshot(
          ${consolidatedBoqItemId}::text,
          ${grp.totalApprovedQty}::double precision,
          ${grp.totalApprovedQty}::double precision,
          ${grp.weightedUnitRate}::double precision,
          ${grp.totalContractAmount}::double precision,
          true
        )`;
        uboqGroup = await tx.uboqConsolidationGroup.update({
          where: { id: existingGroup.id },
          data: {
            totalApprovedQty: grp.totalApprovedQty,
            weightedUnitRate: grp.weightedUnitRate,
            totalContractAmount: grp.totalContractAmount,
          },
        });
      } else {
        const consBoq = await tx.consolidatedBOQItem.create({
          data: {
            projectId: params.projectId,
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
            projectId: params.projectId,
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
        const ref = phaseLineIdByKey.get(link.lineKey)!;
        await tx.uboqConsolidationLink.create({
          data: {
            consolidationGroupId: uboqGroup.id,
            phaseLineId: ref.phaseLineId,
            allocatedQty: link.allocatedQtyInGroupUom,
            allocationWeightPct: link.allocationWeightPct,
          },
        });
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

      createdGroups.push({ uboqGroup, consolidatedBoqItemId, preview: grp });
    }

    // Create CanonicalResourceAccounts & PRR versions if resourceTakeoffs provided
    const createdAccounts = [];
    const createdPrrs = [];
    if (params.resourceTakeoffs && params.resourceTakeoffs.length > 0) {
      for (const rt of params.resourceTakeoffs) {
        const matchedGrp =
          createdGroups.find(
            (cg) =>
              cg.uboqGroup.groupCode === rt.consolidatedItemCodeOrDesc ||
              cg.uboqGroup.canonicalDescription.toLowerCase() === rt.consolidatedItemCodeOrDesc.toLowerCase()
          ) ?? createdGroups[0];

        const resUom = normalizeUom(rt.resourceUnitRaw, rt.resourceSpec);
        const resSpecHash = computeSpecSignatureHash(rt.resourceDescription, rt.resourceSpec);
        const evalRes = evaluateResourceTakeoffRequirement({
          resourceCode: rt.resourceCode,
          takeoffBasis: rt.takeoffBasis,
          resourceCoeff: rt.resourceCoeff,
          workQuantityBasis: Number(matchedGrp.uboqGroup.totalApprovedQty),
          summaryVerifiedQty: rt.summaryVerifiedQty,
        });
        const blockTakeoff = evalRes.issues.find((i) => i.severity === 'BLOCKING');
        if (blockTakeoff) {
          throw new Error(`UBOQ_TAKEOFF_BLOCKED [${blockTakeoff.ruleCode}]: ${blockTakeoff.message}`);
        }

        const acct = await tx.uboqCanonicalResourceAccount.upsert({
          where: {
            projectId_consolidatedBoqItemId_specSignatureHash_resourceUomNormalized: {
              projectId: params.projectId,
              consolidatedBoqItemId: matchedGrp.consolidatedBoqItemId,
              specSignatureHash: resSpecHash,
              resourceUomNormalized: resUom.normalizedCode,
            },
          },
          update: {
            targetResourceUnitCost: rt.targetResourceUnitCost ?? rt.benchmarkUnitCost,
          },
          create: {
            projectId: params.projectId,
            consolidatedBoqItemId: matchedGrp.consolidatedBoqItemId,
            resourceCode: rt.resourceCode,
            resourceDescription: rt.resourceDescription,
            resourceSpec: rt.resourceSpec,
            specSignatureHash: resSpecHash,
            resourceClass: rt.resourceClass ?? 'MATERIAL',
            fulfillmentChannel: rt.fulfillmentChannel ?? 'SUPPLIER_PO',
            resourceUomNormalized: resUom.normalizedCode,
            uomDimensionFamily: resUom.dimensionFamily,
            targetResourceUnitCost: rt.targetResourceUnitCost ?? rt.benchmarkUnitCost,
          },
        });
        createdAccounts.push(acct);

        const latestPrr = await tx.uboqProcurementResourceRequirement.findFirst({
          where: { canonicalResourceId: acct.id },
          orderBy: { versionNumber: 'desc' },
        });
        const nextPrrVer = (latestPrr?.versionNumber ?? 0) + 1;

        const prr = await tx.uboqProcurementResourceRequirement.create({
          data: {
            canonicalResourceId: acct.id,
            projectId: params.projectId,
            consolidatedBoqItemId: matchedGrp.consolidatedBoqItemId,
            snapshotId: snapshot.id,
            versionNumber: nextPrrVer,
            supersedesId: latestPrr?.id ?? null,
            status: 'UNDER_REVIEW',
            takeoffBasis: rt.takeoffBasis,
            resourceCoeff: rt.resourceCoeff ?? null,
            workQuantityBasis: rt.takeoffBasis === 'CONTRACTOR_DETAILED_DUPA' ? Number(matchedGrp.uboqGroup.totalApprovedQty) : null,
            summaryVerifiedQty: rt.summaryVerifiedQty ?? null,
            requiredQty: evalRes.requiredQty,
            benchmarkUnitCost: rt.benchmarkUnitCost,
            procurementBudget: Number((evalRes.requiredQty * rt.benchmarkUnitCost).toFixed(2)),
            sourceDocumentId: sourceDoc.id,
            preparedById: params.uploadedByUserId,
          },
        });
        createdPrrs.push(prr);
      }
    }

    return { snapshot, createdGroups, createdAccounts, createdPrrs };
  });

  return {
    sourceDocument: sourceDoc,
    extractedCandidateCount: extracted.candidates.length,
    requiresHumanReviewCount: extracted.candidates.filter((c) => c.requiresHumanReview).length,
    snapshot: result.snapshot,
    consolidatedGroups: result.createdGroups,
    createdAccounts: result.createdAccounts,
    createdPrrs: result.createdPrrs,
  };
}

/**
 * Approves an Operational Snapshot with Maker-Checker SoD (VAL-20) and atomically approves its staged PRRs!
 */
export async function approveOperationalSnapshotAndPrrs(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: { snapshotId: string; approverUserId: string }
) {
  const prisma = prismaInput as PrismaClient;
  const snap = await prisma.uboqOperationalSnapshot.findUnique({
    where: { id: params.snapshotId },
    include: { requirements: true },
  });
  if (!snap) throw new Error('UBOQ_SNAPSHOT_NOT_FOUND');
  if (snap.preparedById === params.approverUserId) {
    throw new Error('UBOQ_SOD_VIOLATION: Operational Snapshot preparer cannot self-approve snapshot (VAL-20)');
  }

  // Supersede prior approved snapshot on this project if present
  if (snap.supersedesSnapshotId) {
    const prev = await prisma.uboqOperationalSnapshot.findUnique({ where: { id: snap.supersedesSnapshotId } });
    if (prev && prev.status === 'APPROVED') {
      await prisma.uboqOperationalSnapshot.update({
        where: { id: prev.id },
        data: { status: 'SUPERSEDED' },
      });
    }
  }

  const approvedSnap = await prisma.uboqOperationalSnapshot.update({
    where: { id: snap.id },
    data: {
      status: 'APPROVED',
      reviewedById: params.approverUserId,
      reviewedAt: new Date(),
      approvedById: params.approverUserId,
      approvedAt: new Date(),
    },
  });

  const approvedPrrResults = [];
  for (const prr of snap.requirements) {
    if (prr.status === 'UNDER_REVIEW') {
      const res = await approvePrrVersionAtomically(prisma, {
        prrId: prr.id,
        approverUserId: params.approverUserId,
      });
      approvedPrrResults.push(res);
    }
  }

  return { snapshot: approvedSnap, approvedPrrResults };
}
