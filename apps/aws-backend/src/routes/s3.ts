// @ts-nocheck
import { Router } from 'express';
import { generateUploadUrl, generateDownloadUrl } from '../services/s3.service';

const router = Router();

// Endpoint to generate a presigned URL for uploading files
router.post('/presigned-url/upload', async (req, res) => {
  try {
    const { key, contentType } = req.body;
    
    if (!key || !contentType) {
      return res.status(400).json({ error: 'Missing key or contentType' });
    }

    const url = await generateUploadUrl(key, contentType);
    res.json({ url, key });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Endpoint to generate a presigned URL for downloading files
router.post('/presigned-url/download', async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key' });
    }

    const url = await generateDownloadUrl(key);
    res.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default router;
