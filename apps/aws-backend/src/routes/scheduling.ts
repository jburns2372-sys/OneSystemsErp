// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '../lib/permissions';

const router = Router();
const prisma = new PrismaClient();

function getPbacContext(req: any) {
  return {
    userId: req.headers['x-user-session'] as string | undefined,
    activeProjectId: req.headers['x-active-project-id'] as string | undefined,
    simulatedRole: req.headers['x-simulated-role'] as string | undefined,
  };
}

router.delete('/:projectId', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SCHEDULING', 'canDelete', simulatedRole);
    
    const { projectId } = req.params;

    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId }
    });

    if (!schedule) {
      throw new Error('Schedule not found for this project');
    }

    await prisma.projectSchedule.delete({
      where: { id: schedule.id }
    });

    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

export default router;
