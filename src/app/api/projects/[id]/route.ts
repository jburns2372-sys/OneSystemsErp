import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership } from '@/lib/uboq/project-ownership';

const RESERVED_PROJECT_SEGMENTS = new Set(['dashboard-stats']);
const DELETE_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN']);

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    if (!projectId || RESERVED_PROJECT_SEGMENTS.has(projectId.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid project identifier' }, { status: 400 });
    }
    await assertProjectGraphOwnership(prisma, {
      userId: actor.userId,
      userRole: actor.role,
      projectId,
    });

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status }
    });

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    console.error('Error updating project');
    const msg = typeof error?.message === 'string' ? error.message : '';
    if (msg.includes('UBOQ_PBAC')) {
      return NextResponse.json({ error: 'Forbidden: Project ownership access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: projectId } = await params;
    if (!projectId || RESERVED_PROJECT_SEGMENTS.has(projectId.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid project identifier' }, { status: 400 });
    }
    if (!DELETE_ADMIN_ROLES.has(actor.role)) {
      return NextResponse.json({ error: 'Forbidden: Only SUPER_ADMIN or SYSTEM_ADMIN may delete projects' }, { status: 403 });
    }
    const GUEST_ROLE_ALIASES = new Set(['GUEST_USER', 'GUEST USER']);
    let primaryAdminRole = await prisma.role.findFirst({
      where: { OR: [{ roleCode: actor.role }, { roleName: actor.role }] },
      select: { isActive: true, roleCode: true, roleName: true },
    });
    if (!primaryAdminRole && actor.role === 'SYSTEM_ADMIN') {
      primaryAdminRole = await prisma.role.findFirst({
        where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
        select: { isActive: true, roleCode: true, roleName: true },
      });
    }
    const assignedRoles = await prisma.userRole.findMany({
      where: { userId: actor.userId },
      include: { role: true },
    });
    const hasGuestAssignment =
      GUEST_ROLE_ALIASES.has(actor.role) ||
      GUEST_ROLE_ALIASES.has(primaryAdminRole?.roleCode || '') ||
      GUEST_ROLE_ALIASES.has(primaryAdminRole?.roleName || '') ||
      assignedRoles.some(
        ({ role }: any) =>
          role?.isActive &&
          (GUEST_ROLE_ALIASES.has(role.roleCode) || GUEST_ROLE_ALIASES.has(role.roleName))
      );
    if (!primaryAdminRole?.isActive || hasGuestAssignment) {
      return NextResponse.json({ error: 'Forbidden: Active global system-admin role required' }, { status: 403 });
    }
    const cookieStore = await cookies();
    const simulatedRole = cookieStore.get('simulatedRole')?.value;
    if (simulatedRole) {
      if (!DELETE_ADMIN_ROLES.has(simulatedRole)) {
        return NextResponse.json({ error: 'Forbidden: Project deletion is blocked while simulating a non-admin role' }, { status: 403 });
      }
      let simAdminRole = await prisma.role.findFirst({
        where: { OR: [{ roleCode: simulatedRole }, { roleName: simulatedRole }] },
        select: { isActive: true, roleCode: true, roleName: true },
      });
      if (!simAdminRole && simulatedRole === 'SYSTEM_ADMIN') {
        simAdminRole = await prisma.role.findFirst({
          where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
          select: { isActive: true, roleCode: true, roleName: true },
        });
      }
      if (
        !simAdminRole?.isActive ||
        GUEST_ROLE_ALIASES.has(simulatedRole) ||
        GUEST_ROLE_ALIASES.has(simAdminRole.roleCode) ||
        GUEST_ROLE_ALIASES.has(simAdminRole.roleName)
      ) {
        return NextResponse.json({ error: 'Forbidden: Active simulated admin role required' }, { status: 403 });
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        uboqGovernanceEnabled: true,
        _count: {
          select: {
            uboqOperationalSnapshots: true,
            uboqResourceLedgerEntries: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (
      project.uboqGovernanceEnabled ||
      project._count.uboqOperationalSnapshots > 0 ||
      project._count.uboqResourceLedgerEntries > 0
    ) {
      return NextResponse.json(
        { error: `UBOQ_PROJECT_DELETE_BLOCKED: Cannot delete UBOQ-governed project ${projectId}` },
        { status: 409 }
      );
    }

    // First delete some common children that might cause FK constraints if not cascaded
    await prisma.projectSchedule.deleteMany({ where: { projectId } });
    await prisma.awardedBOQItem.deleteMany({ where: { projectId } });
    await prisma.consolidatedBOQItem.deleteMany({ where: { projectId } });
    await prisma.materialRequest.deleteMany({ where: { projectId } });
    await prisma.projectUserAssignment.deleteMany({ where: { projectId } });

    // Now delete the project itself
    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error('Error deleting project');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
