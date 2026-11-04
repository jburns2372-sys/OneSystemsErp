import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership, isGlobalTenantAdminRole } from '@/lib/uboq/project-ownership';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
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
    console.error('Error updating project:', error);
    const msg = error?.message || 'Internal Server Error';
    const status = msg.includes('UBOQ_PBAC') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isGlobalTenantAdminRole(actor.role)) {
      return NextResponse.json({ error: 'Forbidden: Only administrative directors may delete projects' }, { status: 403 });
    }

    const { id: projectId } = await params;
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
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
