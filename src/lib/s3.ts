import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'onesystems-erp-bucket';

/**
 * Uploads a file to AWS S3, returning a URL to access it.
 * This function acts as a drop-in replacement for @vercel/blob `put` (in terms of returning a URL).
 */
export async function uploadToS3(filename: string, body: Buffer | Uint8Array | Blob | string | ReadableStream, options?: any) {
  let bufferBody: Buffer | Uint8Array | string;

  if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    bufferBody = new Uint8Array(arrayBuffer);
  } else if (body instanceof ReadableStream) {
    // Collect stream into buffer
    const chunks = [];
    const reader = body.getReader();
    let done, value;
    while (!done) {
      ({ done, value } = await reader.read());
      if (value) chunks.push(value);
    }
    bufferBody = Buffer.concat(chunks);
  } else {
    bufferBody = body as any;
  }

  // Ensure unique filename
  const key = `${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: bufferBody,
    ContentType: options?.contentType || 'application/octet-stream',
    // Note: To make it public, either the bucket needs public access or we use ACLs.
    // AWS S3 blocks public ACLs by default now, so you usually rely on Bucket Policies.
  });

  await s3Client.send(command);

  // Construct and return the URL
  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  
  return { url };
}
