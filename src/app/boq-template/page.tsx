import { verifySession } from '@/lib/dal/auth';
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import BOQTemplateClient from "./BOQTemplateClient";

export const dynamic = "force-dynamic";

export default async function BOQTemplatePage() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  const effectiveRole = (simulatedRole && user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS'))
    ? simulatedRole
    : (user?.role || 'GUEST_USER');
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN';

  // Fetch active projects that the user has access to
  const projects = await prisma.project.findMany({
    where: isSuperAdmin ? {} : {
      userAssignments: {
        some: {
          userId: userId,
          assignmentStatus: 'active'
        }
      }
    },
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  });

  return <BOQTemplateClient projects={projects} />;
}
