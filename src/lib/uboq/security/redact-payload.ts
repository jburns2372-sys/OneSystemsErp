import { CANONICAL_FIELD_MAP, resolveCanonicalFieldId, type UboqFieldVisibility } from '../field-catalog';

const EXECUTIVE_FINANCE_ROLES = new Set([
  'SUPER_ADMIN',
  'PRESIDENT',
  'VP_OPERATIONS',
  'FINANCE_DIRECTOR',
  'COST_CONTROL_MANAGER',
  'COMMERCIAL_DIRECTOR',
  'CHIEF_ESTIMATOR',
]);

const COMMERCIAL_RESTRICTED_ROLES = new Set([
  ...EXECUTIVE_FINANCE_ROLES,
  'PROJECT_MANAGER',
  'QUANTITY_SURVEYOR',
  'PROCUREMENT_MANAGER',
  'PROCUREMENT_OFFICER',
  'ACCOUNTANT',
  'BILLING_ENGINEER',
  'OPERATIONS_MANAGER',
]);

// Explicit property-name guard for DTO objects using camelCase or snake_case keys
const SENSITIVE_DTO_KEYS = new Set([
  'target_direct_cost_amt',
  'targetDirectCostAmt',
  'target_total_cost',
  'targetTotalCost',
  'target_profit',
  'targetProfit',
  'target_margin',
  'target_margin_pct',
  'targetMarginPct',
  'commitment_open_amt',
  'commitmentOpenAmt',
  'etc_uncommitted',
  'etcUncommitted',
  'forecast_eac',
  'forecastEac',
  'forecast_profit',
  'forecastProfit',
  'procurement_cash_out_amt',
  'procurementCashOutAmt',
  'payroll_subcon_cash_out_amt',
  'payrollSubconCashOutAmt',
  'other_cash_out_amt',
  'otherCashOutAmt',
  'actual_cash_paid_amt',
  'actualCashPaidAmt',
  'quarterly_closing_cash',
  'closingCashAmt',
  'quarterly_liquidity_gap',
  'liquidityGapAmt',
  'targetBudgets',
  'uboqContractorTargetBudgets',
]);

const RESTRICTED_DTO_KEYS = new Set([
  'awarded_revenue',
  'awardedRevenue',
  'awardedRevenueExVat',
  'current_contract_value',
  'currentContractValue',
  'contract_unit_rate',
  'contractUnitRate',
  'contract_line_amount',
  'contractLineAmount',
  'contractAmountExVat',
  'weightedUnitRate',
  'totalContractAmount',
  'target_resource_cost',
  'targetResourceUnitCost',
  'benchmarkUnitCost',
  'procurement_budget',
  'procurementBudget',
  'agency_edc_amt',
  'agencyEdcAmt',
  'agency_abc',
  'agencyAbcAmt',
  'agencyEstimates',
]);

export function getPermittedVisibilityTiers(userRole: string): ReadonlySet<UboqFieldVisibility> {
  const normalizedRole = (userRole || '').trim().toUpperCase();
  if (EXECUTIVE_FINANCE_ROLES.has(normalizedRole)) {
    return new Set<UboqFieldVisibility>(['public', 'internal', 'restricted', 'sensitive']);
  }
  if (COMMERCIAL_RESTRICTED_ROLES.has(normalizedRole)) {
    return new Set<UboqFieldVisibility>(['public', 'internal', 'restricted']);
  }
  if (normalizedRole === 'GUEST_USER' || normalizedRole === 'EXTERNAL_VIEWER' || !normalizedRole) {
    return new Set<UboqFieldVisibility>(['public']);
  }
  // SITE_ENGINEER, WAREHOUSEMAN, FOREMAN, QA_QC_INSPECTOR, PROJECT_ENGINEER (field-level)
  return new Set<UboqFieldVisibility>(['public', 'internal']);
}

export function canRoleAccessField(userRole: string, fieldIdOrAlias: string): boolean {
  const canonicalId = resolveCanonicalFieldId(fieldIdOrAlias);
  if (!canonicalId) return false;
  const spec = CANONICAL_FIELD_MAP.get(canonicalId);
  if (!spec) return false;
  const tiers = getPermittedVisibilityTiers(userRole);
  return tiers.has(spec.visibility);
}

/**
 * Deeply strips unauthorized sensitive/restricted properties on the server BEFORE serialization or export (VAL-18, SEC-03).
 */
export function redactUboqPayloadForRole<T>(payload: T, userRole: string): T {
  const tiers = getPermittedVisibilityTiers(userRole);
  const allowSensitive = tiers.has('sensitive');
  const allowRestricted = tiers.has('restricted');

  if (allowSensitive && allowRestricted) {
    return payload;
  }

  function scrubValue(val: unknown): unknown {
    if (val === null || val === undefined) return val;
    if (val instanceof Date) return val;
    if (Array.isArray(val)) {
      return val.map((item) => scrubValue(item));
    }
    if (typeof val === 'object') {
      // Handle Prisma Decimal or objects with toNumber/toFixed cleanly
      if (typeof (val as { toFixed?: unknown }).toFixed === 'function' && 'd' in (val as Record<string, unknown>)) {
        return Number(String(val));
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (!allowSensitive && SENSITIVE_DTO_KEYS.has(k)) {
          continue;
        }
        if (!allowRestricted && RESTRICTED_DTO_KEYS.has(k)) {
          continue;
        }
        const canonical = CANONICAL_FIELD_MAP.get(k);
        if (canonical && !tiers.has(canonical.visibility)) {
          continue;
        }
        out[k] = scrubValue(v);
      }
      return out;
    }
    return val;
  }

  return scrubValue(payload) as T;
}
