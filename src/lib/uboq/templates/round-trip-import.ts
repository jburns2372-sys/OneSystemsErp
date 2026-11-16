import crypto from 'node:crypto';
import zlib from 'node:zlib';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import { CANONICAL_FIELD_MAP } from '../field-catalog';
import {
  inspectCellSecurity,
  neutralizeSpreadsheetFormulaForCsv,
  scanUploadedDocumentSecurity,
} from '../intake/security-guard';
import { assertProjectGraphOwnership } from '../project-ownership';
import { canRoleAccessField, redactUboqPayloadForRole } from '../security/redact-payload';
import { assertUboqStageAuthorization } from '../security/stage-rbac';
import { SYSTEM_TEMPLATE_PRESETS } from '../template-builder';
import { normalizeUom } from '../uom-registry';
import { FORMAL_EXPORT_CONTRACTS } from './formal-t0-t1';
import { ALLOWED_SAVED_LAYOUT_FIELDS, normalizeHeadingAliases } from './saved-layouts';

export const ROUNDTRIP_SUPPORTED_TEMPLATES = ['T0_MASTER_CONTRACT', 'T1_PHASE_BOQ'] as const;
export type RoundTripTemplateCode = (typeof ROUNDTRIP_SUPPORTED_TEMPLATES)[number];

export const UNRATIFIED_RESERVED_TEMPLATES = [
  'T11_VARIATION_IMPACT',
  'T12_CHANGE_REGISTER',
] as const;

export type RoundTripExportFormat = 'xlsx' | 'json';
export type RoundTripLayoutMode = 'WORKING_PRESET' | 'SAVED_LAYOUT' | 'FORMAL_CONTRACT';
export type RoundTripConflictMode =
  | 'STAGE_GOVERNED_CHANGE_PROPOSAL'
  | 'VERIFY_ONLY'
  | 'OVERWRITE_APPROVED_IN_PLACE';

export class RoundTripImportError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 400,
    public readonly detail?: Record<string, unknown>
  ) {
    super(code);
  }
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

const ROUNDTRIP_STAGE_ROLES = new Set([
  ...GLOBAL_ADMIN_ROLES,
  'FINANCE_DIRECTOR',
  'COMMERCIAL_DIRECTOR',
  'COST_CONTROL_MANAGER',
  'CHIEF_ESTIMATOR',
  'PROJECT_DIRECTOR',
  'DIRECTORS',
  'PROJECT_MANAGER',
  'OPERATIONS_MANAGER',
  'QUANTITY_SURVEYOR',
  'QS_ENGINEER',
  'BILLING_ENGINEER',
  'ACCOUNTANT',
  'PROJECT_ENGINEER',
  'COST_ENGINEER',
  'ESTIMATOR',
]);

const ROUNDTRIP_COMMERCIAL_FINANCIAL_ROLES = new Set([
  'SUPER_ADMIN',
  'PRESIDENT',
  'VP_OPERATIONS',
  'FINANCE_DIRECTOR',
  'COMMERCIAL_DIRECTOR',
  'COST_CONTROL_MANAGER',
  'CHIEF_ESTIMATOR',
  'PROJECT_MANAGER',
  'OPERATIONS_MANAGER',
  'QUANTITY_SURVEYOR',
  'BILLING_ENGINEER',
  'ACCOUNTANT',
]);

const IMMUTABLE_IDENTITY_FIELDS: Readonly<Record<RoundTripTemplateCode, ReadonlySet<string>>> = {
  T0_MASTER_CONTRACT: new Set(['project_id', 'contract_id', 'tax_profile_version']),
  T1_PHASE_BOQ: new Set([
    'project_id',
    'boq_line_id',
    'snapshot_id',
    'snapshot_version',
    'phase_code',
    'section_code',
    'item_code',
  ]),
};

/**
 * Strict commercial/financial/quantity-ceiling fields on T0 and T1.
 * Even when visible in public/internal views (such as approved_qty, original_qty, unit, pricing_method),
 * modifying any of these fields on round-trip import requires verified commercial/financial authority
 * and ALWAYS stages a governed proposal rather than mutating live canonical records.
 */
const COMMERCIAL_FINANCIAL_FIELDS: Readonly<Record<RoundTripTemplateCode, ReadonlySet<string>>> = {
  T0_MASTER_CONTRACT: new Set([
    'awarded_revenue',
    'current_contract_value',
    'contract_vat_basis',
    'pricing_method',
    'vo_reference',
  ]),
  T1_PHASE_BOQ: new Set([
    'original_qty',
    'approved_qty',
    'contract_unit_rate',
    'contract_line_amount',
    'pricing_type',
    'unit',
  ]),
};

const VALID_PRICING_METHODS = new Set([
  'UNIT_PRICE',
  'LUMP_SUM',
  'HYBRID_UNIT_AND_LUMP_SUM',
  'MILESTONE',
  'COST_PLUS',
]);

const VALID_VAT_BASES = new Set([
  'VAT_INCLUSIVE',
  'VAT_EXCLUSIVE',
  'VAT_EXEMPT',
  'ZERO_RATED',
]);

const VALID_PRICING_TYPES = new Set([
  'UNIT_PRICE',
  'LUMP_SUM',
  'MILESTONE',
  'PROVISIONAL_SUM',
]);

export interface ActorRoundTripCapabilities {
  effectiveRole: string;
  fieldAccessRole: string;
  canStageRoundTrip: boolean;
  canModifyFinancialFields: boolean;
}

export interface SignedRoundTripManifest {
  roundTripContractVersion: 'OSERP_T0_T1_ROUNDTRIP_V1';
  packageId: string;
  projectId: string;
  templateCode: RoundTripTemplateCode;
  sourceType: 'CONTRACT_AUTHORITY' | 'OPERATIONAL_SNAPSHOT';
  sourceId: string;
  sourceVersion: string;
  sourceCanonicalHash: string;
  layoutMode: RoundTripLayoutMode;
  layoutGroupId: string | null;
  layoutDefinitionId: string | null;
  layoutVersionNumber: number | null;
  layoutDefinitionHash: string;
  selectedFields: string[];
  headingAliases: Record<string, string>;
  rowCount: number;
  rowIdentityDigest: string;
  financialFieldsIncluded: boolean;
  exportFormat: RoundTripExportFormat;
  packageNonce: string;
  issuedEpochSec: number;
  expiresEpochSec: number;
  manifestSignature: string;
}

export interface ProposedFieldDiff {
  rowNumber: number;
  rowKey: string;
  itemCode: string | null;
  phaseCode: string | null;
  fieldId: string;
  fieldHeading: string;
  classification: 'NON_FINANCIAL_SCOPE' | 'COMMERCIAL_FINANCIAL';
  baselineValue: string | number | null;
  submittedValue: string | number | null;
}

export interface IssueSignedRoundTripRequest {
  projectId: string;
  templateCode: RoundTripTemplateCode;
  sourceId: string;
  format: RoundTripExportFormat;
  layoutMode?: RoundTripLayoutMode;
  layoutRevisionId?: string;
  selectedFields?: string[];
  headingAliases?: Record<string, string>;
  ttlSeconds?: number;
}

export interface VerifySignedRoundTripRequest {
  projectId: string;
  idempotencyKey: string;
  fileName: string;
  fileBuffer: Buffer;
  conflictResolutionMode?: RoundTripConflictMode;
  allowSupersededLayoutRevision?: boolean;
  lumpSumOrRoundedOverrideJustification?: string;
  changeNote?: string;
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{6,160}$/.test(value.trim());
}

function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getTrustAnchorSecret(): string {
  const secret = (process.env.UBOQ_RLS_CONTEXT_SECRET ?? '').trim();
  if (!secret || secret.length < 64) {
    throw new RoundTripImportError('ROUNDTRIP_TRUST_ANCHOR_UNAVAILABLE', 500);
  }
  return secret;
}

export function computeRoundTripManifestSignature(
  manifest: Omit<SignedRoundTripManifest, 'manifestSignature'>,
  secretOverride?: string
): string {
  const secret = (secretOverride ?? getTrustAnchorSecret()).trim();
  const payload = [
    secret,
    'UBOQ_ROUNDTRIP_MANIFEST_V1',
    manifest.packageId,
    manifest.projectId,
    manifest.templateCode.trim().toUpperCase(),
    manifest.sourceType.trim().toUpperCase(),
    manifest.sourceId,
    manifest.sourceVersion,
    manifest.sourceCanonicalHash.trim().toLowerCase(),
    manifest.layoutMode.trim().toUpperCase(),
    manifest.layoutDefinitionId ?? '',
    manifest.layoutVersionNumber !== null ? String(manifest.layoutVersionNumber) : '',
    manifest.layoutDefinitionHash.trim().toLowerCase(),
    String(manifest.rowCount),
    manifest.rowIdentityDigest.trim().toLowerCase(),
    manifest.financialFieldsIncluded ? 'true' : 'false',
    manifest.exportFormat.trim().toUpperCase(),
    manifest.packageNonce.trim().toLowerCase(),
    String(manifest.issuedEpochSec),
    String(manifest.expiresEpochSec),
  ].join('|');
  return sha256Hex(Buffer.from(payload, 'utf8'));
}

function verifyManifestSignatureTimingSafe(manifest: SignedRoundTripManifest): boolean {
  if (!/^[0-9a-f]{64}$/i.test(manifest.manifestSignature || '')) {
    return false;
  }
  const expectedHex = computeRoundTripManifestSignature(manifest);
  const actualBuf = Buffer.from(manifest.manifestSignature.toLowerCase(), 'hex');
  const expectedBuf = Buffer.from(expectedHex.toLowerCase(), 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function mintRoundTripCallProof(params: {
  action: 'ISSUE_PACKAGE' | 'RECORD_SUBMISSION';
  recordId: string;
  projectId: string;
  actorId: string;
  templateCode: string;
  payloadSha256: string;
  statusOrMode: string;
}): string {
  const secret = getTrustAnchorSecret();
  const issuedSec = String(Math.floor(Date.now() / 1000));
  const nonceHex = crypto.randomBytes(12).toString('hex');
  const payload = [
    secret,
    'UBOQ_ROUNDTRIP_CALL_V1',
    params.action.toUpperCase(),
    params.recordId,
    params.projectId,
    params.actorId,
    params.templateCode.trim().toUpperCase(),
    params.payloadSha256.trim().toLowerCase(),
    params.statusOrMode.trim().toUpperCase(),
    issuedSec,
    nonceHex,
  ].join('|');
  const macHex = sha256Hex(Buffer.from(payload, 'utf8'));
  return `${issuedSec}.${nonceHex}.${macHex}`;
}

export function assertSupportedRoundTripTemplateCode(value: unknown): RoundTripTemplateCode {
  if (typeof value !== 'string') {
    throw new RoundTripImportError('ROUNDTRIP_TEMPLATE_NOT_SUPPORTED', 400);
  }
  const norm = value.trim().toUpperCase();
  if ((UNRATIFIED_RESERVED_TEMPLATES as readonly string[]).includes(norm)) {
    throw new RoundTripImportError('ROUNDTRIP_TEMPLATE_UNRATIFIED_PENDING_OWNER_APPROVAL', 400, {
      templateCode: norm,
      ratificationStatus: 'PENDING_PROJECT_OWNER_RATIFICATION',
    });
  }
  if (!(ROUNDTRIP_SUPPORTED_TEMPLATES as readonly string[]).includes(norm)) {
    throw new RoundTripImportError('ROUNDTRIP_TEMPLATE_NOT_SUPPORTED', 400, {
      templateCode: norm,
    });
  }
  return norm as RoundTripTemplateCode;
}

function canActorAccessFieldBothRoles(caps: ActorRoundTripCapabilities, fieldId: string): boolean {
  return (
    canRoleAccessField(caps.effectiveRole, fieldId) &&
    canRoleAccessField(caps.fieldAccessRole, fieldId)
  );
}

export async function resolveActorRoundTripCapabilities(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string
): Promise<ActorRoundTripCapabilities> {
  if (!isValidId(projectId)) {
    throw new RoundTripImportError('ROUNDTRIP_PROJECT_REQUIRED', 400);
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
      canStageRoundTrip: true,
      canModifyFinancialFields: ROUNDTRIP_COMMERCIAL_FINANCIAL_ROLES.has(normRole),
    };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true },
  });
  if (!project) {
    throw new RoundTripImportError('ROUNDTRIP_PROJECT_NOT_FOUND', 404);
  }

  if (project.managerId === actorId) {
    return {
      effectiveRole: normRole,
      fieldAccessRole: normRole,
      canStageRoundTrip: ROUNDTRIP_STAGE_ROLES.has(normRole),
      canModifyFinancialFields: ROUNDTRIP_COMMERCIAL_FINANCIAL_ROLES.has(normRole),
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
    throw new RoundTripImportError('ROUNDTRIP_ACCESS_DENIED', 403);
  }

  const assignAccess = (assignment.accessLevel || '').trim().toUpperCase();
  const assignRole = (assignment.projectRole || '').trim().toUpperCase();
  const isReadOnly = READ_ONLY_LEVELS.has(assignAccess) || READ_ONLY_LEVELS.has(assignRole);
  const narrowedRole =
    assignRole && !['MEMBER', 'STANDARD', 'FULL'].includes(assignRole) ? assignRole : null;
  const fieldAccessRole = isReadOnly ? 'EXTERNAL_VIEWER' : narrowedRole ?? normRole;

  const canStageRoundTrip =
    !isReadOnly &&
    ROUNDTRIP_STAGE_ROLES.has(normRole) &&
    (!narrowedRole || ROUNDTRIP_STAGE_ROLES.has(narrowedRole));

  const canModifyFinancialFields =
    canStageRoundTrip &&
    ROUNDTRIP_COMMERCIAL_FINANCIAL_ROLES.has(normRole) &&
    (!narrowedRole || ROUNDTRIP_COMMERCIAL_FINANCIAL_ROLES.has(narrowedRole));

  return {
    effectiveRole: normRole,
    fieldAccessRole,
    canStageRoundTrip,
    canModifyFinancialFields,
  };
}

interface CanonicalRowWithMeta {
  rowNumber: number;
  rowKey: string;
  meta: {
    __row_num: number;
    row_key: string;
    project_id: string;
    source_id: string;
    source_version: string;
    contract_id: string | null;
    boq_line_id: string | null;
    awarded_boq_item_id: string | null;
    phase_code: string | null;
    section_code: string | null;
    item_code: string | null;
    row_identity_hash: string;
  };
  values: Record<string, string | number | null>;
}

interface LoadedRoundTripCanonicalSource {
  sourceType: 'CONTRACT_AUTHORITY' | 'OPERATIONAL_SNAPSHOT';
  sourceId: string;
  sourceVersion: string;
  sourceCanonicalHash: string;
  rowIdentityDigest: string;
  rows: CanonicalRowWithMeta[];
}

async function loadCanonicalSourceForRoundTrip(
  db: Prisma.TransactionClient,
  projectId: string,
  templateCode: RoundTripTemplateCode,
  sourceId: string
): Promise<LoadedRoundTripCanonicalSource> {
  if (templateCode === 'T0_MASTER_CONTRACT') {
    const c = await db.uboqContractAuthority.findFirst({
      where: {
        id: sourceId,
        projectId,
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
        status: true,
        approvedById: true,
        approvedAt: true,
        taxProfile: { select: { projectId: true, profileCode: true, versionCode: true } },
      },
    });
    if (!c) {
      throw new RoundTripImportError('ROUNDTRIP_APPROVED_SOURCE_NOT_FOUND', 404);
    }
    if (c.taxProfile && c.taxProfile.projectId !== projectId) {
      throw new RoundTripImportError('ROUNDTRIP_SOURCE_OWNERSHIP_DENIED', 403);
    }

    const taxProfileVersion = c.taxProfile
      ? `${c.taxProfile.profileCode}@${c.taxProfile.versionCode}`
      : null;

    const values: Record<string, string | number | null> = {
      project_id: c.projectId,
      contract_id: c.id,
      client_name: c.clientName,
      contract_ref: c.contractRef ?? null,
      noa_ref: c.noaRef ?? null,
      ntp_ref: c.ntpRef ?? null,
      client_po_ref: c.clientPoRef ?? null,
      vo_reference: c.voReference ?? null,
      awarded_revenue: new Prisma.Decimal(c.awardedRevenueExVat).toFixed(2),
      current_contract_value: new Prisma.Decimal(c.currentContractValue).toFixed(2),
      contract_duration: c.contractDurationDays ?? null,
      commencement_date: c.commencementDate ? c.commencementDate.toISOString().slice(0, 10) : null,
      pricing_method: c.pricingMethod,
      contract_vat_basis: c.contractVatBasis,
      tax_profile_version: taxProfileVersion,
    };

    const rowIdentityCore = {
      __row_num: 1,
      row_key: c.id,
      project_id: c.projectId,
      source_id: c.id,
      source_version: c.id,
      contract_id: c.id,
      boq_line_id: null,
      awarded_boq_item_id: null,
      phase_code: null,
      section_code: null,
      item_code: null,
    };
    const rowIdentityHash = sha256Hex(JSON.stringify(rowIdentityCore));
    const meta = { ...rowIdentityCore, row_identity_hash: rowIdentityHash };

    const sourceCanonicalHash = sha256Hex(
      JSON.stringify({
        templateCode,
        projectId: c.projectId,
        sourceId: c.id,
        status: c.status,
        approvedById: c.approvedById,
        approvedAt: c.approvedAt?.toISOString() ?? null,
        awardedRevenueGross: new Prisma.Decimal(c.awardedRevenue).toFixed(2),
        values,
      })
    );
    const rowIdentityDigest = sha256Hex(JSON.stringify([meta]));

    return {
      sourceType: 'CONTRACT_AUTHORITY',
      sourceId: c.id,
      sourceVersion: c.id,
      sourceCanonicalHash,
      rowIdentityDigest,
      rows: [{ rowNumber: 1, rowKey: c.id, meta, values }],
    };
  }

  const snapshot = await db.uboqOperationalSnapshot.findFirst({
    where: {
      id: sourceId,
      projectId,
      status: 'APPROVED',
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    select: {
      id: true,
      projectId: true,
      versionNumber: true,
      canonicalHash: true,
      contractAuthorityId: true,
      status: true,
      approvedById: true,
      approvedAt: true,
    },
  });
  if (!snapshot) {
    throw new RoundTripImportError('ROUNDTRIP_APPROVED_SOURCE_NOT_FOUND', 404);
  }

  if (snapshot.contractAuthorityId) {
    const linkedCa = await db.uboqContractAuthority.findFirst({
      where: {
        id: snapshot.contractAuthorityId,
        projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      select: { id: true },
    });
    if (!linkedCa) {
      throw new RoundTripImportError('ROUNDTRIP_LINKED_CONTRACT_NOT_APPROVED', 409);
    }
  }

  const lines = await db.uboqAwardedPhaseLine.findMany({
    where: { projectId, snapshotId: snapshot.id },
    select: {
      id: true,
      projectId: true,
      snapshotId: true,
      awardedBoqItemId: true,
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
  if (lines.length === 0) {
    throw new RoundTripImportError('ROUNDTRIP_EMPTY_SOURCE_LINES', 409);
  }
  if (lines.length > 1000) {
    throw new RoundTripImportError('ROUNDTRIP_ROW_LIMIT_EXCEEDED', 413);
  }

  const sourceVersion = String(snapshot.versionNumber);
  const rows: CanonicalRowWithMeta[] = lines.map((l, idx) => {
    const rowNumber = idx + 1;
    const values: Record<string, string | number | null> = {
      project_id: l.projectId,
      boq_line_id: l.id,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      phase_code: l.phaseCode,
      section_code: l.sectionCode ?? null,
      item_code: l.itemCode,
      work_description: l.workDescription,
      specification: l.specification ?? null,
      unit: l.unitNormalized,
      pricing_type: l.pricingType,
      original_qty: new Prisma.Decimal(l.originalQty).toFixed(4),
      approved_qty: new Prisma.Decimal(l.approvedQty).toFixed(4),
      contract_unit_rate: new Prisma.Decimal(l.contractUnitRate).toFixed(4),
      contract_line_amount: new Prisma.Decimal(l.contractLineAmount).toFixed(2),
    };
    const rowIdentityCore = {
      __row_num: rowNumber,
      row_key: l.id,
      project_id: l.projectId,
      source_id: snapshot.id,
      source_version: sourceVersion,
      contract_id: snapshot.contractAuthorityId ?? null,
      boq_line_id: l.id,
      awarded_boq_item_id: l.awardedBoqItemId ?? null,
      phase_code: l.phaseCode,
      section_code: l.sectionCode ?? null,
      item_code: l.itemCode,
    };
    const rowIdentityHash = sha256Hex(JSON.stringify(rowIdentityCore));
    return {
      rowNumber,
      rowKey: l.id,
      meta: { ...rowIdentityCore, row_identity_hash: rowIdentityHash },
      values,
    };
  });

  const sourceCanonicalHash = sha256Hex(
    JSON.stringify({
      templateCode,
      projectId: snapshot.projectId,
      snapshotId: snapshot.id,
      versionNumber: snapshot.versionNumber,
      snapshotCanonicalHash: snapshot.canonicalHash,
      contractAuthorityId: snapshot.contractAuthorityId,
      status: snapshot.status,
      approvedById: snapshot.approvedById,
      approvedAt: snapshot.approvedAt?.toISOString() ?? null,
      lines: rows.map((r) => ({
        boq_line_id: r.rowKey,
        awarded_boq_item_id: r.meta.awarded_boq_item_id,
        values: r.values,
      })),
    })
  );
  const rowIdentityDigest = sha256Hex(JSON.stringify(rows.map((r) => r.meta)));

  return {
    sourceType: 'OPERATIONAL_SNAPSHOT',
    sourceId: snapshot.id,
    sourceVersion,
    sourceCanonicalHash,
    rowIdentityDigest,
    rows,
  };
}

function computeLayoutDefinitionHash(
  templateCode: RoundTripTemplateCode,
  selectedFields: readonly string[],
  headingAliases: Record<string, string>
): string {
  const rowGrain = SYSTEM_TEMPLATE_PRESETS[templateCode].rowGrain;
  return sha256Hex(
    JSON.stringify({
      templateCode,
      rowGrain,
      selectedFields,
      headingAliases,
    })
  );
}

const NUMERIC_SCALE_BY_FIELD: Readonly<Record<string, number>> = {
  awarded_revenue: 2,
  current_contract_value: 2,
  contract_duration: 0,
  original_qty: 4,
  approved_qty: 4,
  contract_unit_rate: 4,
  contract_line_amount: 2,
};

async function renderSignedRoundTripXlsxBuffer(
  manifest: SignedRoundTripManifest,
  rows: readonly CanonicalRowWithMeta[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'OneSystemsERP UBOQ Engine';
  wb.created = new Date(manifest.issuedEpochSec * 1000);

  const ws = wb.addWorksheet(manifest.templateCode);
  const headers = manifest.selectedFields.map(
    (fieldId) => manifest.headingAliases[fieldId] ?? CANONICAL_FIELD_MAP.get(fieldId)!.suggestedHeading
  );
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };

  for (const r of rows) {
    const excelValues = manifest.selectedFields.map((fieldId) => {
      const raw = r.values[fieldId];
      if (raw === null || raw === undefined || raw === '') return '';
      const scale = NUMERIC_SCALE_BY_FIELD[fieldId];
      if (scale !== undefined) {
        return Number(raw);
      }
      return neutralizeSpreadsheetFormulaForCsv(String(raw));
    });
    const added = ws.addRow(excelValues);
    manifest.selectedFields.forEach((fieldId, idx) => {
      const scale = NUMERIC_SCALE_BY_FIELD[fieldId];
      if (scale !== undefined && r.values[fieldId] !== null && r.values[fieldId] !== undefined) {
        const cell = added.getCell(idx + 1);
        cell.numFmt =
          scale === 0 ? '#,##0' : scale === 2 ? '#,##0.00' : '#,##0.0000';
      }
    });
  }

  const metaSheet = wb.addWorksheet('__OSERP_META');
  metaSheet.state = 'veryHidden';
  metaSheet.addRow([
    '__row_num',
    'row_key',
    'project_id',
    'source_id',
    'source_version',
    'contract_id',
    'boq_line_id',
    'awarded_boq_item_id',
    'phase_code',
    'section_code',
    'item_code',
    'row_identity_hash',
  ]);
  for (const r of rows) {
    metaSheet.addRow([
      r.meta.__row_num,
      r.meta.row_key,
      r.meta.project_id,
      r.meta.source_id,
      r.meta.source_version,
      r.meta.contract_id ?? '',
      r.meta.boq_line_id ?? '',
      r.meta.awarded_boq_item_id ?? '',
      r.meta.phase_code ?? '',
      r.meta.section_code ?? '',
      r.meta.item_code ?? '',
      r.meta.row_identity_hash,
    ]);
  }

  const sigSheet = wb.addWorksheet('__OSERP_SIGNATURE');
  sigSheet.state = 'veryHidden';
  sigSheet.addRow(['key', 'value']);
  const sigEntries: Array<[string, string]> = [
    ['roundtrip_contract_version', manifest.roundTripContractVersion],
    ['package_id', manifest.packageId],
    ['project_id', manifest.projectId],
    ['template_code', manifest.templateCode],
    ['source_type', manifest.sourceType],
    ['source_id', manifest.sourceId],
    ['source_version', manifest.sourceVersion],
    ['source_canonical_hash', manifest.sourceCanonicalHash],
    ['layout_mode', manifest.layoutMode],
    ['layout_group_id', manifest.layoutGroupId ?? ''],
    ['layout_definition_id', manifest.layoutDefinitionId ?? ''],
    [
      'layout_version_number',
      manifest.layoutVersionNumber !== null ? String(manifest.layoutVersionNumber) : '',
    ],
    ['layout_definition_hash', manifest.layoutDefinitionHash],
    ['selected_fields_json', JSON.stringify(manifest.selectedFields)],
    ['heading_aliases_json', JSON.stringify(manifest.headingAliases)],
    ['row_count', String(manifest.rowCount)],
    ['row_identity_digest', manifest.rowIdentityDigest],
    ['financial_fields_included', manifest.financialFieldsIncluded ? 'true' : 'false'],
    ['export_format', manifest.exportFormat],
    ['package_nonce', manifest.packageNonce],
    ['issued_epoch_sec', String(manifest.issuedEpochSec)],
    ['expires_epoch_sec', String(manifest.expiresEpochSec)],
    ['manifest_signature', manifest.manifestSignature],
  ];
  for (const [k, v] of sigEntries) {
    sigSheet.addRow([k, v]);
  }

  const rawBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(rawBuf);
}

export function parseIssueSignedRoundTripRequest(body: unknown): IssueSignedRoundTripRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new RoundTripImportError('ROUNDTRIP_INVALID_REQUEST', 400);
  }
  const x = body as Record<string, unknown>;
  const allowedKeys = new Set([
    'action',
    'projectId',
    'templateCode',
    'sourceId',
    'format',
    'layoutMode',
    'layoutRevisionId',
    'selectedFields',
    'headingAliases',
    'ttlSeconds',
  ]);
  if (Object.keys(x).some((k) => !allowedKeys.has(k))) {
    throw new RoundTripImportError('ROUNDTRIP_UNSUPPORTED_OPTION', 400);
  }
  if (!isValidId(x.projectId) || !isValidId(x.sourceId)) {
    throw new RoundTripImportError('ROUNDTRIP_SOURCE_REQUIRED', 400);
  }
  const templateCode = assertSupportedRoundTripTemplateCode(x.templateCode);
  const rawFmt = typeof x.format === 'string' ? x.format.trim().toLowerCase() : 'xlsx';
  if (rawFmt !== 'xlsx' && rawFmt !== 'json') {
    throw new RoundTripImportError('ROUNDTRIP_FORMAT_NOT_SUPPORTED', 400);
  }

  let layoutMode: RoundTripLayoutMode = 'WORKING_PRESET';
  if (x.layoutMode !== undefined) {
    if (
      typeof x.layoutMode !== 'string' ||
      !['WORKING_PRESET', 'SAVED_LAYOUT', 'FORMAL_CONTRACT'].includes(x.layoutMode)
    ) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_LAYOUT_MODE', 400);
    }
    layoutMode = x.layoutMode as RoundTripLayoutMode;
  }

  if (layoutMode === 'SAVED_LAYOUT' && !isValidId(x.layoutRevisionId)) {
    throw new RoundTripImportError('ROUNDTRIP_LAYOUT_REVISION_REQUIRED', 400);
  }

  let ttlSeconds: number | undefined;
  if (x.ttlSeconds !== undefined) {
    if (
      typeof x.ttlSeconds !== 'number' ||
      !Number.isInteger(x.ttlSeconds) ||
      x.ttlSeconds < 60 ||
      x.ttlSeconds > 7 * 86400
    ) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_TTL', 400);
    }
    ttlSeconds = x.ttlSeconds;
  }

  return {
    projectId: x.projectId,
    templateCode,
    sourceId: x.sourceId,
    format: rawFmt,
    layoutMode,
    layoutRevisionId: typeof x.layoutRevisionId === 'string' ? x.layoutRevisionId : undefined,
    selectedFields: Array.isArray(x.selectedFields) ? (x.selectedFields as string[]) : undefined,
    headingAliases:
      x.headingAliases && typeof x.headingAliases === 'object' && !Array.isArray(x.headingAliases)
        ? (x.headingAliases as Record<string, string>)
        : undefined,
    ttlSeconds,
  };
}

export async function issueSignedRoundTripPackage(
  db: Prisma.TransactionClient,
  actorId: string,
  rawInput: IssueSignedRoundTripRequest
): Promise<{
  packageId: string;
  manifest: SignedRoundTripManifest;
  deliveredBytes: Buffer;
  outputSha256: string;
  contentType: string;
  fileName: string;
}> {
  const input = parseIssueSignedRoundTripRequest(rawInput);
  const caps = await resolveActorRoundTripCapabilities(db, actorId, input.projectId);
  if (!caps.canStageRoundTrip) {
    throw new RoundTripImportError('ROUNDTRIP_IMPORT_FORBIDDEN', 403);
  }

  const permittedFields = ALLOWED_SAVED_LAYOUT_FIELDS[input.templateCode];
  let selectedFields: string[];
  let headingAliases: Record<string, string> = {};
  let layoutGroupId: string | null = null;
  let layoutDefinitionId: string | null = null;
  let layoutVersionNumber: number | null = null;
  let layoutDefinitionHash: string;
  const layoutMode: RoundTripLayoutMode = input.layoutMode ?? 'WORKING_PRESET';

  if (layoutMode === 'SAVED_LAYOUT') {
    const rev = await db.uboqTemplateDefinition.findFirst({
      where: {
        id: input.layoutRevisionId!,
        projectId: input.projectId,
        isSystemPreset: false,
      },
      select: {
        id: true,
        projectId: true,
        layoutGroupId: true,
        templateCode: true,
        sharingScope: true,
        createdById: true,
        versionNumber: true,
        definitionHash: true,
        selectedFieldsJson: true,
        headingAliasesJson: true,
      },
    });
    if (!rev || rev.templateCode !== input.templateCode) {
      throw new RoundTripImportError('ROUNDTRIP_SAVED_LAYOUT_NOT_FOUND', 404);
    }
    if (
      rev.sharingScope === 'PRIVATE' &&
      rev.createdById !== actorId &&
      !GLOBAL_ADMIN_ROLES.has(caps.effectiveRole)
    ) {
      throw new RoundTripImportError('ROUNDTRIP_SAVED_LAYOUT_FORBIDDEN', 403);
    }
    selectedFields = Array.isArray(rev.selectedFieldsJson)
      ? (rev.selectedFieldsJson as string[])
      : [];
    headingAliases = normalizeHeadingAliases(
      input.templateCode,
      selectedFields,
      rev.headingAliasesJson ?? {}
    );
    layoutGroupId = rev.layoutGroupId;
    layoutDefinitionId = rev.id;
    layoutVersionNumber = rev.versionNumber;
    layoutDefinitionHash =
      rev.definitionHash ??
      computeLayoutDefinitionHash(input.templateCode, selectedFields, headingAliases);
  } else if (layoutMode === 'FORMAL_CONTRACT') {
    const blockingCount = await db.uboqValidationException.count({
      where: { projectId: input.projectId, status: 'OPEN', severity: 'BLOCKING' },
    });
    if (blockingCount > 0) {
      throw new RoundTripImportError('ROUNDTRIP_OPEN_BLOCKING_EXCEPTIONS', 409, {
        openBlockingExceptions: blockingCount,
      });
    }
    const spec = FORMAL_EXPORT_CONTRACTS[input.templateCode];
    selectedFields = [...spec.presetFields];
    headingAliases = normalizeHeadingAliases(
      input.templateCode,
      selectedFields,
      input.headingAliases ?? {}
    );
    layoutDefinitionId = spec.contractCode;
    layoutVersionNumber = 1;
    layoutDefinitionHash = computeLayoutDefinitionHash(
      input.templateCode,
      selectedFields,
      headingAliases
    );
  } else {
    selectedFields =
      input.selectedFields ??
      SYSTEM_TEMPLATE_PRESETS[input.templateCode].defaultFields.filter((f) =>
        canActorAccessFieldBothRoles(caps, f)
      );
    if (
      !Array.isArray(selectedFields) ||
      selectedFields.length === 0 ||
      selectedFields.length > permittedFields.length ||
      selectedFields.some((f) => typeof f !== 'string' || !permittedFields.includes(f)) ||
      new Set(selectedFields).size !== selectedFields.length
    ) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_COLUMNS', 400);
    }
    headingAliases = normalizeHeadingAliases(
      input.templateCode,
      selectedFields,
      input.headingAliases ?? {}
    );
    layoutDefinitionHash = computeLayoutDefinitionHash(
      input.templateCode,
      selectedFields,
      headingAliases
    );
  }

  if (selectedFields.some((f) => !canActorAccessFieldBothRoles(caps, f))) {
    throw new RoundTripImportError('ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN', 403);
  }

  const hasRestrictedField = selectedFields.some(
    (f) => CANONICAL_FIELD_MAP.get(f)?.visibility === 'restricted'
  );
  if (hasRestrictedField && !caps.canModifyFinancialFields) {
    throw new RoundTripImportError('ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN', 403);
  }

  const canonical = await loadCanonicalSourceForRoundTrip(
    db,
    input.projectId,
    input.templateCode,
    input.sourceId
  );

  const packageId = `rtpkg_${crypto.randomBytes(12).toString('hex')}`;
  const packageNonce = crypto.randomBytes(16).toString('hex');
  const issuedEpochSec = Math.floor(Date.now() / 1000);
  const expiresEpochSec = issuedEpochSec + (input.ttlSeconds ?? 86400);

  const unsignedManifest: Omit<SignedRoundTripManifest, 'manifestSignature'> = {
    roundTripContractVersion: 'OSERP_T0_T1_ROUNDTRIP_V1',
    packageId,
    projectId: input.projectId,
    templateCode: input.templateCode,
    sourceType: canonical.sourceType,
    sourceId: canonical.sourceId,
    sourceVersion: canonical.sourceVersion,
    sourceCanonicalHash: canonical.sourceCanonicalHash,
    layoutMode,
    layoutGroupId,
    layoutDefinitionId,
    layoutVersionNumber,
    layoutDefinitionHash,
    selectedFields,
    headingAliases,
    rowCount: canonical.rows.length,
    rowIdentityDigest: canonical.rowIdentityDigest,
    financialFieldsIncluded: hasRestrictedField,
    exportFormat: input.format.toUpperCase() as 'XLSX' | 'JSON' extends never
      ? never
      : RoundTripExportFormat,
    packageNonce,
    issuedEpochSec,
    expiresEpochSec,
  };
  // Keep lowercase 'xlsx' | 'json' in TS manifest while SQL normalizes UPPER()
  unsignedManifest.exportFormat = input.format;

  const manifestSignature = computeRoundTripManifestSignature(unsignedManifest);
  const manifest: SignedRoundTripManifest = {
    ...unsignedManifest,
    manifestSignature,
  };

  let deliveredBytes: Buffer;
  let contentType: string;
  const fileName = `${input.templateCode}_${canonical.sourceId}_${packageId}.${input.format}`;

  if (input.format === 'xlsx') {
    deliveredBytes = await renderSignedRoundTripXlsxBuffer(manifest, canonical.rows);
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    const jsonPkg = {
      roundTripContractVersion: 'OSERP_T0_T1_ROUNDTRIP_V1',
      manifest,
      columns: selectedFields.map((fieldId) => ({
        fieldId,
        heading: headingAliases[fieldId] ?? CANONICAL_FIELD_MAP.get(fieldId)!.suggestedHeading,
      })),
      rows: canonical.rows.map((r) => ({
        __oserpMeta: r.meta,
        values: Object.fromEntries(selectedFields.map((f) => [f, r.values[f] ?? null])),
      })),
    };
    deliveredBytes = Buffer.from(JSON.stringify(jsonPkg, null, 2) + '\n', 'utf8');
    contentType = 'application/json';
  }

  const outputSha256 = sha256Hex(deliveredBytes);
  const callProof = mintRoundTripCallProof({
    action: 'ISSUE_PACKAGE',
    recordId: packageId,
    projectId: input.projectId,
    actorId,
    templateCode: input.templateCode,
    payloadSha256: outputSha256,
    statusOrMode: layoutMode,
  });

  const fieldsJson = JSON.stringify(selectedFields);
  const aliasesJson = JSON.stringify(headingAliases);
  await db.$queryRaw`
    SELECT * FROM public.uboq_issue_signed_roundtrip_package(
      ${packageId}::text,
      ${input.projectId}::text,
      ${actorId}::text,
      ${input.templateCode}::text,
      ${canonical.sourceType}::text,
      ${canonical.sourceId}::text,
      ${canonical.sourceVersion}::text,
      ${canonical.sourceCanonicalHash}::text,
      ${layoutMode}::text,
      ${layoutGroupId}::text,
      ${layoutDefinitionId}::text,
      ${layoutVersionNumber}::integer,
      ${layoutDefinitionHash}::text,
      ${fieldsJson}::jsonb,
      ${aliasesJson}::jsonb,
      ${canonical.rows.length}::integer,
      ${canonical.rowIdentityDigest}::text,
      ${hasRestrictedField}::boolean,
      ${input.format.toUpperCase()}::text,
      ${packageNonce}::text,
      ${outputSha256}::text,
      ${manifestSignature}::text,
      ${BigInt(issuedEpochSec)}::bigint,
      ${BigInt(expiresEpochSec)}::bigint,
      ${callProof}::text
    )
  `;

  await db.auditLog.create({
    data: {
      userId: actorId,
      userRole: caps.effectiveRole,
      moduleName: 'UBOQ_ROUNDTRIP_IMPORT',
      transactionId: packageId,
      actionType: 'ROUNDTRIP_PACKAGE_ISSUED',
      oldValue: null,
      newValue: JSON.stringify({
        projectId: input.projectId,
        packageId,
        templateCode: input.templateCode,
        sourceId: canonical.sourceId,
        sourceVersion: canonical.sourceVersion,
        layoutMode,
        layoutDefinitionId,
        layoutVersionNumber,
        rowCount: canonical.rows.length,
        financialFieldsIncluded: hasRestrictedField,
        format: input.format,
        outputSha256,
      }),
      remarks: `Issued signed ${input.templateCode} round-trip package (${input.format.toUpperCase()})`,
    },
  });

  return {
    packageId,
    manifest,
    deliveredBytes,
    outputSha256,
    contentType,
    fileName,
  };
}

function assertZeroFormulaTagsInXlsxZip(buffer: Buffer): void {
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const idx = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), offset);
    if (idx === -1 || idx + 30 > buffer.length) break;

    const bitFlag = buffer.readUInt16LE(idx + 6);
    const compMethod = buffer.readUInt16LE(idx + 8);
    const compSize = buffer.readUInt32LE(idx + 18);
    const nameLen = buffer.readUInt16LE(idx + 26);
    const extraLen = buffer.readUInt16LE(idx + 28);
    const dataStart = idx + 30 + nameLen + extraLen;

    if (idx + 30 + nameLen <= buffer.length) {
      const entryName = buffer.subarray(idx + 30, idx + 30 + nameLen).toString('utf8');
      if (
        /^xl\/worksheets\/.*\.xml$/i.test(entryName) &&
        (bitFlag & 0x08) === 0 &&
        dataStart + compSize <= buffer.length
      ) {
        const rawEntry = buffer.subarray(dataStart, dataStart + compSize);
        let xmlText = '';
        if (compMethod === 0) {
          xmlText = rawEntry.toString('utf8');
        } else if (compMethod === 8) {
          xmlText = zlib.inflateRawSync(rawEntry).toString('utf8');
        }
        if (/<(?:[a-zA-Z0-9_]+:)?f(?:\s|>)/i.test(xmlText)) {
          throw new RoundTripImportError('ROUNDTRIP_FORMULA_CELL_PROHIBITED', 400, {
            worksheet: entryName,
          });
        }
      }
    }

    offset = dataStart + Math.max(compSize, 0);
    if (offset <= idx) offset = idx + 4;
  }
}

function extractExcelCellScalar(cell: ExcelJS.Cell): unknown {
  const val = cell.value;
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    if ('formula' in val || 'sharedFormula' in val) {
      throw new RoundTripImportError('ROUNDTRIP_FORMULA_CELL_PROHIBITED', 400, {
        cellAddress: cell.address,
      });
    }
    if (val instanceof Date) {
      return val.toISOString().slice(0, 10);
    }
    if ('richText' in val && Array.isArray(val.richText)) {
      return val.richText.map((rt) => rt.text).join('');
    }
    if ('error' in val) {
      throw new RoundTripImportError('ROUNDTRIP_EXCEL_ERROR_CELL', 400, {
        cellAddress: cell.address,
      });
    }
    if ('text' in val && typeof val.text === 'string') {
      return val.text;
    }
  }
  return val;
}

interface ParsedUploadedRoundTripPayload {
  importFormat: 'XLSX' | 'JSON';
  manifest: SignedRoundTripManifest;
  visibleHeaders: string[];
  rows: Array<{
    meta: CanonicalRowWithMeta['meta'];
    rawCellsByField: Record<string, unknown>;
  }>;
}

async function parseUploadedSignedRoundTripPayload(
  fileName: string,
  fileBuffer: Buffer
): Promise<ParsedUploadedRoundTripPayload> {
  let scan;
  try {
    scan = scanUploadedDocumentSecurity(fileName, fileBuffer);
  } catch (err) {
    throw new RoundTripImportError('ROUNDTRIP_DOCUMENT_SECURITY_BLOCKED', 400, {
      reason: err instanceof Error ? err.message : 'Document security scan failed',
    });
  }

  if (scan.detectedFormat === 'JSON') {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fileBuffer.toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_JSON_PAYLOAD', 400);
    }
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.roundTripContractVersion !== 'OSERP_T0_T1_ROUNDTRIP_V1' ||
      !parsed.manifest ||
      typeof parsed.manifest !== 'object' ||
      !Array.isArray(parsed.columns) ||
      !Array.isArray(parsed.rows)
    ) {
      throw new RoundTripImportError('ROUNDTRIP_UNSIGNED_OR_MISSING_MANIFEST', 400);
    }
    const m = parsed.manifest as Record<string, unknown>;
    const templateCode = assertSupportedRoundTripTemplateCode(m.templateCode);
    const manifest: SignedRoundTripManifest = {
      roundTripContractVersion: 'OSERP_T0_T1_ROUNDTRIP_V1',
      packageId: String(m.packageId ?? ''),
      projectId: String(m.projectId ?? ''),
      templateCode,
      sourceType: String(m.sourceType ?? '') as SignedRoundTripManifest['sourceType'],
      sourceId: String(m.sourceId ?? ''),
      sourceVersion: String(m.sourceVersion ?? ''),
      sourceCanonicalHash: String(m.sourceCanonicalHash ?? ''),
      layoutMode: String(m.layoutMode ?? '') as RoundTripLayoutMode,
      layoutGroupId: m.layoutGroupId ? String(m.layoutGroupId) : null,
      layoutDefinitionId: m.layoutDefinitionId ? String(m.layoutDefinitionId) : null,
      layoutVersionNumber:
        typeof m.layoutVersionNumber === 'number' ? m.layoutVersionNumber : null,
      layoutDefinitionHash: String(m.layoutDefinitionHash ?? ''),
      selectedFields: Array.isArray(m.selectedFields)
        ? (m.selectedFields as unknown[]).map((f) => String(f))
        : [],
      headingAliases:
        m.headingAliases && typeof m.headingAliases === 'object' && !Array.isArray(m.headingAliases)
          ? (m.headingAliases as Record<string, string>)
          : {},
      rowCount: Number(m.rowCount ?? 0),
      rowIdentityDigest: String(m.rowIdentityDigest ?? ''),
      financialFieldsIncluded: Boolean(m.financialFieldsIncluded),
      exportFormat: String(m.exportFormat ?? 'json').toLowerCase() as RoundTripExportFormat,
      packageNonce: String(m.packageNonce ?? ''),
      issuedEpochSec: Number(m.issuedEpochSec ?? 0),
      expiresEpochSec: Number(m.expiresEpochSec ?? 0),
      manifestSignature: String(m.manifestSignature ?? ''),
    };

    const visibleHeaders = (parsed.columns as Array<Record<string, unknown>>).map((c) =>
      String(c?.heading ?? '')
    );
    const rows = (parsed.rows as Array<Record<string, unknown>>).map((r) => {
      if (!r || typeof r !== 'object' || !r.__oserpMeta || !r.values) {
        throw new RoundTripImportError('ROUNDTRIP_ROW_LINEAGE_TAMPERED', 409);
      }
      const rm = r.__oserpMeta as Record<string, unknown>;
      return {
        meta: {
          __row_num: Number(rm.__row_num ?? 0),
          row_key: String(rm.row_key ?? ''),
          project_id: String(rm.project_id ?? ''),
          source_id: String(rm.source_id ?? ''),
          source_version: String(rm.source_version ?? ''),
          contract_id: rm.contract_id ? String(rm.contract_id) : null,
          boq_line_id: rm.boq_line_id ? String(rm.boq_line_id) : null,
          awarded_boq_item_id: rm.awarded_boq_item_id ? String(rm.awarded_boq_item_id) : null,
          phase_code: rm.phase_code ? String(rm.phase_code) : null,
          section_code: rm.section_code ? String(rm.section_code) : null,
          item_code: rm.item_code ? String(rm.item_code) : null,
          row_identity_hash: String(rm.row_identity_hash ?? ''),
        },
        rawCellsByField: r.values as Record<string, unknown>,
      };
    });

    return { importFormat: 'JSON', manifest, visibleHeaders, rows };
  }

  if (scan.detectedFormat !== 'XLSX') {
    throw new RoundTripImportError('ROUNDTRIP_FORMAT_NOT_SUPPORTED', 400, {
      detectedFormat: scan.detectedFormat,
    });
  }

  assertZeroFormulaTagsInXlsxZip(fileBuffer);

  const wb = new ExcelJS.Workbook();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(fileBuffer as any);
  } catch {
    throw new RoundTripImportError('ROUNDTRIP_CORRUPTED_WORKBOOK', 400);
  }

  const sigSheet = wb.getWorksheet('__OSERP_SIGNATURE');
  const metaSheet = wb.getWorksheet('__OSERP_META');
  if (!sigSheet || !metaSheet) {
    throw new RoundTripImportError('ROUNDTRIP_UNSIGNED_OR_MISSING_MANIFEST', 400);
  }

  const sigMap = new Map<string, string>();
  for (let r = 2; r <= sigSheet.rowCount; r += 1) {
    const row = sigSheet.getRow(r);
    const k = String(extractExcelCellScalar(row.getCell(1)) ?? '').trim();
    const v = String(extractExcelCellScalar(row.getCell(2)) ?? '');
    if (k) sigMap.set(k, v);
  }
  if (sigMap.get('roundtrip_contract_version') !== 'OSERP_T0_T1_ROUNDTRIP_V1') {
    throw new RoundTripImportError('ROUNDTRIP_UNSIGNED_OR_MISSING_MANIFEST', 400);
  }

  const templateCode = assertSupportedRoundTripTemplateCode(sigMap.get('template_code'));
  let selectedFields: string[] = [];
  let headingAliases: Record<string, string> = {};
  try {
    selectedFields = JSON.parse(sigMap.get('selected_fields_json') || '[]') as string[];
    headingAliases = JSON.parse(sigMap.get('heading_aliases_json') || '{}') as Record<
      string,
      string
    >;
  } catch {
    throw new RoundTripImportError('ROUNDTRIP_SIGNATURE_INVALID', 403);
  }

  const lvRaw = sigMap.get('layout_version_number') || '';
  const manifest: SignedRoundTripManifest = {
    roundTripContractVersion: 'OSERP_T0_T1_ROUNDTRIP_V1',
    packageId: sigMap.get('package_id') || '',
    projectId: sigMap.get('project_id') || '',
    templateCode,
    sourceType: (sigMap.get('source_type') || '') as SignedRoundTripManifest['sourceType'],
    sourceId: sigMap.get('source_id') || '',
    sourceVersion: sigMap.get('source_version') || '',
    sourceCanonicalHash: sigMap.get('source_canonical_hash') || '',
    layoutMode: (sigMap.get('layout_mode') || '') as RoundTripLayoutMode,
    layoutGroupId: sigMap.get('layout_group_id') || null,
    layoutDefinitionId: sigMap.get('layout_definition_id') || null,
    layoutVersionNumber: lvRaw !== '' ? Number(lvRaw) : null,
    layoutDefinitionHash: sigMap.get('layout_definition_hash') || '',
    selectedFields,
    headingAliases,
    rowCount: Number(sigMap.get('row_count') || '0'),
    rowIdentityDigest: sigMap.get('row_identity_digest') || '',
    financialFieldsIncluded: sigMap.get('financial_fields_included') === 'true',
    exportFormat: ((sigMap.get('export_format') || 'xlsx').toLowerCase() as RoundTripExportFormat),
    packageNonce: sigMap.get('package_nonce') || '',
    issuedEpochSec: Number(sigMap.get('issued_epoch_sec') || '0'),
    expiresEpochSec: Number(sigMap.get('expires_epoch_sec') || '0'),
    manifestSignature: sigMap.get('manifest_signature') || '',
  };

  const dataSheet = wb.getWorksheet(templateCode);
  if (!dataSheet) {
    throw new RoundTripImportError('ROUNDTRIP_WORKSHEET_MISSING', 400, {
      expectedWorksheet: templateCode,
    });
  }

  const headerRow = dataSheet.getRow(1);
  const maxHeaderCols = Math.max(selectedFields.length, headerRow.cellCount);
  const visibleHeaders: string[] = [];
  for (let c = 1; c <= maxHeaderCols; c += 1) {
    const hv = String(extractExcelCellScalar(headerRow.getCell(c)) ?? '').trim();
    if (c <= selectedFields.length || hv !== '') {
      visibleHeaders.push(hv);
    }
  }

  // Count non-empty data rows & meta rows to detect added/deleted rows
  const metaRows: CanonicalRowWithMeta['meta'][] = [];
  for (let r = 2; r <= metaSheet.rowCount; r += 1) {
    const row = metaSheet.getRow(r);
    const rk = String(extractExcelCellScalar(row.getCell(2)) ?? '').trim();
    const rnRaw = extractExcelCellScalar(row.getCell(1));
    if (rk === '' && (rnRaw === null || rnRaw === '')) continue;
    const strOrNull = (colIdx: number) => {
      const s = String(extractExcelCellScalar(row.getCell(colIdx)) ?? '').trim();
      return s === '' ? null : s;
    };
    metaRows.push({
      __row_num: Number(rnRaw ?? 0),
      row_key: rk,
      project_id: String(extractExcelCellScalar(row.getCell(3)) ?? '').trim(),
      source_id: String(extractExcelCellScalar(row.getCell(4)) ?? '').trim(),
      source_version: String(extractExcelCellScalar(row.getCell(5)) ?? '').trim(),
      contract_id: strOrNull(6),
      boq_line_id: strOrNull(7),
      awarded_boq_item_id: strOrNull(8),
      phase_code: strOrNull(9),
      section_code: strOrNull(10),
      item_code: strOrNull(11),
      row_identity_hash: String(extractExcelCellScalar(row.getCell(12)) ?? '').trim(),
    });
  }

  let dataNonEmptyRowCount = 0;
  const maxDataRow = Math.max(dataSheet.rowCount, metaRows.length + 1);
  const rawRowRecords: Array<Record<string, unknown>> = [];
  for (let r = 2; r <= maxDataRow; r += 1) {
    const row = dataSheet.getRow(r);
    let anyNonEmpty = false;
    const cellMap: Record<string, unknown> = {};
    for (let c = 1; c <= Math.max(selectedFields.length, row.cellCount); c += 1) {
      const scalar = extractExcelCellScalar(row.getCell(c));
      if (scalar !== null && scalar !== undefined && String(scalar).trim() !== '') {
        anyNonEmpty = true;
        if (c > selectedFields.length) {
          throw new RoundTripImportError('ROUNDTRIP_LAYOUT_HEADER_MISMATCH', 409, {
            unexpectedColumnIndex: c,
            row: r,
          });
        }
      }
      if (c <= selectedFields.length) {
        cellMap[selectedFields[c - 1]!] = scalar;
      }
    }
    if (r - 1 <= metaRows.length) {
      if (!anyNonEmpty) {
        throw new RoundTripImportError('ROUNDTRIP_ROW_LINEAGE_TAMPERED', 409, {
          reason: 'DELETED_OR_BLANK_CANONICAL_ROW',
          row: r,
        });
      }
      dataNonEmptyRowCount += 1;
      rawRowRecords.push(cellMap);
    } else if (anyNonEmpty) {
      throw new RoundTripImportError('ROUNDTRIP_ROW_LINEAGE_TAMPERED', 409, {
        reason: 'UNAPPROVED_ADDED_ROW_DETECTED',
        row: r,
      });
    }
  }

  if (dataNonEmptyRowCount !== metaRows.length) {
    throw new RoundTripImportError('ROUNDTRIP_ROW_LINEAGE_TAMPERED', 409);
  }

  return {
    importFormat: 'XLSX',
    manifest,
    visibleHeaders,
    rows: metaRows.map((meta, idx) => ({
      meta,
      rawCellsByField: rawRowRecords[idx]!,
    })),
  };
}

function unescapeNeutralizedLeadingTick(text: string): string {
  if (text.startsWith("'") && text.length > 1 && /^'[\t\r=+\-@]/.test(text)) {
    return text.slice(1);
  }
  return text;
}

function normalizeAndValidateFieldValue(
  fieldId: string,
  rawVal: unknown,
  specHint?: string | null
): string | number | null {
  const spec = CANONICAL_FIELD_MAP.get(fieldId);
  if (!spec) {
    throw new RoundTripImportError('ROUNDTRIP_UNKNOWN_FIELD', 400, { fieldId });
  }

  if (rawVal === null || rawVal === undefined) {
    if (
      fieldId === 'client_name' ||
      fieldId === 'work_description' ||
      fieldId === 'unit' ||
      fieldId === 'pricing_method' ||
      fieldId === 'contract_vat_basis' ||
      fieldId === 'pricing_type' ||
      NUMERIC_SCALE_BY_FIELD[fieldId] !== undefined && fieldId !== 'contract_duration'
    ) {
      throw new RoundTripImportError('ROUNDTRIP_REQUIRED_FIELD_EMPTY', 400, { fieldId });
    }
    return null;
  }

  const rawText = unescapeNeutralizedLeadingTick(String(rawVal)).trim();
  if (rawText === '') {
    if (
      fieldId === 'client_name' ||
      fieldId === 'work_description' ||
      fieldId === 'unit' ||
      fieldId === 'pricing_method' ||
      fieldId === 'contract_vat_basis' ||
      fieldId === 'pricing_type' ||
      (NUMERIC_SCALE_BY_FIELD[fieldId] !== undefined && fieldId !== 'contract_duration')
    ) {
      throw new RoundTripImportError('ROUNDTRIP_REQUIRED_FIELD_EMPTY', 400, { fieldId });
    }
    return null;
  }

  const cellSec = inspectCellSecurity(rawText);
  if (cellSec.isFormulaInjection || cellSec.isPromptInjection) {
    throw new RoundTripImportError('ROUNDTRIP_CELL_INJECTION_BLOCKED', 400, {
      fieldId,
      alerts: cellSec.alerts,
    });
  }
  if (/^\s*[=+\-@]/.test(rawText) && NUMERIC_SCALE_BY_FIELD[fieldId] === undefined) {
    throw new RoundTripImportError('ROUNDTRIP_FORMULA_PREFIX_BLOCKED', 400, { fieldId });
  }

  const scale = NUMERIC_SCALE_BY_FIELD[fieldId];
  if (scale !== undefined) {
    const cleanedNum = rawText.replace(/,/g, '');
    if (!/^\d+(?:\.\d+)?$/.test(cleanedNum)) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_NUMERIC_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
    if (scale === 0) {
      const asInt = Number(cleanedNum);
      if (!Number.isInteger(asInt) || asInt <= 0 || asInt > 36500) {
        throw new RoundTripImportError('ROUNDTRIP_INVALID_DURATION_DAYS', 400, {
          fieldId,
          value: rawText,
        });
      }
      return asInt;
    }
    const dec = new Prisma.Decimal(cleanedNum);
    if (dec.isNegative() || !dec.isFinite()) {
      throw new RoundTripImportError('ROUNDTRIP_NEGATIVE_NUMERIC_PROHIBITED', 400, { fieldId });
    }
    if (dec.decimalPlaces() > scale) {
      throw new RoundTripImportError('ROUNDTRIP_DECIMAL_SCALE_EXCEEDED', 400, {
        fieldId,
        maxScale: scale,
        value: rawText,
      });
    }
    if (
      (fieldId === 'original_qty' || fieldId === 'approved_qty') &&
      dec.lte(0)
    ) {
      throw new RoundTripImportError('ROUNDTRIP_NON_POSITIVE_QUANTITY', 400, { fieldId });
    }
    return dec.toFixed(scale);
  }

  if (spec.dataType === 'DATE') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawText)) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_DATE_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
    const parsedDate = new Date(`${rawText}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== rawText
    ) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_DATE_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
    return rawText;
  }

  if (fieldId === 'unit') {
    try {
      return normalizeUom(rawText, specHint).normalizedCode;
    } catch {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_UOM_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
  }

  if (fieldId === 'pricing_method') {
    const up = rawText.toUpperCase();
    if (!VALID_PRICING_METHODS.has(up)) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_ENUM_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
    return up;
  }

  if (fieldId === 'contract_vat_basis') {
    const up = rawText.toUpperCase();
    if (!VALID_VAT_BASES.has(up)) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_ENUM_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
    return up;
  }

  if (fieldId === 'pricing_type') {
    const up = rawText.toUpperCase();
    if (!VALID_PRICING_TYPES.has(up)) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_ENUM_VALUE', 400, {
        fieldId,
        value: rawText,
      });
    }
    return up;
  }

  if (rawText.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(rawText)) {
    throw new RoundTripImportError('ROUNDTRIP_INVALID_TEXT_VALUE', 400, { fieldId });
  }

  return rawText;
}

export async function persistRoundTripSubmissionRecord(
  db: Prisma.TransactionClient,
  params: {
    actorId: string;
    actorRole: string;
    projectId: string;
    packageId: string | null;
    idempotencyKey: string;
    uploadedFileSha256: string;
    importFormat: 'XLSX' | 'JSON';
    templateCode: RoundTripTemplateCode;
    sourceId: string | null;
    sourceVersion: string | null;
    layoutDefinitionId: string | null;
    layoutVersionNumber: number | null;
    layoutDefinitionHash: string | null;
    conflictResolutionMode: RoundTripConflictMode;
    verificationStatus: 'STAGED_PENDING_APPROVAL' | 'VERIFIED_NO_CHANGES' | 'REJECTED';
    failureCode: string | null;
    totalRowCount: number;
    changedRowCount: number;
    nonFinancialChangeCount: number;
    financialChangeCount: number;
    proposedChanges: ProposedFieldDiff[];
    diagnostics: Record<string, unknown>;
  }
): Promise<{ idempotentReplay: boolean; submissionId: string; createdAt: string }> {
  const submissionId = `rtimp_${crypto.randomBytes(12).toString('hex')}`;
  const callProof = mintRoundTripCallProof({
    action: 'RECORD_SUBMISSION',
    recordId: submissionId,
    projectId: params.projectId,
    actorId: params.actorId,
    templateCode: params.templateCode,
    payloadSha256: params.uploadedFileSha256,
    statusOrMode: params.verificationStatus,
  });

  const proposedJson = JSON.stringify(params.proposedChanges);
  const diagJson = JSON.stringify(params.diagnostics);

  let rows: Array<{ result: { idempotentReplay: boolean; submission: Record<string, unknown> } }>;
  try {
    rows = await db.$queryRaw<
      Array<{ result: { idempotentReplay: boolean; submission: Record<string, unknown> } }>
    >`
      SELECT public.uboq_record_roundtrip_import_submission(
        ${submissionId}::text,
        ${params.projectId}::text,
        ${params.actorId}::text,
        ${params.packageId}::text,
        ${params.idempotencyKey}::text,
        ${params.uploadedFileSha256}::text,
        ${params.importFormat}::text,
        ${params.templateCode}::text,
        ${params.sourceId}::text,
        ${params.sourceVersion}::text,
        ${params.layoutDefinitionId}::text,
        ${params.layoutVersionNumber}::integer,
        ${params.layoutDefinitionHash}::text,
        ${params.conflictResolutionMode}::text,
        ${params.verificationStatus}::text,
        ${params.failureCode}::text,
        ${params.totalRowCount}::integer,
        ${params.changedRowCount}::integer,
        ${params.nonFinancialChangeCount}::integer,
        ${params.financialChangeCount}::integer,
        ${proposedJson}::jsonb,
        ${diagJson}::jsonb,
        ${callProof}::text
      ) AS result
    `;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ROUNDTRIP_IDEMPOTENCY_KEY_CONFLICT')) {
      throw new RoundTripImportError('ROUNDTRIP_IDEMPOTENCY_KEY_CONFLICT', 409);
    }
    if (msg.includes('ROUNDTRIP_PACKAGE_REPLAY_BLOCKED') || msg.includes('ALREADY_CONSUMED')) {
      throw new RoundTripImportError('ROUNDTRIP_PACKAGE_REPLAY_BLOCKED', 409);
    }
    if (msg.includes('ROUNDTRIP_PACKAGE_EXPIRED')) {
      throw new RoundTripImportError('ROUNDTRIP_PACKAGE_EXPIRED', 409);
    }
    if (msg.includes('ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN')) {
      throw new RoundTripImportError('ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN', 403);
    }
    if (msg.includes('ROUNDTRIP_IMPORT_FORBIDDEN')) {
      throw new RoundTripImportError('ROUNDTRIP_IMPORT_FORBIDDEN', 403);
    }
    throw err;
  }

  const out = rows[0]!.result;
  const sub = out.submission;
  const persistedId = String(sub.id);

  if (!out.idempotentReplay) {
    const actionType =
      params.verificationStatus === 'STAGED_PENDING_APPROVAL'
        ? 'ROUNDTRIP_IMPORT_STAGED'
        : params.verificationStatus === 'VERIFIED_NO_CHANGES'
          ? 'ROUNDTRIP_IMPORT_VERIFIED_NOOP'
          : 'ROUNDTRIP_IMPORT_REJECTED';

    await db.auditLog.create({
      data: {
        userId: params.actorId,
        userRole: params.actorRole,
        moduleName: 'UBOQ_ROUNDTRIP_IMPORT',
        transactionId: persistedId,
        actionType,
        oldValue: null,
        newValue: JSON.stringify({
          projectId: params.projectId,
          submissionId: persistedId,
          packageId: params.packageId,
          idempotencyKey: params.idempotencyKey,
          templateCode: params.templateCode,
          sourceId: params.sourceId,
          sourceVersion: params.sourceVersion,
          verificationStatus: params.verificationStatus,
          failureCode: params.failureCode,
          changedRowCount: params.changedRowCount,
          nonFinancialChangeCount: params.nonFinancialChangeCount,
          financialChangeCount: params.financialChangeCount,
          uploadedFileSha256: params.uploadedFileSha256,
        }),
        remarks:
          params.failureCode
            ? `Rejected round-trip import (${params.failureCode})`
            : `Verified signed ${params.templateCode} round-trip (${params.verificationStatus})`,
      },
    });
  }

  return {
    idempotentReplay: out.idempotentReplay,
    submissionId: persistedId,
    createdAt: String(sub.createdAt ?? new Date().toISOString()),
  };
}

export interface VerifiedRoundTripImportResult {
  submissionId: string;
  idempotentReplay: boolean;
  verificationStatus: 'STAGED_PENDING_APPROVAL' | 'VERIFIED_NO_CHANGES';
  canonicalRecordsMutated: 0;
  packageId: string;
  projectId: string;
  templateCode: RoundTripTemplateCode;
  sourceId: string;
  sourceVersion: string;
  layoutMode: RoundTripLayoutMode;
  layoutDefinitionId: string | null;
  layoutVersionNumber: number | null;
  uploadedFileSha256: string;
  totalRowCount: number;
  changedRowCount: number;
  nonFinancialChangeCount: number;
  financialChangeCount: number;
  proposedChanges: ProposedFieldDiff[];
  createdAt: string;
}

export async function verifyAndStageSignedRoundTripImport(
  db: Prisma.TransactionClient,
  actorId: string,
  req: VerifySignedRoundTripRequest
): Promise<VerifiedRoundTripImportResult> {
  if (!isValidId(req.projectId)) {
    throw new RoundTripImportError('ROUNDTRIP_PROJECT_REQUIRED', 400);
  }
  if (!isValidIdempotencyKey(req.idempotencyKey)) {
    throw new RoundTripImportError('ROUNDTRIP_IDEMPOTENCY_KEY_REQUIRED', 400);
  }

  const caps = await resolveActorRoundTripCapabilities(db, actorId, req.projectId);
  if (!caps.canStageRoundTrip) {
    throw new RoundTripImportError('ROUNDTRIP_IMPORT_FORBIDDEN', 403);
  }

  const conflictMode: RoundTripConflictMode =
    req.conflictResolutionMode ?? 'STAGE_GOVERNED_CHANGE_PROPOSAL';
  if (
    !['STAGE_GOVERNED_CHANGE_PROPOSAL', 'VERIFY_ONLY', 'OVERWRITE_APPROVED_IN_PLACE'].includes(
      conflictMode
    )
  ) {
    throw new RoundTripImportError('ROUNDTRIP_INVALID_CONFLICT_MODE', 400);
  }

  const uploadedFileSha256 = sha256Hex(req.fileBuffer);

  // Fast-path check for exact idempotent retry before re-consuming package
  const existingSubmission = await db.uboqRoundTripImportSubmission.findUnique({
    where: {
      projectId_idempotencyKey: {
        projectId: req.projectId,
        idempotencyKey: req.idempotencyKey.trim(),
      },
    },
  });
  if (existingSubmission) {
    if (
      existingSubmission.actorUserId === actorId &&
      existingSubmission.uploadedFileSha256 === uploadedFileSha256 &&
      existingSubmission.conflictResolutionMode === conflictMode &&
      (existingSubmission.verificationStatus === 'STAGED_PENDING_APPROVAL' ||
        existingSubmission.verificationStatus === 'VERIFIED_NO_CHANGES')
    ) {
      return {
        submissionId: existingSubmission.id,
        idempotentReplay: true,
        verificationStatus: existingSubmission.verificationStatus as
          | 'STAGED_PENDING_APPROVAL'
          | 'VERIFIED_NO_CHANGES',
        canonicalRecordsMutated: 0,
        packageId: existingSubmission.packageId!,
        projectId: existingSubmission.projectId,
        templateCode: existingSubmission.templateCode as RoundTripTemplateCode,
        sourceId: existingSubmission.sourceId!,
        sourceVersion: existingSubmission.sourceVersion!,
        layoutMode: 'WORKING_PRESET',
        layoutDefinitionId: existingSubmission.layoutDefinitionId,
        layoutVersionNumber: existingSubmission.layoutVersionNumber,
        uploadedFileSha256,
        totalRowCount: existingSubmission.totalRowCount,
        changedRowCount: existingSubmission.changedRowCount,
        nonFinancialChangeCount: existingSubmission.nonFinancialChangeCount,
        financialChangeCount: existingSubmission.financialChangeCount,
        proposedChanges: Array.isArray(existingSubmission.proposedChangesJson)
          ? (existingSubmission.proposedChangesJson as unknown as ProposedFieldDiff[])
          : [],
        createdAt: existingSubmission.createdAt.toISOString(),
      };
    }
    throw new RoundTripImportError('ROUNDTRIP_IDEMPOTENCY_KEY_CONFLICT', 409);
  }

  // Gate 0: Never allow silent or direct in-place overwrite of approved canonical records
  if (conflictMode === 'OVERWRITE_APPROVED_IN_PLACE') {
    throw new RoundTripImportError('ROUNDTRIP_SILENT_OVERWRITE_BLOCKED', 409, {
      conflictResolutionMode: conflictMode,
    });
  }

  // Gate 1: Document security & container parsing
  const parsed = await parseUploadedSignedRoundTripPayload(req.fileName, req.fileBuffer);
  const { manifest } = parsed;

  // Gate 2: Cryptographic manifest signature verification (trust-anchor HMAC/SHA-256)
  if (!verifyManifestSignatureTimingSafe(manifest)) {
    throw new RoundTripImportError('ROUNDTRIP_SIGNATURE_INVALID', 403, {
      claimedPackageId: manifest.packageId || null,
    });
  }

  // Gate 3: Project identity & persisted package ledger verification
  if (manifest.projectId !== req.projectId) {
    throw new RoundTripImportError('ROUNDTRIP_PROJECT_IDENTITY_MISMATCH', 403, {
      manifestProjectId: manifest.projectId,
      requestProjectId: req.projectId,
    });
  }

  const pkgRow = await db.uboqSignedRoundTripPackage.findFirst({
    where: {
      id: manifest.packageId,
      projectId: req.projectId,
    },
  });
  if (!pkgRow) {
    throw new RoundTripImportError('ROUNDTRIP_PACKAGE_NOT_FOUND', 403);
  }
  if (
    pkgRow.manifestSignature !== manifest.manifestSignature.toLowerCase() ||
    pkgRow.packageNonce !== manifest.packageNonce.toLowerCase() ||
    pkgRow.templateCode !== manifest.templateCode ||
    pkgRow.sourceId !== manifest.sourceId ||
    pkgRow.sourceCanonicalHash !== manifest.sourceCanonicalHash.toLowerCase() ||
    pkgRow.layoutDefinitionHash !== manifest.layoutDefinitionHash.toLowerCase() ||
    pkgRow.rowIdentityDigest !== manifest.rowIdentityDigest.toLowerCase()
  ) {
    throw new RoundTripImportError('ROUNDTRIP_SIGNATURE_INVALID', 403);
  }
  if (pkgRow.consumedByImportId !== null) {
    throw new RoundTripImportError('ROUNDTRIP_PACKAGE_REPLAY_BLOCKED', 409, {
      packageId: pkgRow.id,
      consumedByImportId: pkgRow.consumedByImportId,
    });
  }
  if (pkgRow.expiresAt.getTime() < Date.now()) {
    throw new RoundTripImportError('ROUNDTRIP_PACKAGE_EXPIRED', 409, {
      packageId: pkgRow.id,
      expiresAt: pkgRow.expiresAt.toISOString(),
    });
  }

  // Gate 4: Canonical source existence, approval status & concurrent drift (no silent overwrite)
  let liveCanonical: LoadedRoundTripCanonicalSource;
  try {
    liveCanonical = await loadCanonicalSourceForRoundTrip(
      db,
      req.projectId,
      manifest.templateCode,
      manifest.sourceId
    );
  } catch (err) {
    if (err instanceof RoundTripImportError && err.status === 404) {
      throw new RoundTripImportError('ROUNDTRIP_SOURCE_STALE_OR_MODIFIED', 409, {
        reason: 'SOURCE_NO_LONGER_APPROVED',
      });
    }
    throw err;
  }

  if (
    liveCanonical.sourceVersion !== manifest.sourceVersion ||
    liveCanonical.sourceCanonicalHash !== manifest.sourceCanonicalHash.toLowerCase()
  ) {
    throw new RoundTripImportError('ROUNDTRIP_SOURCE_STALE_OR_MODIFIED', 409, {
      manifestSourceHash: manifest.sourceCanonicalHash,
      liveSourceHash: liveCanonical.sourceCanonicalHash,
    });
  }

  // Gate 5: Layout & version compatibility verification
  const recomputedLayoutHash = computeLayoutDefinitionHash(
    manifest.templateCode,
    manifest.selectedFields,
    manifest.headingAliases
  );
  if (recomputedLayoutHash !== manifest.layoutDefinitionHash.toLowerCase()) {
    throw new RoundTripImportError('ROUNDTRIP_LAYOUT_HASH_MISMATCH', 409);
  }

  const expectedHeaders = manifest.selectedFields.map(
    (fieldId) => manifest.headingAliases[fieldId] ?? CANONICAL_FIELD_MAP.get(fieldId)!.suggestedHeading
  );
  if (
    parsed.visibleHeaders.length !== expectedHeaders.length ||
    parsed.visibleHeaders.some((h, idx) => h.trim() !== expectedHeaders[idx]!.trim())
  ) {
    throw new RoundTripImportError('ROUNDTRIP_LAYOUT_HEADER_MISMATCH', 409, {
      expectedHeaders,
      receivedHeaders: parsed.visibleHeaders,
    });
  }

  if (manifest.layoutMode === 'SAVED_LAYOUT') {
    if (!manifest.layoutDefinitionId || manifest.layoutVersionNumber === null) {
      throw new RoundTripImportError('ROUNDTRIP_SAVED_LAYOUT_INVALID', 409);
    }
    const savedRev = await db.uboqTemplateDefinition.findFirst({
      where: {
        id: manifest.layoutDefinitionId,
        projectId: req.projectId,
        isSystemPreset: false,
      },
      select: {
        id: true,
        layoutGroupId: true,
        versionNumber: true,
        definitionHash: true,
      },
    });
    if (!savedRev || savedRev.definitionHash !== manifest.layoutDefinitionHash.toLowerCase()) {
      throw new RoundTripImportError('ROUNDTRIP_SAVED_LAYOUT_MODIFIED_OR_MISSING', 409);
    }
    if (!req.allowSupersededLayoutRevision && savedRev.layoutGroupId) {
      const latestRev = await db.uboqTemplateDefinition.findFirst({
        where: {
          projectId: req.projectId,
          layoutGroupId: savedRev.layoutGroupId,
          isSystemPreset: false,
        },
        orderBy: { versionNumber: 'desc' },
        select: { id: true, versionNumber: true },
      });
      if (latestRev && latestRev.versionNumber > savedRev.versionNumber) {
        throw new RoundTripImportError('ROUNDTRIP_LAYOUT_VERSION_SUPERSEDED', 409, {
          packageLayoutVersion: savedRev.versionNumber,
          latestLayoutVersion: latestRev.versionNumber,
        });
      }
    }
  }

  // Gate 6: Row lineage & immutable identity verification
  if (parsed.rows.length !== liveCanonical.rows.length) {
    throw new RoundTripImportError('ROUNDTRIP_ROW_LINEAGE_TAMPERED', 409, {
      expectedRowCount: liveCanonical.rows.length,
      receivedRowCount: parsed.rows.length,
    });
  }
  const uploadedMetaDigest = sha256Hex(JSON.stringify(parsed.rows.map((r) => r.meta)));
  if (uploadedMetaDigest !== liveCanonical.rowIdentityDigest) {
    throw new RoundTripImportError('ROUNDTRIP_ROW_LINEAGE_TAMPERED', 409, {
      reason: 'META_ROW_IDENTITY_DIGEST_MISMATCH',
    });
  }

  // Gate 7 & 8: Field normalization, immutable column guard, strict financial field authorization & line math check
  const immutableSet = IMMUTABLE_IDENTITY_FIELDS[manifest.templateCode];
  const financialSet = COMMERCIAL_FINANCIAL_FIELDS[manifest.templateCode];
  const proposedChanges: ProposedFieldDiff[] = [];
  const changedRowNumbers = new Set<number>();
  let nonFinancialChangeCount = 0;
  let financialChangeCount = 0;

  for (let i = 0; i < liveCanonical.rows.length; i += 1) {
    const canonicalRow = liveCanonical.rows[i]!;
    const uploadedRow = parsed.rows[i]!;
    const specHint =
      typeof uploadedRow.rawCellsByField.specification === 'string'
        ? uploadedRow.rawCellsByField.specification
        : (canonicalRow.values.specification as string | null);

    const effectiveRowValues: Record<string, string | number | null> = {
      ...canonicalRow.values,
    };
    let rowFinancialTouched = false;

    for (const fieldId of manifest.selectedFields) {
      if (!canActorAccessFieldBothRoles(caps, fieldId)) {
        throw new RoundTripImportError('ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN', 403, {
          fieldId,
        });
      }
      const normalizedSubmitted = normalizeAndValidateFieldValue(
        fieldId,
        uploadedRow.rawCellsByField[fieldId],
        specHint
      );
      const baselineValue = canonicalRow.values[fieldId] ?? null;

      if (normalizedSubmitted !== baselineValue) {
        if (immutableSet.has(fieldId)) {
          throw new RoundTripImportError('ROUNDTRIP_IMMUTABLE_IDENTITY_MODIFIED', 409, {
            rowKey: canonicalRow.rowKey,
            fieldId,
            baselineValue,
            submittedValue: normalizedSubmitted,
          });
        }

        const isFinancial = financialSet.has(fieldId);
        if (isFinancial && !caps.canModifyFinancialFields) {
          throw new RoundTripImportError('ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN', 403, {
            rowKey: canonicalRow.rowKey,
            fieldId,
            actorRole: caps.effectiveRole,
            fieldAccessRole: caps.fieldAccessRole,
          });
        }

        effectiveRowValues[fieldId] = normalizedSubmitted;
        changedRowNumbers.add(canonicalRow.rowNumber);
        if (isFinancial) {
          financialChangeCount += 1;
          rowFinancialTouched = true;
        } else {
          nonFinancialChangeCount += 1;
        }

        proposedChanges.push({
          rowNumber: canonicalRow.rowNumber,
          rowKey: canonicalRow.rowKey,
          itemCode: canonicalRow.meta.item_code,
          phaseCode: canonicalRow.meta.phase_code,
          fieldId,
          fieldHeading:
            manifest.headingAliases[fieldId] ??
            CANONICAL_FIELD_MAP.get(fieldId)!.suggestedHeading,
          classification: isFinancial ? 'COMMERCIAL_FINANCIAL' : 'NON_FINANCIAL_SCOPE',
          baselineValue,
          submittedValue: normalizedSubmitted,
        });
      }
    }

    // Never silently recompute contract_line_amount on T1 when qty/rate/amount change!
    if (manifest.templateCode === 'T1_PHASE_BOQ' && rowFinancialTouched) {
      const hasQtyCol = manifest.selectedFields.includes('approved_qty');
      const hasRateCol = manifest.selectedFields.includes('contract_unit_rate');
      const hasAmtCol = manifest.selectedFields.includes('contract_line_amount');
      if (!hasQtyCol || !hasRateCol || !hasAmtCol) {
        throw new RoundTripImportError('ROUNDTRIP_PARTIAL_FINANCIAL_COLUMNS_UNSAFE', 409, {
          rowKey: canonicalRow.rowKey,
          requiredTogether: ['approved_qty', 'contract_unit_rate', 'contract_line_amount'],
        });
      }

      const pricingType = String(effectiveRowValues.pricing_type ?? 'UNIT_PRICE').toUpperCase();
      if (pricingType === 'UNIT_PRICE') {
        const effQty = new Prisma.Decimal(String(effectiveRowValues.approved_qty));
        const effRate = new Prisma.Decimal(String(effectiveRowValues.contract_unit_rate));
        const effLineAmt = new Prisma.Decimal(String(effectiveRowValues.contract_line_amount));
        const expectedLineAmt = effQty
          .mul(effRate)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const diff = effLineAmt.sub(expectedLineAmt).abs();
        if (
          diff.gt(new Prisma.Decimal('0.05')) &&
          (!req.lumpSumOrRoundedOverrideJustification ||
            req.lumpSumOrRoundedOverrideJustification.trim().length < 10)
        ) {
          throw new RoundTripImportError('ROUNDTRIP_FINANCIAL_LINE_AMOUNT_MISMATCH', 409, {
            rowKey: canonicalRow.rowKey,
            approvedQty: effQty.toFixed(4),
            contractUnitRate: effRate.toFixed(4),
            submittedLineAmount: effLineAmt.toFixed(2),
            expectedLineAmount: expectedLineAmt.toFixed(2),
          });
        }
      }
    }
  }

  const changedRowCount = changedRowNumbers.size;
  if (changedRowCount > 0 && conflictMode === 'VERIFY_ONLY') {
    throw new RoundTripImportError('ROUNDTRIP_CHANGES_DETECTED_IN_VERIFY_ONLY_MODE', 409, {
      changedRowCount,
      nonFinancialChangeCount,
      financialChangeCount,
    });
  }

  const verificationStatus: 'STAGED_PENDING_APPROVAL' | 'VERIFIED_NO_CHANGES' =
    changedRowCount > 0 ? 'STAGED_PENDING_APPROVAL' : 'VERIFIED_NO_CHANGES';

  const persisted = await persistRoundTripSubmissionRecord(db, {
    actorId,
    actorRole: caps.effectiveRole,
    projectId: req.projectId,
    packageId: manifest.packageId,
    idempotencyKey: req.idempotencyKey.trim(),
    uploadedFileSha256,
    importFormat: parsed.importFormat,
    templateCode: manifest.templateCode,
    sourceId: manifest.sourceId,
    sourceVersion: manifest.sourceVersion,
    layoutDefinitionId: manifest.layoutDefinitionId,
    layoutVersionNumber: manifest.layoutVersionNumber,
    layoutDefinitionHash: manifest.layoutDefinitionHash,
    conflictResolutionMode: conflictMode,
    verificationStatus,
    failureCode: null,
    totalRowCount: liveCanonical.rows.length,
    changedRowCount,
    nonFinancialChangeCount,
    financialChangeCount,
    proposedChanges,
    diagnostics: {
      changeNote: req.changeNote?.trim() || null,
      canonicalRecordsMutated: 0,
      awardedBoqImmutablePreserved: true,
    },
  });

  return {
    submissionId: persisted.submissionId,
    idempotentReplay: persisted.idempotentReplay,
    verificationStatus,
    canonicalRecordsMutated: 0,
    packageId: manifest.packageId,
    projectId: req.projectId,
    templateCode: manifest.templateCode,
    sourceId: manifest.sourceId,
    sourceVersion: manifest.sourceVersion,
    layoutMode: manifest.layoutMode,
    layoutDefinitionId: manifest.layoutDefinitionId,
    layoutVersionNumber: manifest.layoutVersionNumber,
    uploadedFileSha256,
    totalRowCount: liveCanonical.rows.length,
    changedRowCount,
    nonFinancialChangeCount,
    financialChangeCount,
    proposedChanges,
    createdAt: persisted.createdAt,
  };
}

export async function listRoundTripWorkspaceState(
  db: Prisma.TransactionClient,
  actorId: string,
  projectId: string
) {
  const caps = await resolveActorRoundTripCapabilities(db, actorId, projectId);

  const rawSubmissions = await db.uboqRoundTripImportSubmission.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      id: true,
      packageId: true,
      idempotencyKey: true,
      uploadedFileSha256: true,
      importFormat: true,
      templateCode: true,
      sourceId: true,
      sourceVersion: true,
      layoutDefinitionId: true,
      layoutVersionNumber: true,
      conflictResolutionMode: true,
      actorUserId: true,
      actorRole: true,
      verificationStatus: true,
      failureCode: true,
      totalRowCount: true,
      changedRowCount: true,
      nonFinancialChangeCount: true,
      financialChangeCount: true,
      proposedChangesJson: true,
      createdAt: true,
    },
  });

  // Defense-in-depth redaction on top of PostgreSQL RLS SELECT filtering
  const submissions = rawSubmissions.map((sub) => {
    const rawDiffs = Array.isArray(sub.proposedChangesJson)
      ? (sub.proposedChangesJson as unknown as ProposedFieldDiff[])
      : [];
    const safeDiffs = rawDiffs.map((d) => {
      if (
        !caps.canModifyFinancialFields &&
        (d.classification === 'COMMERCIAL_FINANCIAL' ||
          !canActorAccessFieldBothRoles(caps, d.fieldId))
      ) {
        return {
          ...d,
          baselineValue: '[REDACTED_COMMERCIAL]',
          submittedValue: '[REDACTED_COMMERCIAL]',
        };
      }
      return redactUboqPayloadForRole(d, caps.fieldAccessRole);
    });
    return {
      id: sub.id,
      packageId: sub.packageId,
      idempotencyKey: sub.idempotencyKey,
      uploadedFileSha256: sub.uploadedFileSha256,
      importFormat: sub.importFormat,
      templateCode: sub.templateCode,
      sourceId: sub.sourceId,
      sourceVersion: sub.sourceVersion,
      layoutDefinitionId: sub.layoutDefinitionId,
      layoutVersionNumber: sub.layoutVersionNumber,
      conflictResolutionMode: sub.conflictResolutionMode,
      actorUserId: sub.actorUserId,
      actorRole: sub.actorRole,
      verificationStatus: sub.verificationStatus,
      failureCode: sub.failureCode,
      totalRowCount: sub.totalRowCount,
      changedRowCount: sub.changedRowCount,
      nonFinancialChangeCount: sub.nonFinancialChangeCount,
      financialChangeCount: sub.financialChangeCount,
      proposedChanges: safeDiffs,
      createdAt: sub.createdAt.toISOString(),
    };
  });

  return {
    capabilities: caps,
    supportedRoundTripTemplates: [...ROUNDTRIP_SUPPORTED_TEMPLATES],
    reservedPendingContracts: [] as Array<{
      proposedCode: string;
      ratificationStatus: string;
      implementedInRuntime: boolean;
    }>,
    ratifiedPhaseD2Templates: [
      {
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        ratificationStatus: 'RATIFIED_BY_PROJECT_OWNER_2026_11_15',
        ratificationDate: '2026-11-15',
        electronicSignaturePresent: false,
        implementedInRuntime: true,
      },
      {
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        ratificationStatus: 'RATIFIED_BY_PROJECT_OWNER_2026_11_15',
        ratificationDate: '2026-11-15',
        electronicSignaturePresent: false,
        implementedInRuntime: true,
      },
    ],
    submissions,
  };
}
