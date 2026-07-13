import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      include: {
        delayRecords: {
          include: {
            activity: { select: { name: true, activityCode: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ delays: schedule.delayRecords });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { activityId, delayStartDate, delayEndDate, delayDays, category, cause, impactToCriticalPath } = body;

    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const delayRecord = await prisma.scheduleDelayRecord.create({
      data: {
        scheduleId: schedule.id,
        activityId,
        delayStartDate: new Date(delayStartDate),
        delayEndDate: delayEndDate ? new Date(delayEndDate) : null,
        delayDays: delayDays || 0,
        category,
        cause,
        impactToCriticalPath: impactToCriticalPath || false,
        approvalStatus: 'PENDING'
      },
      include: {
        activity: { select: { name: true, activityCode: true } }
      }
    });

    return NextResponse.json({ success: true, delayRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
