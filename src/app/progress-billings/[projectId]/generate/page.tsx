import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProgressBillingGenerator from "./ProgressBillingGenerator";

export default async function GenerateProgressBillingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { 
      name: true, 
      retentionPercentage: true, 
      withholdingTaxPercentage: true,
      advanceRecoupmentMethod: true,
      contractAmount: true
    }
  });

  if (!project) {
    return <div className="p-6 text-gray-500">Project not found.</div>;
  }

  // Find all approved accomplishments that are NOT YET billed
  const unbilledAccomplishments = await prisma.accomplishment.findMany({
    where: {
      projectId,
      status: "APPROVED", // Assuming an approval workflow happened
      // We could also filter by checking if it exists in Billing Items, but keeping it simple for prototype
    },
    select: {
      id: true,
      billingPeriod: true,
      accomplishmentDate: true,
      approvedAmount: true,
    }
  });

  // Mocking data since we might not have seeded accomplishments
  const mockUnbilled = unbilledAccomplishments.length > 0 ? unbilledAccomplishments : [
    {
      id: "mock-1",
      billingPeriod: "Month 1 (June)",
      accomplishmentDate: new Date(),
      approvedAmount: 500000,
    },
    {
      id: "mock-2",
      billingPeriod: "Month 2 (July)",
      accomplishmentDate: new Date(),
      approvedAmount: 350000,
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/progress-billings" className="hover:text-blue-600">Progress Billings</Link>
            <span>/</span>
            <span className="text-gray-900">{project.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Generate Progress Billing</h1>
        </div>
      </div>

      <ProgressBillingGenerator 
        projectId={projectId} 
        unbilledAccomplishments={mockUnbilled} 
        projectInfo={project}
      />
    </div>
  );
}
