import {
  CANONICAL_FIELD_CATALOG,
  CANONICAL_FIELD_MAP,
  resolveCanonicalFieldId,
  type CanonicalFieldSpec,
} from './field-catalog';

export interface VisualCandidateRecord {
  id: string;
  sourceDocumentId: string;
  sourceRowNumber: number | null;
  sourceCellRef: string | null;
  rawHeadingText: string | null;
  mappedCanonicalId: string | null;
  rawValueText: string | null;
  rawFormulaText: string | null;
  parsedJson: Record<string, unknown> | null;
  confidenceScore: number;
  extractionMethod: string;
  requiresHumanReview: boolean;
  reviewDecision: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  sectionTitle?: string | null;
  sheetOrPageRef?: string | null;
}

export interface VisualSourceDocumentRecord {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256Hash: string;
  documentRole: string;
  isLockedImmutable: boolean;
  isApprovedImmutable: boolean;
  createdAt: string;
  candidates: VisualCandidateRecord[];
}

export interface VisualValidationExceptionRecord {
  id: string;
  projectId: string;
  snapshotId: string | null;
  ruleCode: string;
  severity: string;
  entityType: string;
  entityId: string | null;
  message: string;
  status: string;
  resolvedById: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

export interface VisualColumnSummary {
  sourceColumnKey: string;
  currentCanonicalFieldId: string | null;
  sampleValue: string;
  sampleCoordinate: string;
  candidateCount: number;
  avgConfidence: number;
}

export interface VisualMappingValidationResult {
  valid: boolean;
  errors: string[];
  conflicts: Array<{ targetFieldId: string; sourceColumns: string[] }>;
  normalizedRemap: Record<string, string>;
}

export interface VisualMappingProfilePayload {
  schemaVersion: 'UBOQ_INPUT_MAPPING_PROFILE_V1';
  profileName: string;
  sectorType: 'GOVERNMENT' | 'CORPORATE' | 'PRIVATE' | 'ANY';
  createdAt: string;
  columnMap: Record<string, string>;
}

const INTAKE_MAPPING_DOMAINS = new Set([
  'BOQ / Contract Lines',
  'Contract / Award',
  'Agency / Estimate',
  'Resource / Procurement',
  'Tax / Pricing',
]);

export function getIntakeCanonicalFieldOptions(): ReadonlyArray<CanonicalFieldSpec> {
  return CANONICAL_FIELD_CATALOG.filter(
    (spec) => INTAKE_MAPPING_DOMAINS.has(spec.domain) && spec.requiredForOutput !== 'HIDDEN'
  );
}

export function extractCandidateEffectiveFields(
  candidate: Pick<VisualCandidateRecord, 'parsedJson' | 'mappedCanonicalId' | 'rawValueText'>
): Record<string, string | number | null> {
  const parsed = candidate.parsedJson && typeof candidate.parsedJson === 'object' ? candidate.parsedJson : null;
  if (parsed) {
    const effective = parsed.effectiveMappedFields;
    if (effective && typeof effective === 'object' && !Array.isArray(effective)) {
      return { ...(effective as Record<string, string | number | null>) };
    }
    const mapped = parsed.mappedFields;
    if (mapped && typeof mapped === 'object' && !Array.isArray(mapped)) {
      return { ...(mapped as Record<string, string | number | null>) };
    }
  }
  if (candidate.mappedCanonicalId) {
    return { [candidate.mappedCanonicalId]: candidate.rawValueText ?? null };
  }
  return {};
}

export function extractCandidateCellCoordinates(
  candidate: Pick<VisualCandidateRecord, 'parsedJson' | 'sourceCellRef'>
): Record<string, string> {
  const parsed = candidate.parsedJson && typeof candidate.parsedJson === 'object' ? candidate.parsedJson : null;
  const coords = parsed?.cellCoordinates;
  if (coords && typeof coords === 'object' && !Array.isArray(coords)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(coords as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) {
        out[k] = v.trim();
      }
    }
    return out;
  }
  return candidate.sourceCellRef ? { row: candidate.sourceCellRef } : {};
}

export function extractVisualColumnSummaries(
  candidates: ReadonlyArray<VisualCandidateRecord>
): VisualColumnSummary[] {
  const acc = new Map<
    string,
    {
      sampleValue: string;
      sampleCoordinate: string;
      candidateCount: number;
      confidenceSum: number;
    }
  >();

  for (const cand of candidates) {
    const fields = extractCandidateEffectiveFields(cand);
    const coords = extractCandidateCellCoordinates(cand);
    for (const [colKey, val] of Object.entries(fields)) {
      const key = colKey.trim();
      if (!key) continue;
      const existing = acc.get(key);
      const valText = val === null || val === undefined ? '' : String(val).trim();
      const coordText = coords[key] || cand.sourceCellRef || (cand.sourceRowNumber ? `Row ${cand.sourceRowNumber}` : '—');
      if (!existing) {
        acc.set(key, {
          sampleValue: valText || '—',
          sampleCoordinate: coordText,
          candidateCount: 1,
          confidenceSum: Number(cand.confidenceScore || 0),
        });
      } else {
        existing.candidateCount += 1;
        existing.confidenceSum += Number(cand.confidenceScore || 0);
        if (existing.sampleValue === '—' && valText) {
          existing.sampleValue = valText;
          existing.sampleCoordinate = coordText;
        }
      }
    }
  }

  return Array.from(acc.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sourceColumnKey, info]) => ({
      sourceColumnKey,
      currentCanonicalFieldId: resolveCanonicalFieldId(sourceColumnKey),
      sampleValue: info.sampleValue,
      sampleCoordinate: info.sampleCoordinate,
      candidateCount: info.candidateCount,
      avgConfidence: info.candidateCount > 0 ? Number((info.confidenceSum / info.candidateCount).toFixed(4)) : 0,
    }));
}

export function validateVisualColumnMapping(
  columnMap: Record<string, string | null | undefined>
): VisualMappingValidationResult {
  const errors: string[] = [];
  const targetToSources = new Map<string, string[]>();
  const normalizedRemap: Record<string, string> = {};

  if (!columnMap || typeof columnMap !== 'object' || Array.isArray(columnMap)) {
    return {
      valid: false,
      errors: ['UBOQ_INVALID_MAPPING_INPUT: columnMap must be a plain key-value object'],
      conflicts: [],
      normalizedRemap: {},
    };
  }

  for (const [rawSrc, rawTarget] of Object.entries(columnMap)) {
    const src = String(rawSrc || '').trim();
    if (!src) {
      errors.push('UBOQ_INVALID_SOURCE_COLUMN: Source column key cannot be empty');
      continue;
    }
    if (rawTarget === null || rawTarget === undefined || String(rawTarget).trim() === '') {
      // Unmapped / leave untouched
      continue;
    }

    const targetCanonical = resolveCanonicalFieldId(String(rawTarget));
    if (!targetCanonical || !CANONICAL_FIELD_MAP.has(targetCanonical)) {
      errors.push(
        `UBOQ_INVALID_CANONICAL_FIELD: Target field "${String(rawTarget)}" for column "${src}" is not in the canonical registry`
      );
      continue;
    }

    const list = targetToSources.get(targetCanonical) ?? [];
    list.push(src);
    targetToSources.set(targetCanonical, list);

    const srcCanonical = resolveCanonicalFieldId(src) ?? src;
    if (srcCanonical !== targetCanonical) {
      normalizedRemap[src] = targetCanonical;
    }
  }

  const conflicts: Array<{ targetFieldId: string; sourceColumns: string[] }> = [];
  for (const [targetFieldId, sourceColumns] of targetToSources.entries()) {
    if (sourceColumns.length > 1) {
      conflicts.push({ targetFieldId, sourceColumns });
      errors.push(
        `UBOQ_CONFLICTING_COLUMN_MAPPING: Canonical field "${targetFieldId}" is mapped multiple times (${sourceColumns.join(', ')})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    conflicts,
    normalizedRemap,
  };
}

export function buildPortableMappingProfile(input: {
  profileName: string;
  sectorType?: 'GOVERNMENT' | 'CORPORATE' | 'PRIVATE' | 'ANY';
  columnMap: Record<string, string>;
}): VisualMappingProfilePayload {
  const name = String(input.profileName || '').trim();
  if (!name || name.length > 120) {
    throw new Error('UBOQ_INVALID_PROFILE_NAME: Profile name must be between 1 and 120 characters');
  }
  const validation = validateVisualColumnMapping(input.columnMap);
  if (!validation.valid) {
    throw new Error(validation.errors[0] || 'UBOQ_INVALID_MAPPING_PROFILE');
  }
  const cleanedMap: Record<string, string> = {};
  for (const [src, target] of Object.entries(input.columnMap)) {
    const trimmedSrc = src.trim();
    const resolvedTarget = target ? resolveCanonicalFieldId(target) : null;
    if (trimmedSrc && resolvedTarget) {
      cleanedMap[trimmedSrc] = resolvedTarget;
    }
  }
  return {
    schemaVersion: 'UBOQ_INPUT_MAPPING_PROFILE_V1',
    profileName: name,
    sectorType: input.sectorType ?? 'ANY',
    createdAt: new Date().toISOString(),
    columnMap: cleanedMap,
  };
}

export function parsePortableMappingProfile(rawJson: string): VisualMappingProfilePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('UBOQ_INVALID_PROFILE_JSON: Mapping profile must be valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('UBOQ_INVALID_PROFILE_JSON: Mapping profile payload must be an object');
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.schemaVersion !== 'UBOQ_INPUT_MAPPING_PROFILE_V1') {
    throw new Error('UBOQ_UNSUPPORTED_PROFILE_VERSION: Expected schemaVersion UBOQ_INPUT_MAPPING_PROFILE_V1');
  }
  const sector =
    obj.sectorType === 'GOVERNMENT' ||
    obj.sectorType === 'CORPORATE' ||
    obj.sectorType === 'PRIVATE' ||
    obj.sectorType === 'ANY'
      ? obj.sectorType
      : 'ANY';

  return buildPortableMappingProfile({
    profileName: String(obj.profileName || ''),
    sectorType: sector,
    columnMap: (obj.columnMap && typeof obj.columnMap === 'object' && !Array.isArray(obj.columnMap)
      ? obj.columnMap
      : {}) as Record<string, string>,
  });
}
