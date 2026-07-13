import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

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
