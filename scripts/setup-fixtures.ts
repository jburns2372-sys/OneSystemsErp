import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
      data: { moduleName: 'PROJECT_MANAGEMENT', description: 'Project Management' }
    });
  }

  // Ensure Module Scheduling exists
  let schedModule = await prisma.module.findUnique({ where: { moduleName: 'Scheduling' } });
  if (!schedModule) {
    schedModule = await prisma.module.create({
      data: { moduleName: 'Scheduling', description: 'Scheduling' }
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
    // For PM Module
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
    // For Scheduling Module
    const existingSched = await prisma.rolePermission.findUnique({
      where: { roleId_moduleId: { roleId, moduleId: schedModule!.id } }
    });
    if (existingSched) {
      await prisma.rolePermission.update({
        where: { id: existingSched.id },
        data: perms
      });
    } else {
      await prisma.rolePermission.create({
        data: {
          roleId,
          moduleId: schedModule!.id,
          moduleName: 'Scheduling',
          ...perms
        }
      });
    }
  }

  // 1. Technical Reviewer
  const techRole = await ensureRole('TEST_TECH_REV', 'Test Technical Reviewer');
  await setPermissions(techRole.id, { canReview: true, canApprove: true, canReturnForCorrection: true, canReject: true, canView: true });
  const techUser = await ensureTestUser('tech_reviewer@test.com', 'Tech Reviewer', 'TEST_TECH_REV');

  // 2. Baseline Approver
  const approverRole = await ensureRole('TEST_APPROVER', 'Test Baseline Approver');
  await setPermissions(approverRole.id, { canSubmit: true, canApprove: true, canLock: true, canRevise: true, canView: true });
  await ensureTestUser('baseline_approver@test.com', 'Baseline Approver', 'TEST_APPROVER');

  // 3. Unauthorized User
  const unauthRole = await ensureRole('TEST_UNAUTH', 'Test Unauthorized');
  // No special permissions
  await ensureTestUser('unauth_user@test.com', 'Unauth User', 'TEST_UNAUTH');

  const ts = Date.now();

  // Create EMPTY project
  const emptyProject = await prisma.project.create({
    data: {
      name: `E2E_SCHED_EMPTY_${ts}`,
      contractAmount: 1000000,
      originalContractDuration: 30,
    }
  });

  // Assign user to EMPTY project
  await prisma.projectUserAssignment.create({
    data: {
      userId: techUser.id,
      projectId: emptyProject.id,
      projectRole: 'PROJECT_ENGINEER',
      accessLevel: 'WRITE',
      assignmentStatus: 'active',
      assignedBy: 'SYSTEM',
    }
  });

  // Create VALID project
  const validProject = await prisma.project.create({
    data: {
      name: `E2E_SCHED_VALID_${ts}`,
      contractAmount: 1000000,
      originalContractDuration: 30,
    }
  });

  // Assign user to VALID project
  await prisma.projectUserAssignment.create({
    data: {
      userId: techUser.id,
      projectId: validProject.id,
      projectRole: 'PROJECT_ENGINEER',
      accessLevel: 'WRITE',
      assignmentStatus: 'active',
      assignedBy: 'SYSTEM',
    }
  });

  // Create valid Schedule
  await prisma.projectSchedule.create({
    data: {
      projectId: validProject.id,
      name: `Schedule for VALID_${ts}`,
      workflowStatus: 'READY_FOR_REVIEW',
      awardedContractAmount: 1000,
      scheduledAmount: 1000,
      wbsNodes: {
        create: [
          {
            name: 'Phase 1',
            code: '1',
            level: 1,
            orderIndex: 0
          }
        ]
      },
      activities: {
        create: [
          {
            name: 'Task 1',
            status: 'PENDING',
            criticalPath: false
          }
        ]
      }
    }
  });

  console.log(`EMPTY_PROJECT_ID=${emptyProject.id}`);
  console.log(`VALID_PROJECT_ID=${validProject.id}`);
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
