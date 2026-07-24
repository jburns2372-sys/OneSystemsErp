/**
 * Authoritative origin: commit 12bc13dbd03e06ef59e897ba34be3b472566485b.
 *
 * This hardened version intentionally does not load dotenv files. The caller
 * must provide an explicitly approved environment and database identity.
 */
import { PrismaClient } from '@prisma/client';
import { SecureUserEmailChangeService } from '../src/lib/services/secure-user-email-change.service';

interface CliArguments {
  userId?: string;
  currentEmail?: string;
  newEmail?: string;
  role?: string;
  reason?: string;
  apply: boolean;
}

interface ParsedDatabaseIdentity {
  hostname: string;
  databaseName: string;
  endpointId: string;
}

interface RuntimeDatabaseIdentity {
  databaseName: string;
  branchId: string | null;
  endpointId: string | null;
}

class ValidationError extends Error {}

const valueOptions = new Map<string, keyof Omit<CliArguments, 'apply'>>([
  ['--userId', 'userId'],
  ['--currentEmail', 'currentEmail'],
  ['--newEmail', 'newEmail'],
  ['--role', 'role'],
  ['--reason', 'reason'],
]);

function parseArguments(args: string[]): CliArguments {
  const parsed: CliArguments = { apply: false };
  const seen = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];

    if (seen.has(option)) {
      throw new ValidationError('argument validation failed: duplicate option.');
    }
    seen.add(option);

    if (option === '--apply') {
      parsed.apply = true;
      continue;
    }

    const property = valueOptions.get(option);
    if (!property) {
      throw new ValidationError('argument validation failed: unknown option.');
    }

    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new ValidationError('argument validation failed: missing option value.');
    }

    parsed[property] = value;
    index += 1;
  }

  if (
    !parsed.userId ||
    !parsed.currentEmail ||
    !parsed.newEmail ||
    !parsed.role ||
    !parsed.reason
  ) {
    throw new ValidationError('argument validation failed: required values are missing.');
  }

  return parsed;
}

function validateExecutionEnvironment(apply: boolean): void {
  if (process.env.NODE_ENV?.trim().toLowerCase() === 'production') {
    throw new ValidationError('production execution is prohibited.');
  }

  const configuredMarkers = [
    process.env.ENVIRONMENT,
    process.env.APP_ENV,
    process.env.UAT_ENV,
  ].filter((value): value is string => value !== undefined);
  const exactMarkers = configuredMarkers.filter((value) => value === 'V4-R7');

  if (
    configuredMarkers.length !== 1 ||
    exactMarkers.length !== 1
  ) {
    throw new ValidationError(
      'environment validation failed: configure exactly one V4-R7 marker.',
    );
  }

  if (apply && process.env.ALLOW_UAT_EMAIL_CHANGE !== 'true') {
    throw new ValidationError(
      'apply authorization failed: explicit UAT approval is required.',
    );
  }
}

function requireApprovalValue(name: string): string {
  const value = process.env[name];
  if (!value || value !== value.trim()) {
    throw new ValidationError('database identity approval is incomplete.');
  }
  return value;
}

function parseDatabaseIdentity(): ParsedDatabaseIdentity {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) {
    throw new ValidationError('database identity validation failed.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawDatabaseUrl);
  } catch {
    throw new ValidationError('database identity validation failed.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new ValidationError('database identity validation failed.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const hostnameLabels = hostname.split('.');
  const endpointLabel = hostnameLabels[0];
  const endpointId = endpointLabel.endsWith('-pooler')
    ? endpointLabel.slice(0, -'-pooler'.length)
    : endpointLabel;
  const isStructuredNeonHostname =
    hostnameLabels.length >= 4 &&
    hostname.endsWith('.neon.tech') &&
    /^ep-[a-z0-9]+(?:-[a-z0-9]+)+$/.test(endpointId) &&
    (endpointLabel === endpointId || endpointLabel === `${endpointId}-pooler`);

  let databaseName = '';
  try {
    databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
  } catch {
    throw new ValidationError('database identity validation failed.');
  }

  if (
    !isStructuredNeonHostname ||
    !databaseName ||
    databaseName.includes('/')
  ) {
    throw new ValidationError('database identity validation failed.');
  }

  const approvedHostname = requireApprovalValue(
    'APPROVED_UAT_DATABASE_HOSTNAME',
  ).toLowerCase();
  const approvedDatabaseName = requireApprovalValue(
    'APPROVED_UAT_DATABASE_NAME',
  );
  const approvedScope = requireApprovalValue('APPROVED_UAT_DATABASE_SCOPE');

  if (
    !['V4-R7-UAT', 'RECONCILIATION-TEST'].includes(approvedScope) ||
    hostname !== approvedHostname ||
    databaseName !== approvedDatabaseName
  ) {
    throw new ValidationError('database identity is not approved.');
  }

  return { hostname, databaseName, endpointId };
}

async function validateRuntimeDatabaseIdentity(
  prisma: PrismaClient,
  parsedIdentity: ParsedDatabaseIdentity,
): Promise<void> {
  const approvedBranchId = requireApprovalValue(
    'APPROVED_UAT_NEON_BRANCH_ID',
  );
  const mainBranchId = requireApprovalValue('NEON_MAIN_BRANCH_ID');

  if (
    !/^br-[a-z0-9]+(?:-[a-z0-9]+)+$/.test(approvedBranchId) ||
    !/^br-[a-z0-9]+(?:-[a-z0-9]+)+$/.test(mainBranchId) ||
    approvedBranchId === mainBranchId
  ) {
    throw new ValidationError('database branch approval is invalid.');
  }

  const rows = await prisma.$queryRaw<RuntimeDatabaseIdentity[]>`
    SELECT
      current_database()::text AS "databaseName",
      current_setting('neon.branch_id', true)::text AS "branchId",
      current_setting('neon.endpoint_id', true)::text AS "endpointId"
  `;
  const runtimeIdentity = rows[0];

  if (
    !runtimeIdentity ||
    runtimeIdentity.databaseName !== parsedIdentity.databaseName ||
    runtimeIdentity.branchId !== approvedBranchId ||
    runtimeIdentity.branchId === mainBranchId ||
    runtimeIdentity.endpointId !== parsedIdentity.endpointId
  ) {
    throw new ValidationError('runtime database identity is not approved.');
  }
}

async function run(): Promise<void> {
  let prisma: PrismaClient | undefined;

  try {
    const parsed = parseArguments(process.argv.slice(2));
    validateExecutionEnvironment(parsed.apply);
    const parsedDatabaseIdentity = parseDatabaseIdentity();

    prisma = new PrismaClient();
    await validateRuntimeDatabaseIdentity(prisma, parsedDatabaseIdentity);

    const service = new SecureUserEmailChangeService(prisma);
    const result = await service.execute({
      targetUserId: parsed.userId!,
      expectedCurrentEmail: parsed.currentEmail!,
      newEmail: parsed.newEmail!,
      environment: 'V4-R7',
      reason: parsed.reason!,
      operatorProvenance: 'CLI Maintenance Script',
      intendedRole: parsed.role!,
      dryRun: !parsed.apply,
    });

    if (!result.success) {
      throw new ValidationError('operation validation failed.');
    }

    console.log(`Mode: ${result.dryRun ? 'DRY RUN' : 'APPLY'}`);
    console.log(`Old email: ${result.oldEmailMasked}`);
    console.log(`New email: ${result.newEmailMasked}`);
    console.log(`Sessions invalidated: ${result.sessionInvalidated ? 'yes' : 'no'}`);
    console.log(`Recovery tokens revoked: ${result.tokensRevoked}`);
    console.log(`Audit record created: ${result.auditRecordCreated ? 'yes' : 'no'}`);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

run().catch((error: unknown) => {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.message}`);
  } else {
    console.error('Unexpected failure; details withheld.');
  }
  process.exitCode = 1;
});
