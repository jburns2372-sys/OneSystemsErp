export type DashboardStatsDiagnosticCode =
  | 'BACKEND_HTTP_401'
  | 'BACKEND_HTTP_403'
  | 'BACKEND_HTTP_404'
  | 'BACKEND_HTTP_405'
  | 'BACKEND_HTTP_5XX'
  | 'BACKEND_HTTP_ERROR'
  | 'BACKEND_URL_UNCONFIGURED'
  | 'BACKEND_INVALID_PAYLOAD'
  | 'BACKEND_UNREACHABLE';

const ALLOWED_DIAGNOSTIC_CODES = new Set<DashboardStatsDiagnosticCode>([
  'BACKEND_HTTP_401',
  'BACKEND_HTTP_403',
  'BACKEND_HTTP_404',
  'BACKEND_HTTP_405',
  'BACKEND_HTTP_5XX',
  'BACKEND_HTTP_ERROR',
  'BACKEND_URL_UNCONFIGURED',
  'BACKEND_INVALID_PAYLOAD',
  'BACKEND_UNREACHABLE',
]);

export function sanitizeDashboardDiagnosticCode(
  code: unknown,
  fallback: DashboardStatsDiagnosticCode = 'BACKEND_UNREACHABLE'
): DashboardStatsDiagnosticCode {
  if (typeof code === 'string' && ALLOWED_DIAGNOSTIC_CODES.has(code as DashboardStatsDiagnosticCode)) {
    return code as DashboardStatsDiagnosticCode;
  }
  return fallback;
}

export interface DashboardStatsBaseline {
  pendingAIOverrides: number;
  totalProjects: number;
  totalBudget: number;
  totalPayables: number;
  totalAccomplishments: number;
  pendingMRFs: number;
  pendingPettyCash: number | null;
  activePayrollPeriods: number;
  openCanvassing: number;
  activePurchaseOrders: number;
  expectedDeliveries: number;
  totalIssuances: number;
  totalSuppliers: number;
  totalWorkers: number;
  totalUsers: number;
  totalAuditLogs: number;
  totalDailyLogs: number;
  totalJobOrders: number;
}

export interface DashboardStatsOptionalNumeric {
  pendingMRs?: number;
  totalExpenses?: number;
  accomplishmentPercentage?: number;
  totalSubcontractors?: number;
  totalDocuments?: number;
  totalVariationOrders?: number;
}

export interface DashboardStatsResult extends DashboardStatsBaseline, DashboardStatsOptionalNumeric {
  statsUnavailable: boolean;
  statsStatus: 'LIVE' | 'UNAVAILABLE';
  statsDiagnosticCode: DashboardStatsDiagnosticCode | null;
  unavailableMetrics?: string[];
}

export const ZERO_DASHBOARD_STATS: Readonly<DashboardStatsBaseline> = Object.freeze({
  pendingAIOverrides: 0,
  totalProjects: 0,
  totalBudget: 0,
  totalPayables: 0,
  totalAccomplishments: 0,
  pendingMRFs: 0,
  pendingPettyCash: 0,
  activePayrollPeriods: 0,
  openCanvassing: 0,
  activePurchaseOrders: 0,
  expectedDeliveries: 0,
  totalIssuances: 0,
  totalSuppliers: 0,
  totalWorkers: 0,
  totalUsers: 0,
  totalAuditLogs: 0,
  totalDailyLogs: 0,
  totalJobOrders: 0,
});

const REQUIRED_DASHBOARD_KEYS = Object.keys(ZERO_DASHBOARD_STATS) as Array<keyof DashboardStatsBaseline>;
const OPTIONAL_DASHBOARD_KEYS: ReadonlyArray<keyof DashboardStatsOptionalNumeric> = [
  'pendingMRs',
  'totalExpenses',
  'accomplishmentPercentage',
  'totalSubcontractors',
  'totalDocuments',
  'totalVariationOrders',
];

export function classifyDashboardBackendFailure(
  error: unknown,
  explicitStatus?: number
): DashboardStatsDiagnosticCode {
  if ((error as any)?.isInvalidPayload === true) {
    return 'BACKEND_INVALID_PAYLOAD';
  }

  const status =
    typeof explicitStatus === 'number'
      ? explicitStatus
      : typeof (error as any)?.httpStatus === 'number'
        ? (error as any).httpStatus
        : undefined;

  if (status === 401) return 'BACKEND_HTTP_401';
  if (status === 403) return 'BACKEND_HTTP_403';
  if (status === 404) return 'BACKEND_HTTP_404';
  if (status === 405) return 'BACKEND_HTTP_405';
  if (typeof status === 'number' && status >= 500 && status <= 599) return 'BACKEND_HTTP_5XX';
  if (typeof status === 'number' && status >= 400 && status <= 499) return 'BACKEND_HTTP_ERROR';

  const message = error instanceof Error ? error.message : String(error ?? '');
  if (
    /SERVER_URL_RESOLUTION_FAILED|UNTRUSTED_BACKEND_DESTINATION|INTERNAL_AUTH_SECRET_MISSING/i.test(
      message
    )
  ) {
    return 'BACKEND_URL_UNCONFIGURED';
  }
  if (/\b405\b|Method Not Allowed/i.test(message)) return 'BACKEND_HTTP_405';
  if (/\b401\b|Unauthorized|PASSWORD_CHANGE_REQUIRED/i.test(message)) return 'BACKEND_HTTP_401';
  if (/\b403\b|Forbidden/i.test(message)) return 'BACKEND_HTTP_403';
  if (/\b404\b|Not Found/i.test(message)) return 'BACKEND_HTTP_404';
  if (/\b50[0-9]\b|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout/i.test(message)) {
    return 'BACKEND_HTTP_5XX';
  }

  return 'BACKEND_UNREACHABLE';
}

export function buildUnavailableDashboardStats(
  diagnosticCode: DashboardStatsDiagnosticCode
): DashboardStatsResult {
  return {
    ...ZERO_DASHBOARD_STATS,
    statsUnavailable: true,
    statsStatus: 'UNAVAILABLE',
    statsDiagnosticCode: sanitizeDashboardDiagnosticCode(diagnosticCode),
  };
}

export function normalizeLiveDashboardStats(payload: unknown): DashboardStatsResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return buildUnavailableDashboardStats('BACKEND_INVALID_PAYLOAD');
  }
  const record = payload as Record<string, unknown>;
  if (record.statsUnavailable === true || record.statsStatus === 'UNAVAILABLE') {
    return buildUnavailableDashboardStats(
      sanitizeDashboardDiagnosticCode(record.statsDiagnosticCode, 'BACKEND_UNREACHABLE')
    );
  }
  if ('error' in record && Boolean(record.error)) {
    return buildUnavailableDashboardStats('BACKEND_INVALID_PAYLOAD');
  }

  const rawUnavailable = Array.isArray(record.unavailableMetrics)
    ? record.unavailableMetrics.filter((k): k is string => typeof k === 'string' && k.length > 0)
    : [];
  const unavailableSet = new Set(rawUnavailable);

  const normalizedBaseline = {} as Record<keyof DashboardStatsBaseline, number | null>;
  for (const key of REQUIRED_DASHBOARD_KEYS) {
    const val = record[key];
    if (val === null && key === 'pendingPettyCash' && unavailableSet.has(key)) {
      normalizedBaseline[key] = null;
      continue;
    }
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return buildUnavailableDashboardStats('BACKEND_INVALID_PAYLOAD');
    }
    normalizedBaseline[key] = val;
  }

  const normalizedOptional: DashboardStatsOptionalNumeric = {};
  for (const optKey of OPTIONAL_DASHBOARD_KEYS) {
    const val = record[optKey];
    if (val !== undefined) {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        return buildUnavailableDashboardStats('BACKEND_INVALID_PAYLOAD');
      }
      normalizedOptional[optKey] = val;
    }
  }

  return {
    ...(normalizedBaseline as DashboardStatsBaseline),
    ...normalizedOptional,
    statsUnavailable: false,
    statsStatus: 'LIVE',
    statsDiagnosticCode: null,
    ...(rawUnavailable.length > 0 ? { unavailableMetrics: rawUnavailable } : {}),
  };
}

export function isDashboardStatsUnavailable(stats: any): boolean {
  return Boolean(!stats || stats.statsUnavailable === true || stats.statsStatus === 'UNAVAILABLE');
}

export function formatDashboardCount(stats: any, value: unknown, suffix = ''): string {
  if (isDashboardStatsUnavailable(stats)) {
    return '—';
  }
  if (value === null) {
    return 'Unavailable';
  }
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${numeric}${suffix}`;
}

export function formatDashboardCurrency(stats: any, value: unknown): string {
  if (isDashboardStatsUnavailable(stats)) {
    return 'Unavailable';
  }
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 'Unavailable';
  }
  return `₱ ${numeric.toLocaleString()}`;
}
