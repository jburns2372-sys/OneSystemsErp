import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { CANONICAL_FIELD_MAP, T12_SAFE_DERIVED_VARIANCE_SPECS } from '../field-catalog';
import {
  inspectCellSecurity,
  neutralizeSpreadsheetFormulaForCsv,
} from '../intake/security-guard';
import { assertProjectGraphOwnership } from '../project-ownership';
import { canRoleAccessField, getPermittedVisibilityTiers } from '../security/redact-payload';
import { assertUboqStageAuthorization } from '../security/stage-rbac';
import {
  buildTemplateProjection,
  exportProjectionToXlsxBuffer,
  isMisleadingActualTreasuryHeadingAlias,
  isMisleadingT11RevisedQuantityHeadingAlias,
  resolveT11QuantityDefaultHeading,
  resolveT12PeriodBalanceDefaultHeading,
  SYSTEM_TEMPLATE_PRESETS,
} from '../template-builder';
import {
  type ActiveBatchTemplateCode,
  ALLOWED_TEMPLATE_FIELDS,
  CanonicalAdapterError,
  filterSystemMetaFieldsForRoles,
  isActiveBatchTemplateCode,
  listBatchTemplateCatalogSources,
  type LoadedTemplateCanonicalData,
  loadT2ConsolidatedBoqCanonicalData,
  loadT3AgencyEstimateCanonicalData,
  loadT4ResourceTakeoffCanonicalData,
  loadT5AccomplishmentCertCanonicalData,
  loadT6ProgressBillingCanonicalData,
  loadT7ScheduleEvmCanonicalData,
  loadT8CashflowHalfMonthCanonicalData,
  loadT9CashflowQuarterlyCanonicalData,
  loadT10ExecutiveMarginCanonicalData,
  loadT11VariationOrderRegisterCanonicalData,
  loadT12CashflowVarianceTreasuryCanonicalData,
  PRIMARY_TOTAL_AMOUNT_FIELD,
  resolveNarrowestFieldRole,
} from './canonical-source-adapters';

export type InitialTemplateCode = ActiveBatchTemplateCode;

export interface InitialTemplateRequest {
  projectId: string;
  templateCode: InitialTemplateCode;
  sourceId: string;
  selectedFields?: string[];
  headingAliases?: Record<string, string>;
  format: 'json' | 'xlsx' | 'csv';
}

export class TemplateRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400
  ) {
    super(code);
  }
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

export function parseInitialTemplateRequest(value: unknown): InitialTemplateRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TemplateRequestError('TEMPLATE_INVALID_REQUEST');
  }
  const x = value as Record<string, unknown>;
  const keys = new Set([
    'projectId',
    'templateCode',
    'sourceId',
    'selectedFields',
    'headingAliases',
    'format',
  ]);
  if (Object.keys(x).some((k) => !keys.has(k))) {
    throw new TemplateRequestError('TEMPLATE_UNSUPPORTED_OPTION');
  }
  if (!validId(x.projectId) || !validId(x.sourceId)) {
    throw new TemplateRequestError('TEMPLATE_SOURCE_REQUIRED');
  }
  if (!isActiveBatchTemplateCode(x.templateCode)) {
    throw new TemplateRequestError('TEMPLATE_CODE_NOT_IN_INCREMENT');
  }
  if (
    x.format !== undefined &&
    (typeof x.format !== 'string' || !['json', 'xlsx', 'csv'].includes(x.format))
  ) {
    throw new TemplateRequestError('TEMPLATE_FORMAT_NOT_SUPPORTED');
  }
  const permitted = ALLOWED_TEMPLATE_FIELDS[x.templateCode];
  if (
    x.selectedFields !== undefined &&
    (!Array.isArray(x.selectedFields) ||
      !x.selectedFields.length ||
      x.selectedFields.length > permitted.length ||
      x.selectedFields.some((f) => typeof f !== 'string' || !permitted.includes(f)) ||
      new Set(x.selectedFields).size !== x.selectedFields.length)
  ) {
    throw new TemplateRequestError('TEMPLATE_INVALID_COLUMNS');
  }
  if (x.headingAliases !== undefined) {
    if (
      !x.headingAliases ||
      typeof x.headingAliases !== 'object' ||
      Array.isArray(x.headingAliases)
    ) {
      throw new TemplateRequestError('TEMPLATE_INVALID_HEADINGS');
    }
    for (const [key, heading] of Object.entries(x.headingAliases)) {
      if (
        !permitted.includes(key) ||
        typeof heading !== 'string' ||
        !heading.trim() ||
        heading.length > 120 ||
        /[\x00-\x1f\x7f]/.test(heading) ||
        /^\s*[=+@-]/.test(heading)
      ) {
        throw new TemplateRequestError('TEMPLATE_INVALID_HEADINGS');
      }
    }
  }
  return {
    projectId: x.projectId,
    templateCode: x.templateCode,
    sourceId: x.sourceId,
    selectedFields: x.selectedFields as string[] | undefined,
    headingAliases: x.headingAliases as Record<string, string> | undefined,
    format: (x.format ?? 'json') as InitialTemplateRequest['format'],
  };
}

const GLOBAL_ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'PRESIDENT',
  'VP_OPERATIONS',
]);

const READ_ONLY_LEVELS = new Set([
  'VIEWER',
  'VIEW_ONLY',
  'READ_ONLY',
  'OBSERVER',
  'GUEST',
  'EXTERNAL_VIEWER',
]);

interface ActorTemplateAccess {
  effectiveRole: string;
  fieldAccessRole: string;
  projectionRole: string;
}

function canActorAccessTemplateField(access: ActorTemplateAccess, fieldId: string): boolean {
  return (
    canRoleAccessField(access.effectiveRole, fieldId) &&
    canRoleAccessField(access.fieldAccessRole, fieldId)
  );
}

async function authorize(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string
): Promise<ActorTemplateAccess> {
  if (!validId(projectId)) throw new TemplateRequestError('TEMPLATE_PROJECT_REQUIRED');
  const authority = await assertUboqStageAuthorization(db, {
    userId: actorId,
    projectId,
    capability: 'UBOQ_VIEW',
  });
  await assertProjectGraphOwnership(db, {
    userId: actorId,
    userRole: authority.effectiveRole,
    projectId,
  });

  const normRole = authority.effectiveRole.trim().toUpperCase();
  if (GLOBAL_ADMIN_ROLES.has(normRole)) {
    return { effectiveRole: normRole, fieldAccessRole: normRole, projectionRole: normRole };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true },
  });
  if (!project) {
    throw new TemplateRequestError('TEMPLATE_ACCESS_DENIED', 403);
  }
  if (project.managerId === actorId) {
    return { effectiveRole: normRole, fieldAccessRole: normRole, projectionRole: normRole };
  }

  const assignment = await db.projectUserAssignment.findFirst({
    where: {
      projectId,
      userId: actorId,
      assignmentStatus: { in: ['active', 'ACTIVE'] },
    },
    select: { id: true, projectRole: true, accessLevel: true },
    orderBy: { id: 'asc' },
  });
  if (!assignment) {
    throw new TemplateRequestError('TEMPLATE_ACCESS_DENIED', 403);
  }

  const assignAccess = (assignment.accessLevel || '').trim().toUpperCase();
  const assignRole = (assignment.projectRole || '').trim().toUpperCase();
  const isReadOnlyAssignment =
    READ_ONLY_LEVELS.has(assignAccess) || READ_ONLY_LEVELS.has(assignRole);
  const narrowedProjRole =
    assignRole && !['MEMBER', 'STANDARD', 'FULL'].includes(assignRole) ? assignRole : null;
  const fieldAccessRole = isReadOnlyAssignment
    ? 'EXTERNAL_VIEWER'
    : narrowedProjRole ?? normRole;

  return {
    effectiveRole: normRole,
    fieldAccessRole,
    projectionRole: resolveNarrowestFieldRole(normRole, fieldAccessRole),
  };
}

export async function listInitialTemplateSources(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string
) {
  const access = await authorize(db, actorId, projectId);
  const templates = await listBatchTemplateCatalogSources(
    db,
    access.effectiveRole,
    projectId,
    access.fieldAccessRole
  );
  return { templates, workingCopyOnly: true };
}

function mapAdapterFailure(err: unknown): never {
  if (err instanceof CanonicalAdapterError) {
    throw new TemplateRequestError(err.code, err.status);
  }
  throw err;
}

function resolveDefaultTemplateHeading(
  templateCode: InitialTemplateCode,
  fieldId: string,
  t12ActualTreasuryLiquidityVerified = false
): string {
  if (templateCode === 'T11_VARIATION_ORDER_REGISTER') {
    const t11Heading = resolveT11QuantityDefaultHeading(fieldId);
    if (t11Heading) return t11Heading;
  }
  if (templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY') {
    const t12Heading = resolveT12PeriodBalanceDefaultHeading(
      fieldId,
      t12ActualTreasuryLiquidityVerified
    );
    if (t12Heading) return t12Heading;
  }
  return (
    CANONICAL_FIELD_MAP.get(fieldId)?.suggestedHeading ??
    T12_SAFE_DERIVED_VARIANCE_SPECS.get(fieldId)?.suggestedHeading ??
    fieldId
  );
}

export async function buildInitialTemplate(
  db: Prisma.TransactionClient,
  actorId: string,
  input: InitialTemplateRequest
) {
  // Revalidate at service boundary: callers cannot inject grain, formulas, rows or role.
  input = parseInitialTemplateRequest(input);
  const access = await authorize(db, actorId, input.projectId);
  const fields =
    input.selectedFields ??
    SYSTEM_TEMPLATE_PRESETS[input.templateCode].defaultFields.filter((f) =>
      canActorAccessTemplateField(access, f)
    );
  if (
    !fields.length ||
    fields.some((f) => !canActorAccessTemplateField(access, f)) ||
    Object.keys(input.headingAliases ?? {}).some((f) => !fields.includes(f))
  ) {
    throw new TemplateRequestError('TEMPLATE_FIELD_FORBIDDEN', 403);
  }
  const headings = fields.map((f) =>
    (input.headingAliases?.[f] || resolveDefaultTemplateHeading(input.templateCode, f))
      .trim()
      .toLowerCase()
  );
  if (new Set(headings).size !== headings.length) {
    throw new TemplateRequestError('TEMPLATE_DUPLICATE_HEADINGS');
  }

  let rows: Array<Record<string, unknown>>;
  let sourceVersion: string;
  let meta: readonly string[];
  let cashFlowSummary: LoadedTemplateCanonicalData['cashFlowSummary'] | null = null;
  let executiveMarginSummary: LoadedTemplateCanonicalData['executiveMarginSummary'] | null = null;
  let variationRegisterSummary: LoadedTemplateCanonicalData['variationRegisterSummary'] | null =
    null;
  let treasuryVarianceSummary: LoadedTemplateCanonicalData['treasuryVarianceSummary'] | null = null;

  if (input.templateCode === 'T0_MASTER_CONTRACT') {
    const c = await db.uboqContractAuthority.findFirst({
      where: {
        id: input.sourceId,
        projectId: input.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      select: {
        id: true,
        projectId: true,
        clientName: true,
        contractRef: true,
        noaRef: true,
        ntpRef: true,
        clientPoRef: true,
        voReference: true,
        awardedRevenueExVat: true,
        currentContractValue: true,
        contractDurationDays: true,
        commencementDate: true,
        pricingMethod: true,
        contractVatBasis: true,
        taxProfile: { select: { projectId: true, profileCode: true, versionCode: true } },
      },
    });
    if (!c) throw new TemplateRequestError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
    if (c.taxProfile && c.taxProfile.projectId !== input.projectId) {
      throw new TemplateRequestError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    sourceVersion = c.id;
    rows = [
      {
        project_id: c.projectId,
        contract_id: c.id,
        client_name: c.clientName,
        contract_ref: c.contractRef,
        noa_ref: c.noaRef,
        ntp_ref: c.ntpRef,
        client_po_ref: c.clientPoRef,
        vo_reference: c.voReference,
        awarded_revenue: c.awardedRevenueExVat.toString(),
        current_contract_value: c.currentContractValue.toString(),
        contract_duration: c.contractDurationDays,
        commencement_date: c.commencementDate?.toISOString().slice(0, 10) ?? null,
        pricing_method: c.pricingMethod,
        contract_vat_basis: c.contractVatBasis,
        tax_profile_version: c.taxProfile
          ? `${c.taxProfile.profileCode}@${c.taxProfile.versionCode}`
          : null,
      },
    ];
    meta = ['project_id', 'contract_id', 'tax_profile_version'];
  } else if (input.templateCode === 'T1_PHASE_BOQ') {
    const snapshot = await db.uboqOperationalSnapshot.findFirst({
      where: {
        id: input.sourceId,
        projectId: input.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      select: { id: true, versionNumber: true },
    });
    if (!snapshot) throw new TemplateRequestError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
    const lines = await db.uboqAwardedPhaseLine.findMany({
      where: { projectId: input.projectId, snapshotId: snapshot.id },
      select: {
        id: true,
        projectId: true,
        snapshotId: true,
        phaseCode: true,
        sectionCode: true,
        itemCode: true,
        workDescription: true,
        specification: true,
        unitNormalized: true,
        pricingType: true,
        originalQty: true,
        approvedQty: true,
        contractUnitRate: true,
        contractLineAmount: true,
      },
      orderBy: [{ phaseCode: 'asc' }, { sectionCode: 'asc' }, { itemCode: 'asc' }, { id: 'asc' }],
      take: 1001,
    });
    if (lines.length > 1000) throw new TemplateRequestError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
    sourceVersion = String(snapshot.versionNumber);
    rows = lines.map((l) => ({
      project_id: l.projectId,
      boq_line_id: l.id,
      snapshot_id: l.snapshotId,
      snapshot_version: snapshot.versionNumber,
      phase_code: l.phaseCode,
      section_code: l.sectionCode,
      item_code: l.itemCode,
      work_description: l.workDescription,
      specification: l.specification,
      unit: l.unitNormalized,
      pricing_type: l.pricingType,
      original_qty: l.originalQty.toString(),
      approved_qty: l.approvedQty.toString(),
      contract_unit_rate: l.contractUnitRate.toString(),
      contract_line_amount: l.contractLineAmount.toString(),
    }));
    meta = [
      'project_id',
      'snapshot_id',
      'snapshot_version',
      'boq_line_id',
      'phase_code',
      'section_code',
    ];
  } else if (input.templateCode === 'T2_CONSOLIDATED_BOQ') {
    const loaded = await loadT2ConsolidatedBoqCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
  } else if (input.templateCode === 'T3_AGENCY_ESTIMATE') {
    const loaded = await loadT3AgencyEstimateCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
  } else if (input.templateCode === 'T4_RESOURCE_TAKEOFF') {
    const loaded = await loadT4ResourceTakeoffCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
  } else if (input.templateCode === 'T5_ACCOMPLISHMENT_CERT') {
    const loaded = await loadT5AccomplishmentCertCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
  } else if (input.templateCode === 'T6_PROGRESS_BILLING') {
    const loaded = await loadT6ProgressBillingCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
  } else if (input.templateCode === 'T7_SCHEDULE_EVM') {
    const loaded = await loadT7ScheduleEvmCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
  } else if (input.templateCode === 'T8_CASHFLOW_HALF_MONTH') {
    const loaded = await loadT8CashflowHalfMonthCanonicalData(db, input.projectId, input.sourceId, {
      effectiveRole: access.effectiveRole,
      fieldAccessRole: access.fieldAccessRole,
    }).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
    cashFlowSummary = loaded.cashFlowSummary ?? null;
  } else if (input.templateCode === 'T9_CASHFLOW_QUARTERLY') {
    const loaded = await loadT9CashflowQuarterlyCanonicalData(db, input.projectId, input.sourceId, {
      effectiveRole: access.effectiveRole,
      fieldAccessRole: access.fieldAccessRole,
    }).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
    cashFlowSummary = loaded.cashFlowSummary ?? null;
  } else if (input.templateCode === 'T10_EXECUTIVE_MARGIN') {
    const loaded = await loadT10ExecutiveMarginCanonicalData(db, input.projectId, input.sourceId, {
      effectiveRole: access.effectiveRole,
      fieldAccessRole: access.fieldAccessRole,
    }).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
    executiveMarginSummary = loaded.executiveMarginSummary ?? null;
  } else if (input.templateCode === 'T11_VARIATION_ORDER_REGISTER') {
    const loaded = await loadT11VariationOrderRegisterCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: access.effectiveRole,
        fieldAccessRole: access.fieldAccessRole,
      }
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
    variationRegisterSummary = loaded.variationRegisterSummary ?? null;
    if (
      Object.entries(input.headingAliases ?? {}).some(([fId, alias]) =>
        isMisleadingT11RevisedQuantityHeadingAlias(fId, alias)
      )
    ) {
      throw new TemplateRequestError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409);
    }
  } else {
    const loaded = await loadT12CashflowVarianceTreasuryCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: access.effectiveRole,
        fieldAccessRole: access.fieldAccessRole,
      }
    ).catch(mapAdapterFailure);
    sourceVersion = loaded.sourceVersion;
    rows = loaded.rows;
    meta = loaded.systemMetaFields;
    cashFlowSummary = loaded.cashFlowSummary ?? null;
    treasuryVarianceSummary = loaded.treasuryVarianceSummary ?? null;
    if (
      treasuryVarianceSummary &&
      !treasuryVarianceSummary.actualTreasuryLiquidityVerified &&
      Object.values(input.headingAliases ?? {}).some((alias) =>
        isMisleadingActualTreasuryHeadingAlias(alias)
      )
    ) {
      throw new TemplateRequestError('TEMPLATE_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED', 409);
    }
    const postLoadHeadings = fields.map((f) =>
      (
        input.headingAliases?.[f] ||
        resolveDefaultTemplateHeading(
          input.templateCode,
          f,
          treasuryVarianceSummary?.actualTreasuryLiquidityVerified === true
        )
      )
        .trim()
        .toLowerCase()
    );
    if (new Set(postLoadHeadings).size !== postLoadHeadings.length) {
      throw new TemplateRequestError('TEMPLATE_DUPLICATE_HEADINGS');
    }
  }

  const projection = buildTemplateProjection(rows, {
    templateCode: input.templateCode,
    userRole: access.projectionRole,
    selectedFields: [...fields],
    headingAliases: input.headingAliases,
    t12ActualTreasuryLiquidityVerified:
      treasuryVarianceSummary?.actualTreasuryLiquidityVerified === true,
  });

  // IR-01: Apply identical role-based financial visibility restrictions to systemMetaFields & __oserpMeta (JSON + XLSX __OSERP_META)
  const authorizedMeta = filterSystemMetaFieldsForRoles(
    meta,
    access.effectiveRole,
    access.fieldAccessRole
  );
  projection.systemMetaFields = authorizedMeta;
  projection.projectedRows.forEach((row, i) => {
    row.__oserpMeta = Object.fromEntries(authorizedMeta.map((key) => [key, rows[i][key] ?? null]));
  });

  // Preserve Awarded BOQ total strictly for T1/T2 contract scope; expose domain-labeled summary total separately
  const contractAmountField =
    input.templateCode === 'T1_PHASE_BOQ' || input.templateCode === 'T2_CONSOLIDATED_BOQ'
      ? 'contract_line_amount'
      : null;
  const approvedLineTotal =
    contractAmountField &&
      fields.includes(contractAmountField) &&
      canActorAccessTemplateField(access, contractAmountField)
      ? rows
        .reduce(
          (total, row) => total.plus(String(row[contractAmountField] ?? '0')),
          new Prisma.Decimal(0)
        )
        .toFixed(2)
      : null;

  const primaryField = PRIMARY_TOTAL_AMOUNT_FIELD[input.templateCode];
  let summaryTotal: {
    fieldId: string;
    basis:
    | 'AWARDED_CONTRACT_REVENUE'
    | 'AGENCY_POW_DUPA_ESTIMATE'
    | 'INTERNAL_PRR_BENCHMARK_COST'
    | 'FORECAST_NET_CASH_RECEIPTS'
    | 'INTERNAL_EXECUTIVE_EAC_FORECAST'
    | 'APPROVED_CLIENT_VO_REVENUE_DELTA'
    | 'TREASURY_RECEIPTS_VARIANCE';
    label: string;
    amount: string;
  } | null = null;
  if (
    primaryField &&
    fields.includes(primaryField) &&
    canActorAccessTemplateField(access, primaryField)
  ) {
    const nonNullValues = rows
      .map((r) => r[primaryField])
      .filter((v): v is string | number => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length > 0 || input.templateCode !== 'T3_AGENCY_ESTIMATE') {
      const sumDec = nonNullValues.reduce(
        (acc, v) => acc.plus(String(v)),
        new Prisma.Decimal(0)
      );
      summaryTotal = {
        fieldId: primaryField,
        basis:
          input.templateCode === 'T4_RESOURCE_TAKEOFF'
            ? 'INTERNAL_PRR_BENCHMARK_COST'
            : input.templateCode === 'T3_AGENCY_ESTIMATE'
              ? 'AGENCY_POW_DUPA_ESTIMATE'
              : input.templateCode === 'T8_CASHFLOW_HALF_MONTH' ||
                input.templateCode === 'T9_CASHFLOW_QUARTERLY'
                ? 'FORECAST_NET_CASH_RECEIPTS'
                : input.templateCode === 'T10_EXECUTIVE_MARGIN'
                  ? 'INTERNAL_EXECUTIVE_EAC_FORECAST'
                  : input.templateCode === 'T11_VARIATION_ORDER_REGISTER'
                    ? 'APPROVED_CLIENT_VO_REVENUE_DELTA'
                    : input.templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY'
                      ? 'TREASURY_RECEIPTS_VARIANCE'
                      : 'AWARDED_CONTRACT_REVENUE',
        label:
          input.templateCode === 'T4_RESOURCE_TAKEOFF'
            ? 'Internal procurement budget ceiling'
            : input.templateCode === 'T3_AGENCY_ESTIMATE'
              ? 'Agency POW / DUPA estimated total'
              : input.templateCode === 'T5_ACCOMPLISHMENT_CERT'
                ? 'Certified current SWA amount'
                : input.templateCode === 'T6_PROGRESS_BILLING'
                  ? 'Net certified billing due'
                  : input.templateCode === 'T7_SCHEDULE_EVM'
                    ? 'Schedule earned value (EV)'
                    : input.templateCode === 'T8_CASHFLOW_HALF_MONTH' ||
                      input.templateCode === 'T9_CASHFLOW_QUARTERLY'
                      ? 'Forecast net cash receipts total'
                      : input.templateCode === 'T10_EXECUTIVE_MARGIN'
                        ? 'Executive forecast profit (Ex-VAT)'
                        : input.templateCode === 'T11_VARIATION_ORDER_REGISTER'
                          ? 'Approved client VO contract revenue delta'
                          : input.templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY'
                            ? 'Treasury receipts variance (Actual minus Forecast)'
                            : input.templateCode === 'T2_CONSOLIDATED_BOQ'
                              ? 'Consolidated awarded BOQ total'
                              : 'Approved BOQ total',
        amount: sumDec.toFixed(2),
      };
    }
  }

  const canReadRestricted = getPermittedVisibilityTiers(access.projectionRole).has('restricted');

  return {
    templateCode: input.templateCode,
    rowGrain: SYSTEM_TEMPLATE_PRESETS[input.templateCode].rowGrain,
    source: { id: input.sourceId, version: sourceVersion },
    workingCopyOnly: true,
    decimalEncoding: 'exact-decimal-text' as const,
    rowCount: rows.length,
    approvedLineTotal,
    summaryTotal,
    ...(canReadRestricted && cashFlowSummary ? { cashFlowSummary } : {}),
    ...(canReadRestricted && executiveMarginSummary ? { executiveMarginSummary } : {}),
    ...(canReadRestricted && variationRegisterSummary ? { variationRegisterSummary } : {}),
    ...(canReadRestricted && treasuryVarianceSummary ? { treasuryVarianceSummary } : {}),
    projection,
  };
}

const FOUR_DP_CURRENCY_FIELDS = new Set<string>([
  'contract_unit_rate',
  'estimated_total_unit_cost',
  'target_resource_cost',
]);

const SIX_DP_DECIMAL_FIELDS = new Set<string>(['resource_coeff']);

function resolveExcelNumericFormat(fieldId: string, dataType: string): string | null {
  if (dataType === 'CURRENCY') {
    return FOUR_DP_CURRENCY_FIELDS.has(fieldId) ? '#,##0.0000' : '#,##0.00';
  }
  if (dataType === 'DECIMAL') {
    return SIX_DP_DECIMAL_FIELDS.has(fieldId) ? '#,##0.000000' : '#,##0.0000';
  }
  if (dataType === 'RATIO') {
    return '#,##0.0000';
  }
  if (dataType === 'PERCENT') {
    return '0.0000"%"';
  }
  if (dataType === 'DAYS') {
    return '#,##0';
  }
  return null;
}

function sanitizeExcelTextCell(raw: unknown): string {
  const rawStr = String(raw ?? '');
  const cleaned = inspectCellSecurity(rawStr).sanitizedText;
  return neutralizeSpreadsheetFormulaForCsv(
    rawStr.startsWith('\t') || rawStr.startsWith('\r') ? rawStr : cleaned
  );
}

export async function renderWorkingTemplateToXlsxBuffer(
  projection: ReturnType<typeof buildTemplateProjection>,
  templateCode: InitialTemplateCode
): Promise<Buffer> {
  // Preserve Increment 01 exact text round-trip contract on T0/T1
  if (templateCode === 'T0_MASTER_CONTRACT' || templateCode === 'T1_PHASE_BOQ') {
    return exportProjectionToXlsxBuffer(projection, templateCode);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(templateCode.slice(0, 31) || 'UBOQ_Export');

  ws.addRow(projection.visibleColumns.map((c) => sanitizeExcelTextCell(c.heading)));

  for (const r of projection.projectedRows) {
    const excelRow = ws.addRow([]);
    projection.visibleColumns.forEach((c, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      const rawVal = r.visible[c.fieldId];
      if (rawVal === null || rawVal === undefined || rawVal === '') {
        cell.value = null;
        return;
      }

      const spec =
        CANONICAL_FIELD_MAP.get(c.fieldId) ?? T12_SAFE_DERIVED_VARIANCE_SPECS.get(c.fieldId);
      const numFmt = spec ? resolveExcelNumericFormat(c.fieldId, spec.dataType) : null;
      if (numFmt !== null) {
        const trimmed =
          typeof rawVal === 'number'
            ? String(rawVal)
            : typeof rawVal === 'string'
              ? rawVal.trim()
              : '';
        if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
          const numVal = Number(trimmed);
          if (Number.isFinite(numVal)) {
            cell.value = numVal;
            cell.numFmt = numFmt;
            return;
          }
        }
      }

      if (typeof rawVal === 'boolean') {
        cell.value = rawVal;
        return;
      }

      cell.value = sanitizeExcelTextCell(rawVal);
    });
  }

  const metaWs = wb.addWorksheet('__OSERP_META');
  metaWs.state = 'veryHidden';
  metaWs.addRow(['row_index', ...projection.systemMetaFields.map((k) => sanitizeExcelTextCell(k))]);
  projection.projectedRows.forEach((r, idx) => {
    const metaRow = metaWs.addRow([]);
    metaRow.getCell(1).value = idx + 2;
    projection.systemMetaFields.forEach((k, mIdx) => {
      const mCell = metaRow.getCell(mIdx + 2);
      const mVal = r.__oserpMeta[k];
      if (mVal === null || mVal === undefined) {
        mCell.value = null;
      } else if (typeof mVal === 'number' && Number.isFinite(mVal)) {
        mCell.value = mVal;
      } else if (typeof mVal === 'boolean') {
        mCell.value = mVal;
      } else {
        mCell.value = sanitizeExcelTextCell(mVal);
      }
    });
  });

  const arrayBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuf);
}
