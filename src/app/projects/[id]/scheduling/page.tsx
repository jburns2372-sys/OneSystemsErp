import React from "react";
import { prisma } from "@/lib/prisma";
import SchedulingHubClient from "./SchedulingHubClient";

export default async function ProjectSchedulingHub({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectSchedule: {
        include: {
          wbsNodes: {
            orderBy: { orderIndex: 'asc' }
          },
          activities: {
            include: {
              assignedTo: { select: { id: true, name: true, email: true } },
              wbs: true,
              boqMappings: {
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

  if (!project.projectSchedule) {
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

  return (
    <SchedulingHubClient 
      project={project} 
      initialSchedule={project.projectSchedule} 
      awardedBoq={awardedBoq}
    />
  );
}
