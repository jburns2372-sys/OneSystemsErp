import { PrismaClient } from '@prisma/client';
import { updateProjectUserAssignmentRole } from '../lib/services/ProjectUserAssignmentService';

const prisma = new PrismaClient();

async function runTests() {
  console.log('Starting GATE9D assignment update tests...');

  // Setup test data
  const testProject = await prisma.project.create({
    data: { name: 'Test Project 9D Update', status: 'PLANNING' }
  });

  const testUserActive = await prisma.user.create({
    data: { email: 'test_update_active@onesystemserp.com', name: 'Test Active', role: 'FINANCE_OFFICER', status: 'ACTIVE' }
  });

  const testUserInactive = await prisma.user.create({
    data: { email: 'test_update_inactive@onesystemserp.com', name: 'Test Inactive', role: 'FINANCE_OFFICER', status: 'INACTIVE' }
  });

  const testSuperAdmin = await prisma.user.create({
    data: { email: 'test_update_sa@onesystemserp.com', name: 'Test SA', role: 'SUPER_ADMIN', status: 'ACTIVE' }
  });

  const validAssignment = await prisma.projectUserAssignment.create({
    data: {
      projectId: testProject.id,
      userId: testUserActive.id,
      projectRole: 'PROJECT_ENGINEER',
      accessLevel: 'standard_project_access',
      assignmentStatus: 'active',
      assignedBy: testSuperAdmin.id,
    }
  });

  const inactiveAssignment = await prisma.projectUserAssignment.create({
    data: {
      projectId: testProject.id,
      userId: testUserInactive.id,
      projectRole: 'PROJECT_ENGINEER',
      accessLevel: 'standard_project_access',
      assignmentStatus: 'inactive',
      assignedBy: testSuperAdmin.id,
    }
  });

  let testsPassed = 0;
  let totalTests = 14;

  try {
    // 1. Missing authentication is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: validAssignment.id,
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'FINANCE_OFFICER',
        reason: 'test',
        actorContext: { userId: '', role: '' }
      });
      throw new Error('Should have rejected missing auth');
    } catch (e: any) {
      if (!e.message.includes('UNAUTHORIZED')) throw e;
      testsPassed++;
      console.log('Test 1 passed');
    }

    // 2. An unauthorized actor is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: validAssignment.id,
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'FINANCE_OFFICER',
        reason: 'test',
        actorContext: { userId: testUserActive.id, role: 'FINANCE_OFFICER' }
      });
      throw new Error('Should have rejected unauthorized actor');
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED_ROLE') throw e;
      testsPassed++;
      console.log('Test 2 passed');
    }

    // 5. A nonexistent assignment is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: 'missing_id',
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'FINANCE_OFFICER',
        reason: 'test',
        actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
      });
      throw new Error('Should have rejected nonexistent assignment');
    } catch (e: any) {
      if (e.message !== 'ASSIGNMENT_NOT_FOUND') throw e;
      testsPassed++;
      console.log('Test 5 passed');
    }

    // 6. An inactive assignment is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: inactiveAssignment.id,
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'FINANCE_OFFICER',
        reason: 'test',
        actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
      });
      throw new Error('Should have rejected inactive assignment');
    } catch (e: any) {
      if (e.message !== 'ASSIGNMENT_INACTIVE' && e.message !== 'USER_INACTIVE') throw e;
      testsPassed++;
      console.log('Test 6 passed');
    }

    // 7. An incorrect expected current role is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: validAssignment.id,
        expectedCurrentProjectRole: 'WRONG_ROLE',
        newProjectRole: 'FINANCE_OFFICER',
        reason: 'test',
        actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
      });
      throw new Error('Should have rejected incorrect expected role');
    } catch (e: any) {
      if (e.message !== 'INCORRECT_CURRENT_ROLE') throw e;
      testsPassed++;
      console.log('Test 7 passed');
    }

    // 8. An invalid new project role is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: validAssignment.id,
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'MADE_UP_ROLE',
        reason: 'test',
        actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
      });
      throw new Error('Should have rejected invalid new role');
    } catch (e: any) {
      if (e.message !== 'INVALID_NEW_ROLE') throw e;
      testsPassed++;
      console.log('Test 8 passed');
    }

    // 9. An unchanged project role is rejected.
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: validAssignment.id,
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'PROJECT_ENGINEER',
        reason: 'test',
        actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
      });
      throw new Error('Should have rejected unchanged role');
    } catch (e: any) {
      if (e.message !== 'UNCHANGED_ROLE') throw e;
      testsPassed++;
      console.log('Test 9 passed');
    }

    // 10. An incompatible target-user/global-role combination is rejected.
    const incompatibleUser = await prisma.user.create({
      data: { email: 'incompatible@onesystemserp.com', name: 'Inc', role: 'SITE_ENGINEER', status: 'ACTIVE' }
    });
    const incAssignment = await prisma.projectUserAssignment.create({
      data: {
        projectId: testProject.id,
        userId: incompatibleUser.id,
        projectRole: 'PROJECT_ENGINEER',
        accessLevel: 'standard',
        assignmentStatus: 'active'
      }
    });
    try {
      await updateProjectUserAssignmentRole({
        assignmentId: incAssignment.id,
        expectedCurrentProjectRole: 'PROJECT_ENGINEER',
        newProjectRole: 'FINANCE_OFFICER',
        reason: 'test',
        actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
      });
      throw new Error('Should have rejected incompatible global role');
    } catch (e: any) {
      if (e.message !== 'INCOMPATIBLE_GLOBAL_ROLE') throw e;
      testsPassed++;
      console.log('Test 10 passed');
    }

    // 11. A valid update changes only the assignment projectRole.
    await updateProjectUserAssignmentRole({
      assignmentId: validAssignment.id,
      expectedCurrentProjectRole: 'PROJECT_ENGINEER',
      newProjectRole: 'FINANCE_OFFICER',
      reason: 'test correction',
      actorContext: { userId: testSuperAdmin.id, role: 'SUPER_ADMIN' }
    });
    const updated = await prisma.projectUserAssignment.findUnique({ where: { id: validAssignment.id } });
    if (updated?.projectRole !== 'FINANCE_OFFICER') throw new Error('Role not updated');
    testsPassed++;
    console.log('Test 11 passed');

    // 12. The target user’s global role remains unchanged.
    const checkUser = await prisma.user.findUnique({ where: { id: testUserActive.id } });
    if (checkUser?.role !== 'FINANCE_OFFICER') throw new Error('Global role changed');
    testsPassed++;
    console.log('Test 12 passed');

    // 13. The target user remains ACTIVE.
    if (checkUser?.status !== 'ACTIVE') throw new Error('User status changed');
    testsPassed++;
    console.log('Test 13 passed');

    // 14. Exactly one active assignment remains for the user and project.
    // 15. No duplicate assignment is created.
    const assignments = await prisma.projectUserAssignment.findMany({
      where: { userId: testUserActive.id, projectId: testProject.id, assignmentStatus: 'active' }
    });
    if (assignments.length !== 1) throw new Error('Duplicate assignments found');
    testsPassed++;
    console.log('Test 14 & 15 passed');

    // 16. Exactly one correction audit record is created.
    const audits = await prisma.auditLog.findMany({
      where: { transactionId: validAssignment.id, actionType: 'UPDATE_ROLE' }
    });
    if (audits.length !== 1) throw new Error('Did not create exactly one correction audit record');
    testsPassed++;
    console.log('Test 16 passed');
    
    // 17. The audit record contains the previous and corrected project roles.
    // 18. The audit record contains no secrets or credentials.
    const auditData = audits[0].newValue || '';
    if (!auditData.includes('PROJECT_ENGINEER') || !auditData.includes('FINANCE_OFFICER')) {
      throw new Error('Audit does not contain previous and corrected roles');
    }
    if (auditData.includes('password') || auditData.includes('token') || auditData.includes('secret')) {
      throw new Error('Audit contains secrets');
    }
    testsPassed++;
    console.log('Test 17 & 18 passed');

    console.log('Existing role that grants Finance review access is: FINANCE_OFFICER');
    console.log(`Passed ${testsPassed} automated test assertions.`);

  } finally {
    // Cleanup
    await prisma.projectUserAssignment.deleteMany({ where: { projectId: testProject.id } });
    await prisma.auditLog.deleteMany({ where: { userId: testSuperAdmin.id } });
    await prisma.project.delete({ where: { id: testProject.id } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test_update_' } } });
    await prisma.user.deleteMany({ where: { email: 'incompatible@onesystemserp.com' } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
