import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import { inspectCellSecurity, neutralizeSpreadsheetFormulaForCsv } from '../intake/security-guard';
import { buildTemplateProjection, SYSTEM_TEMPLATE_PRESETS } from '../template-builder';
import {
  CanonicalAdapterError,
  type FormalCapableTemplateCode,
  isFormalCapableTemplateCode,
  loadT4ResourceTakeoffCanonicalData,
  loadT5AccomplishmentCertCanonicalData,
  loadT6ProgressBillingCanonicalData,
  loadT11VariationOrderRegisterCanonicalData,
  mintSensitiveExportAttestation,
} from './canonical-source-adapters';
import {
  loadSavedLayout,
  resolveActorLayoutCapabilities,
  SavedLayoutError,
  validateLayoutColumns,
} from './saved-layouts';
import { canRoleAccessField } from '../security/redact-payload';

export type FormalContractCode =
  | 'ERP_CANONICAL_T0_FORMAL_V1'
  | 'ERP_CANONICAL_T1_FORMAL_V1'
  | 'ERP_CANONICAL_T4_FORMAL_V1'
  | 'ERP_CANONICAL_T5_FORMAL_V1'
  | 'ERP_CANONICAL_T6_FORMAL_V1'
  | 'ERP_CANONICAL_T11_FORMAL_V1';
export type FormalExportFormat = 'json' | 'xlsx' | 'csv';

export class FormalExportError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 400,
    public readonly detail?: Record<string, unknown>
  ) {
    super(code);
  }
}

export interface FormalContractSpec {
  readonly contractCode: FormalContractCode;
  readonly templateCode: FormalCapableTemplateCode;
  readonly contractTitle: string;
  readonly rowGrain: string;
  readonly presetFields: readonly string[];
  readonly mandatoryFieldsAlways: readonly string[];
  readonly conditionalSourceFields: readonly string[];
  readonly externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED';
  readonly missingExternalContracts: readonly string[];
  readonly inventedAgencyOrSignatoryFields: readonly [];
}

export const FORMAL_EXPORT_CONTRACTS: Readonly<
  Record<FormalCapableTemplateCode, FormalContractSpec>
> = {
  T0_MASTER_CONTRACT: {
    contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
    templateCode: 'T0_MASTER_CONTRACT',
    contractTitle: 'ERP Validated Generic Formal Contract & Authority Summary',
    rowGrain: 'CONTRACT_HEADER',
    presetFields: [
      'client_name',
      'contract_ref',
      'noa_ref',
      'ntp_ref',
      'client_po_ref',
      'vo_reference',
      'pricing_method',
      'contract_vat_basis',
      'awarded_revenue',
      'current_contract_value',
      'contract_duration',
      'commencement_date',
    ],
    mandatoryFieldsAlways: [
      'client_name',
      'pricing_method',
      'contract_vat_basis',
      'awarded_revenue',
      'current_contract_value',
    ],
    conditionalSourceFields: ['contract_ref'],
    externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
    missingExternalContracts: [
      'EXTERNAL_AGENCY_FORM_LAYOUT',
      'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
    ],
    inventedAgencyOrSignatoryFields: [],
  },
  T1_PHASE_BOQ: {
    contractCode: 'ERP_CANONICAL_T1_FORMAL_V1',
    templateCode: 'T1_PHASE_BOQ',
    contractTitle: 'ERP Validated Generic Formal Awarded Multi-Phase Contract BOQ',
    rowGrain: 'PHASE_BOQ_LINE',
    presetFields: [
      'phase_code',
      'section_code',
      'item_code',
      'work_description',
      'specification',
      'unit',
      'pricing_type',
      'original_qty',
      'approved_qty',
      'contract_unit_rate',
      'contract_line_amount',
    ],
    mandatoryFieldsAlways: [
      'phase_code',
      'item_code',
      'work_description',
      'unit',
      'original_qty',
      'approved_qty',
      'contract_unit_rate',
      'contract_line_amount',
    ],
    conditionalSourceFields: ['specification'],
    externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
    missingExternalContracts: [
      'EXTERNAL_AGENCY_FORM_LAYOUT',
      'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
    ],
    inventedAgencyOrSignatoryFields: [],
  },
  T4_RESOURCE_TAKEOFF: {
    contractCode: 'ERP_CANONICAL_T4_FORMAL_V1',
    templateCode: 'T4_RESOURCE_TAKEOFF',
    contractTitle: 'ERP Validated Generic Formal Procurement Resource Takeoff & Stock Balance',
    rowGrain: 'CANONICAL_RESOURCE',
    presetFields: [...SYSTEM_TEMPLATE_PRESETS.T4_RESOURCE_TAKEOFF.defaultFields],
    mandatoryFieldsAlways: [...SYSTEM_TEMPLATE_PRESETS.T4_RESOURCE_TAKEOFF.defaultFields],
    conditionalSourceFields: [],
    externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
    missingExternalContracts: [
      'EXTERNAL_AGENCY_FORM_LAYOUT',
      'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
    ],
    inventedAgencyOrSignatoryFields: [],
  },
  T5_ACCOMPLISHMENT_CERT: {
    contractCode: 'ERP_CANONICAL_T5_FORMAL_V1',
    templateCode: 'T5_ACCOMPLISHMENT_CERT',
    contractTitle: 'ERP Validated Generic Formal Statement of Work Accomplished (SWA)',
    rowGrain: 'PHASE_BOQ_LINE',
    presetFields: [
      ...SYSTEM_TEMPLATE_PRESETS.T5_ACCOMPLISHMENT_CERT.defaultFields,
      'vo_reference',
      'contract_unit_rate',
      'prior_certified_amt',
      'certified_curr_amt',
    ],
    mandatoryFieldsAlways: [...SYSTEM_TEMPLATE_PRESETS.T5_ACCOMPLISHMENT_CERT.defaultFields],
    conditionalSourceFields: [],
    externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
    missingExternalContracts: [
      'EXTERNAL_AGENCY_FORM_LAYOUT',
      'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
    ],
    inventedAgencyOrSignatoryFields: [],
  },
  T6_PROGRESS_BILLING: {
    contractCode: 'ERP_CANONICAL_T6_FORMAL_V1',
    templateCode: 'T6_PROGRESS_BILLING',
    contractTitle: 'ERP Validated Generic Formal Progress Billing Certificate',
    rowGrain: 'PHASE_BOQ_LINE',
    presetFields: [...SYSTEM_TEMPLATE_PRESETS.T6_PROGRESS_BILLING.defaultFields],
    mandatoryFieldsAlways: [...SYSTEM_TEMPLATE_PRESETS.T6_PROGRESS_BILLING.defaultFields],
    conditionalSourceFields: [],
    externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
    missingExternalContracts: [
      'EXTERNAL_AGENCY_FORM_LAYOUT',
      'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
    ],
    inventedAgencyOrSignatoryFields: [],
  },
  T11_VARIATION_ORDER_REGISTER: {
    contractCode: 'ERP_CANONICAL_T11_FORMAL_V1',
    templateCode: 'T11_VARIATION_ORDER_REGISTER',
    contractTitle:
      'ERP Validated Generic Formal Variation Order & Contract / Commitment Revision Register',
    rowGrain: 'VARIATION_ORDER_ITEM',
    presetFields: [
      'vo_number',
      'vo_classification',
      'phase_code',
      'item_code',
      'work_description',
      'unit',
      'original_qty',
      'vo_approved_qty_delta',
      'approved_qty',
      'contract_unit_rate',
      'vo_client_revenue_delta_amt',
      'current_contract_value',
    ],
    mandatoryFieldsAlways: [
      'vo_number',
      'vo_classification',
      'phase_code',
      'item_code',
      'work_description',
      'unit',
      'original_qty',
      'vo_approved_qty_delta',
      'approved_qty',
      'contract_unit_rate',
      'vo_client_revenue_delta_amt',
    ],
    conditionalSourceFields: [],
    externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
    missingExternalContracts: [
      'EXTERNAL_AGENCY_FORM_LAYOUT',
      'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
    ],
    inventedAgencyOrSignatoryFields: [],
  },
};

const FORMAL_EXPORT_ROLES = new Set([
  'SUPER_ADMIN',
  'PRESIDENT',
  'VP_OPERATIONS',
  'FINANCE_DIRECTOR',
  'COST_CONTROL_MANAGER',
  'COMMERCIAL_DIRECTOR',
  'CHIEF_ESTIMATOR',
  'PROJECT_MANAGER',
  'QUANTITY_SURVEYOR',
  'PROCUREMENT_MANAGER',
  'PROCUREMENT_OFFICER',
  'ACCOUNTANT',
  'BILLING_ENGINEER',
  'OPERATIONS_MANAGER',
]);

export type ContractAssociationStatus =
  | 'DIRECT_CONTRACT_AUTHORITY_SOURCE'
  | 'VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY'
  | 'UNLINKED_NO_SNAPSHOT_CONTRACT_BINDING'
  | 'UNLINKED_MULTIPLE_PROJECT_CONTRACTS'
  | 'UNLINKED_NO_APPROVED_PROJECT_CONTRACT'
  | 'INTERNAL_BENCHMARK_PRR_PROCUREMENT_BASIS';

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

export interface FormalExportRequest {
  projectId: string;
  templateCode: FormalCapableTemplateCode;
  sourceId: string;
  format: FormalExportFormat;
  contractCode?: string;
  contractAuthorityId?: string;
  layoutRevisionId?: string;
  layoutGroupId?: string;
  expectedVersionNumber?: number;
}

export function parseFormalExportRequest(value: unknown): FormalExportRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FormalExportError('FORMAL_INVALID_REQUEST', 400);
  }
  const x = value as Record<string, unknown>;
  const allowedKeys = new Set([
    'projectId',
    'templateCode',
    'sourceId',
    'format',
    'contractCode',
    'contractAuthorityId',
    'layoutRevisionId',
    'layoutGroupId',
    'expectedVersionNumber',
  ]);
  if (Object.keys(x).some((k) => !allowedKeys.has(k))) {
    throw new FormalExportError('FORMAL_UNSUPPORTED_OPTION', 400);
  }
  if (!isValidId(x.projectId) || !isValidId(x.sourceId)) {
    throw new FormalExportError('FORMAL_SOURCE_REQUIRED', 400);
  }
  if (!isFormalCapableTemplateCode(x.templateCode)) {
    throw new FormalExportError('FORMAL_TEMPLATE_CODE_NOT_SUPPORTED', 400);
  }
  const format = (x.format ?? 'json') as FormalExportFormat;
  if (typeof format !== 'string' || !['json', 'xlsx', 'csv'].includes(format)) {
    throw new FormalExportError('FORMAL_FORMAT_NOT_SUPPORTED', 400);
  }
  if (x.contractAuthorityId !== undefined && !isValidId(x.contractAuthorityId)) {
    throw new FormalExportError('FORMAL_INVALID_CONTRACT_AUTHORITY_ID', 400);
  }
  if (x.layoutRevisionId !== undefined && !isValidId(x.layoutRevisionId)) {
    throw new FormalExportError('FORMAL_INVALID_LAYOUT_ID', 400);
  }
  if (x.layoutGroupId !== undefined && !isValidId(x.layoutGroupId)) {
    throw new FormalExportError('FORMAL_INVALID_LAYOUT_ID', 400);
  }
  if (x.layoutRevisionId && x.layoutGroupId) {
    throw new FormalExportError('FORMAL_AMBIGUOUS_LAYOUT_TARGET', 400);
  }
  if (
    x.expectedVersionNumber !== undefined &&
    (typeof x.expectedVersionNumber !== 'number' ||
      !Number.isInteger(x.expectedVersionNumber) ||
      x.expectedVersionNumber < 1)
  ) {
    throw new FormalExportError('FORMAL_INVALID_LAYOUT_VERSION', 400);
  }
  if (x.contractCode !== undefined && typeof x.contractCode !== 'string') {
    throw new FormalExportError('FORMAL_INVALID_CONTRACT_CODE', 400);
  }

  const spec = FORMAL_EXPORT_CONTRACTS[x.templateCode];
  if (x.contractCode !== undefined && x.contractCode !== spec.contractCode) {
    throw new FormalExportError('FORMAL_SPECIFICATION_NOT_DEFINED', 409, {
      requestedContractCode: x.contractCode,
      retainedValidatedContractCode: spec.contractCode,
      externalAgencySpecStatus: spec.externalAgencySpecStatus,
      missingExternalContracts: spec.missingExternalContracts,
    });
  }

  return {
    projectId: x.projectId,
    templateCode: x.templateCode,
    sourceId: x.sourceId,
    format,
    contractCode: spec.contractCode,
    contractAuthorityId: x.contractAuthorityId as string | undefined,
    layoutRevisionId: x.layoutRevisionId as string | undefined,
    layoutGroupId: x.layoutGroupId as string | undefined,
    expectedVersionNumber: x.expectedVersionNumber as number | undefined,
  };
}

export interface PhaseSubtotalSummary {
  phaseCode: string;
  lineCount: number;
  contractLineSubtotal: string;
  contractAmountExVatSubtotal: string;
}

export interface UomResourceSubtotalSummary {
  resourceUnit: string;
  resourceCount: number;
  requiredQtySubtotal: string;
  stockAvailableQtySubtotal: string;
  resourceToProcureSubtotal: string;
  procurementBudgetSubtotal: string;
}

export interface PreparedFormalExport {
  projectId: string;
  actorId: string;
  actorRole: string;
  templateCode: FormalCapableTemplateCode;
  contractSpec: FormalContractSpec;
  layoutIdentity: {
    mode: 'SAVED_LAYOUT' | 'SYSTEM_FORMAL_PRESET';
    layoutDefinitionId: string | null;
    layoutGroupId: string | null;
    layoutVersionNumber: number;
    layoutOwnerId: string | null;
    sharingScope: 'PRIVATE' | 'PROJECT_SHARED' | 'SYSTEM_FORMAL_PRESET';
    templateName: string;
    definitionHash: string;
    selectedFields: string[];
    headingAliases: Record<string, string>;
  };
  sourceIdentity: {
    sourceType:
      | 'CONTRACT_AUTHORITY'
      | 'OPERATIONAL_SNAPSHOT'
      | 'ACCOMPLISHMENT_SWA'
      | 'PROGRESS_BILLING_CERTIFICATE';
    sourceId: string;
    sourceVersion: string;
    approvedById: string;
    approvedAt: string;
    canonicalHash: string | null;
    sourceEvidenceHash: string | null;
  };
  pricingAndBillingBasis: {
    contractAssociationStatus: ContractAssociationStatus;
    linkedContractAuthorityId: string | null;
    projectApprovedContractCount: number;
    pricingMethod: string | null;
    contractVatBasis: string | null;
    taxProfileVersion: string | null;
    sectorType: string | null;
    outputVatRate: string | null;
    retentionRate: string | null;
    advanceRecoupmentRate: string | null;
    ewtRate: string | null;
    govVatWithholdingRate: string | null;
    basisNote: string;
  };
  totals: {
    rowCount: number;
    originalContractAwardAmount: string | null;
    awardedRevenueExVat: string | null;
    currentApprovedContractValue: string | null;
    approvedLineTotal: string | null;
    approvedLineTotalExVat: string | null;
    procurementBudgetTotal?: string | null;
    certifiedCurrentAmountTotal?: string | null;
    priorCertifiedAmountTotal?: string | null;
    cumulativeCertifiedAmountTotal?: string | null;
    revisedContractLineTotal?: string | null;
    weightedPhysicalProgressPct?: string | null;
    exVatBaseTotal?: string | null;
    outputVatTotal?: string | null;
    grossBillingTotal?: string | null;
    retentionTotal?: string | null;
    advanceRecoupmentTotal?: string | null;
    vatWithholdingTotal?: string | null;
    ewtWithholdingTotal?: string | null;
    withholdingTotal?: string | null;
    otherDeductionsTotal?: string | null;
    netCertifiedDueTotal?: string | null;
    paymentReceivedTotal?: string | null;
    clientVoRevenueDeltaTotal?: string | null;
    clientVoRevenueDeltaExVatTotal?: string | null;
    subconCommitmentVoDeltaTotal?: string | null;
    approvedClientVoCount?: number;
    approvedSubconVoCount?: number;
    approvedClientVoItemCount?: number;
    approvedSubconVoItemCount?: number;
    diagnosticRateTimesApprovedQtySum: string | null;
    diagnosticLineVarianceCount: number;
    phaseSubtotals: PhaseSubtotalSummary[];
    uomQuantitySubtotals?: UomResourceSubtotalSummary[];
  };
  projection: ReturnType<typeof buildTemplateProjection>;
  traceabilityFields: readonly string[];
}

export async function listFormalContractCatalog(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string
) {
  const caps = await resolveActorLayoutCapabilities(db, actorId, projectId);
  const openBlockingExceptions = await db.uboqValidationException.count({
    where: { projectId, status: 'OPEN', severity: 'BLOCKING' },
  });
  const canFormalExport =
    FORMAL_EXPORT_ROLES.has(caps.effectiveRole) &&
    caps.fieldAccessRole !== 'EXTERNAL_VIEWER' &&
    canRoleAccessField(caps.effectiveRole, 'contract_line_amount') &&
    canRoleAccessField(caps.fieldAccessRole, 'contract_line_amount');

  return {
    projectId,
    canFormalExport,
    openBlockingExceptions,
    contracts: [
      FORMAL_EXPORT_CONTRACTS.T0_MASTER_CONTRACT,
      FORMAL_EXPORT_CONTRACTS.T1_PHASE_BOQ,
      FORMAL_EXPORT_CONTRACTS.T4_RESOURCE_TAKEOFF,
      FORMAL_EXPORT_CONTRACTS.T5_ACCOMPLISHMENT_CERT,
      FORMAL_EXPORT_CONTRACTS.T6_PROGRESS_BILLING,
      FORMAL_EXPORT_CONTRACTS.T11_VARIATION_ORDER_REGISTER,
    ],
  };
}

export async function prepareFormalExportData(
  db: Prisma.TransactionClient,
  actorId: string,
  rawInput: FormalExportRequest
): Promise<PreparedFormalExport> {
  const input = parseFormalExportRequest(rawInput);
  let caps;
  try {
    caps = await resolveActorLayoutCapabilities(db, actorId, input.projectId);
  } catch (err) {
    if (err instanceof SavedLayoutError) {
      throw new FormalExportError(err.code, err.status);
    }
    throw err;
  }

  const contractSpec = FORMAL_EXPORT_CONTRACTS[input.templateCode];
  if (
    !FORMAL_EXPORT_ROLES.has(caps.effectiveRole) ||
    caps.fieldAccessRole === 'EXTERNAL_VIEWER'
  ) {
    throw new FormalExportError('FORMAL_EXPORT_ROLE_FORBIDDEN', 403);
  }

  // VAL-19: Formal compliance export blocked if any OPEN BLOCKING validation exception exists
  const openBlockingExceptions = await db.uboqValidationException.count({
    where: { projectId: input.projectId, status: 'OPEN', severity: 'BLOCKING' },
  });
  if (openBlockingExceptions > 0) {
    throw new FormalExportError('FORMAL_OPEN_BLOCKING_EXCEPTIONS', 409, {
      openBlockingExceptions,
    });
  }

  // Resolve approved layout & version identity
  let layoutIdentity: PreparedFormalExport['layoutIdentity'];
  if (input.layoutRevisionId || input.layoutGroupId) {
    let loaded;
    try {
      loaded = await loadSavedLayout(db, actorId, {
        projectId: input.projectId,
        layoutRevisionId: input.layoutRevisionId,
        layoutGroupId: input.layoutGroupId,
        versionNumber: input.layoutRevisionId ? undefined : input.expectedVersionNumber,
      });
    } catch (err) {
      if (err instanceof SavedLayoutError) {
        throw new FormalExportError(err.code, err.status);
      }
      throw err;
    }
    const rev = loaded.revision;
    if (rev.templateCode !== input.templateCode) {
      throw new FormalExportError('FORMAL_LAYOUT_TEMPLATE_MISMATCH', 409);
    }
    if (
      input.expectedVersionNumber !== undefined &&
      rev.versionNumber !== input.expectedVersionNumber
    ) {
      throw new FormalExportError('FORMAL_LAYOUT_VERSION_MISMATCH', 409, {
        expectedVersionNumber: input.expectedVersionNumber,
        actualVersionNumber: rev.versionNumber,
      });
    }
    if (rev.redactedFieldCount > 0) {
      throw new FormalExportError('FORMAL_EXPORT_ROLE_FORBIDDEN', 403);
    }
    layoutIdentity = {
      mode: 'SAVED_LAYOUT',
      layoutDefinitionId: rev.id,
      layoutGroupId: rev.layoutGroupId,
      layoutVersionNumber: rev.versionNumber,
      layoutOwnerId: rev.createdById,
      sharingScope: rev.sharingScope,
      templateName: rev.templateName,
      definitionHash: rev.definitionHash,
      selectedFields: [...rev.selectedFields],
      headingAliases: { ...rev.headingAliases },
    };
  } else {
    const validatedPreset = validateLayoutColumns(
      input.templateCode,
      [...contractSpec.presetFields],
      {}
    );
    layoutIdentity = {
      mode: 'SYSTEM_FORMAL_PRESET',
      layoutDefinitionId: null,
      layoutGroupId: null,
      layoutVersionNumber: 1,
      layoutOwnerId: null,
      sharingScope: 'SYSTEM_FORMAL_PRESET',
      templateName: contractSpec.contractTitle,
      definitionHash: validatedPreset.definitionHash,
      selectedFields: validatedPreset.selectedFields,
      headingAliases: {},
    };
  }

  // Ensure actor role has full access to all selected fields in formal output (no silent column dropping!)
  if (
    layoutIdentity.selectedFields.some(
      (f) => !canRoleAccessField(caps.effectiveRole, f) || !canRoleAccessField(caps.fieldAccessRole, f)
    )
  ) {
    throw new FormalExportError('FORMAL_EXPORT_ROLE_FORBIDDEN', 403);
  }

  // Enforce mandatory formal fields before reading/rendering
  for (const reqField of contractSpec.mandatoryFieldsAlways) {
    if (!layoutIdentity.selectedFields.includes(reqField)) {
      throw new FormalExportError('FORMAL_MANDATORY_FIELD_MISSING', 409, {
        missingField: reqField,
      });
    }
  }

  if (input.templateCode === 'T0_MASTER_CONTRACT') {
    const [c, approvedContractCount] = await Promise.all([
      db.uboqContractAuthority.findFirst({
        where: {
          id: input.sourceId,
          projectId: input.projectId,
          status: 'APPROVED',
          approvedAt: { not: null },
          approvedById: { not: null },
        },
        include: {
          taxProfile: true,
        },
      }),
      db.uboqContractAuthority.count({
        where: {
          projectId: input.projectId,
          status: 'APPROVED',
          approvedAt: { not: null },
          approvedById: { not: null },
        },
      }),
    ]);
    if (!c || !c.approvedAt || !c.approvedById) {
      throw new FormalExportError('FORMAL_APPROVED_SOURCE_NOT_FOUND', 404);
    }
    if (input.contractAuthorityId !== undefined && input.contractAuthorityId !== c.id) {
      throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_MISMATCH', 409, {
        sourceId: c.id,
        requestedContractAuthorityId: input.contractAuthorityId,
      });
    }
    if (c.taxProfile && c.taxProfile.projectId !== input.projectId) {
      throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
    }
    if (c.contractRef && !layoutIdentity.selectedFields.includes('contract_ref')) {
      throw new FormalExportError('FORMAL_MANDATORY_FIELD_MISSING', 409, {
        missingField: 'contract_ref',
      });
    }

    const originalAwarded = c.awardedRevenue.gt(0)
      ? c.awardedRevenue.toFixed(2)
      : c.awardedRevenueExVat.toFixed(2);
    const awardedExVat = c.awardedRevenueExVat.toFixed(2);
    const currentContractVal = c.currentContractValue.toFixed(2);
    const taxProfileVersion = c.taxProfile
      ? `${c.taxProfile.profileCode}@${c.taxProfile.versionCode}`
      : null;

    const canonicalRow: Record<string, unknown> = {
      project_id: c.projectId,
      contract_id: c.id,
      client_name: c.clientName,
      contract_ref: c.contractRef,
      noa_ref: c.noaRef,
      ntp_ref: c.ntpRef,
      client_po_ref: c.clientPoRef,
      vo_reference: c.voReference,
      pricing_method: c.pricingMethod,
      contract_vat_basis: c.contractVatBasis,
      awarded_revenue: originalAwarded,
      current_contract_value: currentContractVal,
      contract_duration: c.contractDurationDays,
      commencement_date: c.commencementDate?.toISOString().slice(0, 10) ?? null,
      tax_profile_version: taxProfileVersion,
      sector_type: c.sectorType,
      awarded_revenue_raw_db: c.awardedRevenue.toFixed(2),
      awarded_revenue_ex_vat_exact: awardedExVat,
      approved_by_id: c.approvedById,
      approved_at_iso: c.approvedAt.toISOString(),
    };

    const projection = buildTemplateProjection([canonicalRow], {
      templateCode: 'T0_MASTER_CONTRACT',
      userRole: caps.effectiveRole,
      selectedFields: layoutIdentity.selectedFields,
      headingAliases: layoutIdentity.headingAliases,
      isFormalSubmission: true,
      hasOpenBlockingExceptions: false,
    });

    const traceabilityFields = [
      'project_id',
      'contract_id',
      'sector_type',
      'pricing_method',
      'contract_vat_basis',
      'tax_profile_version',
      'awarded_revenue_raw_db',
      'awarded_revenue_ex_vat_exact',
      'current_contract_value',
      'approved_by_id',
      'approved_at_iso',
    ] as const;

    projection.systemMetaFields = traceabilityFields;
    projection.projectedRows[0].__oserpMeta = Object.fromEntries(
      traceabilityFields.map((k) => [k, canonicalRow[k] ?? null])
    );

    return {
      projectId: input.projectId,
      actorId,
      actorRole: caps.effectiveRole,
      templateCode: 'T0_MASTER_CONTRACT',
      contractSpec,
      layoutIdentity,
      sourceIdentity: {
        sourceType: 'CONTRACT_AUTHORITY',
        sourceId: c.id,
        sourceVersion: c.id,
        approvedById: c.approvedById,
        approvedAt: c.approvedAt.toISOString(),
        canonicalHash: null,
        sourceEvidenceHash: null,
      },
      pricingAndBillingBasis: {
        contractAssociationStatus: 'DIRECT_CONTRACT_AUTHORITY_SOURCE',
        linkedContractAuthorityId: c.id,
        projectApprovedContractCount: approvedContractCount,
        pricingMethod: c.pricingMethod,
        contractVatBasis: c.contractVatBasis,
        taxProfileVersion,
        sectorType: c.sectorType,
        outputVatRate: c.taxProfile ? c.taxProfile.outputVatRate.toFixed(6) : null,
        retentionRate: c.taxProfile ? c.taxProfile.retentionRate.toFixed(6) : null,
        advanceRecoupmentRate: c.taxProfile
          ? c.taxProfile.advanceRecoupmentRate.toFixed(6)
          : null,
        ewtRate: c.taxProfile ? c.taxProfile.ewtRate.toFixed(6) : null,
        govVatWithholdingRate: c.taxProfile
          ? c.taxProfile.govVatWithholdingRate.toFixed(6)
          : null,
        basisNote: 'Sourced directly from approved UboqContractAuthority and linked UboqTaxPricingProfile.',
      },
      totals: {
        rowCount: 1,
        originalContractAwardAmount: originalAwarded,
        awardedRevenueExVat: awardedExVat,
        currentApprovedContractValue: currentContractVal,
        approvedLineTotal: null,
        approvedLineTotalExVat: null,
        diagnosticRateTimesApprovedQtySum: null,
        diagnosticLineVarianceCount: 0,
        phaseSubtotals: [],
      },
      projection,
      traceabilityFields,
    };
  }

  if (input.templateCode === 'T4_RESOURCE_TAKEOFF') {
    let loadedT4;
    try {
      loadedT4 = await loadT4ResourceTakeoffCanonicalData(
        db,
        input.projectId,
        input.sourceId,
        { requireNonEmptyForFormal: true }
      );
    } catch (err) {
      if (err instanceof CanonicalAdapterError) {
        const mappedCode = err.code.startsWith('TEMPLATE_')
          ? err.code.replace(/^TEMPLATE_/, 'FORMAL_')
          : err.code;
        throw new FormalExportError(mappedCode, err.status, err.detail);
      }
      throw err;
    }

    const approvedContractCount = await db.uboqContractAuthority.count({
      where: {
        projectId: input.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
    });

    let verifiedLinkedContractId: string | null = null;
    if (loadedT4.snapshotContractAuthorityId) {
      const ca = await db.uboqContractAuthority.findFirst({
        where: {
          id: loadedT4.snapshotContractAuthorityId,
          projectId: input.projectId,
        },
        select: { id: true, status: true, approvedAt: true, approvedById: true },
      });
      if (!ca || ca.status !== 'APPROVED' || !ca.approvedAt || !ca.approvedById) {
        throw new FormalExportError('FORMAL_LINKED_CONTRACT_NOT_APPROVED', 409, {
          snapshotId: loadedT4.sourceId,
          contractAuthorityId: loadedT4.snapshotContractAuthorityId,
        });
      }
      verifiedLinkedContractId = ca.id;
    }

    if (input.contractAuthorityId !== undefined) {
      if (!verifiedLinkedContractId) {
        throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED', 409, {
          snapshotId: loadedT4.sourceId,
          requestedContractAuthorityId: input.contractAuthorityId,
        });
      }
      if (verifiedLinkedContractId !== input.contractAuthorityId) {
        throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_MISMATCH', 409, {
          snapshotId: loadedT4.sourceId,
          snapshotContractAuthorityId: verifiedLinkedContractId,
          requestedContractAuthorityId: input.contractAuthorityId,
        });
      }
    }

    let procurementBudgetTotalDec = new Prisma.Decimal(0);
    let diagnosticQtyTimesCostSumDec = new Prisma.Decimal(0);
    let diagnosticBudgetVarianceCount = 0;

    const uomBuckets = new Map<
      string,
      {
        count: number;
        reqQty: Prisma.Decimal;
        stockQty: Prisma.Decimal;
        toProcureQty: Prisma.Decimal;
        budgetAmt: Prisma.Decimal;
      }
    >();

    for (const r of loadedT4.rows) {
      const budgetDec = new Prisma.Decimal(String(r.procurement_budget));
      const diagDec = new Prisma.Decimal(String(r.computed_qty_times_target_cost_2dp));
      const deltaDec = new Prisma.Decimal(String(r.budget_line_delta_2dp));
      if (!deltaDec.isZero()) diagnosticBudgetVarianceCount += 1;
      procurementBudgetTotalDec = procurementBudgetTotalDec.plus(budgetDec);
      diagnosticQtyTimesCostSumDec = diagnosticQtyTimesCostSumDec.plus(diagDec);

      const uom = String(r.resource_unit);
      const reqQty = new Prisma.Decimal(String(r.resource_required_qty));
      const stockQty = new Prisma.Decimal(String(r.stock_available_qty));
      const toProcureQty = new Prisma.Decimal(String(r.resource_to_procure));
      const existingUom = uomBuckets.get(uom);
      if (!existingUom) {
        uomBuckets.set(uom, {
          count: 1,
          reqQty,
          stockQty,
          toProcureQty,
          budgetAmt: budgetDec,
        });
      } else {
        existingUom.count += 1;
        existingUom.reqQty = existingUom.reqQty.plus(reqQty);
        existingUom.stockQty = existingUom.stockQty.plus(stockQty);
        existingUom.toProcureQty = existingUom.toProcureQty.plus(toProcureQty);
        existingUom.budgetAmt = existingUom.budgetAmt.plus(budgetDec);
      }
    }

    const projection = buildTemplateProjection(loadedT4.rows, {
      templateCode: 'T4_RESOURCE_TAKEOFF',
      userRole: caps.effectiveRole,
      selectedFields: layoutIdentity.selectedFields,
      headingAliases: layoutIdentity.headingAliases,
      isFormalSubmission: true,
      hasOpenBlockingExceptions: false,
    });

    const traceabilityFields = [
      ...loadedT4.systemMetaFields,
      'benchmark_unit_cost_exact',
      'target_resource_cost',
      'procurement_budget',
      'computed_qty_times_target_cost_2dp',
      'budget_line_delta_2dp',
      'source_sheet_name',
      'source_cell_ref',
    ] as const;

    projection.systemMetaFields = traceabilityFields;
    projection.projectedRows.forEach((row, idx) => {
      row.__oserpMeta = Object.fromEntries(
        traceabilityFields.map((k) => [k, loadedT4.rows[idx][k] ?? null])
      );
    });

    const uomQuantitySubtotals: UomResourceSubtotalSummary[] = [...uomBuckets.entries()].map(
      ([resourceUnit, b]) => ({
        resourceUnit,
        resourceCount: b.count,
        requiredQtySubtotal: b.reqQty.toFixed(4),
        stockAvailableQtySubtotal: b.stockQty.toFixed(4),
        resourceToProcureSubtotal: b.toProcureQty.toFixed(4),
        procurementBudgetSubtotal: b.budgetAmt.toFixed(2),
      })
    );

    return {
      projectId: input.projectId,
      actorId,
      actorRole: caps.effectiveRole,
      templateCode: 'T4_RESOURCE_TAKEOFF',
      contractSpec,
      layoutIdentity,
      sourceIdentity: {
        sourceType: 'OPERATIONAL_SNAPSHOT',
        sourceId: loadedT4.sourceId,
        sourceVersion: loadedT4.sourceVersion,
        approvedById: loadedT4.approvedById,
        approvedAt: loadedT4.approvedAtIso,
        canonicalHash: loadedT4.canonicalHash,
        sourceEvidenceHash: loadedT4.sourceEvidenceHash,
      },
      pricingAndBillingBasis: {
        contractAssociationStatus: 'INTERNAL_BENCHMARK_PRR_PROCUREMENT_BASIS',
        linkedContractAuthorityId: verifiedLinkedContractId,
        projectApprovedContractCount: approvedContractCount,
        pricingMethod: 'INTERNAL_PRR_BENCHMARK_CEILING',
        contractVatBasis: 'NOT_APPLICABLE_INTERNAL_PROCUREMENT_CEILING',
        taxProfileVersion: null,
        sectorType: null,
        outputVatRate: null,
        retentionRate: null,
        advanceRecoupmentRate: null,
        ewtRate: null,
        govVatWithholdingRate: null,
        basisNote:
          'Strictly internal PRR / Benchmark procurement resource ceiling; Awarded BOQ contract revenue and unit rates are never mixed into T4.',
      },
      totals: {
        rowCount: loadedT4.rows.length,
        originalContractAwardAmount: null,
        awardedRevenueExVat: null,
        currentApprovedContractValue: null,
        approvedLineTotal: null,
        approvedLineTotalExVat: null,
        procurementBudgetTotal: procurementBudgetTotalDec.toFixed(2),
        diagnosticRateTimesApprovedQtySum: diagnosticQtyTimesCostSumDec.toFixed(2),
        diagnosticLineVarianceCount: diagnosticBudgetVarianceCount,
        phaseSubtotals: [],
        uomQuantitySubtotals,
      },
      projection,
      traceabilityFields,
    };
  }

  if (
    input.templateCode === 'T5_ACCOMPLISHMENT_CERT' ||
    input.templateCode === 'T6_PROGRESS_BILLING'
  ) {
    let loadedBatchB;
    try {
      loadedBatchB =
        input.templateCode === 'T5_ACCOMPLISHMENT_CERT'
          ? await loadT5AccomplishmentCertCanonicalData(db, input.projectId, input.sourceId)
          : await loadT6ProgressBillingCanonicalData(db, input.projectId, input.sourceId);
    } catch (err) {
      if (err instanceof CanonicalAdapterError) {
        const mappedCode = err.code.startsWith('TEMPLATE_')
          ? err.code.replace(/^TEMPLATE_/, 'FORMAL_')
          : err.code;
        throw new FormalExportError(mappedCode, err.status, err.detail);
      }
      throw err;
    }

    const approvedContractCount = await db.uboqContractAuthority.count({
      where: {
        projectId: input.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
    });

    const snapshotIdForAssoc = String(loadedBatchB.rows[0]?.snapshot_id ?? loadedBatchB.sourceId);
    if (input.contractAuthorityId !== undefined) {
      if (!loadedBatchB.snapshotContractAuthorityId) {
        throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED', 409, {
          snapshotId: snapshotIdForAssoc,
          requestedContractAuthorityId: input.contractAuthorityId,
          projectApprovedContractCount: approvedContractCount,
        });
      }
      if (loadedBatchB.snapshotContractAuthorityId !== input.contractAuthorityId) {
        throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_MISMATCH', 409, {
          snapshotId: snapshotIdForAssoc,
          snapshotContractAuthorityId: loadedBatchB.snapshotContractAuthorityId,
          requestedContractAuthorityId: input.contractAuthorityId,
        });
      }
    }

    let linkedContract: Awaited<
      ReturnType<typeof db.uboqContractAuthority.findFirst<{ include: { taxProfile: true } }>>
    > = null;
    let contractAssociationStatus: ContractAssociationStatus;

    if (loadedBatchB.snapshotContractAuthorityId) {
      const ca = await db.uboqContractAuthority.findFirst({
        where: {
          id: loadedBatchB.snapshotContractAuthorityId,
          projectId: input.projectId,
        },
        include: { taxProfile: true },
      });
      if (!ca) {
        throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
      }
      if (ca.status !== 'APPROVED' || !ca.approvedAt || !ca.approvedById) {
        throw new FormalExportError('FORMAL_LINKED_CONTRACT_NOT_APPROVED', 409, {
          snapshotId: snapshotIdForAssoc,
          contractAuthorityId: loadedBatchB.snapshotContractAuthorityId,
          contractStatus: ca.status,
        });
      }
      if (ca.taxProfile && ca.taxProfile.projectId !== input.projectId) {
        throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
      }
      linkedContract = ca;
      contractAssociationStatus = 'VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY';
    } else if (approvedContractCount > 1) {
      contractAssociationStatus = 'UNLINKED_MULTIPLE_PROJECT_CONTRACTS';
    } else if (approvedContractCount === 1) {
      contractAssociationStatus = 'UNLINKED_NO_SNAPSHOT_CONTRACT_BINDING';
    } else {
      contractAssociationStatus = 'UNLINKED_NO_APPROVED_PROJECT_CONTRACT';
    }

    const taxProfile =
      linkedContract?.taxProfile && linkedContract.taxProfile.projectId === input.projectId
        ? linkedContract.taxProfile
        : null;

    // Build phase subtotals from current certified work amount
    const phaseMap = new Map<string, { lineCount: number; currCertAmt: Prisma.Decimal }>();
    for (const r of loadedBatchB.rows) {
      const pCode = String(r.phase_code ?? 'DEFAULT');
      const currAmt = new Prisma.Decimal(String(r.certified_curr_amt ?? '0'));
      const ex = phaseMap.get(pCode);
      if (!ex) {
        phaseMap.set(pCode, { lineCount: 1, currCertAmt: currAmt });
      } else {
        ex.lineCount += 1;
        ex.currCertAmt = ex.currCertAmt.plus(currAmt);
      }
    }
    const phaseSubtotals: PhaseSubtotalSummary[] = [...phaseMap.entries()].map(
      ([phaseCode, info]) => ({
        phaseCode,
        lineCount: info.lineCount,
        contractLineSubtotal: info.currCertAmt.toFixed(2),
        contractAmountExVatSubtotal: info.currCertAmt.toFixed(2),
      })
    );

    const projection = buildTemplateProjection(loadedBatchB.rows, {
      templateCode: input.templateCode,
      userRole: caps.effectiveRole,
      selectedFields: layoutIdentity.selectedFields,
      headingAliases: layoutIdentity.headingAliases,
      isFormalSubmission: true,
      hasOpenBlockingExceptions: false,
    });

    const traceabilityFields =
      input.templateCode === 'T5_ACCOMPLISHMENT_CERT'
        ? ([
            ...loadedBatchB.systemMetaFields,
            'billing_period',
            'vo_reference',
            'pricing_type',
            'original_qty',
            'approved_qty',
            'prev_certified_qty',
            'current_measured_qty',
            'certified_curr_qty',
            'cum_certified_qty',
            'remaining_qty',
            'physical_progress_pct',
            'contract_unit_rate',
            'contract_line_amount',
            'prior_certified_amt',
            'certified_curr_amt',
          ] as const)
        : ([
            ...loadedBatchB.systemMetaFields,
            'vo_reference',
            'pricing_type',
            'original_qty',
            'approved_qty',
            'prev_certified_qty',
            'certified_curr_qty',
            'contract_unit_rate',
            'contract_line_amount',
            'prior_certified_amt',
            'certified_curr_amt',
            'gross_billing',
            'retention_amt',
            'advance_recoup',
            'vat_withholding_amount',
            'ewt_withholding_amount',
            'withholding_amt',
            'net_certified_due',
            'payment_received',
          ] as const);

    projection.systemMetaFields = traceabilityFields;
    projection.projectedRows.forEach((row, idx) => {
      row.__oserpMeta = Object.fromEntries(
        traceabilityFields.map((k) => [k, loadedBatchB.rows[idx][k] ?? null])
      );
    });

    const origContractAward = linkedContract
      ? (linkedContract.awardedRevenue.gt(0)
          ? linkedContract.awardedRevenue
          : linkedContract.awardedRevenueExVat
        ).toFixed(2)
      : null;

    if (input.templateCode === 'T5_ACCOMPLISHMENT_CERT') {
      const swa = loadedBatchB.swaSummary!;
      return {
        projectId: input.projectId,
        actorId,
        actorRole: caps.effectiveRole,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        contractSpec,
        layoutIdentity,
        sourceIdentity: {
          sourceType: 'ACCOMPLISHMENT_SWA',
          sourceId: loadedBatchB.sourceId,
          sourceVersion: loadedBatchB.sourceVersion,
          approvedById: loadedBatchB.approvedById,
          approvedAt: loadedBatchB.approvedAtIso,
          canonicalHash: loadedBatchB.canonicalHash,
          sourceEvidenceHash: loadedBatchB.sourceEvidenceHash,
        },
        pricingAndBillingBasis: {
          contractAssociationStatus,
          linkedContractAuthorityId: linkedContract ? linkedContract.id : null,
          projectApprovedContractCount: approvedContractCount,
          pricingMethod: linkedContract ? linkedContract.pricingMethod : 'LINE_PRICING_TYPE_GOVERNED',
          contractVatBasis: linkedContract
            ? linkedContract.contractVatBasis
            : 'UNLINKED_TO_CONTRACT_AUTHORITY',
          taxProfileVersion: taxProfile
            ? `${taxProfile.profileCode}@${taxProfile.versionCode}`
            : null,
          sectorType: linkedContract ? linkedContract.sectorType : null,
          outputVatRate: taxProfile ? taxProfile.outputVatRate.toFixed(6) : null,
          retentionRate: taxProfile ? taxProfile.retentionRate.toFixed(6) : null,
          advanceRecoupmentRate: taxProfile ? taxProfile.advanceRecoupmentRate.toFixed(6) : null,
          ewtRate: taxProfile ? taxProfile.ewtRate.toFixed(6) : null,
          govVatWithholdingRate: taxProfile ? taxProfile.govVatWithholdingRate.toFixed(6) : null,
          basisNote: `Approved SWA (${swa.billingPeriod}) reconciled to approved UboqOperationalSnapshot ${swa.snapshotId}@v${swa.snapshotVersionNumber}, approved QA/QC Inspection evidence, and approved Client VariationOrders (Subcontractor VOs excluded).`,
        },
        totals: {
          rowCount: loadedBatchB.rows.length,
          originalContractAwardAmount: origContractAward,
          awardedRevenueExVat: linkedContract ? linkedContract.awardedRevenueExVat.toFixed(2) : null,
          currentApprovedContractValue: linkedContract
            ? linkedContract.currentContractValue.toFixed(2)
            : null,
          approvedLineTotal: null,
          approvedLineTotalExVat: null,
          certifiedCurrentAmountTotal: swa.certifiedCurrentAmountTotal,
          priorCertifiedAmountTotal: swa.priorCertifiedAmountTotal,
          cumulativeCertifiedAmountTotal: swa.cumulativeCertifiedAmountTotal,
          revisedContractLineTotal: swa.revisedContractLineTotal,
          weightedPhysicalProgressPct: swa.weightedPhysicalProgressPct,
          diagnosticRateTimesApprovedQtySum: swa.certifiedCurrentAmountTotal,
          diagnosticLineVarianceCount: 0,
          phaseSubtotals,
        },
        projection,
        traceabilityFields,
      };
    }

    // T6_PROGRESS_BILLING
    const bil = loadedBatchB.billingSummary!;
    return {
      projectId: input.projectId,
      actorId,
      actorRole: caps.effectiveRole,
      templateCode: 'T6_PROGRESS_BILLING',
      contractSpec,
      layoutIdentity,
      sourceIdentity: {
        sourceType: 'PROGRESS_BILLING_CERTIFICATE',
        sourceId: loadedBatchB.sourceId,
        sourceVersion: loadedBatchB.sourceVersion,
        approvedById: loadedBatchB.approvedById,
        approvedAt: loadedBatchB.approvedAtIso,
        canonicalHash: loadedBatchB.canonicalHash,
        sourceEvidenceHash: loadedBatchB.sourceEvidenceHash,
      },
      pricingAndBillingBasis: {
        contractAssociationStatus,
        linkedContractAuthorityId: linkedContract ? linkedContract.id : null,
        projectApprovedContractCount: approvedContractCount,
        pricingMethod: linkedContract ? linkedContract.pricingMethod : 'LINE_PRICING_TYPE_GOVERNED',
        contractVatBasis: linkedContract
          ? linkedContract.contractVatBasis
          : 'UNLINKED_TO_CONTRACT_AUTHORITY',
        taxProfileVersion: bil.taxProfileVersion,
        sectorType: linkedContract ? linkedContract.sectorType : null,
        outputVatRate: taxProfile ? taxProfile.outputVatRate.toFixed(6) : null,
        retentionRate: taxProfile ? taxProfile.retentionRate.toFixed(6) : null,
        advanceRecoupmentRate: taxProfile ? taxProfile.advanceRecoupmentRate.toFixed(6) : null,
        ewtRate: taxProfile ? taxProfile.ewtRate.toFixed(6) : null,
        govVatWithholdingRate: taxProfile ? taxProfile.govVatWithholdingRate.toFixed(6) : null,
        basisNote: `Approved Progress Billing #${bil.billingNumber} valued strictly at Awarded BOQ UboqAwardedPhaseLine.contractUnitRate (${bil.snapshotId}@v${bil.snapshotVersionNumber}), tax profile=${bil.taxProfileVersion}.`,
      },
      totals: {
        rowCount: loadedBatchB.rows.length,
        originalContractAwardAmount: origContractAward,
        awardedRevenueExVat: linkedContract ? linkedContract.awardedRevenueExVat.toFixed(2) : null,
        currentApprovedContractValue: linkedContract
          ? linkedContract.currentContractValue.toFixed(2)
          : null,
        approvedLineTotal: null,
        approvedLineTotalExVat: null,
        certifiedCurrentAmountTotal: bil.certifiedCurrentAmountTotal,
        priorCertifiedAmountTotal: bil.priorCertifiedAmountTotal,
        exVatBaseTotal: bil.exVatBaseTotal,
        outputVatTotal: bil.outputVatTotal,
        grossBillingTotal: bil.grossBillingTotal,
        retentionTotal: bil.retentionTotal,
        advanceRecoupmentTotal: bil.advanceRecoupmentTotal,
        vatWithholdingTotal: bil.vatWithholdingTotal,
        ewtWithholdingTotal: bil.ewtWithholdingTotal,
        withholdingTotal: bil.withholdingTotal,
        otherDeductionsTotal: bil.otherDeductionsTotal,
        netCertifiedDueTotal: bil.netCertifiedDueTotal,
        paymentReceivedTotal: bil.paymentReceivedTotal,
        diagnosticRateTimesApprovedQtySum: bil.certifiedCurrentAmountTotal,
        diagnosticLineVarianceCount: 0,
        phaseSubtotals,
      },
      projection,
      traceabilityFields,
    };
  }

  if (input.templateCode === 'T11_VARIATION_ORDER_REGISTER') {
    let loadedT11;
    try {
      loadedT11 = await loadT11VariationOrderRegisterCanonicalData(
        db,
        input.projectId,
        input.sourceId,
        {
          effectiveRole: caps.effectiveRole,
          fieldAccessRole: caps.fieldAccessRole,
        }
      );
    } catch (err) {
      if (err instanceof CanonicalAdapterError) {
        const mappedCode = err.code.startsWith('TEMPLATE_')
          ? err.code.replace(/^TEMPLATE_/, 'FORMAL_')
          : err.code;
        throw new FormalExportError(mappedCode, err.status, err.detail);
      }
      throw err;
    }

    const approvedContractCount = await db.uboqContractAuthority.count({
      where: {
        projectId: input.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
    });

    if (input.contractAuthorityId !== undefined) {
      if (!loadedT11.snapshotContractAuthorityId) {
        throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED', 409, {
          snapshotId: loadedT11.sourceId,
          requestedContractAuthorityId: input.contractAuthorityId,
          projectApprovedContractCount: approvedContractCount,
        });
      }
      if (loadedT11.snapshotContractAuthorityId !== input.contractAuthorityId) {
        throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_MISMATCH', 409, {
          snapshotId: loadedT11.sourceId,
          snapshotContractAuthorityId: loadedT11.snapshotContractAuthorityId,
          requestedContractAuthorityId: input.contractAuthorityId,
        });
      }
    }

    const linkedContract = await db.uboqContractAuthority.findFirst({
      where: {
        id: loadedT11.snapshotContractAuthorityId!,
        projectId: input.projectId,
      },
      include: { taxProfile: true },
    });
    if (!linkedContract) {
      throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
    }
    if (
      linkedContract.status !== 'APPROVED' ||
      !linkedContract.approvedAt ||
      !linkedContract.approvedById
    ) {
      throw new FormalExportError('FORMAL_LINKED_CONTRACT_NOT_APPROVED', 409, {
        snapshotId: loadedT11.sourceId,
        contractAuthorityId: linkedContract.id,
        contractStatus: linkedContract.status,
      });
    }
    if (linkedContract.taxProfile && linkedContract.taxProfile.projectId !== input.projectId) {
      throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
    }

    const taxProfile = linkedContract.taxProfile ?? null;
    const voSummary = loadedT11.variationRegisterSummary!;
    const includeSensitiveSubconDelta = layoutIdentity.selectedFields.includes(
      'vo_subcon_commitment_delta_amt'
    );

    const phaseMap = new Map<
      string,
      { lineCount: number; revGross: Prisma.Decimal; revExVat: Prisma.Decimal }
    >();
    for (const r of loadedT11.rows) {
      const pCode = String(r.phase_code ?? 'DEFAULT');
      const gAmt = new Prisma.Decimal(String(r.vo_client_revenue_delta_amt ?? '0'));
      const exAmt = new Prisma.Decimal(String(r.vo_client_revenue_delta_ex_vat ?? '0'));
      const cur = phaseMap.get(pCode);
      if (!cur) {
        phaseMap.set(pCode, { lineCount: 1, revGross: gAmt, revExVat: exAmt });
      } else {
        cur.lineCount += 1;
        cur.revGross = cur.revGross.plus(gAmt);
        cur.revExVat = cur.revExVat.plus(exAmt);
      }
    }
    const phaseSubtotals: PhaseSubtotalSummary[] = [...phaseMap.entries()].map(
      ([phaseCode, info]) => ({
        phaseCode,
        lineCount: info.lineCount,
        contractLineSubtotal: info.revGross.toFixed(2),
        contractAmountExVatSubtotal: info.revExVat.toFixed(2),
      })
    );

    const projection = buildTemplateProjection(loadedT11.rows, {
      templateCode: 'T11_VARIATION_ORDER_REGISTER',
      userRole: caps.effectiveRole,
      selectedFields: layoutIdentity.selectedFields,
      headingAliases: layoutIdentity.headingAliases,
      isFormalSubmission: true,
      hasOpenBlockingExceptions: false,
    });

    const traceabilityFields = [
      ...loadedT11.systemMetaFields.filter(
        (k) => k !== 'vo_subcon_commitment_delta_amt' || includeSensitiveSubconDelta
      ),
      'vo_number',
      'vo_classification',
      'original_qty',
      'vo_approved_qty_delta',
      'approved_qty',
      'contract_unit_rate',
      'vo_client_revenue_delta_amt',
      ...(includeSensitiveSubconDelta ? (['vo_subcon_commitment_delta_amt'] as const) : []),
    ] as const;

    projection.systemMetaFields = traceabilityFields;
    projection.projectedRows.forEach((row, idx) => {
      row.__oserpMeta = Object.fromEntries(
        traceabilityFields.map((k) => [k, loadedT11.rows[idx][k] ?? null])
      );
    });

    return {
      projectId: input.projectId,
      actorId,
      actorRole: caps.effectiveRole,
      templateCode: 'T11_VARIATION_ORDER_REGISTER',
      contractSpec,
      layoutIdentity,
      sourceIdentity: {
        sourceType: 'OPERATIONAL_SNAPSHOT',
        sourceId: loadedT11.sourceId,
        sourceVersion: String(voSummary.snapshotVersionNumber),
        approvedById: loadedT11.approvedById,
        approvedAt: loadedT11.approvedAtIso,
        canonicalHash: loadedT11.canonicalHash,
        sourceEvidenceHash: loadedT11.sourceEvidenceHash,
      },
      pricingAndBillingBasis: {
        contractAssociationStatus: 'VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY',
        linkedContractAuthorityId: linkedContract.id,
        projectApprovedContractCount: approvedContractCount,
        pricingMethod: linkedContract.pricingMethod,
        contractVatBasis: linkedContract.contractVatBasis,
        taxProfileVersion: taxProfile
          ? `${taxProfile.profileCode}@${taxProfile.versionCode}`
          : null,
        sectorType: linkedContract.sectorType,
        outputVatRate: taxProfile ? taxProfile.outputVatRate.toFixed(6) : null,
        retentionRate: taxProfile ? taxProfile.retentionRate.toFixed(6) : null,
        advanceRecoupmentRate: taxProfile ? taxProfile.advanceRecoupmentRate.toFixed(6) : null,
        ewtRate: taxProfile ? taxProfile.ewtRate.toFixed(6) : null,
        govVatWithholdingRate: taxProfile ? taxProfile.govVatWithholdingRate.toFixed(6) : null,
        basisNote:
          'Internal ERP Canonical Formal Variation Order Register (no external agency statutory certification claimed): approved Client Contract VOs adjust contract revenue and quantity entitlement only; approved Subcontractor Commitment VOs adjust subcontractor/benchmark cost commitment only.',
      },
      totals: {
        rowCount: loadedT11.rows.length,
        originalContractAwardAmount: voSummary.originalContractAwardAmount,
        awardedRevenueExVat: voSummary.awardedRevenueExVat,
        currentApprovedContractValue: voSummary.revisedContractValueTotal,
        approvedLineTotal: null,
        approvedLineTotalExVat: null,
        clientVoRevenueDeltaTotal: voSummary.clientVoRevenueDeltaTotal,
        clientVoRevenueDeltaExVatTotal: voSummary.clientVoRevenueDeltaExVatTotal,
        subconCommitmentVoDeltaTotal: includeSensitiveSubconDelta
          ? voSummary.subconCommitmentVoDeltaTotal
          : null,
        approvedClientVoCount: voSummary.approvedClientVoCount,
        approvedSubconVoCount: voSummary.approvedSubconVoCount,
        approvedClientVoItemCount: voSummary.approvedClientVoItemCount,
        approvedSubconVoItemCount: voSummary.approvedSubconVoItemCount,
        diagnosticRateTimesApprovedQtySum: voSummary.clientVoRevenueDeltaTotal,
        diagnosticLineVarianceCount: 0,
        phaseSubtotals,
      },
      projection,
      traceabilityFields,
    };
  }

  // T1_PHASE_BOQ
  const snapshot = await db.uboqOperationalSnapshot.findFirst({
    where: {
      id: input.sourceId,
      projectId: input.projectId,
      status: 'APPROVED',
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    include: {
      sourceDocument: {
        select: { id: true, projectId: true, sha256Hash: true, fileName: true },
      },
      contractAuthority: {
        include: { taxProfile: true },
      },
    },
  });
  if (!snapshot || !snapshot.approvedAt || !snapshot.approvedById) {
    throw new FormalExportError('FORMAL_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (snapshot.sourceDocument && snapshot.sourceDocument.projectId !== input.projectId) {
    throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
  }

  const [lines, approvedContractCount] = await Promise.all([
    db.uboqAwardedPhaseLine.findMany({
      where: { projectId: input.projectId, snapshotId: snapshot.id },
      include: {
        sourceDocument: {
          select: { id: true, projectId: true, sha256Hash: true },
        },
        extractionCandidate: {
          select: {
            id: true,
            sourceDocumentId: true,
            sourceRowNumber: true,
            sourceCellRef: true,
            reviewDecision: true,
          },
        },
      },
      orderBy: [{ phaseCode: 'asc' }, { sectionCode: 'asc' }, { itemCode: 'asc' }, { id: 'asc' }],
      take: 1001,
    }),
    db.uboqContractAuthority.count({
      where: {
        projectId: input.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
    }),
  ]);

  if (input.contractAuthorityId !== undefined) {
    if (!snapshot.contractAuthorityId) {
      throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED', 409, {
        snapshotId: snapshot.id,
        requestedContractAuthorityId: input.contractAuthorityId,
        projectApprovedContractCount: approvedContractCount,
      });
    }
    if (snapshot.contractAuthorityId !== input.contractAuthorityId) {
      throw new FormalExportError('FORMAL_CONTRACT_ASSOCIATION_MISMATCH', 409, {
        snapshotId: snapshot.id,
        snapshotContractAuthorityId: snapshot.contractAuthorityId,
        requestedContractAuthorityId: input.contractAuthorityId,
      });
    }
  }

  let linkedContract: NonNullable<typeof snapshot.contractAuthority> | null = null;
  let contractAssociationStatus: ContractAssociationStatus;

  if (snapshot.contractAuthorityId !== null) {
    const ca = snapshot.contractAuthority;
    if (!ca || ca.projectId !== input.projectId) {
      throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
    }
    if (ca.status !== 'APPROVED' || !ca.approvedAt || !ca.approvedById) {
      throw new FormalExportError('FORMAL_LINKED_CONTRACT_NOT_APPROVED', 409, {
        snapshotId: snapshot.id,
        contractAuthorityId: snapshot.contractAuthorityId,
        contractStatus: ca.status,
      });
    }
    if (ca.taxProfile && ca.taxProfile.projectId !== input.projectId) {
      throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
    }
    linkedContract = ca;
    contractAssociationStatus = 'VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY';
  } else if (approvedContractCount > 1) {
    contractAssociationStatus = 'UNLINKED_MULTIPLE_PROJECT_CONTRACTS';
  } else if (approvedContractCount === 1) {
    contractAssociationStatus = 'UNLINKED_NO_SNAPSHOT_CONTRACT_BINDING';
  } else {
    contractAssociationStatus = 'UNLINKED_NO_APPROVED_PROJECT_CONTRACT';
  }

  if (lines.length === 0) {
    throw new FormalExportError('FORMAL_EMPTY_SNAPSHOT', 409);
  }
  if (lines.length > 1000) {
    throw new FormalExportError('FORMAL_ROW_LIMIT_EXCEEDED', 413);
  }

  const hasAnySpecification = lines.some(
    (l) => typeof l.specification === 'string' && l.specification.trim().length > 0
  );
  if (hasAnySpecification && !layoutIdentity.selectedFields.includes('specification')) {
    throw new FormalExportError('FORMAL_MANDATORY_FIELD_MISSING', 409, {
      missingField: 'specification',
    });
  }

  let approvedLineTotalDec = new Prisma.Decimal(0);
  let approvedLineTotalExVatDec = new Prisma.Decimal(0);
  let rateTimesQtySumDec = new Prisma.Decimal(0);
  let diagnosticLineVarianceCount = 0;

  const phaseSubtotalMap = new Map<
    string,
    {
      lineCount: number;
      lineAmt: Prisma.Decimal;
      exVatAmt: Prisma.Decimal;
    }
  >();

  const canonicalRows: Array<Record<string, unknown>> = lines.map((l) => {
    if (l.sourceDocument && l.sourceDocument.projectId !== input.projectId) {
      throw new FormalExportError('FORMAL_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const lineAmt = l.contractLineAmount;
    const exVatAmt = l.contractAmountExVat;
    const rateTimesQty2dp = l.approvedQty
      .mul(l.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const lineDelta2dp = lineAmt.minus(rateTimesQty2dp);
    if (!lineDelta2dp.isZero()) {
      diagnosticLineVarianceCount += 1;
    }

    approvedLineTotalDec = approvedLineTotalDec.plus(lineAmt);
    approvedLineTotalExVatDec = approvedLineTotalExVatDec.plus(exVatAmt);
    rateTimesQtySumDec = rateTimesQtySumDec.plus(rateTimesQty2dp);

    const existingPhase = phaseSubtotalMap.get(l.phaseCode);
    if (!existingPhase) {
      phaseSubtotalMap.set(l.phaseCode, {
        lineCount: 1,
        lineAmt,
        exVatAmt,
      });
    } else {
      existingPhase.lineCount += 1;
      existingPhase.lineAmt = existingPhase.lineAmt.plus(lineAmt);
      existingPhase.exVatAmt = existingPhase.exVatAmt.plus(exVatAmt);
    }

    const docId = l.sourceDocumentId ?? snapshot.sourceDocumentId ?? null;
    const docSha =
      l.sourceDocument?.sha256Hash ?? snapshot.sourceDocument?.sha256Hash ?? null;

    return {
      project_id: l.projectId,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      boq_line_id: l.id,
      awarded_boq_item_id: l.awardedBoqItemId,
      source_document_id: docId,
      source_document_sha256: docSha,
      source_sheet_name: l.sourceSheetName,
      source_cell_ref: l.sourceCellRef ?? l.extractionCandidate?.sourceCellRef ?? null,
      extraction_candidate_id: l.extractionCandidateId,
      extraction_review_decision: l.extractionCandidate?.reviewDecision ?? null,
      phase_code: l.phaseCode,
      section_code: l.sectionCode,
      item_code: l.itemCode,
      work_description: l.workDescription,
      specification: l.specification,
      spec_signature_hash: l.specSignatureHash,
      unit_raw: l.unitRaw,
      unit_normalized: l.unitNormalized,
      unit: l.unitNormalized,
      pricing_type: l.pricingType,
      original_qty: l.originalQty.toFixed(4),
      approved_qty: l.approvedQty.toFixed(4),
      contract_unit_rate: l.contractUnitRate.toFixed(4),
      contract_line_amount: l.contractLineAmount.toFixed(2),
      contract_amount_ex_vat_exact: l.contractAmountExVat.toFixed(2),
      rate_times_approved_qty_2dp: rateTimesQty2dp.toFixed(2),
      line_amount_delta_2dp: lineDelta2dp.toFixed(2),
    };
  });

  const projection = buildTemplateProjection(canonicalRows, {
    templateCode: 'T1_PHASE_BOQ',
    userRole: caps.effectiveRole,
    selectedFields: layoutIdentity.selectedFields,
    headingAliases: layoutIdentity.headingAliases,
    isFormalSubmission: true,
    hasOpenBlockingExceptions: false,
  });

  const traceabilityFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'boq_line_id',
    'awarded_boq_item_id',
    'source_document_id',
    'source_document_sha256',
    'source_sheet_name',
    'source_cell_ref',
    'extraction_candidate_id',
    'extraction_review_decision',
    'phase_code',
    'section_code',
    'item_code',
    'spec_signature_hash',
    'unit_raw',
    'unit_normalized',
    'pricing_type',
    'original_qty',
    'approved_qty',
    'contract_unit_rate',
    'contract_line_amount',
    'contract_amount_ex_vat_exact',
    'rate_times_approved_qty_2dp',
    'line_amount_delta_2dp',
  ] as const;

  projection.systemMetaFields = traceabilityFields;
  projection.projectedRows.forEach((row, idx) => {
    row.__oserpMeta = Object.fromEntries(
      traceabilityFields.map((k) => [k, canonicalRows[idx][k] ?? null])
    );
  });

  const phaseSubtotals: PhaseSubtotalSummary[] = [...phaseSubtotalMap.entries()].map(
    ([phaseCode, info]) => ({
      phaseCode,
      lineCount: info.lineCount,
      contractLineSubtotal: info.lineAmt.toFixed(2),
      contractAmountExVatSubtotal: info.exVatAmt.toFixed(2),
    })
  );

  const taxProfile =
    linkedContract?.taxProfile && linkedContract.taxProfile.projectId === input.projectId
      ? linkedContract.taxProfile
      : null;

  const basisNote = linkedContract
    ? `Line-level pricingType preserved per UboqAwardedPhaseLine; explicit snapshot contractAuthorityId=${linkedContract.id} verified.`
    : approvedContractCount > 1
      ? `Line-level pricingType preserved per UboqAwardedPhaseLine; snapshot has no explicit contractAuthorityId (${approvedContractCount} approved project contract authorities exist — classified UNLINKED without guessing).`
      : approvedContractCount === 1
        ? 'Line-level pricingType preserved per UboqAwardedPhaseLine; snapshot has no explicit contractAuthorityId (classified UNLINKED without assuming project contract linkage).'
        : 'Line-level pricingType preserved per UboqAwardedPhaseLine; no approved UboqContractAuthority recorded on project.';

  return {
    projectId: input.projectId,
    actorId,
    actorRole: caps.effectiveRole,
    templateCode: 'T1_PHASE_BOQ',
    contractSpec,
    layoutIdentity,
    sourceIdentity: {
      sourceType: 'OPERATIONAL_SNAPSHOT',
      sourceId: snapshot.id,
      sourceVersion: String(snapshot.versionNumber),
      approvedById: snapshot.approvedById,
      approvedAt: snapshot.approvedAt.toISOString(),
      canonicalHash: snapshot.canonicalHash,
      sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    },
    pricingAndBillingBasis: {
      contractAssociationStatus,
      linkedContractAuthorityId: linkedContract ? linkedContract.id : null,
      projectApprovedContractCount: approvedContractCount,
      pricingMethod: linkedContract ? linkedContract.pricingMethod : 'LINE_PRICING_TYPE_GOVERNED',
      contractVatBasis: linkedContract
        ? linkedContract.contractVatBasis
        : 'UNLINKED_TO_CONTRACT_AUTHORITY',
      taxProfileVersion: taxProfile
        ? `${taxProfile.profileCode}@${taxProfile.versionCode}`
        : null,
      sectorType: linkedContract ? linkedContract.sectorType : null,
      outputVatRate: taxProfile ? taxProfile.outputVatRate.toFixed(6) : null,
      retentionRate: taxProfile ? taxProfile.retentionRate.toFixed(6) : null,
      advanceRecoupmentRate: taxProfile ? taxProfile.advanceRecoupmentRate.toFixed(6) : null,
      ewtRate: taxProfile ? taxProfile.ewtRate.toFixed(6) : null,
      govVatWithholdingRate: taxProfile ? taxProfile.govVatWithholdingRate.toFixed(6) : null,
      basisNote,
    },
    totals: {
      rowCount: canonicalRows.length,
      originalContractAwardAmount: linkedContract
        ? (linkedContract.awardedRevenue.gt(0)
            ? linkedContract.awardedRevenue
            : linkedContract.awardedRevenueExVat
          ).toFixed(2)
        : null,
      awardedRevenueExVat: linkedContract
        ? linkedContract.awardedRevenueExVat.toFixed(2)
        : null,
      currentApprovedContractValue: linkedContract
        ? linkedContract.currentContractValue.toFixed(2)
        : null,
      approvedLineTotal: approvedLineTotalDec.toFixed(2),
      approvedLineTotalExVat: approvedLineTotalExVatDec.toFixed(2),
      diagnosticRateTimesApprovedQtySum: rateTimesQtySumDec.toFixed(2),
      diagnosticLineVarianceCount,
      phaseSubtotals,
    },
    projection,
    traceabilityFields,
  };
}

const SIX_DP_FIELDS = new Set(['resource_coeff']);
const FOUR_DP_FIELDS = new Set([
  'original_qty',
  'approved_qty',
  'contract_unit_rate',
  'resource_required_qty',
  'allocated_usable_stock_qty',
  'open_mr_reserved_qty',
  'committed_qty',
  'delivered_received_qty',
  'consumed_issued_qty',
  'stock_available_qty',
  'resource_to_procure',
  'target_resource_cost',
  'resource_summary_qty',
  'prev_certified_qty',
  'current_measured_qty',
  'certified_curr_qty',
  'cum_certified_qty',
  'remaining_qty',
  'physical_progress_pct',
  'output_vat_rate',
  'gov_vat_withholding_rate',
  'vo_approved_qty_delta',
]);
const TWO_DP_FIELDS = new Set([
  'contract_line_amount',
  'awarded_revenue',
  'current_contract_value',
  'procurement_budget',
  'certified_curr_amt',
  'prior_certified_amt',
  'gross_billing',
  'retention_amt',
  'advance_recoup',
  'vat_withholding_amount',
  'ewt_withholding_amount',
  'withholding_amt',
  'net_certified_due',
  'payment_received',
  'vo_client_revenue_delta_amt',
  'vo_subcon_commitment_delta_amt',
]);

function toSafeExcelNumber(exactDecimalStr: string): number | null {
  const dec = new Prisma.Decimal(exactDecimalStr);
  if (dec.abs().gt('9000000000000')) {
    // Exceeds safe IEEE-754 4dp exactness window; retain exact decimal text on worksheet
    return null;
  }
  return Number(exactDecimalStr);
}

function columnIndexToLetter(col1Based: number): string {
  let n = col1Based;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function getBatchBFormalSummableTotals(
  prepared: PreparedFormalExport
): Readonly<Record<string, string>> {
  if (prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT') {
    const out: Record<string, string> = {};
    if (prepared.totals.priorCertifiedAmountTotal) {
      out.prior_certified_amt = prepared.totals.priorCertifiedAmountTotal;
    }
    if (prepared.totals.certifiedCurrentAmountTotal) {
      out.certified_curr_amt = prepared.totals.certifiedCurrentAmountTotal;
    }
    if (prepared.totals.revisedContractLineTotal) {
      out.contract_line_amount = prepared.totals.revisedContractLineTotal;
    }
    return out;
  }
  if (prepared.templateCode === 'T6_PROGRESS_BILLING') {
    const out: Record<string, string> = {};
    if (prepared.totals.priorCertifiedAmountTotal) {
      out.prior_certified_amt = prepared.totals.priorCertifiedAmountTotal;
    }
    if (prepared.totals.certifiedCurrentAmountTotal) {
      out.certified_curr_amt = prepared.totals.certifiedCurrentAmountTotal;
    }
    if (prepared.totals.grossBillingTotal) {
      out.gross_billing = prepared.totals.grossBillingTotal;
    }
    if (prepared.totals.retentionTotal) {
      out.retention_amt = prepared.totals.retentionTotal;
    }
    if (prepared.totals.advanceRecoupmentTotal) {
      out.advance_recoup = prepared.totals.advanceRecoupmentTotal;
    }
    if (prepared.totals.vatWithholdingTotal) {
      out.vat_withholding_amount = prepared.totals.vatWithholdingTotal;
    }
    if (prepared.totals.ewtWithholdingTotal) {
      out.ewt_withholding_amount = prepared.totals.ewtWithholdingTotal;
    }
    if (prepared.totals.withholdingTotal) {
      out.withholding_amt = prepared.totals.withholdingTotal;
    }
    if (prepared.totals.netCertifiedDueTotal) {
      out.net_certified_due = prepared.totals.netCertifiedDueTotal;
    }
    if (prepared.totals.paymentReceivedTotal) {
      out.payment_received = prepared.totals.paymentReceivedTotal;
    }
    return out;
  }
  if (prepared.templateCode === 'T11_VARIATION_ORDER_REGISTER') {
    const out: Record<string, string> = {};
    if (prepared.totals.clientVoRevenueDeltaTotal !== undefined && prepared.totals.clientVoRevenueDeltaTotal !== null) {
      out.vo_client_revenue_delta_amt = prepared.totals.clientVoRevenueDeltaTotal;
    }
    if (
      prepared.totals.subconCommitmentVoDeltaTotal !== undefined &&
      prepared.totals.subconCommitmentVoDeltaTotal !== null
    ) {
      out.vo_subcon_commitment_delta_amt = prepared.totals.subconCommitmentVoDeltaTotal;
    }
    return out;
  }
  return {};
}

export async function renderFormalExportToXlsxBuffer(
  prepared: PreparedFormalExport
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const mainTitle =
    prepared.templateCode === 'T0_MASTER_CONTRACT'
      ? 'T0_Formal_Contract'
      : prepared.templateCode === 'T4_RESOURCE_TAKEOFF'
        ? 'T4_Formal_Resource_Takeoff'
        : prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT'
          ? 'T5_Formal_Accomplishment_SWA'
          : prepared.templateCode === 'T6_PROGRESS_BILLING'
            ? 'T6_Formal_Progress_Billing'
            : prepared.templateCode === 'T11_VARIATION_ORDER_REGISTER'
              ? 'T11_Formal_VO_Register'
              : 'T1_Formal_Phase_BOQ';
  const ws = wb.addWorksheet(mainTitle);

  // Header row (Row 1) — strictly canonical/aliased headings, zero invented agency/signatory blocks
  const headerRow = ws.addRow(prepared.projection.visibleColumns.map((c) => c.heading));
  headerRow.font = { bold: true };

  let allAmountsNumeric = true;
  for (const row of prepared.projection.projectedRows) {
    const excelValues: ExcelJS.CellValue[] = prepared.projection.visibleColumns.map((col) => {
      const val = row.visible[col.fieldId];
      if (val === null || val === undefined) return '';
      if (
        SIX_DP_FIELDS.has(col.fieldId) ||
        FOUR_DP_FIELDS.has(col.fieldId) ||
        TWO_DP_FIELDS.has(col.fieldId)
      ) {
        const num = toSafeExcelNumber(String(val));
        if (num === null) {
          if (TWO_DP_FIELDS.has(col.fieldId)) {
            allAmountsNumeric = false;
          }
          return String(val);
        }
        return num;
      }
      if (typeof val === 'string') {
        // Neutralize leading spreadsheet formula characters in text cells
        return neutralizeSpreadsheetFormulaForCsv(inspectCellSecurity(val).sanitizedText);
      }
      return val as ExcelJS.CellValue;
    });
    const added = ws.addRow(excelValues);
    prepared.projection.visibleColumns.forEach((col, i) => {
      const cell = added.getCell(i + 1);
      if (typeof cell.value === 'number') {
        if (SIX_DP_FIELDS.has(col.fieldId)) cell.numFmt = '#,##0.000000';
        else if (FOUR_DP_FIELDS.has(col.fieldId)) cell.numFmt = '#,##0.0000';
        else if (TWO_DP_FIELDS.has(col.fieldId)) cell.numFmt = '#,##0.00';
      }
    });
  }

  // Formal T1 total row with accurate Excel SUM formula + exact Prisma.Decimal result
  if (
    prepared.templateCode === 'T1_PHASE_BOQ' &&
    prepared.totals.approvedLineTotal !== null
  ) {
    const firstDataRow = 2;
    const lastDataRow = prepared.projection.projectedRows.length + 1;
    const totalCells: ExcelJS.CellValue[] = prepared.projection.visibleColumns.map((col, idx) => {
      if (idx === 0 && col.fieldId !== 'contract_line_amount') {
        return 'TOTAL APPROVED CONTRACT BOQ';
      }
      if (col.fieldId === 'contract_line_amount') {
        const safeTotal = toSafeExcelNumber(prepared.totals.approvedLineTotal!);
        if (allAmountsNumeric && safeTotal !== null) {
          const colLetter = columnIndexToLetter(idx + 1);
          return {
            formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
            result: safeTotal,
          };
        }
        return prepared.totals.approvedLineTotal!;
      }
      return '';
    });
    const totalRow = ws.addRow(totalCells);
    totalRow.font = { bold: true };
    const amtIdx = prepared.projection.visibleColumns.findIndex(
      (c) => c.fieldId === 'contract_line_amount'
    );
    if (amtIdx >= 0 && allAmountsNumeric) {
      totalRow.getCell(amtIdx + 1).numFmt = '#,##0.00';
    }
  }

  // Formal T4 total row with live Excel SUM formula on procurement_budget (target_resource_cost stays NO_SUM)
  if (
    prepared.templateCode === 'T4_RESOURCE_TAKEOFF' &&
    prepared.totals.procurementBudgetTotal
  ) {
    const firstDataRow = 2;
    const lastDataRow = prepared.projection.projectedRows.length + 1;
    const totalCells: ExcelJS.CellValue[] = prepared.projection.visibleColumns.map((col, idx) => {
      if (idx === 0 && col.fieldId !== 'procurement_budget') {
        return 'TOTAL PROCUREMENT BUDGET CEILING';
      }
      if (col.fieldId === 'procurement_budget') {
        const safeTotal = toSafeExcelNumber(prepared.totals.procurementBudgetTotal!);
        if (allAmountsNumeric && safeTotal !== null) {
          const colLetter = columnIndexToLetter(idx + 1);
          return {
            formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
            result: safeTotal,
          };
        }
        return prepared.totals.procurementBudgetTotal!;
      }
      return '';
    });
    const totalRow = ws.addRow(totalCells);
    totalRow.font = { bold: true };
    const budgetIdx = prepared.projection.visibleColumns.findIndex(
      (c) => c.fieldId === 'procurement_budget'
    );
    if (budgetIdx >= 0 && allAmountsNumeric) {
      totalRow.getCell(budgetIdx + 1).numFmt = '#,##0.00';
    }
  }

  // Formal T5 / T6 / T11 total row with live Excel SUM formulas on summable currency columns;
  // contract_unit_rate, current_contract_value, and multi-UOM quantities stay NO_SUM
  if (
    prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT' ||
    prepared.templateCode === 'T6_PROGRESS_BILLING' ||
    prepared.templateCode === 'T11_VARIATION_ORDER_REGISTER'
  ) {
    const summableMap = getBatchBFormalSummableTotals(prepared);
    const firstDataRow = 2;
    const lastDataRow = prepared.projection.projectedRows.length + 1;
    const hasDataRows = prepared.projection.projectedRows.length > 0;
    const rowLabel =
      prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT'
        ? 'TOTAL CERTIFIED ACCOMPLISHMENT (SWA)'
        : prepared.templateCode === 'T6_PROGRESS_BILLING'
          ? 'TOTAL CERTIFIED PROGRESS BILLING'
          : 'TOTAL APPROVED VARIATION REGISTER';

    const totalCells: ExcelJS.CellValue[] = prepared.projection.visibleColumns.map((col, idx) => {
      const exactSumStr = summableMap[col.fieldId];
      if (exactSumStr !== undefined) {
        const safeTotal = toSafeExcelNumber(exactSumStr);
        if (allAmountsNumeric && safeTotal !== null) {
          if (hasDataRows) {
            const colLetter = columnIndexToLetter(idx + 1);
            return {
              formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
              result: safeTotal,
            };
          }
          return safeTotal;
        }
        return exactSumStr;
      }
      if (
        prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT' &&
        col.fieldId === 'physical_progress_pct' &&
        prepared.totals.weightedPhysicalProgressPct
      ) {
        const safePct = toSafeExcelNumber(prepared.totals.weightedPhysicalProgressPct);
        return safePct ?? prepared.totals.weightedPhysicalProgressPct;
      }
      if (idx === 0) {
        return rowLabel;
      }
      return '';
    });

    const totalRow = ws.addRow(totalCells);
    totalRow.font = { bold: true };
    prepared.projection.visibleColumns.forEach((col, idx) => {
      if (summableMap[col.fieldId] !== undefined && allAmountsNumeric) {
        totalRow.getCell(idx + 1).numFmt = '#,##0.00';
      } else if (
        prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT' &&
        col.fieldId === 'physical_progress_pct'
      ) {
        const cell = totalRow.getCell(idx + 1);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0.0000';
      }
    });
  }

  // Worksheet 2: Formal_Contract_Summary (contract identity, layout identity, pricing basis, phase subtotals, missing external spec record)
  const summaryWs = wb.addWorksheet('Formal_Contract_Summary');
  summaryWs.addRow(['key', 'value']).font = { bold: true };
  const kvPairs: Array<[string, string]> = [
    ['formal_contract_code', prepared.contractSpec.contractCode],
    ['formal_contract_title', prepared.contractSpec.contractTitle],
    ['template_code', prepared.templateCode],
    ['row_grain', prepared.contractSpec.rowGrain],
    ['project_id', prepared.projectId],
    ['source_type', prepared.sourceIdentity.sourceType],
    ['source_id', prepared.sourceIdentity.sourceId],
    ['source_version', prepared.sourceIdentity.sourceVersion],
    ['source_approved_by_id', prepared.sourceIdentity.approvedById],
    ['source_approved_at', prepared.sourceIdentity.approvedAt],
    ['source_canonical_hash', prepared.sourceIdentity.canonicalHash ?? 'N/A'],
    ['source_evidence_hash', prepared.sourceIdentity.sourceEvidenceHash ?? 'N/A'],
    ['layout_mode', prepared.layoutIdentity.mode],
    ['layout_definition_id', prepared.layoutIdentity.layoutDefinitionId ?? 'SYSTEM_FORMAL_PRESET'],
    ['layout_group_id', prepared.layoutIdentity.layoutGroupId ?? 'SYSTEM_FORMAL_PRESET'],
    ['layout_version_number', String(prepared.layoutIdentity.layoutVersionNumber)],
    ['layout_name', prepared.layoutIdentity.templateName],
    ['layout_sharing_scope', prepared.layoutIdentity.sharingScope],
    ['layout_definition_hash', prepared.layoutIdentity.definitionHash],
    [
      'contract_association_status',
      prepared.pricingAndBillingBasis.contractAssociationStatus,
    ],
    [
      'linked_contract_authority_id',
      prepared.pricingAndBillingBasis.linkedContractAuthorityId ?? 'NONE_UNLINKED',
    ],
    [
      'project_approved_contract_count',
      String(prepared.pricingAndBillingBasis.projectApprovedContractCount),
    ],
    ['pricing_method', prepared.pricingAndBillingBasis.pricingMethod ?? 'UNSET'],
    ['contract_vat_basis', prepared.pricingAndBillingBasis.contractVatBasis ?? 'UNSET'],
    ['tax_profile_version', prepared.pricingAndBillingBasis.taxProfileVersion ?? 'UNSET'],
    ['sector_type', prepared.pricingAndBillingBasis.sectorType ?? 'UNSET'],
    ['row_count', String(prepared.totals.rowCount)],
    [
      'original_contract_award_amount_exact',
      prepared.totals.originalContractAwardAmount ?? 'N/A',
    ],
    ['awarded_revenue_ex_vat_exact', prepared.totals.awardedRevenueExVat ?? 'N/A'],
    [
      'current_approved_contract_value_exact',
      prepared.totals.currentApprovedContractValue ?? 'N/A',
    ],
    ['approved_line_total_exact', prepared.totals.approvedLineTotal ?? 'N/A'],
    ['approved_line_total_ex_vat_exact', prepared.totals.approvedLineTotalExVat ?? 'N/A'],
    ['procurement_budget_total_exact', prepared.totals.procurementBudgetTotal ?? 'N/A'],
    [
      'certified_current_amount_total_exact',
      prepared.totals.certifiedCurrentAmountTotal ?? 'N/A',
    ],
    ['prior_certified_amount_total_exact', prepared.totals.priorCertifiedAmountTotal ?? 'N/A'],
    ['weighted_physical_progress_pct', prepared.totals.weightedPhysicalProgressPct ?? 'N/A'],
    ['gross_billing_total_exact', prepared.totals.grossBillingTotal ?? 'N/A'],
    ['retention_total_exact', prepared.totals.retentionTotal ?? 'N/A'],
    ['advance_recoupment_total_exact', prepared.totals.advanceRecoupmentTotal ?? 'N/A'],
    ['withholding_total_exact', prepared.totals.withholdingTotal ?? 'N/A'],
    ['net_certified_due_total_exact', prepared.totals.netCertifiedDueTotal ?? 'N/A'],
    ['payment_received_total_exact', prepared.totals.paymentReceivedTotal ?? 'N/A'],
    [
      'client_vo_revenue_delta_total_exact',
      prepared.totals.clientVoRevenueDeltaTotal ?? 'N/A',
    ],
    [
      'client_vo_revenue_delta_ex_vat_total_exact',
      prepared.totals.clientVoRevenueDeltaExVatTotal ?? 'N/A',
    ],
    [
      'subcon_commitment_vo_delta_total_exact',
      prepared.totals.subconCommitmentVoDeltaTotal ?? 'N/A',
    ],
    [
      'diagnostic_rate_times_qty_sum_exact',
      prepared.totals.diagnosticRateTimesApprovedQtySum ?? 'N/A',
    ],
    [
      'diagnostic_line_variance_count',
      String(prepared.totals.diagnosticLineVarianceCount),
    ],
    [
      'external_agency_specification_status',
      prepared.contractSpec.externalAgencySpecStatus,
    ],
    [
      'missing_external_contracts',
      prepared.contractSpec.missingExternalContracts.join(', '),
    ],
    ['invented_agency_or_signatory_fields', 'NONE'],
  ];
  for (const [k, v] of kvPairs) {
    summaryWs.addRow([k, v]);
  }
  for (const sub of prepared.totals.phaseSubtotals) {
    summaryWs.addRow([
      `phase_subtotal:${sub.phaseCode}`,
      `lines=${sub.lineCount};amount=${sub.contractLineSubtotal};ex_vat=${sub.contractAmountExVatSubtotal}`,
    ]);
  }
  for (const uomSub of prepared.totals.uomQuantitySubtotals ?? []) {
    summaryWs.addRow([
      `uom_subtotal:${uomSub.resourceUnit}`,
      `resources=${uomSub.resourceCount};required=${uomSub.requiredQtySubtotal};stock=${uomSub.stockAvailableQtySubtotal};to_procure=${uomSub.resourceToProcureSubtotal};budget=${uomSub.procurementBudgetSubtotal}`,
    ]);
  }

  // Worksheet 3: __OSERP_META (veryHidden source-field & canonical line traceability)
  const metaWs = wb.addWorksheet('__OSERP_META');
  metaWs.state = 'veryHidden';
  metaWs.addRow(['worksheet_row_index', ...prepared.traceabilityFields]);
  prepared.projection.projectedRows.forEach((r, idx) => {
    metaWs.addRow([
      idx + 2,
      ...prepared.traceabilityFields.map((k) => {
        const raw = r.__oserpMeta[k];
        if (raw === null || raw === undefined) return '';
        return String(raw);
      }),
    ]);
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function renderFormalExportToCsvString(prepared: PreparedFormalExport): string {
  const escapeCsv = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    const rawStr = String(v);
    const cleaned = inspectCellSecurity(rawStr).sanitizedText;
    const safeStr = neutralizeSpreadsheetFormulaForCsv(
      rawStr.startsWith('\t') || rawStr.startsWith('\r') ? rawStr : cleaned
    );
    if (/[",\r\n]/.test(safeStr)) {
      return `"${safeStr.replace(/"/g, '""')}"`;
    }
    return safeStr;
  };

  const lines: string[] = [];
  lines.push(prepared.projection.visibleColumns.map((c) => escapeCsv(c.heading)).join(','));
  for (const row of prepared.projection.projectedRows) {
    lines.push(
      prepared.projection.visibleColumns
        .map((c) => escapeCsv(row.visible[c.fieldId]))
        .join(',')
    );
  }

  if (
    prepared.templateCode === 'T1_PHASE_BOQ' &&
    prepared.totals.approvedLineTotal !== null
  ) {
    const totalLine = prepared.projection.visibleColumns
      .map((col, idx) => {
        if (idx === 0 && col.fieldId !== 'contract_line_amount') {
          return 'TOTAL_APPROVED_CONTRACT_BOQ';
        }
        if (col.fieldId === 'contract_line_amount') {
          return prepared.totals.approvedLineTotal!;
        }
        return '';
      })
      .join(',');
    lines.push(totalLine);
  }

  if (
    prepared.templateCode === 'T4_RESOURCE_TAKEOFF' &&
    prepared.totals.procurementBudgetTotal
  ) {
    const totalLine = prepared.projection.visibleColumns
      .map((col, idx) => {
        if (idx === 0 && col.fieldId !== 'procurement_budget') {
          return 'TOTAL_PROCUREMENT_BUDGET_CEILING';
        }
        if (col.fieldId === 'procurement_budget') {
          return prepared.totals.procurementBudgetTotal!;
        }
        return '';
      })
      .join(',');
    lines.push(totalLine);
  }

  if (
    prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT' ||
    prepared.templateCode === 'T6_PROGRESS_BILLING' ||
    prepared.templateCode === 'T11_VARIATION_ORDER_REGISTER'
  ) {
    const summableMap = getBatchBFormalSummableTotals(prepared);
    const csvLabel =
      prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT'
        ? 'TOTAL_CERTIFIED_ACCOMPLISHMENT_SWA'
        : prepared.templateCode === 'T6_PROGRESS_BILLING'
          ? 'TOTAL_CERTIFIED_PROGRESS_BILLING'
          : 'TOTAL_APPROVED_VARIATION_REGISTER';
    const totalLine = prepared.projection.visibleColumns
      .map((col, idx) => {
        if (summableMap[col.fieldId] !== undefined) {
          return summableMap[col.fieldId];
        }
        if (
          prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT' &&
          col.fieldId === 'physical_progress_pct' &&
          prepared.totals.weightedPhysicalProgressPct
        ) {
          return prepared.totals.weightedPhysicalProgressPct;
        }
        if (idx === 0) return csvLabel;
        return '';
      })
      .join(',');
    lines.push(totalLine);
  }

  return lines.join('\n');
}

export function buildFormalExportJsonPayload(
  prepared: PreparedFormalExport,
  provenance?: { auditEventId: string }
) {
  return {
    formalExport: true,
    workingCopyOnly: false,
    contract: {
      contractCode: prepared.contractSpec.contractCode,
      contractTitle: prepared.contractSpec.contractTitle,
      templateCode: prepared.templateCode,
      rowGrain: prepared.contractSpec.rowGrain,
      externalAgencySpecStatus: prepared.contractSpec.externalAgencySpecStatus,
      missingExternalContracts: prepared.contractSpec.missingExternalContracts,
      inventedAgencyOrSignatoryFields: prepared.contractSpec.inventedAgencyOrSignatoryFields,
    },
    layout: prepared.layoutIdentity,
    source: prepared.sourceIdentity,
    pricingAndBillingBasis: prepared.pricingAndBillingBasis,
    totals: prepared.totals,
    decimalEncoding: 'exact-decimal-text' as const,
    rowCount: prepared.totals.rowCount,
    approvedLineTotal: prepared.totals.approvedLineTotal,
    procurementBudgetTotal: prepared.totals.procurementBudgetTotal ?? null,
    certifiedCurrentAmountTotal: prepared.totals.certifiedCurrentAmountTotal ?? null,
    netCertifiedDueTotal: prepared.totals.netCertifiedDueTotal ?? null,
    clientVoRevenueDeltaTotal: prepared.totals.clientVoRevenueDeltaTotal ?? null,
    projection: prepared.projection,
    ...(provenance
      ? {
          provenance: {
            auditEventId: provenance.auditEventId,
            digestAlgorithm: 'SHA-256' as const,
            digestHeader: 'X-OSERP-Output-Sha256' as const,
          },
        }
      : {}),
  };
}

export function hashExportPayload(payload: Buffer | string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function recordFormalExportProvenance(
  db: Prisma.TransactionClient,
  prepared: PreparedFormalExport,
  format: FormalExportFormat,
  outputSha256: string,
  auditEventId?: string
) {
  const eventId = auditEventId ?? `utae_${crypto.randomUUID().replaceAll('-', '')}`;
  const details = {
    contractCode: prepared.contractSpec.contractCode,
    externalAgencySpecStatus: prepared.contractSpec.externalAgencySpecStatus,
    missingExternalContracts: prepared.contractSpec.missingExternalContracts,
    contractAssociationStatus: prepared.pricingAndBillingBasis.contractAssociationStatus,
    linkedContractAuthorityId: prepared.pricingAndBillingBasis.linkedContractAuthorityId,
    projectApprovedContractCount: prepared.pricingAndBillingBasis.projectApprovedContractCount,
    layoutMode: prepared.layoutIdentity.mode,
    layoutDefinitionHash: prepared.layoutIdentity.definitionHash,
    selectedFields: prepared.layoutIdentity.selectedFields,
    rowCount: prepared.totals.rowCount,
    approvedLineTotal: prepared.totals.approvedLineTotal,
    procurementBudgetTotal: prepared.totals.procurementBudgetTotal ?? null,
    certifiedCurrentAmountTotal: prepared.totals.certifiedCurrentAmountTotal ?? null,
    priorCertifiedAmountTotal: prepared.totals.priorCertifiedAmountTotal ?? null,
    cumulativeCertifiedAmountTotal: prepared.totals.cumulativeCertifiedAmountTotal ?? null,
    revisedContractLineTotal: prepared.totals.revisedContractLineTotal ?? null,
    grossBillingTotal: prepared.totals.grossBillingTotal ?? null,
    retentionTotal: prepared.totals.retentionTotal ?? null,
    advanceRecoupmentTotal: prepared.totals.advanceRecoupmentTotal ?? null,
    vatWithholdingTotal: prepared.totals.vatWithholdingTotal ?? null,
    ewtWithholdingTotal: prepared.totals.ewtWithholdingTotal ?? null,
    withholdingTotal: prepared.totals.withholdingTotal ?? null,
    otherDeductionsTotal: prepared.totals.otherDeductionsTotal ?? null,
    netCertifiedDueTotal: prepared.totals.netCertifiedDueTotal ?? null,
    paymentReceivedTotal: prepared.totals.paymentReceivedTotal ?? null,
    clientVoRevenueDeltaTotal: prepared.totals.clientVoRevenueDeltaTotal ?? null,
    clientVoRevenueDeltaExVatTotal: prepared.totals.clientVoRevenueDeltaExVatTotal ?? null,
    currentApprovedContractValue: prepared.totals.currentApprovedContractValue,
    pricingMethod: prepared.pricingAndBillingBasis.pricingMethod,
    contractVatBasis: prepared.pricingAndBillingBasis.contractVatBasis,
  };
  const detailsSerialized = JSON.stringify(details);

  const appended = await db.$queryRaw<Array<{ id: string; outputSha256: string | null }>>`
    SELECT id, "outputSha256"
    FROM public.uboq_append_template_audit_event(
      ${eventId}::text,
      ${prepared.projectId}::text,
      ${prepared.layoutIdentity.layoutGroupId}::text,
      ${prepared.layoutIdentity.layoutDefinitionId}::text,
      ${prepared.layoutIdentity.layoutVersionNumber}::integer,
      ${prepared.layoutIdentity.layoutOwnerId}::text,
      ${prepared.layoutIdentity.sharingScope}::text,
      ${prepared.templateCode}::text,
      ${'FORMAL_EXPORT_GENERATED'}::text,
      ${prepared.actorId}::text,
      ${prepared.actorRole}::text,
      ${prepared.sourceIdentity.sourceId}::text,
      ${prepared.sourceIdentity.sourceVersion}::text,
      ${prepared.contractSpec.contractCode}::text,
      ${format}::text,
      ${outputSha256}::text,
      ${detailsSerialized}::jsonb
    )
  `;
  const auditEvent = appended[0] ?? { id: eventId, outputSha256 };

  const dataClassification =
    prepared.templateCode === 'T4_RESOURCE_TAKEOFF'
      ? 'RESTRICTED_PROCUREMENT_BUDGET'
      : prepared.templateCode === 'T5_ACCOMPLISHMENT_CERT'
        ? 'RESTRICTED_ACCOMPLISHMENT_SWA'
        : prepared.templateCode === 'T6_PROGRESS_BILLING'
          ? 'RESTRICTED_PROGRESS_BILLING'
          : prepared.templateCode === 'T11_VARIATION_ORDER_REGISTER'
            ? prepared.layoutIdentity.selectedFields.includes('vo_subcon_commitment_delta_amt')
              ? 'SENSITIVE_EXECUTIVE_FINANCIAL'
              : 'RESTRICTED_VARIATION_REGISTER'
            : 'RESTRICTED_CONTRACTUAL';
  const formalSelId = `sel_formal_${crypto.randomUUID().replaceAll('-', '')}`;
  const formalExportProof = mintSensitiveExportAttestation({
    id: formalSelId,
    projectId: prepared.projectId,
    userId: prepared.actorId,
    templateCode: prepared.templateCode,
    format: format.toUpperCase(),
    sourceId: prepared.sourceIdentity.sourceId,
    recordCount: prepared.totals.rowCount,
    approved: true,
    blocked: false,
    outputSha256: auditEvent.outputSha256 ?? outputSha256,
  });

  await db.$queryRaw`
    SELECT (public.uboq_append_formal_sensitive_export_log(
      ${formalSelId}::text,
      ${auditEvent.id}::text,
      ${dataClassification}::text,
      ${formalExportProof}::text
    )).id AS id
  `;

  await db.auditLog.create({
    data: {
      userId: prepared.actorId,
      userRole: prepared.actorRole,
      moduleName: 'UBOQ_FORMAL_EXPORTS',
      transactionId: auditEvent.id,
      actionType: 'FORMAL_EXPORT_GENERATED',
      oldValue: null,
      newValue: JSON.stringify({
        projectId: prepared.projectId,
        sourceId: prepared.sourceIdentity.sourceId,
        sourceVersion: prepared.sourceIdentity.sourceVersion,
        layoutDefinitionId: prepared.layoutIdentity.layoutDefinitionId,
        layoutVersionNumber: prepared.layoutIdentity.layoutVersionNumber,
        outputSha256,
        format,
        ...details,
      }),
      remarks: `Formal ${prepared.contractSpec.contractCode} (${format.toUpperCase()}) generated`,
    },
  });

  return auditEvent;
}
