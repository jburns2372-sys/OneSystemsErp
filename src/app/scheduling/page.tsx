import React from "react";
import { prisma } from "@/lib/prisma";
import SchedulingDashboardClient from "./SchedulingDashboardClient";

export default async function SchedulingDashboard() {
  const projects = await prisma.project.findMany({
    where: { status: { notIn: ["PLANNING", "COMPLETED", "CLOSED"] } },
    select: { 
      id: true, 
      name: true, 
      contractAmount: true, 
      status: true,
      projectSchedule: {
        select: {
          status: true,
          currentFinishDate: true
        }
      }
    },
  });

  return <SchedulingDashboardClient projects={projects} />;
}
