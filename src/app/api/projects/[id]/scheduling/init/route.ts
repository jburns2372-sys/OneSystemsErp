import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { name, description, calendarDays, workDaysConfig, importBoq, consolidateBoq } = body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if schedule already exists
    const existingSchedule = await prisma.projectSchedule.findUnique({
      where: { projectId }
    });

    if (existingSchedule) {
      return NextResponse.json({ error: 'Schedule already exists for this project' }, { status: 400 });
    }

    // Create Schedule
    const newSchedule = await prisma.projectSchedule.create({
      data: {
        projectId,
        name,
        description,
        calendarDays,
        workDaysConfig,
        status: 'DRAFT'
      }
    });

    // If importBoq is true, generate WBS and Activities from BOQ
    if (importBoq) {
      const awardedBoqItems = await prisma.awardedBOQItem.findMany({
        where: { projectId },
        orderBy: { itemCode: 'asc' }
      });

      if (awardedBoqItems.length > 0) {
        // Create Construction Phase root WBS
        const constructionWbs = await prisma.scheduleWBS.create({
          data: {
            scheduleId: newSchedule.id,
            code: 'CONST',
            name: 'Construction Phase',
            level: 1,
            orderIndex: 1
          }
        });

        if (consolidateBoq) {
          // AI SCHEDULE SIMULATION LOGIC
          
          // First, perform in-memory consolidation to reduce payload size to AI
          const groups = new Map<string, any>();
          for (const item of awardedBoqItems) {
            let oldItemCode = item.itemCode || 'N/A';
            if (oldItemCode === 'N/A' || oldItemCode.trim() === '') {
              oldItemCode = item.description.trim();
            }
            const normalizedDesc = item.description.trim().toLowerCase();
            const normalizedUnit = (item.unit || '').trim().toLowerCase();
            const key = `${oldItemCode.toLowerCase()}||${normalizedDesc}||${normalizedUnit}`;
            
            if (!groups.has(key)) {
              groups.set(key, {
                itemCode: oldItemCode,
                description: item.description,
                unit: item.unit || 'lot',
                quantity: 0,
                items: []
              });
            }
            const group = groups.get(key);
            group.quantity += (item.quantity || 1);
            group.items.push(item);
          }
          const consolidatedItems = Array.from(groups.values());

          // Build simplified payload for AI
          const payload = consolidatedItems.map((g, index) => ({
            id: `ITEM_${index}`,
            code: g.itemCode,
            description: g.description,
            quantity: g.quantity,
            unit: g.unit
          }));

          const prompt = `You are an expert construction project manager. 
We are building a project schedule for a construction project with a target of ${calendarDays} calendar days.
I have a list of BOQ (Bill of Quantities) items. 
Instead of creating a schedule activity for every single item, I want you to HYPER-CONSOLIDATE them into 10 to 15 'Master Activities' (e.g., 'HVAC Piping', 'Equipment Installation', 'Testing').
Please do the following:
1. Define 3 to 6 logical construction sub-phases (e.g. Mobilization, Rough-ins, Equipment Installation, Testing). Provide a unique 'code' for each sub-phase. These will be nested under a master 'Construction Phase'.
2. Define 10 to 15 'Master Activities' that encompass all the work. For each, assign it to the most appropriate sub-phase (wbsCode), estimate a realistic 'durationDays', and provide an array of 3 to 6 distinct 'keywords' that I can use to automatically match and assign the raw BOQ items to this master activity.
3. Identify logical sequence dependencies between these Master Activities (e.g., Equipment Installation happens after Rough-ins). Use the master activity 'code' to link predecessor and successor.

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
                    code: { type: Type.STRING, description: "Unique phase code e.g. WBS-1" },
                    name: { type: Type.STRING, description: "Phase name" },
                    orderIndex: { type: Type.INTEGER }
                  }
                }
              },
              masterActivities: {
                type: Type.ARRAY,
                description: "Master Activities that encompass the BOQ work",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING, description: "Unique activity code e.g. ACT-1" },
                    wbsCode: { type: Type.STRING, description: "The phase code this activity belongs to" },
                    name: { type: Type.STRING, description: "Name of the Master Activity" },
                    durationDays: { type: Type.INTEGER, description: "Estimated duration in days" },
                    keywords: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "List of keywords to match BOQ items to this activity"
                    }
                  }
                }
              },
              dependencies: {
                type: Type.ARRAY,
                description: "Logical dependencies between master activities",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    predecessorCode: { type: Type.STRING, description: "The code of the predecessor master activity" },
                    successorCode: { type: Type.STRING, description: "The code of the successor master activity" },
                    type: { type: Type.STRING, description: "Dependency type: FS, SS, FF, or SF. Default is FS." }
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
            // Fallback to 2.0-flash if 2.5 is unavailable
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
          const masterActivities = result.masterActivities || [];
          const dependencies = result.dependencies || [];

          // 1. Create WBS Nodes
          const wbsMap = new Map();
          for (let i = 0; i < phases.length; i++) {
            const p = phases[i];
            const wbs = await prisma.scheduleWBS.create({
              data: {
                scheduleId: newSchedule.id,
                parentId: constructionWbs.id,
                code: p.code,
                name: p.name,
                level: 2,
                orderIndex: p.orderIndex || i
              }
            });
            wbsMap.set(p.code, wbs.id);
          }

          // Fallback WBS if mapping fails
          let fallbackWbsId = null;
          if (masterActivities.length > 0 && !wbsMap.size) {
             const fwbs = await prisma.scheduleWBS.create({
                data: { scheduleId: newSchedule.id, parentId: constructionWbs.id, code: 'GEN', name: 'General', level: 2, orderIndex: 0 }
             });
             fallbackWbsId = fwbs.id;
          }

          // 2. Create Master Activities
          const activityMap = new Map();
          let startDate = new Date();
          
          for (let i = 0; i < masterActivities.length; i++) {
            const act = masterActivities[i];
            
            // Fuzzy match WBS
            let wbsId = wbsMap.get(act.wbsCode);
            if (!wbsId) {
              const normalizedWbsCode = (act.wbsCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const matchedPhase = phases.find((p: any) => 
                p.code.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedWbsCode ||
                p.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedWbsCode) ||
                normalizedWbsCode.includes(p.code.toLowerCase().replace(/[^a-z0-9]/g, ''))
              );
              if (matchedPhase) {
                wbsId = wbsMap.get(matchedPhase.code);
              }
            }
            wbsId = wbsId || Array.from(wbsMap.values())[0] || fallbackWbsId;

            if (!wbsId) continue; // Skip if still no WBS

            let duration = parseInt(act.durationDays);
            if (isNaN(duration) || duration < 1) duration = 1;

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);

            const newAct = await prisma.scheduleActivity.create({
              data: {
                scheduleId: newSchedule.id,
                wbsId: wbsId,
                activityCode: act.code,
                name: act.name,
                plannedStartDate: startDate,
                plannedFinishDate: endDate,
                plannedDuration: duration,
                status: 'NOT_STARTED'
              }
            });
            activityMap.set(act.code, newAct.id);
            
            // Advance start date slightly for next item default
            startDate = new Date(endDate);
          }

          // 3. Create Dependencies
          for (const dep of dependencies) {
            const predId = activityMap.get(dep.predecessorCode);
            const succId = activityMap.get(dep.successorCode);
            if (predId && succId && predId !== succId) {
              await prisma.scheduleDependency.create({
                data: {
                  scheduleId: newSchedule.id,
                  predecessorId: predId,
                  successorId: succId,
                  type: dep.type || 'FS'
                }
              });
            }
          }

          // 4. Map BOQ Items to Master Activities using Keywords
          let defaultActId = Array.from(activityMap.values())[0]; // Fallback to first activity

          for (const group of consolidatedItems) {
            // Find best matching master activity
            let bestMatchActId = defaultActId;
            let maxMatches = -1;
            
            const groupDescLower = group.description.toLowerCase();

            for (const act of masterActivities) {
              let matches = 0;
              for (const keyword of (act.keywords || [])) {
                if (groupDescLower.includes(keyword.toLowerCase())) {
                  matches++;
                }
              }
              if (matches > maxMatches && matches > 0) {
                maxMatches = matches;
                bestMatchActId = activityMap.get(act.code);
              }
            }

            if (bestMatchActId) {
              // Map all items in this group
              for (const item of group.items) {
                await prisma.scheduleBOQMapping.create({
                  data: {
                    activityId: bestMatchActId,
                    awardedBoqItemId: item.id,
                    mappedQuantity: item.quantity
                  }
                });
              }
            }
          }

        } else {
          // No AI consolidation, map 1-to-1 under Construction Phase WBS
          for (const item of awardedBoqItems) {
            const activity = await prisma.scheduleActivity.create({
              data: {
                scheduleId: newSchedule.id,
                wbsId: constructionWbs.id,
                activityCode: item.itemCode,
                name: item.description || `BOQ Item ${item.itemCode}`,
                plannedQuantity: item.quantity,
                unit: item.unit,
                status: 'NOT_STARTED'
              }
            });

            await prisma.scheduleBOQMapping.create({
              data: {
                activityId: activity.id,
                awardedBoqItemId: item.id,
                mappedQuantity: item.quantity
              }
            });
          }
        }
      }
    }

    const fullSchedule = await prisma.projectSchedule.findUnique({
      where: { id: newSchedule.id },
      include: {
        wbsNodes: true,
        activities: { include: { boqMappings: true } }
      }
    });

    return NextResponse.json({ success: true, schedule: fullSchedule });
  } catch (error: any) {
    console.error('Error initializing schedule:', error);

    // Rollback: If we fail anywhere after creating the schedule but before returning, delete it so the user isn't stuck.
    try {
      const { id: projectId } = await params;
      const stuckSchedule = await prisma.projectSchedule.findUnique({ where: { projectId }, include: { _count: { select: { activities: true } } } });
      if (stuckSchedule && stuckSchedule._count.activities === 0) {
        await prisma.projectSchedule.delete({ where: { id: stuckSchedule.id } });
      }
    } catch (cleanupError) {
      console.error('Failed to rollback schedule on error:', cleanupError);
    }
    
    // Check if the error is a Gemini API error
    let errorMessage = error.message || 'Internal Server Error';
    if (errorMessage.includes('429') || errorMessage.includes('Quota')) {
      errorMessage = 'Google AI API Quota Exceeded (Free Tier). Please wait about 1 minute before generating the schedule again.';
    } else if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      errorMessage = 'Google AI API is currently overloaded. Please try again in a few moments.';
    } else if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed?.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {}
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
