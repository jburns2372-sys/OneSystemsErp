import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { CANONICAL_FIELD_MAP, T12_SAFE_DERIVED_VARIANCE_SPECS } from '../field-catalog';
import { assertProjectGraphOwnership } from '../project-ownership';
import {
  canRoleAccessField,
  getPermittedVisibilityTiers,
  redactUboqPayloadForRole,
} from '../security/redact-payload';
import { assertUboqStageAuthorization } from '../security/stage-rbac';
import {
  buildTemplateProjection,
  isMisleadingActualTreasuryHeadingAlias,
  isMisleadingT11RevisedQuantityHeadingAlias,
  resolveT11QuantityDefaultHeading,
  resolveT12PeriodBalanceDefaultHeading,
  SYSTEM_TEMPLATE_PRESETS,
} from '../template-builder';
import {
  ACTIVE_BATCH_TEMPLATE_CODES,
  ALLOWED_TEMPLATE_FIELDS,
  CanonicalAdapterError,
  filterSystemMetaFieldsForRoles,
  isActiveBatchTemplateCode,
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
import type { InitialTemplateCode } from './t0-t1';

export type LayoutSharingScope = 'PRIVATE' | 'PROJECT_SHARED';

export class SavedLayoutError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(code);
  }
}

export const ALLOWED_SAVED_LAYOUT_FIELDS: Readonly<Record<InitialTemplateCode, readonly string[]>> =
  ALLOWED_TEMPLATE_FIELDS;

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

const LAYOUT_AUTHOR_ROLES = new Set([
  ...GLOBAL_ADMIN_ROLES,
  'ADMIN',
  'PROJECT_DIRECTOR',
  'DIRECTORS',
  'FINANCE_DIRECTOR',
  'COMMERCIAL_DIRECTOR',
  'COST_CONTROL_MANAGER',
  'CHIEF_ESTIMATOR',
  'PROJECT_MANAGER',
  'OPERATIONS_MANAGER',
  'FINANCE_MANAGER',
  'ACCOUNTANT',
  'BILLING_ENGINEER',
  'QS_ENGINEER',
  'QUANTITY_SURVEYOR',
  'COST_ENGINEER',
  'ESTIMATOR',
  'PROJECT_ENGINEER',
  'SITE_ENGINEER',
  'PROCUREMENT_MANAGER',
  'PURCHASING_MANAGER',
  'PROCUREMENT_OFFICER',
  'PURCHASING_OFFICER',
]);

const LAYOUT_SHARE_ROLES = new Set([
  ...GLOBAL_ADMIN_ROLES,
  'ADMIN',
  'PROJECT_DIRECTOR',
  'DIRECTORS',
  'FINANCE_DIRECTOR',
  'COMMERCIAL_DIRECTOR',
  'COST_CONTROL_MANAGER',
  'CHIEF_ESTIMATOR',
  'PROJECT_MANAGER',
  'OPERATIONS_MANAGER',
  'FINANCE_MANAGER',
  'PROCUREMENT_MANAGER',
  'PURCHASING_MANAGER',
  'QS_ENGINEER',
  'QUANTITY_SURVEYOR',
  'COST_ENGINEER',
]);

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

function isPlainText(value: unknown, minLen: number, maxLen: number): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < minLen || value.length > maxLen) return false;
  if (/[\x00-\x1f\x7f]/.test(value)) return false;
  if (/^\s*[=+@-]/.test(value)) return false;
  return true;
}

function resolveDefaultLayoutHeading(templateCode: InitialTemplateCode, fieldId: string): string {
  if (templateCode === 'T11_VARIATION_ORDER_REGISTER') {
    const t11Heading = resolveT11QuantityDefaultHeading(fieldId);
    if (t11Heading) return t11Heading;
  }
  if (templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY') {
    const t12Heading = resolveT12PeriodBalanceDefaultHeading(fieldId, false);
    if (t12Heading) return t12Heading;
  }
  return (
    CANONICAL_FIELD_MAP.get(fieldId)?.suggestedHeading ??
    T12_SAFE_DERIVED_VARIANCE_SPECS.get(fieldId)?.suggestedHeading ??
    fieldId
  );
}

export function normalizeHeadingAliases(
  templateCode: InitialTemplateCode,
  selectedFields: readonly string[],
  rawAliases: unknown
): Record<string, string> {
  if (rawAliases === undefined || rawAliases === null) return {};
  if (typeof rawAliases !== 'object' || Array.isArray(rawAliases)) {
    throw new SavedLayoutError('LAYOUT_INVALID_HEADINGS', 400);
  }
  const permitted = ALLOWED_SAVED_LAYOUT_FIELDS[templateCode];
  const normalized: Record<string, string> = {};
  for (const [key, rawHeading] of Object.entries(rawAliases as Record<string, unknown>)) {
    if (!permitted.includes(key) || !selectedFields.includes(key)) {
      throw new SavedLayoutError('LAYOUT_INVALID_HEADINGS', 400);
    }
    if (!isPlainText(rawHeading, 1, 120)) {
      throw new SavedLayoutError('LAYOUT_INVALID_HEADINGS', 400);
    }
    const trimmed = rawHeading.trim();
    if (
      templateCode === 'T11_VARIATION_ORDER_REGISTER' &&
      isMisleadingT11RevisedQuantityHeadingAlias(key, trimmed)
    ) {
      throw new SavedLayoutError('LAYOUT_VO_REVISED_QUANTITY_AMBIGUOUS', 409);
    }
    const defaultHeading = resolveDefaultLayoutHeading(templateCode, key);
    if (trimmed !== defaultHeading) {
      normalized[key] = trimmed;
    }
  }
  const resolvedLower = selectedFields.map((fieldId) =>
    (normalized[fieldId] ?? resolveDefaultLayoutHeading(templateCode, fieldId)).trim().toLowerCase()
  );
  if (new Set(resolvedLower).size !== resolvedLower.length) {
    throw new SavedLayoutError('LAYOUT_DUPLICATE_HEADINGS', 400);
  }
  return Object.fromEntries(Object.keys(normalized).sort().map((k) => [k, normalized[k]]));
}

export function validateLayoutColumns(
  templateCode: unknown,
  rawSelectedFields: unknown,
  rawAliases: unknown
): {
  templateCode: InitialTemplateCode;
  rowGrain: string;
  selectedFields: string[];
  headingAliases: Record<string, string>;
  definitionHash: string;
} {
  if (!isActiveBatchTemplateCode(templateCode)) {
    throw new SavedLayoutError('LAYOUT_TEMPLATE_CODE_NOT_SUPPORTED', 400);
  }
  const permitted = ALLOWED_SAVED_LAYOUT_FIELDS[templateCode];
  if (
    !Array.isArray(rawSelectedFields) ||
    rawSelectedFields.length === 0 ||
    rawSelectedFields.length > permitted.length ||
    rawSelectedFields.some((f) => typeof f !== 'string' || !permitted.includes(f)) ||
    new Set(rawSelectedFields).size !== rawSelectedFields.length
  ) {
    throw new SavedLayoutError('LAYOUT_INVALID_COLUMNS', 400);
  }
  const selectedFields = [...(rawSelectedFields as string[])];
  const headingAliases = normalizeHeadingAliases(templateCode, selectedFields, rawAliases);
  const rowGrain = SYSTEM_TEMPLATE_PRESETS[templateCode].rowGrain;
  const canonicalPayload = JSON.stringify({
    templateCode,
    rowGrain,
    selectedFields,
    headingAliases,
  });
  const definitionHash = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
  return { templateCode, rowGrain, selectedFields, headingAliases, definitionHash };
}

export interface ActorLayoutCapabilities {
  effectiveRole: string;
  fieldAccessRole: string;
  canWritePrivate: boolean;
  canShareProject: boolean;
  canReadFormalFinancialAudit: boolean;
}

function canActorReadFormalFinancialAudit(effectiveRole: string, fieldAccessRole: string): boolean {
  return (
    fieldAccessRole !== 'EXTERNAL_VIEWER' &&
    canRoleAccessField(effectiveRole, 'contract_line_amount') &&
    canRoleAccessField(fieldAccessRole, 'contract_line_amount') &&
    canRoleAccessField(effectiveRole, 'procurement_budget') &&
    canRoleAccessField(fieldAccessRole, 'procurement_budget')
  );
}

export async function resolveActorLayoutCapabilities(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string
): Promise<ActorLayoutCapabilities> {
  if (!isValidId(projectId)) {
    throw new SavedLayoutError('LAYOUT_PROJECT_REQUIRED', 400);
  }
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
    return {
      effectiveRole: normRole,
      fieldAccessRole: normRole,
      canWritePrivate: true,
      canShareProject: true,
      canReadFormalFinancialAudit: canActorReadFormalFinancialAudit(normRole, normRole),
    };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true },
  });
  if (!project) {
    throw new SavedLayoutError('LAYOUT_PROJECT_NOT_FOUND', 404);
  }

  if (project.managerId === actorId) {
    return {
      effectiveRole: normRole,
      fieldAccessRole: normRole,
      canWritePrivate: LAYOUT_AUTHOR_ROLES.has(normRole),
      canShareProject: LAYOUT_SHARE_ROLES.has(normRole),
      canReadFormalFinancialAudit: canActorReadFormalFinancialAudit(normRole, normRole),
    };
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
    throw new SavedLayoutError('LAYOUT_ACCESS_DENIED', 403);
  }

  const assignAccess = (assignment.accessLevel || '').trim().toUpperCase();
  const assignRole = (assignment.projectRole || '').trim().toUpperCase();
  const isReadOnlyAssignment = READ_ONLY_LEVELS.has(assignAccess) || READ_ONLY_LEVELS.has(assignRole);
  const narrowedProjRole =
    assignRole && !['MEMBER', 'STANDARD', 'FULL'].includes(assignRole) ? assignRole : null;

  const canWritePrivate =
    !isReadOnlyAssignment &&
    LAYOUT_AUTHOR_ROLES.has(normRole) &&
    (!narrowedProjRole || LAYOUT_AUTHOR_ROLES.has(narrowedProjRole));

  const canShareProject =
    !isReadOnlyAssignment &&
    LAYOUT_SHARE_ROLES.has(normRole) &&
    (!narrowedProjRole || LAYOUT_SHARE_ROLES.has(narrowedProjRole));

  const fieldAccessRole = isReadOnlyAssignment
    ? 'EXTERNAL_VIEWER'
    : narrowedProjRole ?? normRole;

  return {
    effectiveRole: normRole,
    fieldAccessRole,
    canWritePrivate,
    canShareProject,
    canReadFormalFinancialAudit: canActorReadFormalFinancialAudit(normRole, fieldAccessRole),
  };
}

function canRoleReadField(caps: ActorLayoutCapabilities, fieldId: string): boolean {
  return canRoleAccessField(caps.effectiveRole, fieldId) && canRoleAccessField(caps.fieldAccessRole, fieldId);
}

export interface SerializedSavedLayoutRevision {
  id: string;
  projectId: string;
  layoutGroupId: string;
  versionNumber: number;
  supersedesId: string | null;
  duplicatedFromId: string | null;
  templateCode: InitialTemplateCode;
  templateName: string;
  rowGrain: string;
  sharingScope: LayoutSharingScope;
  selectedFields: string[];
  headingAliases: Record<string, string>;
  redactedFieldCount: number;
  definitionHash: string;
  changeSummary: string | null;
  createdById: string;
  isOwnedByActor: boolean;
  canEditVersion: boolean;
  createdAt: string;
}

function serializeRevisionForActor(
  row: {
    id: string;
    projectId: string | null;
    layoutGroupId: string | null;
    versionNumber: number;
    supersedesId: string | null;
    duplicatedFromId: string | null;
    templateCode: string;
    templateName: string;
    rowGrain: string;
    sharingScope: string;
    selectedFieldsJson: Prisma.JsonValue;
    headingAliasesJson: Prisma.JsonValue | null;
    definitionHash: string | null;
    changeSummary: string | null;
    createdById: string | null;
    createdAt: Date;
  },
  actorId: string,
  caps: ActorLayoutCapabilities
): SerializedSavedLayoutRevision {
  const rawFields = Array.isArray(row.selectedFieldsJson)
    ? (row.selectedFieldsJson as unknown[]).filter((f): f is string => typeof f === 'string')
    : [];
  const accessibleFields = rawFields.filter((f) => canRoleReadField(caps, f));
  const rawAliases =
    row.headingAliasesJson && typeof row.headingAliasesJson === 'object' && !Array.isArray(row.headingAliasesJson)
      ? (row.headingAliasesJson as Record<string, unknown>)
      : {};
  const accessibleAliases: Record<string, string> = {};
  for (const fieldId of accessibleFields) {
    if (typeof rawAliases[fieldId] === 'string') {
      accessibleAliases[fieldId] = rawAliases[fieldId] as string;
    }
  }
  const isOwnedByActor = row.createdById === actorId;
  const sharingScope = (row.sharingScope === 'PROJECT_SHARED' ? 'PROJECT_SHARED' : 'PRIVATE') as LayoutSharingScope;
  const canEditVersion = isOwnedByActor
    ? sharingScope === 'PROJECT_SHARED'
      ? caps.canShareProject
      : caps.canWritePrivate
    : sharingScope === 'PROJECT_SHARED' && caps.canShareProject;

  return {
    id: row.id,
    projectId: row.projectId || '',
    layoutGroupId: row.layoutGroupId || row.id,
    versionNumber: row.versionNumber,
    supersedesId: row.supersedesId,
    duplicatedFromId: row.duplicatedFromId,
    templateCode: row.templateCode as InitialTemplateCode,
    templateName: row.templateName,
    rowGrain: row.rowGrain,
    sharingScope,
    selectedFields: accessibleFields,
    headingAliases: accessibleAliases,
    redactedFieldCount: rawFields.length - accessibleFields.length,
    definitionHash: row.definitionHash || '',
    changeSummary: row.changeSummary,
    createdById: row.createdById || '',
    isOwnedByActor,
    canEditVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSavedLayouts(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string,
  templateCode?: string | null
) {
  const caps = await resolveActorLayoutCapabilities(db, actorId, projectId);
  if (templateCode && !isActiveBatchTemplateCode(templateCode)) {
    throw new SavedLayoutError('LAYOUT_TEMPLATE_CODE_NOT_SUPPORTED', 400);
  }

  const rows = await db.uboqTemplateDefinition.findMany({
    where: {
      projectId,
      isSystemPreset: false,
      ...(templateCode
        ? { templateCode }
        : { templateCode: { in: [...ACTIVE_BATCH_TEMPLATE_CODES] } }),
      OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actorId }],
    },
    orderBy: [{ layoutGroupId: 'asc' }, { versionNumber: 'desc' }],
    take: 500,
  });

  const groupsMap = new Map<
    string,
    {
      layoutGroupId: string;
      latest: SerializedSavedLayoutRevision;
      revisionCount: number;
      revisions: Array<{
        id: string;
        versionNumber: number;
        templateName: string;
        sharingScope: LayoutSharingScope;
        changeSummary: string | null;
        createdById: string;
        createdAt: string;
      }>;
    }
  >();

  for (const row of rows) {
    const groupId = row.layoutGroupId || row.id;
    const serialized = serializeRevisionForActor(row, actorId, caps);
    const existing = groupsMap.get(groupId);
    const summaryItem = {
      id: serialized.id,
      versionNumber: serialized.versionNumber,
      templateName: serialized.templateName,
      sharingScope: serialized.sharingScope,
      changeSummary: serialized.changeSummary,
      createdById: serialized.createdById,
      createdAt: serialized.createdAt,
    };
    if (!existing) {
      groupsMap.set(groupId, {
        layoutGroupId: groupId,
        latest: serialized,
        revisionCount: 1,
        revisions: [summaryItem],
      });
    } else {
      existing.revisionCount += 1;
      existing.revisions.push(summaryItem);
    }
  }

  const groups = [...groupsMap.values()].sort((a, b) =>
    b.latest.createdAt.localeCompare(a.latest.createdAt)
  );

  return {
    projectId,
    capabilities: {
      effectiveRole: caps.effectiveRole,
      canWritePrivate: caps.canWritePrivate,
      canShareProject: caps.canShareProject,
    },
    groups,
  };
}

export async function loadSavedLayout(
  db: Prisma.TransactionClient,
  actorId: string,
  params: {
    projectId: string;
    layoutRevisionId?: string | null;
    layoutGroupId?: string | null;
    versionNumber?: number | null;
  }
) {
  const caps = await resolveActorLayoutCapabilities(db, actorId, params.projectId);

  let row;
  if (params.layoutRevisionId) {
    if (!isValidId(params.layoutRevisionId)) {
      throw new SavedLayoutError('LAYOUT_INVALID_ID', 400);
    }
    row = await db.uboqTemplateDefinition.findFirst({
      where: {
        id: params.layoutRevisionId,
        projectId: params.projectId,
        isSystemPreset: false,
        OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actorId }],
      },
    });
  } else if (params.layoutGroupId) {
    if (!isValidId(params.layoutGroupId)) {
      throw new SavedLayoutError('LAYOUT_INVALID_ID', 400);
    }
    row = await db.uboqTemplateDefinition.findFirst({
      where: {
        projectId: params.projectId,
        layoutGroupId: params.layoutGroupId,
        isSystemPreset: false,
        ...(params.versionNumber !== undefined && params.versionNumber !== null
          ? { versionNumber: params.versionNumber }
          : {}),
        OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actorId }],
      },
      orderBy: { versionNumber: 'desc' },
    });
  } else {
    throw new SavedLayoutError('LAYOUT_TARGET_REQUIRED', 400);
  }

  if (!row) {
    throw new SavedLayoutError('LAYOUT_NOT_FOUND', 404);
  }

  const allRevisions = await db.uboqTemplateDefinition.findMany({
    where: {
      projectId: params.projectId,
      layoutGroupId: row.layoutGroupId || row.id,
      isSystemPreset: false,
      OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actorId }],
    },
    orderBy: { versionNumber: 'desc' },
  });

  const auditEvents = await db.uboqTemplateAuditEvent.findMany({
    where: {
      projectId: params.projectId,
      layoutGroupId: row.layoutGroupId || row.id,
      ...(caps.canReadFormalFinancialAudit
        ? {}
        : {
          eventType: { not: 'FORMAL_EXPORT_GENERATED' },
          sharingScope: { not: 'SYSTEM_FORMAL_PRESET' },
        }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    revision: serializeRevisionForActor(row, actorId, caps),
    revisions: allRevisions.map((r) => serializeRevisionForActor(r, actorId, caps)),
    auditTrail: sanitizeLayoutAuditTrailForActor(auditEvents, caps),
  };
}

const FINANCIALLY_RESTRICTED_AUDIT_DETAIL_KEYS = new Set([
  'approvedLineTotal',
  'procurementBudgetTotal',
  'certifiedCurrentAmountTotal',
  'priorCertifiedAmountTotal',
  'cumulativeCertifiedAmountTotal',
  'revisedContractLineTotal',
  'grossBillingTotal',
  'retentionTotal',
  'advanceRecoupmentTotal',
  'vatWithholdingTotal',
  'ewtWithholdingTotal',
  'withholdingTotal',
  'otherDeductionsTotal',
  'netCertifiedDueTotal',
  'paymentReceivedTotal',
  'exVatBaseTotal',
  'outputVatTotal',
  'currentApprovedContractValue',
  'pricingMethod',
  'contractVatBasis',
  'summaryTotal',
  'phaseSubtotals',
  'uomResourceSubtotals',
  'linkedContractAuthorityId',
  'projectApprovedContractCount',
  'contractAssociationStatus',
  'clientVoRevenueDeltaTotal',
  'clientVoRevenueDeltaExVatTotal',
  'subconCommitmentVoDeltaTotal',
  'originalContractAwardAmount',
  'revisedContractValueTotal',
  'variationRegisterSummary',
  'treasuryVarianceSummary',
]);

export function redactLayoutAuditDetailsForActor(
  details: Prisma.JsonValue | null,
  caps: ActorLayoutCapabilities
): Prisma.JsonValue | null {
  if (details === null || details === undefined) return null;
  const roleRedacted = redactUboqPayloadForRole(
    redactUboqPayloadForRole(details, caps.effectiveRole),
    caps.fieldAccessRole
  );

  function sanitizeNode(val: unknown): Prisma.JsonValue {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map((item) => sanitizeNode(item));
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      const out: Record<string, Prisma.JsonValue> = {};
      for (const [key, entry] of Object.entries(obj)) {
        if (!caps.canReadFormalFinancialAudit && FINANCIALLY_RESTRICTED_AUDIT_DETAIL_KEYS.has(key)) {
          continue;
        }
        if (key === 'selectedFields' && Array.isArray(entry)) {
          const rawFields = entry.filter((f): f is string => typeof f === 'string');
          const accessible = rawFields.filter((f) => canRoleReadField(caps, f));
          out.selectedFields = accessible;
          if (accessible.length !== rawFields.length) {
            out.redactedFieldCount = rawFields.length - accessible.length;
          }
          continue;
        }
        if (
          key === 'headingAliases' &&
          entry &&
          typeof entry === 'object' &&
          !Array.isArray(entry)
        ) {
          const filteredAliases: Record<string, string> = {};
          for (const [fKey, fHeading] of Object.entries(entry as Record<string, unknown>)) {
            if (typeof fHeading === 'string' && canRoleReadField(caps, fKey)) {
              filteredAliases[fKey] = fHeading;
            }
          }
          out.headingAliases = filteredAliases;
          continue;
        }
        out[key] = sanitizeNode(entry);
      }
      return out;
    }
    return null;
  }

  return sanitizeNode(roleRedacted);
}

export interface SerializedLayoutAuditTrailEntry {
  id: string;
  eventType: string;
  layoutDefinitionId: string | null;
  layoutVersionNumber: number | null;
  sharingScope: string;
  actorUserId: string;
  actorRole: string;
  sourceId: string | null;
  sourceVersion: string | null;
  contractCode: string | null;
  exportFormat: string | null;
  outputSha256: string | null;
  details: Prisma.JsonValue | null;
  createdAt: string;
}

export function sanitizeLayoutAuditTrailForActor(
  auditEvents: ReadonlyArray<{
    id: string;
    eventType: string;
    layoutDefinitionId: string | null;
    layoutVersionNumber: number | null;
    sharingScope: string;
    actorUserId: string;
    actorRole: string;
    sourceId: string | null;
    sourceVersion: string | null;
    contractCode: string | null;
    exportFormat: string | null;
    outputSha256: string | null;
    detailsJson: Prisma.JsonValue | null;
    createdAt: Date;
  }>,
  caps: ActorLayoutCapabilities
): SerializedLayoutAuditTrailEntry[] {
  return auditEvents
    .filter((ev) => {
      if (
        !caps.canReadFormalFinancialAudit &&
        (ev.eventType === 'FORMAL_EXPORT_GENERATED' || ev.sharingScope === 'SYSTEM_FORMAL_PRESET')
      ) {
        return false;
      }
      return true;
    })
    .map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      layoutDefinitionId: ev.layoutDefinitionId,
      layoutVersionNumber: ev.layoutVersionNumber,
      sharingScope: ev.sharingScope,
      actorUserId: ev.actorUserId,
      actorRole: ev.actorRole,
      sourceId: ev.sourceId,
      sourceVersion: ev.sourceVersion,
      contractCode: ev.contractCode,
      exportFormat: ev.exportFormat,
      outputSha256: ev.outputSha256,
      details: redactLayoutAuditDetailsForActor(ev.detailsJson, caps),
      createdAt: ev.createdAt.toISOString(),
    }));
}

async function recordLayoutAudit(
  db: Prisma.TransactionClient,
  params: {
    projectId: string;
    layoutGroupId: string;
    layoutDefinitionId: string;
    layoutVersionNumber: number;
    layoutOwnerId: string;
    sharingScope: LayoutSharingScope;
    templateCode: InitialTemplateCode;
    eventType: 'LAYOUT_CREATED' | 'LAYOUT_VERSIONED' | 'LAYOUT_DUPLICATED';
    actorId: string;
    actorRole: string;
    oldSummary?: Record<string, unknown> | null;
    newSummary: Record<string, unknown>;
    remarks: string;
  }
) {
  const auditId = `utae_${crypto.randomUUID().replaceAll('-', '')}`;
  const detailsSerialized = JSON.stringify(params.newSummary);
  await db.$queryRaw`
    SELECT id FROM public.uboq_append_template_audit_event(
      ${auditId}::text,
      ${params.projectId}::text,
      ${params.layoutGroupId}::text,
      ${params.layoutDefinitionId}::text,
      ${params.layoutVersionNumber}::integer,
      ${params.layoutOwnerId}::text,
      ${params.sharingScope}::text,
      ${params.templateCode}::text,
      ${params.eventType}::text,
      ${params.actorId}::text,
      ${params.actorRole}::text,
      ${null}::text,
      ${null}::text,
      ${null}::text,
      ${null}::text,
      ${null}::text,
      ${detailsSerialized}::jsonb
    )
  `;

  await db.auditLog.create({
    data: {
      userId: params.actorId,
      userRole: params.actorRole,
      moduleName: 'UBOQ_SAVED_LAYOUTS',
      transactionId: params.layoutDefinitionId,
      actionType: params.eventType,
      oldValue: params.oldSummary ? JSON.stringify(params.oldSummary) : null,
      newValue: JSON.stringify({
        projectId: params.projectId,
        layoutGroupId: params.layoutGroupId,
        layoutVersionNumber: params.layoutVersionNumber,
        ...params.newSummary,
      }),
      remarks: params.remarks,
    },
  });
}

function assertWriteAuthorization(
  caps: ActorLayoutCapabilities,
  sharingScope: LayoutSharingScope,
  selectedFields: readonly string[]
) {
  if (!caps.canWritePrivate) {
    throw new SavedLayoutError('LAYOUT_WRITE_FORBIDDEN', 403);
  }
  if (sharingScope === 'PROJECT_SHARED' && !caps.canShareProject) {
    throw new SavedLayoutError('LAYOUT_SHARING_FORBIDDEN', 403);
  }
  if (selectedFields.some((f) => !canRoleReadField(caps, f))) {
    throw new SavedLayoutError('LAYOUT_FIELD_FORBIDDEN', 403);
  }
}

function parseSharingScope(value: unknown, fallback: LayoutSharingScope = 'PRIVATE'): LayoutSharingScope {
  if (value === undefined) return fallback;
  if (value !== 'PRIVATE' && value !== 'PROJECT_SHARED') {
    throw new SavedLayoutError('LAYOUT_INVALID_SHARING_SCOPE', 400);
  }
  return value;
}

function parseChangeSummary(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (!isPlainText(value, 1, 240)) {
    throw new SavedLayoutError('LAYOUT_INVALID_CHANGE_SUMMARY', 400);
  }
  return value.trim();
}

function parseTemplateName(value: unknown): string {
  if (!isPlainText(value, 1, 120)) {
    throw new SavedLayoutError('LAYOUT_INVALID_NAME', 400);
  }
  return value.trim();
}

async function assertNoTreasuryLiquidityMisrepresentationOnSave(
  db: Prisma.TransactionClient,
  projectId: string,
  templateCode: InitialTemplateCode,
  templateName: string,
  headingAliases: Record<string, string>
) {
  if (templateCode !== 'T12_CASHFLOW_VARIANCE_TREASURY') return;
  const claimsActualLiquidity =
    isMisleadingActualTreasuryHeadingAlias(templateName) ||
    Object.values(headingAliases).some((h) => isMisleadingActualTreasuryHeadingAlias(h));
  if (!claimsActualLiquidity) return;

  const verifiedOpening = await db.uboqTreasuryOpeningBalance.findFirst({
    where: {
      projectId,
      verificationStatus: 'VERIFIED',
      verifiedById: { not: null },
      verifiedAt: { not: null },
    },
    select: { id: true },
  });
  if (!verifiedOpening) {
    throw new SavedLayoutError('LAYOUT_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED', 409);
  }
}

export async function createSavedLayout(
  db: Prisma.TransactionClient,
  actorId: string,
  input: {
    projectId: string;
    templateCode: InitialTemplateCode;
    templateName: string;
    selectedFields: string[];
    headingAliases?: Record<string, string>;
    sharingScope?: LayoutSharingScope;
    changeSummary?: string | null;
  }
) {
  const caps = await resolveActorLayoutCapabilities(db, actorId, input.projectId);
  const templateName = parseTemplateName(input.templateName);
  const sharingScope = parseSharingScope(input.sharingScope, 'PRIVATE');
  const changeSummary = parseChangeSummary(input.changeSummary);
  const validated = validateLayoutColumns(
    input.templateCode,
    input.selectedFields,
    input.headingAliases
  );
  assertWriteAuthorization(caps, sharingScope, validated.selectedFields);
  await assertNoTreasuryLiquidityMisrepresentationOnSave(
    db,
    input.projectId,
    validated.templateCode,
    templateName,
    validated.headingAliases
  );

  const layoutGroupId = `tplgrp_${crypto.randomUUID().replaceAll('-', '')}`;
  const created = await db.uboqTemplateDefinition.create({
    data: {
      projectId: input.projectId,
      layoutGroupId,
      supersedesId: null,
      duplicatedFromId: null,
      sharingScope,
      definitionHash: validated.definitionHash,
      changeSummary: changeSummary ?? 'Initial saved layout v1',
      templateCode: validated.templateCode,
      templateName,
      rowGrain: validated.rowGrain,
      selectedFieldsJson: validated.selectedFields,
      headingAliasesJson: Object.keys(validated.headingAliases).length
        ? validated.headingAliases
        : Prisma.DbNull,
      isSystemPreset: false,
      versionNumber: 1,
      createdById: actorId,
    },
  });

  await recordLayoutAudit(db, {
    projectId: input.projectId,
    layoutGroupId,
    layoutDefinitionId: created.id,
    layoutVersionNumber: 1,
    layoutOwnerId: actorId,
    sharingScope,
    templateCode: validated.templateCode,
    eventType: 'LAYOUT_CREATED',
    actorId,
    actorRole: caps.effectiveRole,
    newSummary: {
      templateName,
      sharingScope,
      selectedFields: validated.selectedFields,
      headingAliases: validated.headingAliases,
      definitionHash: validated.definitionHash,
      changeSummary: created.changeSummary,
    },
    remarks: `Created saved layout "${templateName}" (v1, ${sharingScope})`,
  });

  return serializeRevisionForActor(created, actorId, caps);
}

export async function versionSavedLayout(
  db: Prisma.TransactionClient,
  actorId: string,
  input: {
    projectId: string;
    layoutGroupId: string;
    expectedVersionNumber?: number;
    templateName?: string;
    selectedFields: string[];
    headingAliases?: Record<string, string>;
    sharingScope?: LayoutSharingScope;
    changeSummary?: string | null;
  }
) {
  if (!isValidId(input.layoutGroupId)) {
    throw new SavedLayoutError('LAYOUT_INVALID_ID', 400);
  }
  const caps = await resolveActorLayoutCapabilities(db, actorId, input.projectId);

  const head = await db.uboqTemplateDefinition.findFirst({
    where: {
      projectId: input.projectId,
      layoutGroupId: input.layoutGroupId,
      isSystemPreset: false,
      OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actorId }],
    },
    orderBy: { versionNumber: 'desc' },
  });

  if (!head) {
    throw new SavedLayoutError('LAYOUT_NOT_FOUND', 404);
  }

  if (
    input.expectedVersionNumber !== undefined &&
    head.versionNumber !== input.expectedVersionNumber
  ) {
    throw new SavedLayoutError('LAYOUT_VERSION_CONFLICT', 409);
  }

  if (head.createdById !== actorId) {
    if (head.sharingScope !== 'PROJECT_SHARED' || !caps.canShareProject) {
      throw new SavedLayoutError('LAYOUT_EDIT_FORBIDDEN', 403);
    }
  }

  const nextSharingScope = parseSharingScope(
    input.sharingScope,
    head.sharingScope === 'PROJECT_SHARED' ? 'PROJECT_SHARED' : 'PRIVATE'
  );
  if (head.createdById !== actorId && nextSharingScope === 'PRIVATE') {
    // Shared collaborators cannot privatize someone else's shared layout group; duplicate instead.
    throw new SavedLayoutError('LAYOUT_PRIVATIZE_FORBIDDEN', 403);
  }

  const templateName =
    input.templateName !== undefined ? parseTemplateName(input.templateName) : head.templateName;
  const changeSummary = parseChangeSummary(input.changeSummary);
  const validated = validateLayoutColumns(
    head.templateCode,
    input.selectedFields,
    input.headingAliases
  );
  assertWriteAuthorization(caps, nextSharingScope, validated.selectedFields);
  await assertNoTreasuryLiquidityMisrepresentationOnSave(
    db,
    input.projectId,
    validated.templateCode,
    templateName,
    validated.headingAliases
  );

  const nextVersion = head.versionNumber + 1;
  const created = await db.uboqTemplateDefinition.create({
    data: {
      projectId: input.projectId,
      layoutGroupId: input.layoutGroupId,
      supersedesId: head.id,
      duplicatedFromId: null,
      sharingScope: nextSharingScope,
      definitionHash: validated.definitionHash,
      changeSummary: changeSummary ?? `Revision v${nextVersion}`,
      templateCode: validated.templateCode,
      templateName,
      rowGrain: validated.rowGrain,
      selectedFieldsJson: validated.selectedFields,
      headingAliasesJson: Object.keys(validated.headingAliases).length
        ? validated.headingAliases
        : Prisma.DbNull,
      isSystemPreset: false,
      versionNumber: nextVersion,
      createdById: actorId,
    },
  });

  await recordLayoutAudit(db, {
    projectId: input.projectId,
    layoutGroupId: input.layoutGroupId,
    layoutDefinitionId: created.id,
    layoutVersionNumber: nextVersion,
    layoutOwnerId: actorId,
    sharingScope: nextSharingScope,
    templateCode: validated.templateCode,
    eventType: 'LAYOUT_VERSIONED',
    actorId,
    actorRole: caps.effectiveRole,
    oldSummary: {
      supersedesId: head.id,
      previousVersionNumber: head.versionNumber,
      previousTemplateName: head.templateName,
      previousSharingScope: head.sharingScope,
      previousDefinitionHash: head.definitionHash,
    },
    newSummary: {
      supersedesId: head.id,
      templateName,
      sharingScope: nextSharingScope,
      selectedFields: validated.selectedFields,
      headingAliases: validated.headingAliases,
      definitionHash: validated.definitionHash,
      changeSummary: created.changeSummary,
    },
    remarks: `Created revision v${nextVersion} superseding ${head.id} (v${head.versionNumber})`,
  });

  return serializeRevisionForActor(created, actorId, caps);
}

export async function duplicateSavedLayout(
  db: Prisma.TransactionClient,
  actorId: string,
  input: {
    projectId: string;
    sourceRevisionId: string;
    templateName?: string;
    sharingScope?: LayoutSharingScope;
    changeSummary?: string | null;
  }
) {
  if (!isValidId(input.sourceRevisionId)) {
    throw new SavedLayoutError('LAYOUT_INVALID_ID', 400);
  }
  const caps = await resolveActorLayoutCapabilities(db, actorId, input.projectId);
  if (!caps.canWritePrivate) {
    throw new SavedLayoutError('LAYOUT_WRITE_FORBIDDEN', 403);
  }

  const source = await db.uboqTemplateDefinition.findFirst({
    where: {
      id: input.sourceRevisionId,
      projectId: input.projectId,
      isSystemPreset: false,
      OR: [{ sharingScope: 'PROJECT_SHARED' }, { createdById: actorId }],
    },
  });
  if (!source) {
    throw new SavedLayoutError('LAYOUT_NOT_FOUND', 404);
  }

  const serializedSource = serializeRevisionForActor(source, actorId, caps);
  if (!serializedSource.selectedFields.length) {
    throw new SavedLayoutError('LAYOUT_FIELD_FORBIDDEN', 403);
  }

  const sharingScope = parseSharingScope(input.sharingScope, 'PRIVATE');
  const templateName =
    input.templateName !== undefined
      ? parseTemplateName(input.templateName)
      : `${source.templateName} (Copy)`.slice(0, 120);
  const changeSummary = parseChangeSummary(input.changeSummary);

  const validated = validateLayoutColumns(
    source.templateCode,
    serializedSource.selectedFields,
    serializedSource.headingAliases
  );
  assertWriteAuthorization(caps, sharingScope, validated.selectedFields);
  await assertNoTreasuryLiquidityMisrepresentationOnSave(
    db,
    input.projectId,
    validated.templateCode,
    templateName,
    validated.headingAliases
  );

  const newGroupId = `tplgrp_${crypto.randomUUID().replaceAll('-', '')}`;
  const created = await db.uboqTemplateDefinition.create({
    data: {
      projectId: input.projectId,
      layoutGroupId: newGroupId,
      supersedesId: null,
      duplicatedFromId: source.id,
      sharingScope,
      definitionHash: validated.definitionHash,
      changeSummary:
        changeSummary ?? `Duplicated from ${source.templateName} v${source.versionNumber}`,
      templateCode: validated.templateCode,
      templateName,
      rowGrain: validated.rowGrain,
      selectedFieldsJson: validated.selectedFields,
      headingAliasesJson: Object.keys(validated.headingAliases).length
        ? validated.headingAliases
        : Prisma.DbNull,
      isSystemPreset: false,
      versionNumber: 1,
      createdById: actorId,
    },
  });

  await recordLayoutAudit(db, {
    projectId: input.projectId,
    layoutGroupId: newGroupId,
    layoutDefinitionId: created.id,
    layoutVersionNumber: 1,
    layoutOwnerId: actorId,
    sharingScope,
    templateCode: validated.templateCode,
    eventType: 'LAYOUT_DUPLICATED',
    actorId,
    actorRole: caps.effectiveRole,
    oldSummary: {
      duplicatedFromId: source.id,
      duplicatedFromGroupId: source.layoutGroupId,
      duplicatedFromVersion: source.versionNumber,
    },
    newSummary: {
      duplicatedFromId: source.id,
      templateName,
      sharingScope,
      selectedFields: validated.selectedFields,
      headingAliases: validated.headingAliases,
      definitionHash: validated.definitionHash,
      changeSummary: created.changeSummary,
    },
    remarks: `Duplicated layout ${source.id} (v${source.versionNumber}) into ${newGroupId} (v1)`,
  });

  return serializeRevisionForActor(created, actorId, caps);
}

export async function previewSavedLayout(
  db: Prisma.TransactionClient,
  actorId: string,
  input: {
    projectId: string;
    sourceId: string;
    layoutRevisionId?: string;
    layoutGroupId?: string;
    versionNumber?: number;
  }
) {
  if (!isValidId(input.sourceId)) {
    throw new SavedLayoutError('LAYOUT_SOURCE_REQUIRED', 400);
  }
  const caps = await resolveActorLayoutCapabilities(db, actorId, input.projectId);
  const loaded = await loadSavedLayout(db, actorId, {
    projectId: input.projectId,
    layoutRevisionId: input.layoutRevisionId,
    layoutGroupId: input.layoutGroupId,
    versionNumber: input.versionNumber,
  });

  const rev = loaded.revision;
  if (!rev.selectedFields.length) {
    throw new SavedLayoutError('LAYOUT_FIELD_FORBIDDEN', 403);
  }

  const mapLayoutAdapterErr = (err: unknown): never => {
    if (err instanceof CanonicalAdapterError) {
      const code = err.code.replace(/^TEMPLATE_/, 'LAYOUT_');
      throw new SavedLayoutError(code, err.status);
    }
    throw err;
  };

  let rows: Array<Record<string, unknown>>;
  let sourceVersion: string;
  let metaKeys: readonly string[];
  let cashFlowSummary: LoadedTemplateCanonicalData['cashFlowSummary'] | null = null;
  let executiveMarginSummary: LoadedTemplateCanonicalData['executiveMarginSummary'] | null = null;
  let variationRegisterSummary: LoadedTemplateCanonicalData['variationRegisterSummary'] | null =
    null;
  let treasuryVarianceSummary: LoadedTemplateCanonicalData['treasuryVarianceSummary'] | null = null;
  if (rev.templateCode === 'T0_MASTER_CONTRACT') {
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
        awardedRevenue: true,
        awardedRevenueExVat: true,
        currentContractValue: true,
        contractDurationDays: true,
        commencementDate: true,
        pricingMethod: true,
        contractVatBasis: true,
        taxProfile: { select: { projectId: true, profileCode: true, versionCode: true } },
      },
    });
    if (!c) throw new SavedLayoutError('LAYOUT_APPROVED_SOURCE_NOT_FOUND', 404);
    if (c.taxProfile && c.taxProfile.projectId !== input.projectId) {
      throw new SavedLayoutError('LAYOUT_SOURCE_OWNERSHIP_DENIED', 403);
    }
    sourceVersion = c.id;
    const awardedDisplay = c.awardedRevenue.gt(0)
      ? c.awardedRevenue.toString()
      : c.awardedRevenueExVat.toString();
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
        awarded_revenue: awardedDisplay,
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
    metaKeys = ['project_id', 'contract_id', 'tax_profile_version'];
  } else if (rev.templateCode === 'T1_PHASE_BOQ') {
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
    if (!snapshot) throw new SavedLayoutError('LAYOUT_APPROVED_SOURCE_NOT_FOUND', 404);
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
    if (lines.length > 1000) throw new SavedLayoutError('LAYOUT_ROW_LIMIT_EXCEEDED', 413);
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
    metaKeys = [
      'project_id',
      'snapshot_id',
      'snapshot_version',
      'boq_line_id',
      'phase_code',
      'section_code',
    ];
  } else if (rev.templateCode === 'T2_CONSOLIDATED_BOQ') {
    const loadedData = await loadT2ConsolidatedBoqCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
  } else if (rev.templateCode === 'T3_AGENCY_ESTIMATE') {
    const loadedData = await loadT3AgencyEstimateCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
  } else if (rev.templateCode === 'T4_RESOURCE_TAKEOFF') {
    const loadedData = await loadT4ResourceTakeoffCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
  } else if (rev.templateCode === 'T5_ACCOMPLISHMENT_CERT') {
    const loadedData = await loadT5AccomplishmentCertCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
  } else if (rev.templateCode === 'T6_PROGRESS_BILLING') {
    const loadedData = await loadT6ProgressBillingCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
  } else if (rev.templateCode === 'T7_SCHEDULE_EVM') {
    const loadedData = await loadT7ScheduleEvmCanonicalData(
      db,
      input.projectId,
      input.sourceId
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
  } else if (rev.templateCode === 'T8_CASHFLOW_HALF_MONTH') {
    const loadedData = await loadT8CashflowHalfMonthCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: caps.effectiveRole,
        fieldAccessRole: caps.fieldAccessRole,
      }
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
    cashFlowSummary = loadedData.cashFlowSummary ?? null;
  } else if (rev.templateCode === 'T9_CASHFLOW_QUARTERLY') {
    const loadedData = await loadT9CashflowQuarterlyCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: caps.effectiveRole,
        fieldAccessRole: caps.fieldAccessRole,
      }
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
    cashFlowSummary = loadedData.cashFlowSummary ?? null;
  } else if (rev.templateCode === 'T10_EXECUTIVE_MARGIN') {
    const loadedData = await loadT10ExecutiveMarginCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: caps.effectiveRole,
        fieldAccessRole: caps.fieldAccessRole,
      }
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
    executiveMarginSummary = loadedData.executiveMarginSummary ?? null;
  } else if (rev.templateCode === 'T11_VARIATION_ORDER_REGISTER') {
    const loadedData = await loadT11VariationOrderRegisterCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: caps.effectiveRole,
        fieldAccessRole: caps.fieldAccessRole,
      }
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
    variationRegisterSummary = loadedData.variationRegisterSummary ?? null;
    if (
      Object.entries(rev.headingAliases).some(([fId, alias]) =>
        isMisleadingT11RevisedQuantityHeadingAlias(fId, alias)
      )
    ) {
      throw new SavedLayoutError('LAYOUT_VO_REVISED_QUANTITY_AMBIGUOUS', 409);
    }
  } else {
    const loadedData = await loadT12CashflowVarianceTreasuryCanonicalData(
      db,
      input.projectId,
      input.sourceId,
      {
        effectiveRole: caps.effectiveRole,
        fieldAccessRole: caps.fieldAccessRole,
      }
    ).catch(mapLayoutAdapterErr);
    sourceVersion = loadedData.sourceVersion;
    rows = loadedData.rows;
    metaKeys = loadedData.systemMetaFields;
    cashFlowSummary = loadedData.cashFlowSummary ?? null;
    treasuryVarianceSummary = loadedData.treasuryVarianceSummary ?? null;
    if (
      treasuryVarianceSummary &&
      !treasuryVarianceSummary.actualTreasuryLiquidityVerified &&
      (isMisleadingActualTreasuryHeadingAlias(rev.templateName) ||
        Object.values(rev.headingAliases).some((alias) =>
          isMisleadingActualTreasuryHeadingAlias(alias)
        ))
    ) {
      throw new SavedLayoutError('LAYOUT_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED', 409);
    }
  }

  const projectionRole = resolveNarrowestFieldRole(caps.effectiveRole, caps.fieldAccessRole);
  const projection = buildTemplateProjection(rows, {
    templateCode: rev.templateCode,
    userRole: projectionRole,
    selectedFields: rev.selectedFields,
    headingAliases: rev.headingAliases,
    t12ActualTreasuryLiquidityVerified:
      treasuryVarianceSummary?.actualTreasuryLiquidityVerified === true,
  });

  // IR-01: Apply identical role-based financial visibility restrictions to systemMetaFields & __oserpMeta
  const authorizedMetaKeys = filterSystemMetaFieldsForRoles(
    metaKeys,
    caps.effectiveRole,
    caps.fieldAccessRole
  );
  projection.systemMetaFields = authorizedMetaKeys;
  projection.projectedRows.forEach((r, idx) => {
    r.__oserpMeta = Object.fromEntries(authorizedMetaKeys.map((k) => [k, rows[idx][k] ?? null]));
  });

  const approvedLineTotal =
    (rev.templateCode === 'T1_PHASE_BOQ' || rev.templateCode === 'T2_CONSOLIDATED_BOQ') &&
      rev.selectedFields.includes('contract_line_amount') &&
      canRoleReadField(caps, 'contract_line_amount')
      ? rows
        .reduce(
          (acc, row) => acc.plus(String(row.contract_line_amount ?? '0')),
          new Prisma.Decimal(0)
        )
        .toFixed(2)
      : null;

  const primaryField = PRIMARY_TOTAL_AMOUNT_FIELD[rev.templateCode];
  const summaryTotal =
    primaryField &&
      rev.selectedFields.includes(primaryField) &&
      canRoleReadField(caps, primaryField)
      ? (() => {
        const vals = rows
          .map((r) => r[primaryField])
          .filter((v): v is string | number => v !== null && v !== undefined && v !== '');
        if (vals.length === 0 && rev.templateCode === 'T3_AGENCY_ESTIMATE') return null;
        const amount = vals
          .reduce((acc, v) => acc.plus(String(v)), new Prisma.Decimal(0))
          .toFixed(2);
        return {
          fieldId: primaryField,
          basis:
            rev.templateCode === 'T4_RESOURCE_TAKEOFF'
              ? ('INTERNAL_PRR_BENCHMARK_COST' as const)
              : rev.templateCode === 'T3_AGENCY_ESTIMATE'
                ? ('AGENCY_POW_DUPA_ESTIMATE' as const)
                : rev.templateCode === 'T8_CASHFLOW_HALF_MONTH' ||
                  rev.templateCode === 'T9_CASHFLOW_QUARTERLY'
                  ? ('FORECAST_NET_CASH_RECEIPTS' as const)
                  : rev.templateCode === 'T10_EXECUTIVE_MARGIN'
                    ? ('INTERNAL_EXECUTIVE_EAC_FORECAST' as const)
                    : rev.templateCode === 'T11_VARIATION_ORDER_REGISTER'
                      ? ('APPROVED_CLIENT_VO_REVENUE_DELTA' as const)
                      : rev.templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY'
                        ? ('TREASURY_RECEIPTS_VARIANCE' as const)
                        : ('AWARDED_CONTRACT_REVENUE' as const),
          label:
            rev.templateCode === 'T4_RESOURCE_TAKEOFF'
              ? 'Internal procurement budget ceiling'
              : rev.templateCode === 'T3_AGENCY_ESTIMATE'
                ? 'Agency POW / DUPA estimated total'
                : rev.templateCode === 'T5_ACCOMPLISHMENT_CERT'
                  ? 'Certified current SWA amount'
                  : rev.templateCode === 'T6_PROGRESS_BILLING'
                    ? 'Net certified billing due'
                    : rev.templateCode === 'T7_SCHEDULE_EVM'
                      ? 'Schedule earned value (EV)'
                      : rev.templateCode === 'T8_CASHFLOW_HALF_MONTH' ||
                        rev.templateCode === 'T9_CASHFLOW_QUARTERLY'
                        ? 'Forecast net cash receipts total'
                        : rev.templateCode === 'T10_EXECUTIVE_MARGIN'
                          ? 'Executive forecast profit (Ex-VAT)'
                          : rev.templateCode === 'T11_VARIATION_ORDER_REGISTER'
                            ? 'Approved client VO contract revenue delta'
                            : rev.templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY'
                              ? 'Treasury receipts variance (Actual minus Forecast)'
                              : rev.templateCode === 'T2_CONSOLIDATED_BOQ'
                                ? 'Consolidated awarded BOQ total'
                                : 'Approved BOQ total',
          amount,
        };
      })()
      : null;

  const canReadRestricted = getPermittedVisibilityTiers(projectionRole).has('restricted');

  return {
    templateCode: rev.templateCode,
    rowGrain: rev.rowGrain,
    layout: {
      id: rev.id,
      layoutGroupId: rev.layoutGroupId,
      versionNumber: rev.versionNumber,
      templateName: rev.templateName,
      sharingScope: rev.sharingScope,
      definitionHash: rev.definitionHash,
      redactedFieldCount: rev.redactedFieldCount,
    },
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

export type SavedLayoutActionInput =
  | {
    action: 'create';
    projectId: string;
    templateCode: InitialTemplateCode;
    templateName: string;
    selectedFields: string[];
    headingAliases?: Record<string, string>;
    sharingScope?: LayoutSharingScope;
    changeSummary?: string | null;
  }
  | {
    action: 'version';
    projectId: string;
    layoutGroupId: string;
    expectedVersionNumber?: number;
    templateName?: string;
    selectedFields: string[];
    headingAliases?: Record<string, string>;
    sharingScope?: LayoutSharingScope;
    changeSummary?: string | null;
  }
  | {
    action: 'duplicate';
    projectId: string;
    sourceRevisionId: string;
    templateName?: string;
    sharingScope?: LayoutSharingScope;
    changeSummary?: string | null;
  }
  | {
    action: 'preview';
    projectId: string;
    sourceId: string;
    layoutRevisionId?: string;
    layoutGroupId?: string;
    versionNumber?: number;
  };

export function parseSavedLayoutActionRequest(value: unknown): SavedLayoutActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SavedLayoutError('LAYOUT_INVALID_REQUEST', 400);
  }
  const x = value as Record<string, unknown>;
  if (!isValidId(x.projectId)) {
    throw new SavedLayoutError('LAYOUT_PROJECT_REQUIRED', 400);
  }

  switch (x.action) {
    case 'create': {
      const allowed = new Set([
        'action',
        'projectId',
        'templateCode',
        'templateName',
        'selectedFields',
        'headingAliases',
        'sharingScope',
        'changeSummary',
      ]);
      if (Object.keys(x).some((k) => !allowed.has(k))) {
        throw new SavedLayoutError('LAYOUT_UNSUPPORTED_OPTION', 400);
      }
      return {
        action: 'create',
        projectId: x.projectId,
        templateCode: x.templateCode as InitialTemplateCode,
        templateName: x.templateName as string,
        selectedFields: x.selectedFields as string[],
        headingAliases: x.headingAliases as Record<string, string> | undefined,
        sharingScope: x.sharingScope as LayoutSharingScope | undefined,
        changeSummary: x.changeSummary as string | null | undefined,
      };
    }
    case 'version': {
      const allowed = new Set([
        'action',
        'projectId',
        'layoutGroupId',
        'expectedVersionNumber',
        'templateName',
        'selectedFields',
        'headingAliases',
        'sharingScope',
        'changeSummary',
      ]);
      if (Object.keys(x).some((k) => !allowed.has(k))) {
        throw new SavedLayoutError('LAYOUT_UNSUPPORTED_OPTION', 400);
      }
      if (
        x.expectedVersionNumber !== undefined &&
        (typeof x.expectedVersionNumber !== 'number' ||
          !Number.isInteger(x.expectedVersionNumber) ||
          x.expectedVersionNumber < 1)
      ) {
        throw new SavedLayoutError('LAYOUT_INVALID_VERSION', 400);
      }
      return {
        action: 'version',
        projectId: x.projectId,
        layoutGroupId: x.layoutGroupId as string,
        expectedVersionNumber: x.expectedVersionNumber as number | undefined,
        templateName: x.templateName as string | undefined,
        selectedFields: x.selectedFields as string[],
        headingAliases: x.headingAliases as Record<string, string> | undefined,
        sharingScope: x.sharingScope as LayoutSharingScope | undefined,
        changeSummary: x.changeSummary as string | null | undefined,
      };
    }
    case 'duplicate': {
      const allowed = new Set([
        'action',
        'projectId',
        'sourceRevisionId',
        'templateName',
        'sharingScope',
        'changeSummary',
      ]);
      if (Object.keys(x).some((k) => !allowed.has(k))) {
        throw new SavedLayoutError('LAYOUT_UNSUPPORTED_OPTION', 400);
      }
      return {
        action: 'duplicate',
        projectId: x.projectId,
        sourceRevisionId: x.sourceRevisionId as string,
        templateName: x.templateName as string | undefined,
        sharingScope: x.sharingScope as LayoutSharingScope | undefined,
        changeSummary: x.changeSummary as string | null | undefined,
      };
    }
    case 'preview': {
      const allowed = new Set([
        'action',
        'projectId',
        'sourceId',
        'layoutRevisionId',
        'layoutGroupId',
        'versionNumber',
      ]);
      if (Object.keys(x).some((k) => !allowed.has(k))) {
        throw new SavedLayoutError('LAYOUT_UNSUPPORTED_OPTION', 400);
      }
      if (
        x.versionNumber !== undefined &&
        (typeof x.versionNumber !== 'number' || !Number.isInteger(x.versionNumber) || x.versionNumber < 1)
      ) {
        throw new SavedLayoutError('LAYOUT_INVALID_VERSION', 400);
      }
      return {
        action: 'preview',
        projectId: x.projectId,
        sourceId: x.sourceId as string,
        layoutRevisionId: x.layoutRevisionId as string | undefined,
        layoutGroupId: x.layoutGroupId as string | undefined,
        versionNumber: x.versionNumber as number | undefined,
      };
    }
    default:
      throw new SavedLayoutError('LAYOUT_INVALID_ACTION', 400);
  }
}

