// @ts-nocheck
import { Router } from 'express';
import { runBoqUploadJob } from '../jobs/boqWorker';

const router = Router();

// In-memory Job Queue (Simulating AWS SQS/Redis)
export const jobStore = new Map<string, { status: string; result?: any; error?: string }>();

router.post('/boq-upload', async (req, res) => {
  try {
    const { projectId, fileBufferBase64, fileName } = req.body;
    const userId = (req as any).user?.id || 'unknown';
    const user = (req as any).user;

    const jobId = `boq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    jobStore.set(jobId, { status: 'PROCESSING' });

    // Run in background (fire and forget)
    runBoqUploadJob(jobId, projectId, fileBufferBase64, fileName, user)
      .then(result => {
        jobStore.set(jobId, { status: 'COMPLETED', result });
      })
      .catch(error => {
        jobStore.set(jobId, { status: 'FAILED', error: error.message });
      });

    // Return jobId immediately so frontend can poll
    res.json({ success: true, jobId, status: 'PROCESSING' });

  } catch (error: any) {
    console.error('Failed to dispatch BOQ upload job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  res.json({ success: true, ...job });
});

export default router;
