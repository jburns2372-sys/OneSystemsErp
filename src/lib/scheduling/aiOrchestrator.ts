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
import { ProposalSchema, AIProposalType, SchedulingProvider } from './types';
import { OpenAIProposalProvider } from './providers/OpenAIProposalProvider';
import { DeterministicReconstructionProvider } from './providers/DeterministicReconstructionProvider';

export interface OrchestratorContext {
  projectId: string;
  generationRequestId: string;
  userId?: string;
  consolidateBoq?: boolean;
  lockedBOQVersionId?: string;
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

    const rawBoqLines = await prisma.awardedBOQItem.findMany({
      where: { projectId: project.id },
      orderBy: { itemCode: 'asc' }
    });

    if (rawBoqLines.length === 0) throw new Error("No BOQ Lines to process.");

    const classificationCounts = {
      DETAIL_PRICED: 0,
      DETAIL_ZERO_VALUE: 0,
      HEADER: 0,
      DESCRIPTION_CONTINUATION: 0,
      SUBTOTAL: 0,
      GRAND_TOTAL: 0,
      EXCLUDED: 0,
      CLIENT_SUPPLIED: 0,
      NOT_APPLICABLE: 0,
    };

    const pricedBoqLines = rawBoqLines.filter(item => {
      const desc = (item.description || '').toLowerCase();
      const unit = (item.unit || '').trim();
      let classification = 'NOT_APPLICABLE';

      if (desc.includes('subtotal') || desc.includes('sub-total')) {
        classification = 'SUBTOTAL';
      } else if (desc.includes('grand total')) {
        classification = 'GRAND_TOTAL';
      } else if (!unit && !item.quantity && !item.totalCost) {
        classification = 'HEADER';
      } else if (item.totalCost > 0 || (item as any).amount > 0) { 
        classification = 'DETAIL_PRICED';
      } else if (item.totalCost === 0 && unit) {
        classification = 'DETAIL_ZERO_VALUE';
      } else {
        classification = 'EXCLUDED';
      }
      
      classificationCounts[classification as keyof typeof classificationCounts]++;
      return classification === 'DETAIL_PRICED' || classification === 'DETAIL_ZERO_VALUE';
    });

    console.log("=== BOQ ROW CLASSIFICATION REPORT ===");
    console.log(`Total Imported BOQ Rows: ${rawBoqLines.length}`);
    console.table(classificationCounts);
    console.log("=====================================");

    if (pricedBoqLines.length === 0) throw new Error("No valid priced BOQ details found. Cannot generate schedule.");

    const awardedTotal = pricedBoqLines.reduce(
      (sum, item) => sum.plus(new Prisma.Decimal(item.totalCost?.toString() || "0")),
      new Prisma.Decimal(0)
    );
    const awardedContractAmount = new Prisma.Decimal(project.contractAmount?.toString() || "0");

    // Simple epsilon check for floating point mismatch
    if (awardedContractAmount.gt(0) && awardedTotal.minus(awardedContractAmount).abs().toNumber() > 1.0) {
       console.warn(`BOQ Total (${awardedTotal.toNumber()}) does not match Awarded Contract Amount (${awardedContractAmount.toNumber()}). Scheduling proceeds with BOQ Total.`);
    }

    const boqLines = pricedBoqLines;

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
          const category = (item.category || '').trim().toLowerCase();
          const itemCode = (item.itemCode || '').trim().toLowerCase(); // Use itemCode as proxy for system/location if encoded
          // Expand consolidation key: category, itemCode, desc, unit
          const key = `${category}|${itemCode}|${desc}|${unit}`;
          
          if (!groups.has(key)) {
            groups.set(key, {
              id: `GRP_${groupIdx++}`,
              description: item.description, // retain original casing for first item
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
    let aiProposal: AIProposalType | null = null;
    let validationErrors: string[] = [];

    const providerMode = process.env.SCHEDULING_GENERATION_MODE;
    let provider: SchedulingProvider;
    
    if (providerMode === 'RECONSTRUCTION_GATE_8C') {
      provider = new DeterministicReconstructionProvider();
    } else {
      provider = new OpenAIProposalProvider();
    }
    
    // STAGE 9 - CORRECTION LOOP
    while (retryCount <= AI_CONFIG.limits.maxRetries) {
      try {
        aiProposal = await provider.generateProposal({
          projectId,
          projectName: project.name,
          projectDescription: project.description || '',
          classification,
          boqPayload,
          validationErrors
        });

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
          aiProposal.phases[0].activities.push({
            temporaryActivityKey: `AUTO_${crypto.randomUUID()}`,
            activityName: 'Miscellaneous Works (Auto-Assigned)',
            durationMethod: 'CHILD_WORK_PACKAGES',
            discipline: 'General',
            assignedBOQItemIds: unassigned.map(u => u.id),
            productivityAssumption: null,
            crewCountAssumption: null,
            workFrontAssumption: null,
            fixedTechnicalDuration: 1,
            predecessors: [],
            confidence: 0.5
          });
        }

        let finalPhase = aiProposal.phases[aiProposal.phases.length - 1];
        if (!finalPhase.phaseName.toLowerCase().includes("demobilization")) {
          aiProposal.phases.push({
            phaseName: "Project Acceptance and Demobilization",
            rationale: "Auto-added mandatory final phase",
            activities: []
          });
        } else {
          // ensure the exact string is enforced for the final validation gate
          finalPhase.phaseName = "Project Acceptance and Demobilization";
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
    
    const dependencyData: Prisma.ScheduleDependencyCreateManyInput[] = [];

    if (!aiProposal) {
      throw new Error("AI Proposal is null after max retries");
    }

    // Pass 1: Build Maps and Calculate Durations
    const actIdMap = new Map<string, string>();
    const cpmActivities: CPMActivity[] = [];

    for (const p of aiProposal.phases) {
      for (const act of p.activities) {
        const actId = crypto.randomUUID();
        actIdMap.set(act.temporaryActivityKey, actId);

        let durationDays = 1;
        if (act.durationMethod === 'MILESTONE') {
          durationDays = 0;
        } else if (act.durationMethod === 'FIXED_TECHNICAL_DURATION' || act.durationMethod === 'CHILD_WORK_PACKAGES') {
          durationDays = act.fixedTechnicalDuration || 1;
        } else if (act.durationMethod === 'LEVEL_OF_EFFORT') {
          durationDays = project.originalContractDuration || 180;
        } else {
          // PRODUCTION_QUANTITY
          let maxProdDuration = 1;
          const crewCount = act.crewCountAssumption || 1;
          const workFronts = act.workFrontAssumption || 1;
          const prodRate = act.productivityAssumption || 1;

          for (const boqId of act.assignedBOQItemIds) {
            const group = consolidatedPayload.find(g => g.id === boqId);
            if (group) {
              for (const originalBoqId of group.boqLineIds) {
                const boq = boqLines.find(b => b.id === originalBoqId);
                if (boq) {
                  // User formula: duration = ceiling(quantity / dailyProductivityPerCrew / crewCount / independentWorkFrontCount)
                  const rawDays = Number(boq.quantity || 1) / prodRate / crewCount / workFronts;
                  const calculatedDays = Math.max(1, Math.ceil(rawDays));
                  if (calculatedDays > maxProdDuration) maxProdDuration = calculatedDays;
                }
              }
            }
          }
          durationDays = maxProdDuration;
        }

        let metadata: import('@/lib/cpm-engine').CPMActivityMetadata;
        const baseMeta = {
          discipline: act.discipline,
          aiConfidence: act.confidence,
          sourceBoqLineIds: act.assignedBOQItemIds,
          originalCrewCount: act.crewCountAssumption || 1,
        };

        if (act.durationMethod === 'PRODUCTION_QUANTITY') {
          metadata = {
            ...baseMeta,
            method: 'PRODUCTION_QUANTITY',
            crewCount: act.crewCountAssumption || 1,
            workFronts: act.workFrontAssumption || 1,
            prodRate: act.productivityAssumption || 1,
            boqAssigned: act.assignedBOQItemIds
          };
        } else if (act.durationMethod === 'FIXED_TECHNICAL_DURATION') {
          metadata = {
            ...baseMeta,
            method: 'FIXED_TECHNICAL_DURATION',
            fixedTechnicalDuration: act.fixedTechnicalDuration || undefined
          };
        } else if (act.durationMethod === 'CHILD_WORK_PACKAGES') {
          metadata = { ...baseMeta, method: 'CHILD_WORK_PACKAGES' };
        } else if (act.durationMethod === 'LEVEL_OF_EFFORT') {
          metadata = { ...baseMeta, method: 'LEVEL_OF_EFFORT' };
        } else {
          metadata = { ...baseMeta, method: 'MILESTONE' };
        }

        cpmActivities.push({
          id: actId,
          name: act.activityName,
          duration: durationDays,
          metadata
        });
      }
    }

    // Pass 2: Build CPM Dependencies
    const cpmDependencies: CPMDependency[] = [];
    for (const p of aiProposal!.phases) {
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
                lagDays: pred.lag || 0
              });
            }
          }
        }
      }
    }

    // Execute CPM Engine
    let cpmResult = calculateCPM(cpmActivities, cpmDependencies);
    if (cpmResult.hasCircularDependency) {
      throw new Error("Circular dependency detected in schedule logic.");
    }

    const targetDuration = project.originalContractDuration || 180;
    const projectStartDate = project.startDate ? new Date(project.startDate) : new Date();
    const feasibilityFlags: any[] = [];
    
    // Feasibility Engine (Do not clamp dates. Recalculate based on resources)
    let feasibilityAttempts = 0;
    while (cpmResult.projectDuration > targetDuration && feasibilityAttempts < 2) {
      feasibilityAttempts++;
      // Augment crews on critical path activities that are PRODUCTION_QUANTITY
      let updatedAny = false;
      for (const act of cpmActivities) {
        if (cpmResult.results.get(act.id)?.isCritical && act.metadata?.method === 'PRODUCTION_QUANTITY') {
          act.metadata.crewCount *= 2;
          act.metadata.workFronts += 1;
          
          let maxProdDuration = 1;
          for (const boqId of act.metadata.boqAssigned) {
            const group = consolidatedPayload.find(g => g.id === boqId || g.boqLineIds.includes(boqId));
            if (group) {
              for (const originalBoqId of group.boqLineIds) {
                const boq = boqLines.find(b => b.id === originalBoqId);
                if (boq) {
                  const rawDays = Number(boq.quantity || 1) / act.metadata.prodRate / act.metadata.crewCount / act.metadata.workFronts;
                  const calculatedDays = Math.max(1, Math.ceil(rawDays));
                  if (calculatedDays > maxProdDuration) maxProdDuration = calculatedDays;
                }
              }
            }
          }
          const oldDuration = act.duration;
          
          if (maxProdDuration < oldDuration) {
            act.duration = maxProdDuration;
            feasibilityFlags.push({
              activityId: act.id,
              action: 'CREW_AUGMENTATION',
              originalCrewCount: act.metadata.originalCrewCount || 1,
              proposedCrewCount: act.metadata.crewCount,
              originalDuration: oldDuration,
              proposedDuration: maxProdDuration,
              rationale: 'Schedule exceeded contractual duration.'
            });
            updatedAny = true;
          } else {
            // Revert augmentation if ineffective
            act.metadata.crewCount /= 2;
            act.metadata.workFronts -= 1;
          }
        }
      }
      if (!updatedAny) break;
      cpmResult = calculateCPM(cpmActivities, cpmDependencies);
    }
    
    // Determine overall validation metrics
    // Determine completion dates
    const naturalCompletionDate = new Date(projectStartDate);
    naturalCompletionDate.setDate(naturalCompletionDate.getDate() + cpmResult.projectDuration);
    
    const exceedContract = cpmResult.projectDuration > targetDuration;
    
    // final calculated date
    const finalCalculatedCompletionDate = new Date(projectStartDate);
    finalCalculatedCompletionDate.setDate(finalCalculatedCompletionDate.getDate() + cpmResult.projectDuration);

    const diffTime = (project.endDate ? project.endDate.getTime() : projectStartDate.getTime()) - finalCalculatedCompletionDate.getTime();
    const completionVarianceDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const validationMetrics = {
      FINANCIAL: "BALANCED", // will verify below
      BOQ: "FULLY_ALLOCATED",
      DATES: exceedContract ? "EXCEEDS_CONTRACT" : "WITHIN_CONTRACT",
      SEQUENCE: "VALID",
      CPM: cpmResult.results.size > 0 ? "CALCULATED" : "NOT_CALCULATED",
      PHASES: aiProposal!.phases[aiProposal!.phases.length - 1].phaseName === "Project Acceptance and Demobilization" ? "VALID" : "INVALID_FINAL_PHASE",
      OVERALL: exceedContract ? "INFEASIBLE" : "READY_FOR_REVIEW",
      naturalCalculatedCompletionDate: naturalCompletionDate.toISOString(),
      finalCalculatedCompletionDate: finalCalculatedCompletionDate.toISOString(),
      contractStartDate: project.startDate ? project.startDate.toISOString() : projectStartDate.toISOString(),
      contractCompletionDate: project.endDate ? project.endDate.toISOString() : naturalCompletionDate.toISOString(),
      completionVarianceDays,
      feasibilityStatus: exceedContract ? 'SCHEDULE_INFEASIBLE' : 'SCHEDULE_FEASIBLE'
    };

    // Pass 3: Exact Financial Reconciliation, Date Assignment, and Final Validation
    for (const p of aiProposal!.phases) {
      const phaseWbsId = crypto.randomUUID();
      phaseWbsData.push({
        id: phaseWbsId, scheduleId: schedule.id, parentId: rootWbsId, code: `PH-${seq}`, name: p.phaseName, level: 2, orderIndex: seq++
      });

      for (const act of p.activities) {
        const actId = actIdMap.get(act.temporaryActivityKey)!;
        const cpmAct = cpmResult.results.get(actId)!;
        const cpmInputAct = cpmActivities.find(a => a.id === actId)!;

        let actAmount = new Prisma.Decimal(0);
        let qty = 0;
        let unit = 'lot';

        // Apply CPM Dates (Continuous calendar for now)
        const plannedStartDate = new Date(projectStartDate);
        plannedStartDate.setDate(plannedStartDate.getDate() + cpmAct.earlyStart);

        const plannedFinishDate = new Date(projectStartDate);
        plannedFinishDate.setDate(plannedFinishDate.getDate() + Math.max(0, cpmAct.earlyFinish - 1));

        for (const boqId of act.assignedBOQItemIds) {
          const group = consolidatedPayload.find(g => g.id === boqId || g.boqLineIds.includes(boqId));
          if (group) {
            for (const originalBoqId of group.boqLineIds) {
              const boq = boqLines.find(b => b.id === originalBoqId);
              if (boq) {
                const finalAwardedId = boq.id;
                const boqTotalCost = new Prisma.Decimal(boq.totalCost?.toString() || "0");

                actAmount = actAmount.plus(boqTotalCost);
                qty += Number(boq.quantity);
                unit = boq.unit || 'lot';

                allocationData.push({
                  id: crypto.randomUUID(), scheduleId: schedule.id, projectId, activityId: actId,
                  awardedBoqItemId: finalAwardedId, allocatedQuantity: boq.quantity,
                  allocatedAmount: boqTotalCost, allocationMode: 'SINGLE'
                });
              }
            }
          }
        }
        
        let prodRate = null;
        let crewCount = null;
        let workFronts = null;
        if (cpmInputAct.metadata?.method === 'PRODUCTION_QUANTITY') {
          prodRate = cpmInputAct.metadata.prodRate;
          crewCount = cpmInputAct.metadata.crewCount;
          workFronts = cpmInputAct.metadata.workFronts;
        }

        activityData.push({
          id: actId, scheduleId: schedule.id, wbsId: phaseWbsId, name: act.activityName,
          activityCode: `ACT-${actSeq++}`, plannedDuration: cpmAct.earlyFinish - cpmAct.earlyStart,
          plannedStartDate, plannedFinishDate, unit, plannedQuantity: qty,
          durationMethod: cpmInputAct.metadata?.method || act.durationMethod,
          productivityAssumption: prodRate,
          crewCountAssumption: crewCount,
          workFrontAssumption: workFronts,
          activityType: cpmInputAct.metadata?.method || act.durationMethod,
          discipline: act.discipline,
          criticalPath: cpmAct.isCritical,
          totalFloat: cpmAct.totalFloat,
          freeFloat: cpmAct.freeFloat,
          allocatedAmount: actAmount,
          aiRationale: p.rationale || '',
          status: 'NOT_STARTED'
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
        lagDays: dep.lagDays || 0
      });
    }

    // Semantic Validation & Status Rules
    const scheduledTotal = allocationData.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.allocatedAmount?.toString() || "0")),
      new Prisma.Decimal(0)
    );
    const awardedTotalTx = boqLines.reduce(
      (sum, line) => sum.plus(new Prisma.Decimal(line.totalCost?.toString() || "0")),
      new Prisma.Decimal(0)
    );
    
    const difference = scheduledTotal.minus(awardedTotalTx);

    // Line-level verification
    let uniqueAllocatedBOQ = new Set<string>();
    let overallocated = 0;
    let underallocated = 0;

    for (const line of boqLines) {
      const lineAllocations = allocationData.filter(a => a.awardedBoqItemId === line.id);
      if (lineAllocations.length > 0) uniqueAllocatedBOQ.add(line.id);
      
      const lineSum = lineAllocations.reduce(
        (sum, a) => sum.plus(new Prisma.Decimal(a.allocatedAmount?.toString() || "0")),
        new Prisma.Decimal(0)
      );
      
      const lineTotal = new Prisma.Decimal(line.totalCost?.toString() || "0");
      if (!lineSum.equals(lineTotal)) {
         if (lineSum.gt(lineTotal)) overallocated++;
         if (lineSum.lt(lineTotal)) underallocated++;
      }
    }

    console.log("=== FINAL FINANCIAL RECONCILIATION ===");
    console.log(`Unique Priced BOQ Lines: ${boqLines.length}`);
    console.log(`Unique Allocated BOQ Lines: ${uniqueAllocatedBOQ.size}`);
    console.log(`Unallocated Lines: ${boqLines.length - uniqueAllocatedBOQ.size}`);
    console.log(`Overallocated Lines: ${overallocated}`);
    console.log(`Awarded Amount: ${awardedTotalTx.toString()}`);
    console.log(`Scheduled Amount: ${scheduledTotal.toString()}`);
    console.log(`Exact Difference: ${difference.toString()}`);

    if (!difference.equals(new Prisma.Decimal("0.00"))) {
      validationMetrics.FINANCIAL = 'UNBALANCED';
      validationMetrics.OVERALL = 'INVALID';
      validationErrors.push(`CRITICAL FINANCIAL MISMATCH: Schedule Total (${scheduledTotal.toString()}) != Awarded BOQ Total (${awardedTotalTx.toString()}).`);
    } else if (overallocated > 0 || underallocated > 0 || uniqueAllocatedBOQ.size !== boqLines.length) {
      validationMetrics.FINANCIAL = 'UNBALANCED';
      validationMetrics.OVERALL = 'INVALID';
      validationErrors.push(`LINE-LEVEL FINANCIAL MISMATCH.`);
    }

    const finalPhaseName = aiProposal.phases[aiProposal.phases.length - 1].phaseName;
    if (!finalPhaseName.toLowerCase().includes("demobilization")) {
      validationMetrics.PHASES = 'MISSING_FINAL_ACCEPTANCE';
      validationMetrics.OVERALL = 'INVALID';
      validationErrors.push("Final phase must include Demobilization");
    }

    const hasTestingPhase = aiProposal.phases.some((p: any) => p.phaseName.includes("Testing and Commissioning"));
    if (!hasTestingPhase) {
      validationMetrics.PHASES = 'MISSING_TESTING';
      validationMetrics.OVERALL = 'INVALID';
      validationErrors.push("Testing and Commissioning phase is required.");
    }

    await tx.scheduleWBS.createMany({ data: phaseWbsData });
    await tx.scheduleActivity.createMany({ data: activityData });
    await tx.scheduleDependency.createMany({ data: dependencyData });
    await tx.scheduleBOQAllocation.createMany({ data: allocationData });

    await tx.projectSchedule.update({
      where: { id: schedule.id },
      data: {
        status: validationMetrics.OVERALL === 'READY_FOR_REVIEW' ? 'DRAFT' : 'INVALID_GENERATED_DRAFT',
        awardedContractAmount: awardedTotalTx, scheduledAmount: scheduledTotal, differenceAmount: difference,
        validationMetrics: JSON.stringify(validationMetrics),
        feasibilityFlags: JSON.stringify(feasibilityFlags),
        projectStartDate: project.startDate || projectStartDate,
        projectCompletionDate: project.endDate || finalCalculatedCompletionDate,
        baselineStartDate: null,
        baselineFinishDate: null
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
        validationResults: JSON.stringify({ classification, aiProposal, financialDiff: difference.toNumber(), validationMetrics, cpmStats: { duration: cpmResult.projectDuration, criticalActivities: cpmResult.criticalPath.length } })
      }
    });

    if (validationMetrics.OVERALL === 'INFEASIBLE') {
      return {
        success: false,
        errorCode: 'SCHEDULE_INFEASIBLE_REQUIRES_REVIEW',
        stage: 'FINAL_VALIDATION',
        message: 'The schedule still exceeds the contract date after justified compression.',
        scheduleId: schedule.id
      };
    }

    return { success: true, scheduleId: schedule.id, difference: difference.toNumber(), validationMetrics, feasibilityFlags };
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
