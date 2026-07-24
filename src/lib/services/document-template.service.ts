import { prisma } from '@/lib/prisma';
import { checkUserAccess } from '@/lib/accessControl';

export async function fetchActiveTemplatesService(actorId: string, projectId: string | null = null) {
  if (!actorId) {
    throw new Error('Unauthorized: Missing actor id');
  }

  const access = await checkUserAccess(actorId, projectId, 'DocumentTemplates', 'read');
  if (!access.allowed) {
    throw new Error('Unauthorized: Role rejected or project isolation enforced');
  }

  const whereClause: any = { status: 'ACTIVE' };
  
  if (projectId) {
     whereClause.OR = [
       { projectId: null },
       { projectId: projectId }
     ];
  } else {
     whereClause.projectId = null;
  }

  const templates = await prisma.documentTemplate.findMany({
    where: whereClause,
    orderBy: { templateType: 'asc' },
    include: {
      uploadedBy: { select: { name: true } },
    },
  });

  return templates;
}
