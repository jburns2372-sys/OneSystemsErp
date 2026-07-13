import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCPM } from '@/lib/cpm-engine';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import * as crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: {
        project: true,
        activities: {
          orderBy: { activityCode: 'asc' }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (schedule.activities.length === 0) {
      return NextResponse.json({ error: 'No activities to simulate.' }, { status: 400 });
    }

    // We no longer purge any data to ensure 100% financial balancing with the Awarded BOQ.

    // Fetch awarded BOQ items to feed to AI for mapping
    const awardedItems = await prisma.awardedBOQItem.findMany({
      where: { 
        projectId,
        totalCost: { gt: 0 } 
      }
    });

    if (awardedItems.length === 0) {
       return NextResponse.json({ error: 'No Awarded BOQ items found to simulate phasing.' }, { status: 400 });
    }

    const boqPayload = awardedItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit
    }));

    // Filter out previous AI-generated activities
    const activities = schedule.activities.filter(a => a.activityCode !== 'AI-GEN');
    
    // Fallbacks
    let startDate = new Date('2026-06-12T00:00:00.000Z');
    let targetDate = new Date('2026-12-08T00:00:00.000Z');

    if (schedule.project.startDate) {
      startDate = new Date(schedule.project.startDate);
    }
    
    if (schedule.project.originalCompletionDate) {
      targetDate = new Date(schedule.project.originalCompletionDate);
    } else if (schedule.project.endDate) {
      targetDate = new Date(schedule.project.endDate);
    }

    // Calculate dynamic total days
    const diffTime = Math.abs(targetDate.getTime() - startDate.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 2. Intelligent AI Phasing based on Awarded BOQ Materials
    // We no longer feed template activities to the AI, we generate activities directly from the BOQ.

const prompt = `You are an expert construction project manager. 
I have a list of Awarded BOQ Materials and an existing total project duration of ${totalDays} days.
The project starts on ${startDate.toDateString()} and ends on ${targetDate.toDateString()}.
I need to group these BOQ materials into highly detailed, logical construction phases.
Please do the following:
1. YOU MUST GENERATE EXACTLY 10 highly detailed construction sub-phases based on industry standards (e.g. Pre-construction & Mobilization, Earthworks, Foundation, Superstructure, Roof Framing, Exterior Finishes, MEPF, Interior Partitions, Architectural Finishes, Testing & Handover).
2. For each sub-phase, estimate its percentage of the total project duration (pct, must sum to 1.0).
3. For each sub-phase, assign the relevant Awarded BOQ item IDs from the list provided that correspond to the work in that phase.
4. Carefully analyze and sequence the project phases according to strict industry standard construction workflows.

CRITICAL RULES:
- EVERY SINGLE Awarded BOQ Material ID provided in the input MUST be assigned to exactly one phase. Do not leave any BOQ item unassigned, or the project financials will not balance.
- The FIRST phase MUST ONLY contain General Requirements and Preliminaries. This includes activities related to: Mobilization, Warehouse, Off Site Barracks, Site Management, Temporary Works, Permits, OCM, Profit, and Tax.
- DO NOT put physical construction works, demolition, chipping, restoration, or general "Consumables" into the first phase. They belong in subsequent construction phases.
- The TENTH (last) phase MUST ALWAYS be named "Phase 10: Project Acceptance and Demobilization".

Awarded BOQ Materials:
${JSON.stringify(boqPayload, null, 2)}`;

    const schema = z.object({
      phases: z.array(z.object({
        code: z.string().describe("Must strictly follow the format: Phase 1, Phase 2, etc."),
        name: z.string().describe("Phase name (Phase 10 MUST be 'Project Acceptance and Demobilization')"),
        pct: z.number().describe("Percentage of total project duration (0.0 to 1.0)"),
        assignedBOQItemIds: z.array(z.string()).describe("Array of Awarded BOQ item IDs mapped to this phase")
      })).length(10).describe("Exactly 10 logical construction phases")
    });

    let result;
    try {
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: schema,
        prompt: prompt,
      });
      result = object;
    } catch (aiError: any) {
      console.error("OpenAI schedule simulation failed", aiError);
      throw new Error('Failed to simulate schedule: ' + aiError.message);
    }

    const phases = result.phases || [];
    console.log("SIMULATION PHASES:", JSON.stringify(phases));

    if (phases.length === 0) {
      throw new Error("AI failed to generate phases.");
    }

    // Normalize percentages just in case
    let totalPct = phases.reduce((sum: number, p: any) => sum + (p.pct || 0), 0);
    if (totalPct === 0) {
      phases.forEach((p: any) => p.pct = 1 / phases.length);
      totalPct = 1;
    }

    // Prepare the transaction array
    const txOperations = [];

    // Clear previous AI mapping and ALL existing template activities
    txOperations.push(
      prisma.scheduleDependency.deleteMany({
        where: { scheduleId: schedule.id }
      }),
      prisma.scheduleBOQMapping.deleteMany({
        where: { activity: { scheduleId: schedule.id } }
      }),
      prisma.scheduleActivity.deleteMany({
        where: { scheduleId: schedule.id }
      }),
      prisma.scheduleWBS.deleteMany({
        where: { scheduleId: schedule.id }
      })
    );

    const wbsData: any[] = [];
    const activityData: any[] = [];
    const dependencyData: any[] = [];
    const activityUpdates: any[] = [];
    const boqMappingData: any[] = [];

    // Create root Construction Phase
    const constructionWbsId = crypto.randomUUID();
    wbsData.push({
      id: constructionWbsId,
      scheduleId: schedule.id,
      code: 'CONST',
      name: 'Construction Phase',
      level: 1,
      orderIndex: 1
    });

    let daysAllocated = 0;
    const activePhases: any[] = [];

    // Bucket activities into the new AI-generated phases
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      p.acts = [];
      p.wbsId = crypto.randomUUID();
      
      if (i === phases.length - 1) {
        p.days = totalDays - daysAllocated;
      } else {
        const normalizedPct = p.pct / totalPct;
        p.days = Math.max(1, Math.round(totalDays * normalizedPct));
        daysAllocated += p.days;
      }

      const wbsPayload = {
        id: p.wbsId,
        scheduleId: schedule.id,
        parentId: constructionWbsId,
        code: p.code || 'UNKNOWN',
        name: p.name || 'Unnamed Phase',
        level: 2,
        orderIndex: i + 1
      };
      console.log("CREATING WBS:", wbsPayload);
      wbsData.push(wbsPayload);
      activePhases.push(p);
    }

    // Catch any orphaned BOQ items and append them to the final phase
    const assignedBoqIds = new Set<string>();
    for (const phase of activePhases) {
      if (phase.assignedBOQItemIds && Array.isArray(phase.assignedBOQItemIds)) {
        for (const boqId of phase.assignedBOQItemIds) {
          assignedBoqIds.add(boqId);
        }
      } else {
        phase.assignedBOQItemIds = [];
      }
    }
    
    if (activePhases.length > 0) {
      for (const boq of awardedItems) {
        if (!assignedBoqIds.has(boq.id)) {
          activePhases[activePhases.length - 1].assignedBOQItemIds.push(boq.id);
        }
      }
    }

    let currentDate = new Date(startDate);
    let prevMainActId: string | null = null;

    // Construct sequential phases and parallel sub-tasks
    for (const phase of activePhases) {
      if (!phase.days || phase.days <= 0) phase.days = 1;

      const mainStart = new Date(currentDate);
      const mainFinish = new Date(currentDate);
      mainFinish.setDate(mainFinish.getDate() + phase.days - 1);
      // Clamp phase finish to project target date
      if (mainFinish > targetDate) mainFinish.setTime(targetDate.getTime());

      let aiAnchorStatus = 'NOT_STARTED';
      let aiAnchorProgress = 0;
      let aiAnchorActualStart = null;
      const today = new Date();
      if (mainStart <= today) {
        aiAnchorActualStart = mainStart;
        const lapsedDays = Math.ceil((today.getTime() - mainStart.getTime()) / (1000 * 60 * 60 * 24));
        if (lapsedDays >= phase.days) {
          aiAnchorStatus = 'COMPLETED';
          aiAnchorProgress = 100;
        } else {
          aiAnchorStatus = 'IN_PROGRESS';
          aiAnchorProgress = Math.round((lapsedDays / phase.days) * 100);
        }
      }

      // Create Schedule Activities dynamically from assigned BOQ items
      let actOrder = 1;
      let prevActIdInPhase: string | null = null;
      
      if (phase.assignedBOQItemIds && Array.isArray(phase.assignedBOQItemIds)) {
        for (const boqId of phase.assignedBOQItemIds) {
          const boqItem = awardedItems.find(b => b.id === boqId);
          if (boqItem) {
            const actId = crypto.randomUUID();
            activityData.push({
              id: actId,
              scheduleId: schedule.id,
              wbsId: phase.wbsId,
              name: boqItem.description,
              activityCode: `BOQ-${actOrder}`,
              plannedDuration: phase.days,
              plannedStartDate: mainStart,
              plannedFinishDate: mainFinish,
              status: aiAnchorStatus,
              actualProgressPercent: aiAnchorProgress,
              actualStartDate: aiAnchorActualStart,
              plannedQuantity: boqItem.quantity,
              unit: boqItem.unit
            });

            boqMappingData.push({
              activityId: actId,
              awardedBoqItemId: boqId,
              mappedQuantity: boqItem.quantity || 1
            });
            
            // Link activities within the phase (Finish-to-Start)
            if (prevActIdInPhase) {
               dependencyData.push({
                 scheduleId: schedule.id,
                 predecessorId: prevActIdInPhase,
                 successorId: actId,
                 type: 'FS',
                 lagDays: 0
               });
            }
            prevActIdInPhase = actId;
            actOrder++;
          }
        }
      }

      // Link the first activity of this phase to the last activity of the previous phase
      if (prevMainActId && phase.assignedBOQItemIds.length > 0) {
        const firstActOfPhase = activityData.find(a => a.wbsId === phase.wbsId && a.activityCode === 'BOQ-1');
        if (firstActOfPhase) {
          dependencyData.push({
            scheduleId: schedule.id,
            predecessorId: prevMainActId,
            successorId: firstActOfPhase.id,
            type: 'FS',
            lagDays: 0
          });
        }
      }
      
      if (prevActIdInPhase) {
         prevMainActId = prevActIdInPhase;
      }
      
      currentDate = new Date(mainFinish);
      currentDate.setDate(currentDate.getDate() + 1);
      // Prevent advancing past the project target date
      if (currentDate > targetDate) currentDate.setTime(targetDate.getTime());
    }

    console.log(`Writing ${wbsData.length} WBS, ${activityData.length} Acts, ${dependencyData.length} Deps`);

    if (wbsData.length > 0) txOperations.push(prisma.scheduleWBS.createMany({ data: wbsData }));
    if (activityData.length > 0) txOperations.push(prisma.scheduleActivity.createMany({ data: activityData }));
    if (dependencyData.length > 0) txOperations.push(prisma.scheduleDependency.createMany({ data: dependencyData }));
    if (boqMappingData.length > 0) txOperations.push(prisma.scheduleBOQMapping.createMany({ data: boqMappingData }));

    await prisma.$transaction(txOperations);

    // 4. Run CPM to update Float and Critical Path dynamically
    const updatedSchedule = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: { activities: true, dependencies: true }
    });

    if (updatedSchedule) {
      const cpmActivities = updatedSchedule.activities.map(a => ({
        ...a,
        duration: a.plannedDuration
      }));
      await calculateCPM(cpmActivities as any, updatedSchedule.dependencies as any);

      // Update schedule status to BASELINE
      await prisma.projectSchedule.update({
        where: { id: schedule.id },
        data: { status: 'BASELINE' }
      });

      // Automatically start the project
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ACTIVE' }
      });
    }

    return NextResponse.json({ success: true, message: `Schedule successfully simulated with AI phasing across ${totalDays} days.` });
  } catch (error: any) {
    console.error('Error in simulation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
