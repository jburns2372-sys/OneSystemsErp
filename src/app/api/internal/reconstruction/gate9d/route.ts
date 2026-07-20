import { NextResponse } from 'next/server';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    if (process.env.GATE9D_REVIEW_MODE !== 'DISABLED_POST_MIGRATION') {
        return NextResponse.json({ error: 'Endpoint permanently disabled post-migration' }, { status: 410 });
    }

    try {
        const session = await verifyOperationalSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await req.json();
        const { operation, expectedRowVersion, category, idempotencyKey, correlationId, reviewNote } = body;
        
        const projectId = process.env.GATE9D_TARGET_PROJECT_ID;
        if (!projectId) return NextResponse.json({ error: 'Missing GATE9D_TARGET_PROJECT_ID' }, { status: 500 });
        
        const schedule = await prisma.projectSchedule.findFirst({
            where: { projectId: projectId }
        });
        
        if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        
        if (expectedRowVersion !== undefined && schedule.rowVersion !== expectedRowVersion) {
            return NextResponse.json({ error: 'Optimistic concurrency failure' }, { status: 409 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!user || user.status !== 'ACTIVE' || (user.lockedUntil && new Date(user.lockedUntil) > new Date())) {
            return NextResponse.json({ error: 'User invalid' }, { status: 403 });
        }

        const projectAssignment = await prisma.projectUserAssignment.findFirst({
            where: {
                projectId,
                userId: session.userId,
                assignmentStatus: 'ACTIVE',
                OR: [
                    { dateRemoved: null },
                    { dateRemoved: { gt: new Date() } }
                ]
            },
            include: { user: true }
        });

        if (!projectAssignment) {
            return NextResponse.json({ error: 'PBAC denied: Not assigned to project' }, { status: 403 });
        }

        if (operation === 'submitDraftForReview') {
            if (schedule.workflowStatus !== 'AI_GENERATED_DRAFT') {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            if (projectAssignment.projectRole !== 'SITE_ENGINEER') {
                return NextResponse.json({ error: 'PBAC denied' }, { status: 403 });
            }

            const res = await prisma.projectSchedule.updateMany({
                where: { id: schedule.id, rowVersion: expectedRowVersion, workflowStatus: 'AI_GENERATED_DRAFT' },
                data: {
                    workflowStatus: 'READY_FOR_REVIEW',
                    rowVersion: { increment: 1 }
                }
            });
            if (res.count === 0) return NextResponse.json({ error: 'Concurrency or status conflict' }, { status: 409 });
            
            await prisma.auditLog.create({
                data: {
                    actionType: 'SCHEDULE_SUBMITTED_FOR_REVIEW',
                    moduleName: 'PROJECT_SCHEDULING',
                    userId: session.userId,
                    newValue: JSON.stringify({
                        entityType: 'ProjectSchedule',
                        entityId: schedule.id,
                        projectId: projectId,
                        expectedRowVersion,
                        idempotencyKey
                    })
                }
            });
            
            await prisma.scheduleWorkflowTransition.create({
                data: {
                    projectId: projectId,
                    scheduleId: schedule.id,
                    actorUserId: session.userId,
                    actorSessionVersion: session.sessionVersion || 1,
                    action: 'SUBMIT_DRAFT_FOR_REVIEW',
                    fromStatus: 'AI_GENERATED_DRAFT',
                    toStatus: 'READY_FOR_REVIEW',
                    expectedRowVersion: expectedRowVersion,
                    resultingRowVersion: schedule.rowVersion + 1,
                    idempotencyKeyHash: idempotencyKey,
                    metadata: JSON.stringify({
                        clientIp: req.headers.get('x-forwarded-for') || 'unknown',
                        userAgent: req.headers.get('user-agent') || 'unknown'
                    })
                }
            });
            
            return NextResponse.json({ success: true, status: 'READY_FOR_REVIEW' });
            
        } else if (operation === 'startTechnicalReview') {
            if (schedule.workflowStatus !== 'READY_FOR_REVIEW') {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            if (projectAssignment.projectRole !== 'PROJECT_MANAGER') {
                return NextResponse.json({ error: 'PBAC denied' }, { status: 403 });
            }

            const res = await prisma.projectSchedule.updateMany({
                where: { id: schedule.id, rowVersion: expectedRowVersion, workflowStatus: 'READY_FOR_REVIEW' },
                data: {
                    workflowStatus: 'UNDER_TECHNICAL_REVIEW',
                    rowVersion: { increment: 1 }
                }
            });
            if (res.count === 0) return NextResponse.json({ error: 'Concurrency or status conflict' }, { status: 409 });
            
            await prisma.auditLog.create({
                data: {
                    actionType: 'SCHEDULE_TECHNICAL_REVIEW_STARTED',
                    moduleName: 'PROJECT_SCHEDULING',
                    userId: session.userId,
                    newValue: JSON.stringify({
                        entityType: 'ProjectSchedule',
                        entityId: schedule.id,
                        projectId: projectId,
                        expectedRowVersion,
                        idempotencyKey
                    })
                }
            });

            await prisma.scheduleWorkflowTransition.create({
                data: {
                    projectId: projectId,
                    scheduleId: schedule.id,
                    actorUserId: session.userId,
                    actorSessionVersion: session.sessionVersion || 1,
                    action: 'START_TECHNICAL_REVIEW',
                    fromStatus: 'READY_FOR_REVIEW',
                    toStatus: 'UNDER_TECHNICAL_REVIEW',
                    expectedRowVersion: expectedRowVersion,
                    resultingRowVersion: schedule.rowVersion + 1,
                    idempotencyKeyHash: idempotencyKey,
                    metadata: JSON.stringify({
                        clientIp: req.headers.get('x-forwarded-for') || 'unknown',
                        userAgent: req.headers.get('user-agent') || 'unknown'
                    })
                }
            });
            return NextResponse.json({ success: true, status: 'UNDER_TECHNICAL_REVIEW' });
            
        } else if (operation === 'createScheduleReviewComment') {
            if (schedule.workflowStatus !== 'UNDER_TECHNICAL_REVIEW') {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            
            if (category === 'FINANCIAL' && projectAssignment.projectRole !== 'FINANCE_OFFICER') {
                return NextResponse.json({ error: 'PBAC denied: Must be Financial Reviewer' }, { status: 403 });
            } else if (['TECHNICAL', 'SEQUENCE', 'DURATION', 'CREW'].includes(category) && projectAssignment.projectRole !== 'PROJECT_MANAGER') {
                return NextResponse.json({ error: 'PBAC denied: Must be Technical Reviewer' }, { status: 403 });
            } else if (!['TECHNICAL', 'SEQUENCE', 'DURATION', 'CREW', 'FINANCIAL'].includes(category)) {
                return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
            }

            const existing = await prisma.scheduleReviewComment.findFirst({
                where: { scheduleId: schedule.id, commentType: category }
            });
            if (existing) return NextResponse.json({ success: true, comment: existing });
            
            if (category === 'FINANCIAL') {
                const allocs = await prisma.scheduleBOQAllocation.aggregate({
                    where: { scheduleId: schedule.id },
                    _sum: { allocatedAmount: true }
                });
                if (Number(allocs._sum.allocatedAmount) !== 43106674.89) {
                    return NextResponse.json({ error: 'Financial mismatch' }, { status: 400 });
                }
            }

            const comment = await prisma.scheduleReviewComment.create({
                data: {
                    scheduleId: schedule.id,
                    projectId: projectId,
                    createdById: session.userId,
                    commentType: category,
                    comment: reviewNote || 'Verified',
                    reviewRound: 1,
                    createdByNameSnapshot: user.name || 'Unknown',
                    createdByRoleSnapshot: user.role || 'Unknown'
                }
            });
            
            await prisma.auditLog.create({
                data: {
                    actionType: 'SCHEDULE_REVIEW_COMMENT_CREATED',
                    moduleName: 'PROJECT_SCHEDULING',
                    userId: session.userId,
                    newValue: JSON.stringify({
                        entityType: 'ProjectSchedule',
                        entityId: schedule.id,
                        projectId: projectId,
                        expectedRowVersion,
                        idempotencyKey,
                        category
                    })
                }
            });
            
            return NextResponse.json({ success: true, comment });

        } else {
            return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
        }
        
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
