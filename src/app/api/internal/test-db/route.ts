import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const boqVersion = await prisma.projectBOQVersion.findFirst({ where: { projectId }});
    const project = await prisma.project.findUnique({ where: { id: projectId }});
    
    let lockActor = null;
    let lockActorRoles: Prisma.UserRoleGetPayload<{ include: { role: true } }>[] = [];
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
    const schedCounts: any = {};
    for (const model of schedModels) { schedCounts[model] = await (prisma as any)[model].count(); }

    return NextResponse.json({
        boqVersion, boqLocked: project?.boqLocked, lockActor: lockActor?.email, lockActorRole: lockActorRoles.map(r => r.role.roleCode),
        approvals, saActions, burnEmail: !!burnEmail, burnAudit, credRotations, users, awardedLines, schedCounts
    });
}
