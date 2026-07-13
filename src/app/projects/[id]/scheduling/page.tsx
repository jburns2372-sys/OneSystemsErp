import React from "react";
import { prisma } from "@/lib/prisma";
import SchedulingHubClient from "./SchedulingHubClient";

function serializePrisma(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj?.toNumber === 'function') return obj.toNumber();
  if (obj instanceof Date) return obj; // RSC supports Date
  if (Array.isArray(obj)) return obj.map(serializePrisma);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key in obj) {
      res[key] = serializePrisma(obj[key]);
    }
    return res;
  }
  return obj;
}

export default async function ProjectSchedulingHub({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectSchedule: {
        where: {
          status: {
            notIn: ['FAILED_GENERATION', 'FAILED_VALIDATION', 'INVALID_GENERATED_DRAFT', 'LEGACY_INVALID_DRAFT', 'EMPTY_DRAFT', 'ARCHIVED']
          }
        },
        include: {
          wbsNodes: {
            orderBy: { orderIndex: 'asc' }
          },
          activities: {
            include: {
              assignedTo: { select: { id: true, name: true, email: true } },
              wbs: true,
              boqAllocations: {
                include: {
                  awardedBoqItem: { select: { id: true, itemCode: true, description: true, quantity: true, totalCost: true, combinedUnitCost: true, directCost: true } }
                }
              },
              predecessors: true,
              successors: true
            },
            orderBy: { createdAt: 'asc' }
          },
          dependencies: true
        }
      }
    }
  });

  if (!project) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>Project not found</div>;
  }

  // Also prefetch Awarded BOQ for the setup wizard if schedule doesn't exist
  let awardedBoq = null;

  // Since projectSchedule is now an array, we must apply selection logic
  const schedules = project.projectSchedule || [];
  
  // Exclude empty schedules
  const validSchedules = schedules.filter(s => 
    s.activities && s.activities.length > 0 &&
    s.wbsNodes && s.wbsNodes.length > 0
  );

  // Priority selection logic
  let selectedSchedule = null;
  
  // 1. ACTIVE_BASELINE
  selectedSchedule = selectedSchedule || validSchedules.find(s => s.status === 'ACTIVE_BASELINE');
  selectedSchedule = selectedSchedule || validSchedules.find(s => s.status === 'BASELINE');
  
  // 2. READY_FOR_REVIEW
  selectedSchedule = selectedSchedule || validSchedules.find(s => s.status === 'READY_FOR_REVIEW');
  
  // 3. DRAFT_BASELINE
  selectedSchedule = selectedSchedule || validSchedules.find(s => s.status === 'DRAFT_BASELINE');
  selectedSchedule = selectedSchedule || validSchedules.find(s => s.status === 'DRAFT');
  
  // 4. LEGACY_BASELINE
  selectedSchedule = selectedSchedule || validSchedules.find(s => s.status === 'LEGACY_BASELINE');
  
  // Fallback to the newest if any remain and no priority match
  if (!selectedSchedule && validSchedules.length > 0) {
    selectedSchedule = validSchedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  if (!selectedSchedule) {
    awardedBoq = await prisma.awardedBOQItem.findMany({
      where: { projectId },
      orderBy: { itemCode: 'asc' }
    });
    
    // Fallback to Procurement Benchmark if Awarded BOQ is empty
    if (awardedBoq.length === 0) {
      awardedBoq = await prisma.procurementBenchmarkItem.findMany({
        where: { projectId },
        orderBy: { itemCode: 'asc' }
      });
    }
  }

  const serializedProject = serializePrisma(project);
  const serializedBoq = serializePrisma(awardedBoq);

  return (
    <SchedulingHubClient 
      project={serializedProject} 
      initialSchedule={selectedSchedule ? serializePrisma(selectedSchedule) : null} 
      awardedBoq={serializedBoq}
    />
  );
}
