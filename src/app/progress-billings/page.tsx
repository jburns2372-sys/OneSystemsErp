import React from "react";
import { prisma } from "@/lib/prisma";
import ProgressBillingsClient from "./ProgressBillingsClient";

export default async function ProgressBillingsDashboard() {
  // Fetch active projects and their associated accomplishment/billing files
  const projects = await prisma.project.findMany({
    where: { status: { notIn: ["PLANNING", "COMPLETED", "CLOSED"] } },
    select: { 
      id: true, 
      name: true, 
      contractAmount: true, 
      status: true,
      projectAccomplishmentFiles: {
        where: { status: "BILLING" },
        orderBy: { createdAt: 'desc' }
      }
    },
  });

  return <ProgressBillingsClient projects={projects} />;
}
