// @ts-nocheck
import { backendPrisma } from '../lib/prismaRls';
import { invokeH02ProjectMutation } from '../lib/h02ProjectMutation';
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Adjust path as per your project structure

const router = Router();

router.post('/getUserProjectAssignments', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }
    const assignments = await prisma.projectUserAssignment.findMany({
      where: { userId },
      include: {
        project: { select: { name: true, status: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error in getUserProjectAssignments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/getProjectTeamMembers', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required.' });
    }
    const members = await backendPrisma.projectUserAssignment.findMany({
      where: { projectId },
      include: {
        user: { select: { name: true, email: true, role: true, id: true, lastLoginAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: members });
  } catch (error: any) {
    console.error('Error in getProjectTeamMembers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/addProjectAssignment', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!data || !data.userId || !data.projectId || !data.projectRole || !data.accessLevel) {
      return res.status(400).json({ success: false, error: 'Missing required assignment data.' });
    }

    const result = await invokeH02ProjectMutation(req, 'ASSIGNMENT_CREATE', null, data);
    res.json(result);
  } catch (error: any) {
    console.error('Error in addProjectAssignment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/updateProjectAssignment', async (req: Request, res: Response) => {
  try {
    const { assignmentId, data } = req.body;
    if (!assignmentId || !data) {
      return res.status(400).json({ success: false, error: 'Assignment ID and update data are required.' });
    }

    await invokeH02ProjectMutation(req, 'ASSIGNMENT_UPDATE', assignmentId, data);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in updateProjectAssignment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/deleteProjectAssignment', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.body;
    if (!assignmentId) {
      return res.status(400).json({ success: false, error: 'Assignment ID is required.' });
    }
    await invokeH02ProjectMutation(req, 'ASSIGNMENT_DELETE', assignmentId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in deleteProjectAssignment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
