import type { UboqSectorType } from '@prisma/client';

export interface TaxPricingProfileConfig {
  readonly profileCode: string;
  readonly versionCode: string;
  readonly sectorType: UboqSectorType;
  /** Document-specific estimate VAT component (e.g., 0.05 on DPWH POW/DUPA estimate, distinct from statutory output VAT) */
  readonly estimateVatComponentRate: number;
  readonly estimateVatBaseMode: 'NONE' | 'EDC_PLUS_OCM_PROFIT' | 'DIRECT_COST_ONLY';
  /** Statutory invoice output VAT rate (e.g., 0.12 VATable corporate, 0.00 PEZA zero-rated / non-VAT) */
  readonly outputVatRate: number;
  readonly salesVatCategory: 'VATABLE_12' | 'ZERO_RATED_PEZA' | 'VAT_EXEMPT' | 'GOV_FINAL_WITHHOLDING';
  readonly contractVatInclusive: boolean;
  /** Creditable/final VAT withheld by client on billing (e.g., 0.05 government creditable VAT withholding) */
  readonly govVatWithholdingRate: number;
  /** Expanded Withholding Tax on income (e.g., 0.02 contractor EWT) */
  readonly ewtRate: number;
  readonly ocmRate: number;
  readonly contractorProfitRate: number;
  readonly contingencyRate: number;
  readonly retentionRate: number;
  readonly advanceRecoupmentRate: number;
}

export const STANDARD_TAX_PROFILES: Readonly<Record<string, TaxPricingProfileConfig>> = {
  GOV_PH_DUPA_5PCT_EST: {
    profileCode: 'GOV_PH_DUPA_5PCT_EST',
    versionCode: '2026.1',
    sectorType: 'GOVERNMENT',
    estimateVatComponentRate: 0.05,
    estimateVatBaseMode: 'EDC_PLUS_OCM_PROFIT',
    outputVatRate: 0.12,
    salesVatCategory: 'GOV_FINAL_WITHHOLDING',
    contractVatInclusive: true,
    govVatWithholdingRate: 0.05,
    ewtRate: 0.02,
    ocmRate: 0.12,
    contractorProfitRate: 0.08,
    contingencyRate: 0,
    retentionRate: 0.1,
    advanceRecoupmentRate: 0.15,
  },
  CORP_PH_VAT_EXCL_12: {
    profileCode: 'CORP_PH_VAT_EXCL_12',
    versionCode: '2026.1',
    sectorType: 'CORPORATE',
    estimateVatComponentRate: 0,
    estimateVatBaseMode: 'NONE',
    outputVatRate: 0.12,
    salesVatCategory: 'VATABLE_12',
    contractVatInclusive: false,
    govVatWithholdingRate: 0,
    ewtRate: 0.02,
    ocmRate: 0.1,
    contractorProfitRate: 0.1,
    contingencyRate: 0.03,
    retentionRate: 0.1,
    advanceRecoupmentRate: 0.2,
  },
  CORP_PH_VAT_INCL_12: {
    profileCode: 'CORP_PH_VAT_INCL_12',
    versionCode: '2026.1',
    sectorType: 'CORPORATE',
    estimateVatComponentRate: 0,
    estimateVatBaseMode: 'NONE',
    outputVatRate: 0.12,
    salesVatCategory: 'VATABLE_12',
    contractVatInclusive: true,
    govVatWithholdingRate: 0,
    ewtRate: 0.02,
    ocmRate: 0.1,
    contractorProfitRate: 0.1,
    contingencyRate: 0,
    retentionRate: 0.1,
    advanceRecoupmentRate: 0.2,
  },
  PEZA_ZERO_RATED_0: {
    profileCode: 'PEZA_ZERO_RATED_0',
    versionCode: '2026.1',
    sectorType: 'CORPORATE',
    estimateVatComponentRate: 0,
    estimateVatBaseMode: 'NONE',
    outputVatRate: 0,
    salesVatCategory: 'ZERO_RATED_PEZA',
    contractVatInclusive: false,
    govVatWithholdingRate: 0,
    ewtRate: 0.02,
    ocmRate: 0.1,
    contractorProfitRate: 0.1,
    contingencyRate: 0,
    retentionRate: 0.1,
    advanceRecoupmentRate: 0.15,
  },
  PRIVATE_NON_VAT_EXEMPT: {
    profileCode: 'PRIVATE_NON_VAT_EXEMPT',
    versionCode: '2026.1',
    sectorType: 'PRIVATE',
    estimateVatComponentRate: 0,
    estimateVatBaseMode: 'NONE',
    outputVatRate: 0,
    salesVatCategory: 'VAT_EXEMPT',
    contractVatInclusive: true,
    govVatWithholdingRate: 0,
    ewtRate: 0,
    ocmRate: 0.08,
    contractorProfitRate: 0.1,
    contingencyRate: 0,
    retentionRate: 0.05,
    advanceRecoupmentRate: 0,
  },
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Computes document-specific Agency/DUPA estimate breakdown without conflating 5% estimate VAT with 12% statutory VAT (TAX-01).
 */
export function computeAgencyEstimateBreakdown(
  estimatedDirectCost: number,
  profile: TaxPricingProfileConfig,
  options?: { contingencyIncludedInOcm?: boolean }
) {
  const ocmAmount = round2(estimatedDirectCost * profile.ocmRate);
  const contingencyOcm = options?.contingencyIncludedInOcm
    ? 0
    : round2(estimatedDirectCost * profile.contingencyRate);
  const contractorProfitAmt = round2(estimatedDirectCost * profile.contractorProfitRate);

  let estimateVatBase = 0;
  if (profile.estimateVatBaseMode === 'EDC_PLUS_OCM_PROFIT') {
    estimateVatBase = round2(estimatedDirectCost + ocmAmount + contingencyOcm + contractorProfitAmt);
  } else if (profile.estimateVatBaseMode === 'DIRECT_COST_ONLY') {
    estimateVatBase = round2(estimatedDirectCost);
  }

  const estimateVatAmt = round2(estimateVatBase * profile.estimateVatComponentRate);
  // VAL-10: Never double-count contingency when already inside OCM
  const estimatedIndirectCost = round2(ocmAmount + contingencyOcm + contractorProfitAmt + estimateVatAmt);
  const estimatedTotalAmount = round2(estimatedDirectCost + estimatedIndirectCost);

  return {
    estimatedDirectCost: round2(estimatedDirectCost),
    ocmAmount,
    contingencyOcm,
    contractorProfitAmt,
    estimateVatBase,
    estimateVatAmt,
    estimatedIndirectCost,
    estimatedTotalAmount,
  };
}

/**
 * Normalizes any contract amount to Ex-VAT revenue and computes separate output VAT, client VAT withholding, EWT, retention & recoupment (TAX-02, FIN-02).
 */
export function computeContractBillingTaxBreakdown(
  grossCertifiedContractClaim: number,
  profile: TaxPricingProfileConfig,
  options?: { applyRetention?: boolean; applyAdvanceRecoupment?: boolean }
) {
  let exVatBase: number;
  let outputVatAmt: number;
  let grossInvoiceTotal: number;

  if (profile.outputVatRate > 0) {
    if (profile.contractVatInclusive) {
      // Note: Government contracts with 5% estimate VAT in DUPA may still be 12% VAT-inclusive for BIR tax base OR use explicit contract VAT basis
      const divisor =
        profile.sectorType === 'GOVERNMENT' && profile.estimateVatComponentRate > 0 && profile.salesVatCategory === 'GOV_FINAL_WITHHOLDING'
          ? 1 + profile.outputVatRate
          : 1 + profile.outputVatRate;
      exVatBase = round2(grossCertifiedContractClaim / divisor);
      outputVatAmt = round2(grossCertifiedContractClaim - exVatBase);
      grossInvoiceTotal = round2(grossCertifiedContractClaim);
    } else {
      exVatBase = round2(grossCertifiedContractClaim);
      outputVatAmt = round2(exVatBase * profile.outputVatRate);
      grossInvoiceTotal = round2(exVatBase + outputVatAmt);
    }
  } else {
    exVatBase = round2(grossCertifiedContractClaim);
    outputVatAmt = 0;
    grossInvoiceTotal = exVatBase;
  }

  const vatWithholdingAmount = round2(exVatBase * profile.govVatWithholdingRate);
  const ewtWithholdingAmount = round2(exVatBase * profile.ewtRate);
  const withholdingTotal = round2(vatWithholdingAmount + ewtWithholdingAmount);

  const retentionAmt = options?.applyRetention === false ? 0 : round2(grossCertifiedContractClaim * profile.retentionRate);
  const advanceRecoupAmt =
    options?.applyAdvanceRecoupment === false ? 0 : round2(grossCertifiedContractClaim * profile.advanceRecoupmentRate);

  const netCertifiedDue = round2(grossInvoiceTotal - withholdingTotal - retentionAmt - advanceRecoupAmt);

  return {
    exVatBase,
    outputVatAmt,
    grossInvoiceTotal,
    vatWithholdingAmount,
    ewtWithholdingAmount,
    withholdingTotal,
    retentionAmt,
    advanceRecoupAmt,
    netCertifiedDue,
  };
}

/**
 * Separates the 5 canonical financial baselines on an Ex-VAT comparable basis (FIN-01..03, VAL-11).
 */
export function computeFiveBaselineComparison(params: {
  agencyEstimateExVat: number;
  awardedContractAmount: number;
  profile: TaxPricingProfileConfig;
  targetDirectCostExVat: number;
  targetIndirectCostExVat: number;
  openCommittedPoExVat: number;
  actualIncurredCostExVat: number;
  uncommittedEtcExVat: number;
}) {
  const awardedExVat =
    params.profile.outputVatRate > 0 && params.profile.contractVatInclusive
      ? round2(params.awardedContractAmount / (1 + params.profile.outputVatRate))
      : round2(params.awardedContractAmount);

  const targetTotalCostExVat = round2(params.targetDirectCostExVat + params.targetIndirectCostExVat);
  const targetProfitExVat = round2(awardedExVat - targetTotalCostExVat);
  const targetMarginPct = awardedExVat > 0 ? Number(((targetProfitExVat / awardedExVat) * 100).toFixed(4)) : 0;

  const forecastEacExVat = round2(params.actualIncurredCostExVat + params.openCommittedPoExVat + params.uncommittedEtcExVat);
  const forecastProfitExVat = round2(awardedExVat - forecastEacExVat);

  return {
    agencyEstimateExVat: round2(params.agencyEstimateExVat),
    awardedContractExVat: awardedExVat,
    contractorTargetTotalExVat: targetTotalCostExVat,
    targetProfitExVat,
    targetMarginPct,
    committedProcurementExVat: round2(params.openCommittedPoExVat),
    actualCostExVat: round2(params.actualIncurredCostExVat),
    forecastEacExVat,
    forecastProfitExVat,
  };
}
