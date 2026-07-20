import { verifySession } from '@/lib/dal/auth';
import React from "react";
import { prisma } from "@/lib/prisma";
import ProgressBillingsClient from "./ProgressBillingsClient";

import { cookies } from 'next/headers';

export default async function ProgressBillingsDashboard() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  // Fetch active projects and their associated accomplishment/billing files
  const projects = await prisma.project.findMany({
    where: { 
      status: { notIn: ["PLANNING", "COMPLETED", "CLOSED"] },
      ...(isSuperAdmin ? {} : {
        userAssignments: {
          some: {
            userId: userId,
            assignmentStatus: 'active'
          }
        }
      })
    },
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
