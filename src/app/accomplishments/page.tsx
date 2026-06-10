import React from "react";
import { prisma } from "@/lib/prisma";
import AccomplishmentDashboardClient from "./AccomplishmentDashboardClient";

export default async function AccomplishmentDashboard() {
  const projects = await prisma.project.findMany({
    where: { status: { notIn: ["PLANNING", "COMPLETED", "CLOSED"] } },
    select: { 
      id: true, 
      name: true, 
      contractAmount: true, 
      status: true,
      documentTemplates: true,
      projectAccomplishmentFiles: {
        orderBy: { createdAt: 'desc' }
      }
    },
  });

  return <AccomplishmentDashboardClient projects={projects} />;
}
