import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { SecureUserEmailChangeService } from '../src/lib/services/secure-user-email-change.service';

const args = process.argv.slice(2);
const helpText = `
Usage: tsx correct-uat-user-email.ts [options]
Options:
  --userId <id>               Target user ID
  --currentEmail <email>      Expected current email
  --newEmail <email>          New email
  --role <role>               Intended role
  --reason <reason>           Reason for the change
  --apply                     Execute the change (defaults to dry-run)
`;

function parseArgs() {
  const parsed: any = { apply: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--userId') parsed.userId = args[++i];
    else if (args[i] === '--currentEmail') parsed.currentEmail = args[++i];
    else if (args[i] === '--newEmail') parsed.newEmail = args[++i];
    else if (args[i] === '--role') parsed.role = args[++i];
    else if (args[i] === '--reason') parsed.reason = args[++i];
    else if (args[i] === '--apply') parsed.apply = true;
  }
  return parsed;
}

async function run() {
  const parsed = parseArgs();
  
  if (!parsed.userId || !parsed.currentEmail || !parsed.newEmail || !parsed.role || !parsed.reason) {
    console.error('Missing required arguments.');
    console.log(helpText);
    process.exit(1);
  }

  // Environment checks
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Refusing to run in production environment.');
    process.exit(1);
  }

  if (process.env.ENVIRONMENT !== 'V4-R7' && process.env.APP_ENV !== 'V4-R7' && process.env.UAT_ENV !== 'V4-R7') {
    // If not strictly matched to V4-R7 somewhere in env. We can strictly require ENVIRONMENT=V4-R7
    // Let's enforce exactly what was requested.
    // "Refuse to run unless the configured environment is explicitly V4-R7 UAT."
    // Let's check DATABASE_URL instead to verify the specific details.
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('v4_r7_clean') || !dbUrl.includes('ep-solitary-surf-aps3rmax')) {
    console.error('ERROR: Database configuration does not match the approved V4-R7 UAT environment.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const service = new SecureUserEmailChangeService(prisma);

  const dryRun = !parsed.apply;
  console.log(`Starting secure email change process... Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}`);

  const result = await service.execute({
    targetUserId: parsed.userId,
    expectedCurrentEmail: parsed.currentEmail,
    newEmail: parsed.newEmail,
    environment: 'V4-R7',
    reason: parsed.reason,
    operatorProvenance: 'CLI Maintenance Script',
    intendedRole: parsed.role,
    dryRun
  });

  if (!result.success) {
    console.error('Operation Failed:', result.error);
    process.exit(1);
  }

  console.log('\n--- Operation Result ---');
  console.log(`Mode:                  ${result.dryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log(`Target User ID:        ${result.userId}`);
  console.log(`Old Email (Masked):    ${result.oldEmailMasked}`);
  console.log(`New Email (Masked):    ${result.newEmailMasked}`);
  console.log(`Validation Outcome:    SUCCESS`);
  console.log(`Session Incr:          ${result.sessionInvalidated ? 'yes' : 'no'}`);
  console.log(`Tokens Revoked:        ${result.tokensRevoked}`);
  console.log(`Audit Record Created:  ${result.auditRecordCreated ? 'yes' : 'no'}`);

  await prisma.$disconnect();
}

run().catch(e => {
  console.error('Unexpected error during script execution (details hidden for security).');
  process.exit(1);
});
