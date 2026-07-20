const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const boqVersion = await prisma.projectBOQVersion.findFirst({ where: { projectId }});
    const project = await prisma.project.findUnique({ where: { id: projectId }});
    
    let lockActor = null;
    let lockActorRoles = [];
    if (boqVersion?.lockedById) {
      lockActor = await prisma.user.findUnique({ where: { id: boqVersion.lockedById }});
      lockActorRoles = await prisma.userRole.findMany({ where: { userId: boqVersion.lockedById }, include: { role: true } });
    }
    
    const approvals = await prisma.auditLog.findMany({
        where: { OR: [ { actionType: 'BOQ_TECHNICAL_APPROVAL' }, { actionType: 'BOQ_FINAL_APPROVAL' } ] },
        orderBy: { createdAt: 'asc' }
    });

    const saActions = await prisma.auditLog.findMany({ where: { userId: 'cmriqvj420002ic042t24e52x' } });
    const burnEmail = await prisma.user.findFirst({ where: { email: 'j.burns2372@gmail.com' } });
    const burnAudit = await prisma.auditLog.findMany({ where: { actionType: 'EMAIL_CASE_NORMALIZED' } });
    const credRotations = await prisma.auditLog.findMany({ where: { actionType: 'FORCE_PASSWORD_RESET' } });
    const users = await prisma.user.findMany({
        where: { email: { in: ['manager@onesystemserp.com', 'director@onesystemserp.com', 'engineer@onesystemserp.com'] } },
        select: { email: true, passwordChangedAt: true, sessionVersion: true, mustChangePassword: true, status: true }
    });

    const awardedLines = await prisma.awardedBOQItem.count({ where: { projectId } });
    const schedModels = ['projectSchedule', 'scheduleWBS', 'scheduleActivity', 'scheduleDependency'];
    const schedCounts = {};
    for (const model of schedModels) { schedCounts[model] = await prisma[model].count(); }

    const fs = require('fs');
    fs.writeFileSync('db-state.json', JSON.stringify({
        boqVersion, boqLocked: project?.boqLocked, lockActor: lockActor?.email, lockActorRole: lockActorRoles.map(r => r.role.roleCode),
        approvals, saActions, burnEmail: !!burnEmail, burnAudit, credRotations, users, awardedLines, schedCounts
    }, null, 2));
    console.log('done');
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
