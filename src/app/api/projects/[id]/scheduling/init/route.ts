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
      let awardedBoqItems = await prisma.awardedBOQItem.findMany({
        where: { projectId },
        orderBy: { itemCode: 'asc' }
      });

      // Fallback to Procurement Benchmark if Awarded BOQ is empty
      if (awardedBoqItems.length === 0) {
        const benchmarkItems = await prisma.procurementBenchmarkItem.findMany({
          where: { projectId },
          orderBy: { itemCode: 'asc' }
        });
        
        // Map to the shape expected below
        awardedBoqItems = benchmarkItems.map(b => ({
          ...b,
          directCost: 0,
          indirectCost: 0,
          combinedUnitCost: b.unitCost
        })) as any;
      }

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
I have a pre-consolidated list of BOQ (Bill of Quantities) items. 
DO NOT CONSOLIDATE THEM FURTHER. Each item in this list MUST become exactly one distinct Schedule Activity.
Please do the following:
1. Define 3 to 6 logical construction sub-phases (e.g. Mobilization, Execution, Testing). Provide a unique 'code' for each sub-phase. These will be nested under a master 'Construction Phase'.
2. For EACH item in the provided BOQ list, assign it to the most appropriate sub-phase (wbsCode) and estimate a realistic 'durationDays'. You MUST return an activity for every single item provided, using its exact 'id'.
3. Identify logical sequence dependencies between these items based on their descriptions. Use the item 'id' to link predecessor and successor.

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
              activities: {
                type: Type.ARRAY,
                description: "The assigned phases and durations for each BOQ item",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "The exact id of the BOQ item e.g. ITEM_0" },
                    wbsCode: { type: Type.STRING, description: "The phase code this activity belongs to" },
                    durationDays: { type: Type.INTEGER, description: "Estimated duration in days" }
                  }
                }
              },
              dependencies: {
                type: Type.ARRAY,
                description: "Logical dependencies between activities",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    predecessorCode: { type: Type.STRING, description: "The id of the predecessor activity e.g. ITEM_0" },
                    successorCode: { type: Type.STRING, description: "The id of the successor activity e.g. ITEM_1" },
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
          const activities = result.activities || [];
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
          if (activities.length > 0 && !wbsMap.size) {
             const fwbs = await prisma.scheduleWBS.create({
                data: { scheduleId: newSchedule.id, parentId: constructionWbs.id, code: 'GEN', name: 'General', level: 2, orderIndex: 0 }
             });
             fallbackWbsId = fwbs.id;
          }

          // 2. Create Activities mapped exactly to BOQ Items
          const activityMap = new Map();
          let startDate = new Date();
          
          for (let i = 0; i < activities.length; i++) {
            const act = activities[i];
            
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

            if (!wbsId) continue;

            let duration = parseInt(act.durationDays);
            if (isNaN(duration) || duration < 1) duration = 1;

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);

            // Find the consolidated group to pull exact name and code
            const groupIndex = parseInt(act.id.replace('ITEM_', ''));
            const group = consolidatedItems[groupIndex];
            if (!group) continue;

            const newAct = await prisma.scheduleActivity.create({
              data: {
                scheduleId: newSchedule.id,
                wbsId: wbsId,
                activityCode: group.itemCode,
                name: group.description,
                plannedStartDate: startDate,
                plannedFinishDate: endDate,
                plannedDuration: duration,
                plannedQuantity: group.quantity,
                unit: group.unit,
                status: 'NOT_STARTED'
              }
            });
            activityMap.set(act.id, newAct.id);

            // Directly map the exact raw BOQ items from this group
            for (const item of group.items) {
              await prisma.scheduleBOQMapping.create({
                data: {
                  activityId: newAct.id,
                  awardedBoqItemId: item.id,
                  mappedQuantity: item.quantity
                }
              });
            }
            
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
