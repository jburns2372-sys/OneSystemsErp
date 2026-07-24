// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchActiveTemplatesService } from '../../../../src/lib/services/document-template.service';

const prisma = new PrismaClient(); // Assuming prisma client is initialized here or imported from '@/lib/prisma'

const router = Router();

// Endpoint for uploadDocumentTemplate
router.post('/uploadDocumentTemplate', async (req, res) => {
  try {
    const { fileUrl, fileName, templateName, templateType, uploadedById } = req.body;

    if (!fileUrl || !fileName || !templateType || !templateName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Usually there's only one active template per type, we can optionally deprecate the others
    await prisma.documentTemplate.updateMany({
      where: { templateType },
      data: { status: 'INACTIVE' },
    });

    const template = await prisma.documentTemplate.create({
      data: {
        fileUrl,
        fileName,
        templateName,
        templateType,
        uploadedById: uploadedById || null,
        status: 'ACTIVE',
      },
    });

    return res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Template Upload Error (AWS Backend):', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to upload template' });
  }
});

// Endpoint for fetchActiveTemplates
router.post('/fetchActiveTemplates', async (req: any, res) => {
  try {
    const actorId = req.user?.id || req.user?.userId; // Adjust based on how auth middleware attaches the user
    if (!actorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing user session' });
    }
    
    const projectId = req.pbacContext?.activeProjectId || null;

    const templates = await fetchActiveTemplatesService(actorId, projectId);

    return res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Fetch Templates Error (AWS Backend):', error);
    return res.status(500).json({ success: false, error: 'Failed to load templates' });
  }
});

export default router;
