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

    // ==========================================
    // Execute Standard Operations Procedure: Purge Junk Data before simulation
    // ==========================================
    
    // 1. Identify Junk Keywords
    const junkKeywords = ['DIRECT COST OCM (12%) PROFIT', '(2)'];

    for (const keyword of junkKeywords) {
      // Find Junk Activities
      const junkActs = await prisma.scheduleActivity.findMany({
        where: { scheduleId: schedule.id, name: { contains: keyword } }
      });

      if (junkActs.length > 0) {
        const junkActIds = junkActs.map(a => a.id);
        
        // Delete Dependencies
        await prisma.scheduleDependency.deleteMany({
          where: { OR: [{ predecessorId: { in: junkActIds } }, { successorId: { in: junkActIds } }] }
        });

        // Delete BOQ Mappings
        await prisma.scheduleBOQMapping.deleteMany({
          where: { activityId: { in: junkActIds } }
        });

        // Delete Activities
        await prisma.scheduleActivity.deleteMany({
          where: { id: { in: junkActIds } }
        });
      }

      // Delete Junk BOQ Items
      await prisma.awardedBOQItem.deleteMany({
        where: { projectId, description: { contains: keyword } }
      });
    }

    // Re-fetch activities after cleanup to ensure we don't pass deleted ones to AI
    const refreshedSchedule = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: { activities: { orderBy: { activityCode: 'asc' } } }
    });
    
    if (!refreshedSchedule) {
      return NextResponse.json({ error: 'Schedule not found after cleanup' }, { status: 404 });
    }
    // ==========================================

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
    const activities = refreshedSchedule.activities.filter(a => a.activityCode !== 'AI-GEN');
    
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

    // 2. Intelligent AI Phasing based on actual Activities
    const activityPayload = activities.map(a => ({
      id: a.id,
      name: a.name
    }));

const prompt = `You are an expert construction project manager. 
I have a list of project activities and an existing total project duration of ${totalDays} days.
The project starts on ${startDate.toDateString()} and ends on ${targetDate.toDateString()}.
I need to group these activities into highly detailed, logical construction phases and sequence them correctly.
Please do the following:
1. YOU MUST GENERATE EXACTLY 10 highly detailed construction sub-phases based on industry standards (e.g. Pre-construction & Mobilization, Earthworks, Foundation, Superstructure, Roof Framing, Exterior Finishes, MEPF, Interior Partitions, Architectural Finishes, Testing & Handover).
2. For each sub-phase, estimate its percentage of the total project duration (pct, must sum to 1.0).
3. For each sub-phase, provide an ordered array of 'orderedActivityIds' representing the recommended chronological sequence of works within that phase. Every activity provided in the input MUST be assigned to exactly one phase.
4. Carefully analyze and sequence the project phases according to strict industry standard construction workflows.
5. For each sub-phase, assign the relevant Awarded BOQ item IDs from the list provided that correspond to the work in that phase.

CRITICAL RULES:
- EVERY SINGLE Awarded BOQ Material ID provided in the input MUST be assigned to exactly one phase. Do not leave any BOQ item unassigned, or the project financials will not balance.
- The FIRST phase (e.g. PH-1 Mobilization & Site Setup) MUST ONLY contain General Requirements and Preliminaries. This includes activities related to: Mobilization, Demobilization, Quality Standard and Control, Security, Safety and Protection, Site Management Work, Temporary Works, Transportation, and Permits.
- DO NOT put physical construction works, demolition, chipping, restoration, or general "Consumables" into the first phase. They belong in subsequent construction phases.
- Within each phase, the \`orderedActivityIds\` array MUST be strictly ordered chronologically from what starts first to what finishes last.
- For the FIRST phase, true mobilization tasks (like 'Mobilization', 'Site Management', 'Permits', 'Temporary Works') MUST be at the very beginning of the \`orderedActivityIds\` array.

Activities:
${JSON.stringify(activityPayload, null, 2)}

Awarded BOQ Materials:
${JSON.stringify(boqPayload, null, 2)}`;

    const schema = z.object({
      phases: z.array(z.object({
        code: z.string().describe("Unique phase code e.g. PH-1"),
        name: z.string().describe("Phase name"),
        pct: z.number().describe("Percentage of total project duration (0.0 to 1.0)"),
        orderedActivityIds: z.array(z.string()).describe("Chronological sequence of activity IDs to be executed in this phase"),
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

    // Clear previous AI mapping
    txOperations.push(
      prisma.scheduleDependency.deleteMany({
        where: { scheduleId: schedule.id }
      }),
      prisma.scheduleActivity.updateMany({
        where: { scheduleId: schedule.id },
        data: { wbsId: null }
      }),
      prisma.scheduleActivity.deleteMany({
        where: { scheduleId: schedule.id, activityCode: 'AI-GEN' }
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

    // Assign existing activities to the AI phases based on the explicit ordered sequence
    const activityMap = new Map(activities.map(a => [a.id, a]));
    const assignedIds = new Set<string>();

    for (const phase of activePhases) {
      if (phase.orderedActivityIds && Array.isArray(phase.orderedActivityIds)) {
        for (const actId of phase.orderedActivityIds) {
          const act = activityMap.get(actId);
          if (act && !assignedIds.has(actId)) {
            phase.acts.push(act);
            assignedIds.add(actId);
          }
        }
      }
    }

    // Catch any orphaned activities and append them to the final phase
    if (activePhases.length > 0) {
      for (const act of activities) {
        if (!assignedIds.has(act.id)) {
          activePhases[activePhases.length - 1].acts.push(act);
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

      // Create an AI-injected anchor activity for this phase
      const aiAnchorId = `ai_anchor_${phase.wbsId}`;
      activityData.push({
        id: aiAnchorId,
        scheduleId: schedule.id,
        wbsId: phase.wbsId,
        name: `${phase.name} (AI Anchor)`,
        activityCode: 'AI-GEN',
        plannedDuration: phase.days,
        plannedStartDate: mainStart,
        plannedFinishDate: mainFinish,
        status: aiAnchorStatus,
        actualProgressPercent: aiAnchorProgress,
        actualStartDate: aiAnchorActualStart
      });

      // Map AI assigned BOQ items to the AI Anchor Activity
      if (phase.assignedBOQItemIds && Array.isArray(phase.assignedBOQItemIds)) {
        for (const boqId of phase.assignedBOQItemIds) {
          boqMappingData.push({
            activityId: aiAnchorId,
            awardedBoqItemId: boqId,
            mappedQuantity: 1 // Default proportion
          });
        }
      }

      // Link AI Anchor to Previous Phase's AI Anchor (FS)
      if (prevMainActId) {
        dependencyData.push({
          scheduleId: schedule.id,
          predecessorId: prevMainActId,
          successorId: aiAnchorId,
          type: 'FS',
          lagDays: 0
        });
      }

      if (phase.acts.length > 0) {
        const numActs = phase.acts.length;
        const staggerDays = phase.days / numActs;
        // Cap activity duration: cannot exceed phase window
        const duration = Math.max(1, Math.min(Math.floor(phase.days / 2), phase.days));

        for (let i = 0; i < numActs; i++) {
          const act = phase.acts[i];
          const lagFromStart = Math.floor(i * staggerDays);
          
          const actStart = new Date(mainStart);
          actStart.setDate(actStart.getDate() + lagFromStart);
          
          const actFinish = new Date(actStart);
          actFinish.setDate(actFinish.getDate() + duration - 1);
          // Clamp finish to phase end and project target date
          if (actFinish > mainFinish) actFinish.setTime(mainFinish.getTime());
          if (actFinish > targetDate) actFinish.setTime(targetDate.getTime());

          const existingAct = activityMap.get(act.id);
          let actStatus = 'NOT_STARTED';
          let actProgress = 0;
          let actualStart = null;
          
          // Preserve manual overrides if they exist
          if (existingAct && (existingAct.actualProgressPercent > 0 || existingAct.status !== 'NOT_STARTED' || existingAct.actualStartDate)) {
            actStatus = existingAct.status;
            actProgress = existingAct.actualProgressPercent || 0;
            actualStart = existingAct.actualStartDate;
          } else {
            // Auto-commence logic for unstarted activities
            const today = new Date();
            if (actStart <= today) {
              actualStart = actStart;
              const lapsedDays = Math.ceil((today.getTime() - actStart.getTime()) / (1000 * 60 * 60 * 24));
              if (lapsedDays >= duration) {
                actStatus = 'COMPLETED';
                actProgress = 100;
              } else {
                actStatus = 'IN_PROGRESS';
                actProgress = Math.round((lapsedDays / duration) * 100);
              }
            }
          }

          activityUpdates.push({
            id: act.id,
            data: {
              wbsId: phase.wbsId,
              plannedDuration: duration,
              plannedStartDate: actStart,
              plannedFinishDate: actFinish,
              status: actStatus,
              actualProgressPercent: actProgress,
              actualStartDate: actualStart
            }
          });

          if (i === 0) {
            // First activity depends on the Anchor
            dependencyData.push({
              scheduleId: schedule.id,
              predecessorId: aiAnchorId,
              successorId: act.id,
              type: 'SS',
              lagDays: 0
            });
          } else {
            // Subsequent activities depend on the previous one sequentially
            const prevAct = phase.acts[i - 1];
            const incrementalLag = Math.floor(i * staggerDays) - Math.floor((i - 1) * staggerDays);
            
            dependencyData.push({
              scheduleId: schedule.id,
              predecessorId: prevAct.id,
              successorId: act.id,
              type: 'SS',
              lagDays: incrementalLag
            });
          }
        }
      }

      prevMainActId = aiAnchorId;
      currentDate = new Date(mainFinish);
      currentDate.setDate(currentDate.getDate() + 1);
      // Prevent advancing past the project target date
      if (currentDate > targetDate) currentDate.setTime(targetDate.getTime());
    }

    console.log(`Writing ${wbsData.length} WBS, ${activityData.length} Anchor Acts, ${dependencyData.length} Deps, ${activityUpdates.length} Updates`);

    if (wbsData.length > 0) txOperations.push(prisma.scheduleWBS.createMany({ data: wbsData }));
    if (activityData.length > 0) txOperations.push(prisma.scheduleActivity.createMany({ data: activityData }));
    if (dependencyData.length > 0) txOperations.push(prisma.scheduleDependency.createMany({ data: dependencyData }));
    if (boqMappingData.length > 0) txOperations.push(prisma.scheduleBOQMapping.createMany({ data: boqMappingData }));
    
    // Batch all updates into the transaction array instead of sequential interactive tx
    for (const u of activityUpdates) {
      txOperations.push(prisma.scheduleActivity.update({ where: { id: u.id }, data: u.data }));
    }

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
