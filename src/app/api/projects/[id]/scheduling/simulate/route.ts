import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCPM } from '@/lib/cpm-engine';
import { GoogleGenAI, Type, Schema } from '@google/genai';

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

    // Refresh activities list after deleting AI ones
    const scheduleFresh = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: { activities: true }
    });
    const activities = scheduleFresh?.activities || [];
    
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

    // 2. Intelligent AI Phasing based on BOQ Consolidation
    const payload = consolidatedItems.map(item => ({
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit
    }));

    const prompt = `You are an expert construction project manager. 
I have a list of BOQ (Bill of Quantities) items and an existing total project duration of ${totalDays} days.
I need to group the project's activities into logical construction phases based on the BOQ items provided.
Please do the following:
1. Define 3 to 6 logical construction sub-phases (e.g. Mobilization, Rough-ins, Equipment Installation, Testing). Provide a unique 'code' for each sub-phase (e.g. PH-1).
2. For each sub-phase, estimate its percentage of the total project duration (pct, must sum to 1.0).
3. Provide an array of distinct 'keywords' for each sub-phase that I can use to automatically match and assign the existing schedule activities to this sub-phase.

BOQ Items:
${JSON.stringify(payload, null, 2)}`;

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
              keywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of keywords to match existing activities to this phase"
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

    const result = JSON.parse(response.text || '{}');
    const phases = result.phases || [];

    if (phases.length === 0) {
      throw new Error("AI failed to generate phases.");
    }

    // Normalize percentages just in case
    let totalPct = phases.reduce((sum: number, p: any) => sum + (p.pct || 0), 0);
    if (totalPct === 0) {
      phases.forEach((p: any) => p.pct = 1 / phases.length);
      totalPct = 1;
    }

    // 3. Create Root WBS Node
    const constructionWbs = await prisma.scheduleWBS.create({
      data: {
        scheduleId: schedule.id,
        code: 'CONST',
        name: 'Construction Phase',
        level: 1,
        orderIndex: 1
      }
    });

    const transactionOps = [];
    let daysAllocated = 0;

    const activePhases: any[] = [];

    // Bucket activities into the new AI-generated phases
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      p.acts = [];
      p.wbsId = `wbs_phase_${i}`;
      
      if (i === phases.length - 1) {
        p.days = totalDays - daysAllocated;
      } else {
        const normalizedPct = p.pct / totalPct;
        p.days = Math.max(1, Math.round(totalDays * normalizedPct));
        daysAllocated += p.days;
      }

      transactionOps.push(
        prisma.scheduleWBS.create({
          data: {
            id: p.wbsId,
            scheduleId: schedule.id,
            parentId: constructionWbs.id,
            code: p.code,
            name: p.name,
            level: 2,
            orderIndex: i + 1
          }
        })
      );
      activePhases.push(p);
    }

    // Assign existing activities to the AI phases based on keywords
    for (const act of activities) {
      let matched = false;
      const lowerName = (act.name || '').toLowerCase();
      
      for (const phase of activePhases) {
        if ((phase.keywords || []).some((kw: string) => lowerName.includes(kw.toLowerCase()))) {
          phase.acts.push(act);
          matched = true;
          break;
        }
      }
      
      if (!matched && activePhases.length > 0) {
        // Fallback to the largest or first phase
        activePhases[0].acts.push(act);
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

      // Create an AI-injected anchor activity for this phase
      const aiAnchorId = `ai_anchor_${phase.wbsId}`;
      transactionOps.push(
        prisma.scheduleActivity.create({
          data: {
            id: aiAnchorId,
            scheduleId: schedule.id,
            wbsId: phase.wbsId,
            name: `${phase.name} (AI Anchor)`,
            activityCode: 'AI-GEN',
            plannedDuration: phase.days,
            plannedStartDate: mainStart,
            plannedFinishDate: mainFinish,
            status: 'NOT_STARTED',
            actualProgressPercent: 0
          }
        })
      );

      // Link AI Anchor to Previous Phase's AI Anchor (FS)
      if (prevMainActId) {
        transactionOps.push(
          prisma.scheduleDependency.create({
            data: {
              scheduleId: schedule.id,
              predecessorId: prevMainActId,
              successorId: aiAnchorId,
              type: 'FS',
              lagDays: 0
            }
          })
        );
      }

      if (phase.acts.length > 0) {
        // Divide activities into 3 parallel "Crew Tracks" to simulate concurrent teams
        const numTracks = Math.min(phase.acts.length, 3);
        const tracks: any[][] = Array.from({ length: numTracks }, () => []);
        
        phase.acts.forEach((act: any, index: number) => {
          tracks[index % numTracks].push(act);
        });

        for (let t = 0; t < numTracks; t++) {
          const trackActs = tracks[t];
          if (trackActs.length === 0) continue;

          const baseDuration = Math.max(1, Math.floor(phase.days / trackActs.length));
          const remainder = phase.days - (baseDuration * trackActs.length);

          let currentTrackDate = new Date(mainStart);
          let prevTrackActId: string | null = null;

          for (let i = 0; i < trackActs.length; i++) {
            const act = trackActs[i];
            
            const duration = (i === trackActs.length - 1) ? baseDuration + Math.max(0, remainder) : baseDuration;

            const actStart = new Date(currentTrackDate);
            const actFinish = new Date(actStart);
            actFinish.setDate(actFinish.getDate() + duration - 1);

            transactionOps.push(
              prisma.scheduleActivity.update({
                where: { id: act.id },
                data: {
                  wbsId: phase.wbsId,
                  plannedDuration: duration,
                  plannedStartDate: actStart,
                  plannedFinishDate: actFinish
                }
              })
            );

            if (i === 0) {
              transactionOps.push(
                prisma.scheduleDependency.create({
                  data: {
                    scheduleId: schedule.id,
                    predecessorId: aiAnchorId,
                    successorId: act.id,
                    type: 'SS',
                    lagDays: Math.floor(Math.random() * 3)
                  }
                })
              );
            } else if (prevTrackActId) {
              transactionOps.push(
                prisma.scheduleDependency.create({
                  data: {
                    scheduleId: schedule.id,
                    predecessorId: prevTrackActId,
                    successorId: act.id,
                    type: 'FS',
                    lagDays: 0
                  }
                })
              );
            }

            prevTrackActId = act.id;
            currentTrackDate = new Date(actFinish);
            currentTrackDate.setDate(currentTrackDate.getDate() + 1);
          }
        }
      }

      prevMainActId = aiAnchorId;
      currentDate = new Date(mainFinish);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await prisma.$transaction(transactionOps);

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
    }

    return NextResponse.json({ success: true, message: `Schedule successfully simulated with AI phasing across ${totalDays} days.` });
  } catch (error: any) {
    console.error('Error in simulation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
