import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCPM } from '@/lib/cpm-engine';
import { GoogleGenAI, Type, Schema } from '@google/genai';
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

    // Fetch consolidated BOQ items to feed to AI
    const consolidatedItems = await prisma.consolidatedBOQItem.findMany({
      where: { projectId }
    });

    if (consolidatedItems.length === 0) {
       return NextResponse.json({ error: 'No BOQ items found to simulate phasing.' }, { status: 400 });
    }

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

    // 2. Intelligent AI Phasing based on actual Activities
    const activityPayload = activities.map(a => ({
      id: a.id,
      name: a.name
    }));

    const prompt = `You are an expert construction project manager. 
I have a list of project activities and an existing total project duration of ${totalDays} days.
I need to group these activities into logical construction phases and sequence them correctly.
Please do the following:
1. Define 3 to 6 logical construction sub-phases (e.g. Mobilization & Site Setup, Rough-ins, Equipment Installation, Testing). Provide a unique 'code' for each sub-phase (e.g. PH-1).
2. For each sub-phase, estimate its percentage of the total project duration (pct, must sum to 1.0).
3. For each sub-phase, provide an ordered array of 'orderedActivityIds' representing the recommended chronological sequence of works within that phase. Every activity provided in the input MUST be assigned to exactly one phase.

CRITICAL RULES:
- The FIRST phase (e.g. PH-1 Mobilization & Site Setup) MUST ONLY contain General Requirements and Preliminaries. This includes activities related to: Mobilization, Demobilization, Quality Standard and Control, Security, Safety and Protection, Site Management Work, Temporary Works, Transportation, and Permits.
- DO NOT put physical construction works, demolition, chipping, restoration, or general "Consumables" into the first phase. They belong in subsequent construction phases.
- Within each phase, the \`orderedActivityIds\` array MUST be strictly ordered chronologically from what starts first to what finishes last.
- For the FIRST phase, true mobilization tasks (like 'Mobilization', 'Site Management', 'Permits', 'Temporary Works') MUST be at the very beginning of the \`orderedActivityIds\` array.

Activities:
${JSON.stringify(activityPayload, null, 2)}`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        phases: {
          type: Type.ARRAY,
          description: "Logical construction phases",
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: "Unique phase code e.g. PH-1" },
              name: { type: Type.STRING, description: "Phase name" },
              pct: { type: Type.NUMBER, description: "Percentage of total project duration (0.0 to 1.0)" },
              orderedActivityIds: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Chronological sequence of activity IDs to be executed in this phase"
              }
            }
          }
        }
      }
    };

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
    } catch (aiError: any) {
      console.warn("gemini-2.5-flash failed, falling back to gemini-2.0-flash...", aiError.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
    }

    let jsonText = response.text || '{}';
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonText);
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

    // 1. Delete all existing dependencies, WBS nodes, and previous AI-generated activities
    await prisma.scheduleDependency.deleteMany({
      where: { scheduleId: schedule.id }
    });
    // Unlink wbs from activities first so we can delete old WBS nodes safely
    await prisma.scheduleActivity.updateMany({
      where: { scheduleId: schedule.id },
      data: { wbsId: null }
    });
    await prisma.scheduleActivity.deleteMany({
      where: { scheduleId: schedule.id, activityCode: 'AI-GEN' }
    });
    await prisma.scheduleWBS.deleteMany({
      where: { scheduleId: schedule.id }
    });

    const wbsData: any[] = [];
    const activityData: any[] = [];
    const dependencyData: any[] = [];
    const activityUpdates: any[] = [];

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

      let aiAnchorStatus = 'NOT_STARTED';
      let aiAnchorProgress = 0;
      const today = new Date();
      if (mainStart <= today) {
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
        actualProgressPercent: aiAnchorProgress
      });

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
        // Assign a reasonable duration so they overlap and fill the phase
        const duration = Math.max(1, Math.floor(phase.days / 2)); 

        for (let i = 0; i < numActs; i++) {
          const act = phase.acts[i];
          const lagFromStart = Math.floor(i * staggerDays);
          
          const actStart = new Date(mainStart);
          actStart.setDate(actStart.getDate() + lagFromStart);
          
          const actFinish = new Date(actStart);
          actFinish.setDate(actFinish.getDate() + duration - 1);

          let actStatus = 'NOT_STARTED';
          let actProgress = 0;
          const today = new Date();
          if (actStart <= today) {
            const lapsedDays = Math.ceil((today.getTime() - actStart.getTime()) / (1000 * 60 * 60 * 24));
            if (lapsedDays >= duration) {
              actStatus = 'COMPLETED';
              actProgress = 100;
            } else {
              actStatus = 'IN_PROGRESS';
              actProgress = Math.round((lapsedDays / duration) * 100);
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
              actualProgressPercent: actProgress
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
    }

    console.log(`Writing ${wbsData.length} WBS, ${activityData.length} Anchor Acts, ${dependencyData.length} Deps, ${activityUpdates.length} Updates`);

    if (wbsData.length > 0) await prisma.scheduleWBS.createMany({ data: wbsData });
    if (activityData.length > 0) await prisma.scheduleActivity.createMany({ data: activityData });
    if (dependencyData.length > 0) await prisma.scheduleDependency.createMany({ data: dependencyData });
    
    // Sequential updates to avoid Prisma connection pool exhaustion and Neon connection dropping
    for (const u of activityUpdates) {
      await prisma.scheduleActivity.update({ where: { id: u.id }, data: u.data });
    }

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
    }

    return NextResponse.json({ success: true, message: `Schedule successfully simulated with AI phasing across ${totalDays} days.` });
  } catch (error: any) {
    console.error('Error in simulation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
