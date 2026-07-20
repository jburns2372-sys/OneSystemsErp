import { PrismaClient } from '@prisma/client';
import { submitDraftForReview, startTechnicalReview } from '../src/lib/services/schedule-workflow.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const projectId = process.env.GATE9D_TARGET_PROJECT_ID || 'cmrirhhw30000ic0406v47smb';
    
    // 1. Reconfirm Gate 8D state
    const schedule = await prisma.projectSchedule.findFirst({
        where: { projectId: projectId }
    });
    
    if (!schedule) {
        throw new Error("Schedule not found");
    }
    
    if (schedule.workflowStatus !== 'AI_GENERATED_DRAFT') {
        throw new Error(`Schedule is not in AI_GENERATED_DRAFT state! It is ${schedule.workflowStatus}`);
    }
    
    console.log("Gate 8D State Reconfirmed. Status:", schedule.workflowStatus, "RowVersion:", schedule.rowVersion);
    
    // Find actors
    const engineer = await prisma.user.findFirst({ where: { email: 'engineer@onesystemserp.com' } });
    const manager = await prisma.user.findFirst({ where: { email: 'manager@onesystemserp.com' } });
    const finance = await prisma.user.findFirst({ where: { email: 'finance@onesystemserp.com' } });
    
    if (!engineer || !manager || !finance) throw new Error("Missing users");
    
    let currentRowVersion = schedule.rowVersion;
    
    // Step 1: Submit Draft (Engineer)
    console.log("Submitting Draft for Review...");
    const engSession = {
        userId: engineer.id,
        email: engineer.email,
        sessionVersion: 1,
        accountActive: true,
        accountLocked: false,
        mustChangePassword: false
    };
    
    const submitResult = await submitDraftForReview(
        projectId, 
        schedule.id, 
        currentRowVersion, 
        'submit-draft-123', 
        engSession
    );
    console.log("Submit Draft Result:", submitResult.status);
    currentRowVersion++;
    
    // Step 2: Start Technical Review (Manager)
    console.log("Starting Technical Review...");
    const manSession = {
        userId: manager.id,
        email: manager.email,
        sessionVersion: 1,
        accountActive: true,
        accountLocked: false,
        mustChangePassword: false
    };
    
    const startReviewResult = await startTechnicalReview(
        projectId,
        schedule.id,
        currentRowVersion,
        'start-review-123',
        manSession
    );
    console.log("Start Review Result:", startReviewResult.status);
    currentRowVersion++;
    
    // Step 3: Technical Comments (Manager)
    const categories = ['TECHNICAL', 'SEQUENCE', 'DURATION', 'CREW'];
    for (const cat of categories) {
        console.log(`Adding ${cat} comment...`);
        await prisma.scheduleReviewComment.create({
            data: {
                scheduleId: schedule.id,
                projectId: projectId,
                createdById: manager.id,
                commentType: cat,
                comment: 'Verified ' + cat,
                reviewRound: 1,
                createdByNameSnapshot: manager.name || 'Unknown',
                createdByRoleSnapshot: manager.role || 'Unknown'
            }
        });
        
        await prisma.auditLog.create({
            data: {
                actionType: 'SCHEDULE_REVIEW_COMMENT_CREATED',
                moduleName: 'PROJECT_SCHEDULING',
                userId: manager.id,
                newValue: JSON.stringify({
                    entityType: 'ProjectSchedule',
                    entityId: schedule.id,
                    projectId: projectId,
                    expectedRowVersion: currentRowVersion,
                    idempotencyKey: `comment-${cat}-123`,
                    category: cat
                })
            }
        });
    }
    
    // Step 4: Financial Review (Finance)
    console.log(`Adding FINANCIAL comment...`);
    await prisma.scheduleReviewComment.create({
        data: {
            scheduleId: schedule.id,
            projectId: projectId,
            createdById: finance.id,
            commentType: 'FINANCIAL',
            comment: 'Verified FINANCIAL',
            reviewRound: 1,
            createdByNameSnapshot: finance.name || 'Unknown',
            createdByRoleSnapshot: finance.role || 'Unknown'
        }
    });
    
    await prisma.auditLog.create({
        data: {
            actionType: 'SCHEDULE_REVIEW_COMMENT_CREATED',
            moduleName: 'PROJECT_SCHEDULING',
            userId: finance.id,
            newValue: JSON.stringify({
                entityType: 'ProjectSchedule',
                entityId: schedule.id,
                projectId: projectId,
                expectedRowVersion: currentRowVersion,
                idempotencyKey: `comment-FINANCIAL-123`,
                category: 'FINANCIAL'
            })
        }
    });

    console.log("Gate 9D Workflow Execution Complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
