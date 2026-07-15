import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Setting up Test Fixtures for Phase 3D-D ---');

  // Helper to ensure role exists
  async function ensureRole(roleCode: string, roleName: string) {
    let role = await prisma.role.findFirst({ where: { roleCode } });
    if (!role) {
      role = await prisma.role.create({
        data: { roleCode, roleName, isActive: true }
      });
      console.log(`Created role: ${roleCode}`);
    }
    return role;
  }

  // Ensure Module PROJECT_MANAGEMENT exists
  let pmModule = await prisma.module.findUnique({ where: { moduleName: 'PROJECT_MANAGEMENT' } });
  if (!pmModule) {
    pmModule = await prisma.module.create({
      data: { moduleName: 'PROJECT_MANAGEMENT', moduleGroup: 'OPERATIONS', description: 'Project Management', sortOrder: 1 }
    });
  }

  const pwdHash = await bcrypt.hash('testpassword', 10);

  async function ensureTestUser(email: string, name: string, roleCode: string) {
    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: roleCode,
          passwordHash: pwdHash,
          password: 'testpassword'
        }
      });
      console.log(`Created user: ${email} with role: ${roleCode}`);
    }
    return user;
  }

  async function setPermissions(roleId: string, perms: any) {
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_moduleId: { roleId, moduleId: pmModule!.id } }
    });
    if (existing) {
      await prisma.rolePermission.update({
        where: { id: existing.id },
        data: perms
      });
    } else {
      await prisma.rolePermission.create({
        data: {
          roleId,
          moduleId: pmModule!.id,
          moduleName: 'PROJECT_MANAGEMENT',
          ...perms
        }
      });
    }
  }

  // 1. Technical Reviewer
  const techRole = await ensureRole('TEST_TECH_REV', 'Test Technical Reviewer');
  await setPermissions(techRole.id, { canReview: true, canApprove: true, canReturnForCorrection: true, canReject: true, canView: true });
  await ensureTestUser('tech_reviewer@test.com', 'Tech Reviewer', 'TEST_TECH_REV');

  // 2. Baseline Approver
  const approverRole = await ensureRole('TEST_APPROVER', 'Test Baseline Approver');
  await setPermissions(approverRole.id, { canSubmit: true, canApprove: true, canLock: true, canRevise: true, canView: true });
  await ensureTestUser('baseline_approver@test.com', 'Baseline Approver', 'TEST_APPROVER');

  // 3. Unauthorized User
  const unauthRole = await ensureRole('TEST_UNAUTH', 'Test Unauthorized');
  // No special permissions
  await ensureTestUser('unauth_user@test.com', 'Unauth User', 'TEST_UNAUTH');

  console.log('Fixtures setup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
