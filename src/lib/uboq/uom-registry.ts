import type { UboqUomDimensionFamily } from '@prisma/client';

export interface CanonicalUomDefinition {
  readonly normalizedCode: string;
  readonly displayLabel: string;
  readonly dimensionFamily: UboqUomDimensionFamily;
  /** Factor to base unit of dimensionFamily (only convertible when packCode is null) */
  readonly baseConversionFactor: number;
  /** Non-null for discrete commercial packs that CANNOT auto-convert across pack sizes without explicit conversion rule */
  readonly packCode: string | null;
}

export const CANONICAL_UOM_REGISTRY: Readonly<Record<string, CanonicalUomDefinition>> = {
  m3: { normalizedCode: 'm3', displayLabel: 'Cubic Meter (m³)', dimensionFamily: 'VOLUME', baseConversionFactor: 1, packCode: null },
  liter: { normalizedCode: 'liter', displayLabel: 'Liter (L)', dimensionFamily: 'VOLUME', baseConversionFactor: 0.001, packCode: null },
  kg: { normalizedCode: 'kg', displayLabel: 'Kilogram (kg)', dimensionFamily: 'MASS', baseConversionFactor: 1, packCode: null },
  ton: { normalizedCode: 'ton', displayLabel: 'Metric Ton (t)', dimensionFamily: 'MASS', baseConversionFactor: 1000, packCode: null },
  m: { normalizedCode: 'm', displayLabel: 'Linear Meter (m)', dimensionFamily: 'LENGTH', baseConversionFactor: 1, packCode: null },
  mm: { normalizedCode: 'mm', displayLabel: 'Millimeter (mm)', dimensionFamily: 'LENGTH', baseConversionFactor: 0.001, packCode: null },
  m2: { normalizedCode: 'm2', displayLabel: 'Square Meter (m²)', dimensionFamily: 'AREA', baseConversionFactor: 1, packCode: null },
  sqft: { normalizedCode: 'sqft', displayLabel: 'Square Foot (ft²)', dimensionFamily: 'AREA', baseConversionFactor: 0.09290304, packCode: null },
  pc: { normalizedCode: 'pc', displayLabel: 'Piece (pc)', dimensionFamily: 'COUNT', baseConversionFactor: 1, packCode: null },
  length_6m: { normalizedCode: 'length_6m', displayLabel: 'Commercial Bar 6m', dimensionFamily: 'PACK', baseConversionFactor: 1, packCode: 'BAR_6M' },
  bag_40kg: { normalizedCode: 'bag_40kg', displayLabel: '40kg Cement Bag', dimensionFamily: 'PACK', baseConversionFactor: 1, packCode: 'BAG_40KG' },
  bag_50kg: { normalizedCode: 'bag_50kg', displayLabel: '50kg Bag', dimensionFamily: 'PACK', baseConversionFactor: 1, packCode: 'BAG_50KG' },
  pail_16l: { normalizedCode: 'pail_16l', displayLabel: '16L Pail', dimensionFamily: 'PACK', baseConversionFactor: 1, packCode: 'PAIL_16L' },
  gal_4l: { normalizedCode: 'gal_4l', displayLabel: '4L Gallon', dimensionFamily: 'PACK', baseConversionFactor: 1, packCode: 'GAL_4L' },
  man_day: { normalizedCode: 'man_day', displayLabel: 'Man-Day', dimensionFamily: 'TIME_LABOR', baseConversionFactor: 1, packCode: null },
  man_hr: { normalizedCode: 'man_hr', displayLabel: 'Man-Hour', dimensionFamily: 'TIME_LABOR', baseConversionFactor: 0.125, packCode: null },
  equip_hr: { normalizedCode: 'equip_hr', displayLabel: 'Equipment-Hour', dimensionFamily: 'TIME_EQUIP', baseConversionFactor: 1, packCode: null },
  equip_day: { normalizedCode: 'equip_day', displayLabel: 'Equipment-Day', dimensionFamily: 'TIME_EQUIP', baseConversionFactor: 8, packCode: null },
  set: { normalizedCode: 'set', displayLabel: 'Test / Assembly Set', dimensionFamily: 'TEST_SET', baseConversionFactor: 1, packCode: 'SET' },
  lot: { normalizedCode: 'lot', displayLabel: 'Lump Sum / Lot', dimensionFamily: 'LUMP_SCOPE', baseConversionFactor: 1, packCode: 'LOT' },
};

const RAW_UOM_SYNONYMS: Readonly<Record<string, string>> = {
  m3: 'm3',
  'm³': 'm3',
  cum: 'm3',
  'cu.m': 'm3',
  'cu.m.': 'm3',
  'cubic meter': 'm3',
  'cubic meters': 'm3',
  cbm: 'm3',
  l: 'liter',
  ltr: 'liter',
  liter: 'liter',
  liters: 'liter',
  kg: 'kg',
  kgs: 'kg',
  'kg.': 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ton: 'ton',
  tons: 'ton',
  mt: 'ton',
  'metric ton': 'ton',
  'metric tons': 'ton',
  t: 'ton',
  m: 'm',
  lm: 'm',
  'l.m': 'm',
  'l.m.': 'm',
  'ln.m': 'm',
  'linear meter': 'm',
  mm: 'mm',
  m2: 'm2',
  'm²': 'm2',
  sqm: 'm2',
  'sq.m': 'm2',
  'sq.m.': 'm2',
  'square meter': 'm2',
  sqft: 'sqft',
  'sq.ft': 'sqft',
  pc: 'pc',
  pcs: 'pc',
  'pc.': 'pc',
  'pcs.': 'pc',
  piece: 'pc',
  pieces: 'pc',
  ea: 'pc',
  each: 'pc',
  unit: 'pc',
  units: 'pc',
  bag_40kg: 'bag_40kg',
  '40kg bag': 'bag_40kg',
  '40kg bags': 'bag_40kg',
  'bag (40kg)': 'bag_40kg',
  'bags (40kg)': 'bag_40kg',
  'bag 40kg': 'bag_40kg',
  bag_50kg: 'bag_50kg',
  '50kg bag': 'bag_50kg',
  '50kg bags': 'bag_50kg',
  'bag (50kg)': 'bag_50kg',
  'bags (50kg)': 'bag_50kg',
  'bag 50kg': 'bag_50kg',
  length_6m: 'length_6m',
  '6m length': 'length_6m',
  'bar (6m)': 'length_6m',
  pail_16l: 'pail_16l',
  pail: 'pail_16l',
  gal_4l: 'gal_4l',
  gal: 'gal_4l',
  gallon: 'gal_4l',
  man_day: 'man_day',
  'man-day': 'man_day',
  manday: 'man_day',
  md: 'man_day',
  man_hr: 'man_hr',
  'man-hour': 'man_hr',
  mh: 'man_hr',
  equip_hr: 'equip_hr',
  'equip-hr': 'equip_hr',
  'equipment hour': 'equip_hr',
  hr: 'equip_hr',
  hrs: 'equip_hr',
  equip_day: 'equip_day',
  'equip-day': 'equip_day',
  set: 'set',
  sets: 'set',
  cylinder_set: 'set',
  lot: 'lot',
  ls: 'lot',
  'l.s': 'lot',
  'l.s.': 'lot',
  'lump sum': 'lot',
  lumpsum: 'lot',
};

export function normalizeUom(rawUnit: string, specificationHint?: string | null): CanonicalUomDefinition {
  const cleaned = (rawUnit || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (CANONICAL_UOM_REGISTRY[cleaned]) {
    return CANONICAL_UOM_REGISTRY[cleaned];
  }

  // Disambiguate generic 'bag' / 'bags' via specification hint when present
  if (cleaned === 'bag' || cleaned === 'bags') {
    const spec = (specificationHint || '').toLowerCase();
    if (spec.includes('50kg') || spec.includes('50 kg')) {
      return CANONICAL_UOM_REGISTRY.bag_50kg;
    }
    return CANONICAL_UOM_REGISTRY.bag_40kg;
  }

  const mapped = RAW_UOM_SYNONYMS[cleaned];
  if (mapped && CANONICAL_UOM_REGISTRY[mapped]) {
    return CANONICAL_UOM_REGISTRY[mapped];
  }

  throw new Error(`UBOQ_UNKNOWN_UOM: Unrecognized measurement unit "${rawUnit}"`);
}

export function canConvertUom(fromNormalized: string, toNormalized: string): boolean {
  let fromDef = CANONICAL_UOM_REGISTRY[fromNormalized];
  let toDef = CANONICAL_UOM_REGISTRY[toNormalized];
  if (!fromDef) {
    try { fromDef = normalizeUom(fromNormalized); } catch { return false; }
  }
  if (!toDef) {
    try { toDef = normalizeUom(toNormalized); } catch { return false; }
  }
  if (!fromDef || !toDef) return false;
  if (fromDef.normalizedCode === toDef.normalizedCode) return true;
  // LUMP_SCOPE and PACK units with different packCodes cannot be blindly converted
  if (fromDef.dimensionFamily === 'LUMP_SCOPE' || toDef.dimensionFamily === 'LUMP_SCOPE') return false;
  if (fromDef.dimensionFamily !== toDef.dimensionFamily) return false;
  if (fromDef.packCode !== toDef.packCode) return false;
  return true;
}

export function convertUomQuantity(qty: number, fromNormalized: string, toNormalized: string): number {
  let fromDef = CANONICAL_UOM_REGISTRY[fromNormalized];
  let toDef = CANONICAL_UOM_REGISTRY[toNormalized];
  if (!fromDef) {
    try { fromDef = normalizeUom(fromNormalized); } catch { /* handled below */ }
  }
  if (!toDef) {
    try { toDef = normalizeUom(toNormalized); } catch { /* handled below */ }
  }
  if (!fromDef || !toDef || !canConvertUom(fromDef.normalizedCode, toDef.normalizedCode)) {
    throw new Error(
      `UBOQ_INCOMPATIBLE_UOM_CONVERSION: Cannot convert ${qty} from "${fromNormalized}" to "${toNormalized}"`
    );
  }
  if (fromDef.normalizedCode === toDef.normalizedCode) return qty;
  const inBase = qty * fromDef.baseConversionFactor;
  return Number((inBase / toDef.baseConversionFactor).toFixed(6));
}

export function assertExactNormalizedUomMatch(
  actualRawOrNorm: string,
  expectedNormalized: string,
  contextLabel: string,
  specHint?: string | null
): string {
  const resolved = normalizeUom(actualRawOrNorm, specHint);
  if (resolved.normalizedCode !== expectedNormalized) {
    throw new Error(
      `UBOQ_RESOURCE_UOM_MISMATCH [${contextLabel}]: Expected canonical unit "${expectedNormalized}", received "${actualRawOrNorm}" ("${resolved.normalizedCode}")`
    );
  }
  return resolved.normalizedCode;
}

