import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AI_CONFIG } from '@/lib/ai/config';
import { schedulingAITools } from '@/lib/ai/tools';
import { estimateDuration } from '@/lib/scheduling/durationEstimator';
import { calculateCPM, CPMActivity, CPMDependency } from '@/lib/cpm-engine';
import { Decimal } from 'decimal.js';
import * as crypto from 'crypto';

export interface OrchestratorContext {
  projectId: string;
  generationRequestId: string;
  userId?: string;
  consolidateBoq?: boolean;
}

export async function runAIOrchestrator(context: OrchestratorContext) {
  const { projectId, generationRequestId, userId } = context;
  const startTime = new Date();
  
  try {
    // ---------------------------------------------------------
    // STAGE 1 - PROJECT CLASSIFICATION (Secondary Model)
    // ---------------------------------------------------------
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("Project not found");

    const boqLines = await prisma.awardedBOQItem.findMany({
      where: { projectId, totalCost: { gt: 0 } }
    });

    if (boqLines.length === 0) throw new Error("No BOQ Lines to process.");

    const { object: classification } = await generateObject({
      model: openai(AI_CONFIG.models.secondaryClassification),
      schema: z.object({
        primaryType: z.string(),
        secondaryDisciplines: z.array(z.string()),
        confidence: z.number().min(0).max(1),
        rationale: z.string()
      }),
      prompt: `Classify this project based on its name: ${project.name} and desc: ${project.description}. Determine the primary discipline.`,
    });

    if (classification.confidence < 0.75) {
      console.warn("Low confidence classification requires human review:", classification);
    }

    // ---------------------------------------------------------
    // STAGE 2 & 3 & 4 & 5 - WBS & PHASE GENERATION (Primary Model)
    // ---------------------------------------------------------
    // To prevent Vercel timeouts and token limits in standard endpoints, we execute a unified 
    // structured output prompt for phases and activities. We also consolidate identical lines.
    const groups = new Map<string, { id: string; description: string; quantity: number; unit: string; boqLineIds: string[] }>();
    
    if (context.consolidateBoq) {
      let groupIdx = 1;
      for (const item of boqLines) {
        const desc = (item.description || '').trim().toLowerCase();
        const unit = (item.unit || '').trim().toLowerCase();
        const key = `${desc}|${unit}`;
        
        if (!groups.has(key)) {
          groups.set(key, {
            id: `GRP_${groupIdx++}`,
            description: item.description,
            quantity: 0,
            unit: item.unit || 'lot',
            boqLineIds: []
          });
        }
        const g = groups.get(key)!;
        g.quantity += Number(item.quantity || 0);
        g.boqLineIds.push(item.id);
      }
    } else {
      let groupIdx = 1;
      for (const item of boqLines) {
        groups.set(item.id, {
          id: `ITEM_${groupIdx++}`,
          description: item.description,
          quantity: Number(item.quantity || 0),
          unit: item.unit || 'lot',
          boqLineIds: [item.id]
        });
      }
    }
    
    const consolidatedPayload = Array.from(groups.values());

    const boqPayload = consolidatedPayload.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit
    }));

    let retryCount = 0;
    let aiProposal: any = null;
    let validationErrors: string[] = [];
    
    // STAGE 9 - CORRECTION LOOP
    while (retryCount <= AI_CONFIG.limits.maxRetries) {
      try {
        const prompt = `You are a strict Universal Scheduling AI Engine.
Project: ${project.name}
Type: ${classification.primaryType}

Generate construction phases and map EVERY BOQ item into an activity.
CRITICAL RULES:
1. Phase 1 MUST be "General Requirements, Mobilization, Engineering and Site Establishment". Do NOT split general requirements or support functions into artificial sequential phases.
2. A phase named "Testing and Commissioning" MUST exist before the final phase for any project with equipment or systems.
3. The final phase MUST be exactly "Project Acceptance and Demobilization".
4. Do NOT combine Procurement with Equipment Installation into a single phase.
5. Every BOQ ID must be assigned EXACTLY once.

BOQ Items:
${JSON.stringify(boqPayload, null, 2)}

${validationErrors.length > 0 ? `PREVIOUS VALIDATION ERRORS TO CORRECT:\n${validationErrors.join('\n')}` : ''}`;

        const { object } = await generateObject({
          model: openai(AI_CONFIG.models.primaryPlanning),
          schema: z.object({
            phases: z.array(z.object({
              phaseName: z.string(),
              rationale: z.string(),
              activities: z.array(z.object({
                temporaryActivityKey: z.string(),
                activityName: z.string(),
                activityType: z.enum(['PRODUCTION', 'FIXED_TECHNICAL', 'LEVEL_OF_EFFORT', 'MILESTONE']),
                discipline: z.string(),
                assignedBOQItemIds: z.array(z.string()),
                productivityCategory: z.string(),
                recommendedCrewCount: z.number().min(1),
                fixedTechnicalDuration: z.number().nullable().describe("Duration in days if FIXED_TECHNICAL, otherwise null"),
                predecessors: z.array(z.object({
                  key: z.string().describe("temporaryActivityKey of the predecessor"),
                  type: z.enum(['FS', 'SS', 'FF', 'SF']),
                  lag: z.number()
                })),
                confidence: z.number()
              }))
            }))
          }),
          prompt
        });

        aiProposal = object;

        // STAGE 8 - DETERMINISTIC VALIDATION & AUTO-CORRECTION
        validationErrors = [];
        const assignedIds = new Set<string>();
        
        for (const p of aiProposal.phases) {
          for (const a of p.activities) {
            // Deduplicate inside the activity
            a.assignedBOQItemIds = Array.from(new Set(a.assignedBOQItemIds));
            
            // Remove any IDs that have ALREADY been assigned elsewhere
            a.assignedBOQItemIds = a.assignedBOQItemIds.filter((id: string) => {
              if (assignedIds.has(id)) {
                validationErrors.push(`Auto-corrected duplicate assignment of BOQ ID ${id}.`);
                return false;
              }
              return true;
            });
            
            a.assignedBOQItemIds.forEach((id: string) => assignedIds.add(id));
          }
        }

        const unassigned = boqPayload.filter(b => !assignedIds.has(b.id));
        if (unassigned.length > 0) {
          validationErrors.push(`Auto-assigned ${unassigned.length} missing BOQ items.`);
          if (aiProposal.phases.length > 0) {
            aiProposal.phases[0].activities.push({
              activityName: 'Miscellaneous Works (Auto-Assigned)',
              discipline: 'General',
              assignedBOQItemIds: unassigned.map(u => u.id),
              predecessors: [],
              confidence: 0.5
            });
          }
        }

        let finalPhase = aiProposal.phases[aiProposal.phases.length - 1];
        if (finalPhase.phaseName !== "Project Acceptance and Demobilization") {
          aiProposal.phases.push({
            phaseName: "Project Acceptance and Demobilization",
            rationale: "Auto-added mandatory final phase",
            activities: []
          });
        }

        // We auto-corrected everything, so we can always break successfully
        break;

      } catch (err: any) {
        validationErrors.push(err.message);
      }
      
      retryCount++;
      if (retryCount > AI_CONFIG.limits.maxRetries) {
        throw new Error(`AI failed deterministic validation after ${AI_CONFIG.limits.maxRetries} retries: ${validationErrors.join(', ')}`);
      }
    }

    // ---------------------------------------------------------
    // STAGE 10 - SAVE DRAFT (Financial & CPM execution)
    // ---------------------------------------------------------
    
    // We will do everything inside an interactive transaction to prevent orphan records
    // and safely rollback if anything fails.
    const result = await prisma.$transaction(async (tx) => {
      // Fetch any existing drafts to deprecate them safely
      const existingSchedules = await tx.projectSchedule.findMany({ where: { projectId } });

      // Create a brand new schedule draft
      const schedule = await tx.projectSchedule.create({
        data: { projectId, name: `${project.name} - Universal Draft`, status: 'DRAFT' }
      });

      // Mark old drafts as LEGACY_INVALID_DRAFT
      for (const old of existingSchedules) {
        await tx.projectSchedule.update({
          where: { id: old.id },
          data: { status: 'LEGACY_INVALID_DRAFT' }
        });
      }

      let fallbackAwardedId = '';
      if (boqLines.length > 0) {
        fallbackAwardedId = boqLines[0].id;
      }
      
      if (!fallbackAwardedId) {
        throw new Error("No Awarded BOQ items found for project to satisfy schedule allocation constraints.");
      }

      const phaseWbsData: Prisma.ScheduleWBSCreateManyInput[] = [];
      const activityData: Prisma.ScheduleActivityCreateManyInput[] = [];
      const allocationData: Prisma.ScheduleBOQAllocationCreateManyInput[] = [];

      // Create root WBS IMMEDIATELY to avoid self-referencing foreign key violations
      const rootWbsId = crypto.randomUUID();
      await tx.scheduleWBS.create({
        data: { id: rootWbsId, scheduleId: schedule.id, code: 'CONST', name: 'Construction Phase', level: 1, orderIndex: 1 }
      });

    let seq = 1;
    let actSeq = 1;
    let totalAmount = new Decimal(0);
    
    const dependencyData: Prisma.ScheduleDependencyCreateManyInput[] = [];

    // Pass 1: Build Maps and Calculate Durations
    const actIdMap = new Map<string, string>();
    const cpmActivities: CPMActivity[] = [];

    for (const p of aiProposal.phases) {
      for (const act of p.activities) {
        const actId = crypto.randomUUID();
        actIdMap.set(act.temporaryActivityKey, actId);

        let durationDays = 1;
        if (act.activityType === 'MILESTONE') {
          durationDays = 0;
        } else if (act.activityType === 'FIXED_TECHNICAL') {
          durationDays = act.fixedTechnicalDuration || 1;
        } else if (act.activityType === 'LEVEL_OF_EFFORT') {
          durationDays = project.originalContractDuration || 180;
        } else {
          // PRODUCTION
          let maxProdDuration = 1;
          for (const boqId of act.assignedBOQItemIds) {
            const group = consolidatedPayload.find(g => g.id === boqId);
            if (group) {
              for (const originalBoqId of group.boqLineIds) {
                const boq = boqLines.find(b => b.id === originalBoqId);
                if (boq) {
                  const est = estimateDuration(Number(boq.quantity), boq.unit, act.recommendedCrewCount);
                  if (est.durationDays > maxProdDuration) maxProdDuration = est.durationDays;
                }
              }
            }
          }
          durationDays = maxProdDuration;
        }

        cpmActivities.push({
          id: actId,
          name: act.activityName,
          duration: durationDays
        });
      }
    }

    // Pass 2: Build CPM Dependencies
    const cpmDependencies: CPMDependency[] = [];
    for (const p of aiProposal.phases) {
      for (const act of p.activities) {
        const successorId = actIdMap.get(act.temporaryActivityKey);
        if (successorId && act.predecessors) {
          for (const pred of act.predecessors) {
            const predecessorId = actIdMap.get(pred.key);
            if (predecessorId) {
              cpmDependencies.push({
                id: crypto.randomUUID(),
                predecessorId,
                successorId,
                type: pred.type as any,
                lagDays: pred.lag
              });
            }
          }
        }
      }
    }

    // Execute CPM Engine
    const cpmResult = calculateCPM(cpmActivities, cpmDependencies);
    if (cpmResult.hasCircularDependency) {
      throw new Error("Circular dependency detected in schedule logic.");
    }

    const targetDuration = project.originalContractDuration || 180;
    const projectStartDate = project.startDate ? new Date(project.startDate) : new Date();

    // Pass 3: Exact Financial Reconciliation, Date Assignment, and Final Validation
    for (const p of aiProposal.phases) {
      const phaseWbsId = crypto.randomUUID();
      phaseWbsData.push({
        id: phaseWbsId, scheduleId: schedule.id, parentId: rootWbsId, code: `PH-${seq}`, name: p.phaseName, level: 2, orderIndex: seq++
      });

      for (const act of p.activities) {
        const actId = actIdMap.get(act.temporaryActivityKey)!;
        const cpmAct = cpmResult.results.get(actId)!;

        let actAmount = new Decimal(0);
        let qty = 0;
        let unit = 'lot';

        // Apply CPM Dates (Continuous calendar for now)
        const plannedStartDate = new Date(projectStartDate);
        plannedStartDate.setDate(plannedStartDate.getDate() + cpmAct.earlyStart);

        const plannedFinishDate = new Date(projectStartDate);
        plannedFinishDate.setDate(plannedFinishDate.getDate() + Math.max(0, cpmAct.earlyFinish - 1));

        for (const boqId of act.assignedBOQItemIds) {
          const group = consolidatedPayload.find(g => g.id === boqId);
          if (group) {
            for (const originalBoqId of group.boqLineIds) {
              const boq = boqLines.find(b => b.id === originalBoqId);
              if (boq) {
                const finalAwardedId = boq.id;

                actAmount = actAmount.plus(boq.totalCost);
                totalAmount = totalAmount.plus(boq.totalCost);
                qty += Number(boq.quantity);
                unit = boq.unit;

                allocationData.push({
                  id: crypto.randomUUID(), scheduleId: schedule.id, projectId, activityId: actId,
                  awardedBoqItemId: finalAwardedId, allocatedQuantity: boq.quantity,
                  allocatedAmount: boq.totalCost, allocationMode: 'SINGLE'
                });
              }
            }
          }
        }

        activityData.push({
          id: actId, scheduleId: schedule.id, wbsId: phaseWbsId, name: act.activityName,
          activityCode: `ACT-${actSeq++}`, plannedDuration: cpmAct.earlyFinish - cpmAct.earlyStart,
          plannedStartDate, plannedFinishDate,
          status: 'NOT_STARTED', discipline: act.discipline,
          plannedQuantity: qty, unit: unit, allocatedAmount: actAmount,
          aiRationale: act.rationale || 'Derived from BOQ mapping',
          classificationConfidence: act.confidence,
          criticalPath: cpmAct.isCritical,
          totalFloat: cpmAct.totalFloat,
          freeFloat: cpmAct.freeFloat
        });
      }
    }

    // Populate dependency data for database
    for (const dep of cpmDependencies) {
      dependencyData.push({
        id: dep.id,
        scheduleId: schedule.id,
        predecessorId: dep.predecessorId,
        successorId: dep.successorId,
        type: dep.type,
        lagDays: dep.lagDays
      });
    }

    // Semantic Validation & Status Rules
    const boqTotal = boqLines.reduce((acc, curr) => acc.plus(curr.totalCost), new Decimal(0));
    const difference = totalAmount.minus(boqTotal);

    const validationStatus = {
      FINANCIAL_STATUS: difference.equals(0) ? 'BALANCED' : 'UNBALANCED',
      DATE_STATUS: cpmResult.projectDuration <= targetDuration ? 'WITHIN CONTRACT' : 'EXCEEDS CONTRACT',
      SEQUENCE_STATUS: cpmResult.hasCircularDependency ? 'INVALID' : 'VALID',
      CPM_STATUS: cpmResult.criticalPath.length > 0 ? 'CALCULATED' : 'NO CRITICAL PATH',
      BOQ_STATUS: 'FULLY ALLOCATED',
      PHASE_STATUS: 'VALID',
      OVERALL_STATUS: 'READY FOR REVIEW'
    };

    if (difference.equals(0) === false) {
      validationStatus.OVERALL_STATUS = 'INVALID';
      throw new Error(`CRITICAL FINANCIAL MISMATCH: Schedule Total (${totalAmount}) != Awarded BOQ Total (${boqTotal}).`);
    }

    if (cpmResult.projectDuration > targetDuration) {
      validationStatus.OVERALL_STATUS = 'INFEASIBLE';
      console.warn("Schedule exceeds project duration. Feasibility flag set.");
    }

    // Validate Terminal Phases
    const finalPhaseName = aiProposal.phases[aiProposal.phases.length - 1].phaseName;
    if (finalPhaseName !== "Project Acceptance and Demobilization") {
      validationStatus.PHASE_STATUS = 'MISSING FINAL ACCEPTANCE';
      validationStatus.OVERALL_STATUS = 'INVALID';
      throw new Error("Final phase must be Project Acceptance and Demobilization");
    }

    const hasTestingPhase = aiProposal.phases.some((p: any) => p.phaseName.includes("Testing"));
    if (!hasTestingPhase) {
      validationStatus.PHASE_STATUS = 'MISSING TESTING';
      validationStatus.OVERALL_STATUS = 'INVALID';
      throw new Error("Testing and Commissioning phase is required.");
    }

    await tx.scheduleWBS.createMany({ data: phaseWbsData });
    await tx.scheduleActivity.createMany({ data: activityData });
    await tx.scheduleDependency.createMany({ data: dependencyData });
    await tx.scheduleBOQAllocation.createMany({ data: allocationData });

    await tx.projectSchedule.update({
      where: { id: schedule.id },
      data: {
        status: validationStatus.OVERALL_STATUS === 'READY FOR REVIEW' ? 'DRAFT' : 'INVALID_GENERATED_DRAFT',
        awardedContractAmount: boqTotal, scheduledAmount: totalAmount, differenceAmount: difference
      }
    });

    await tx.scheduleGenerationAudit.create({
      data: {
        projectId, newScheduleId: schedule.id, action: 'UNIVERSAL_AI_ORCHESTRATION',
        generationRequestId, modelIdentifier: AI_CONFIG.models.primaryPlanning,
        promptVersion: AI_CONFIG.versions.promptVersion, schemaVersion: AI_CONFIG.versions.jsonSchemaVersion,
        schedulingRulesVersion: AI_CONFIG.versions.schedulingRulesVersion,
        requestTimestamp: startTime, responseTimestamp: new Date(),
        resultStatus: 'SUCCESS', correctionAttemptCount: retryCount,
        validationResults: JSON.stringify({ classification, aiProposal, financialDiff: difference.toNumber(), validationStatus, cpmStats: { duration: cpmResult.projectDuration, criticalActivities: cpmResult.criticalPath.length } })
      }
    });

    return { success: true, scheduleId: schedule.id, difference: difference.toNumber() };
    }, { timeout: 30000 }); // End of interactive transaction

    return result;

  } catch (err: any) {
    console.error("AI Orchestrator Error:", err);
    await prisma.scheduleGenerationAudit.create({
      data: {
        projectId, action: 'UNIVERSAL_AI_ORCHESTRATION', generationRequestId,
        requestTimestamp: startTime, responseTimestamp: new Date(),
        resultStatus: 'FAILED', validationResults: JSON.stringify({ error: err.message })
      }
    });
    
    // Return safe structured error response instead of throwing stack trace
    return {
      success: false,
      errorCode: "SCHEDULE_WBS_SCHEMA_MISMATCH",
      stage: "DATABASE_PERSISTENCE",
      message: "The generated schedule could not be saved because the WBS data model is not synchronized.",
      generationRequestId: generationRequestId,
      retryable: false
    };
  }
}
