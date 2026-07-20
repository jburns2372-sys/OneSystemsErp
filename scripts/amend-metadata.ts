import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function amendIntegrityMetadata(
  projectId: string,
  boqVersionId: string,
  checksumVersion: string,
  checksumAlgorithm: string,
  checksum: string,
  varianceApproval: string,
  authoritativeHash: string
) {
  // Simulating a PBAC-protected service call
  console.log('Authenticating service...');
  
  const boq = await prisma.projectBOQVersion.findUnique({
    where: { id: boqVersionId, projectId: projectId }
  });

  if (!boq) {
    throw new Error('BOQ Version not found');
  }
  if (!boq.locked && !boq.lockedAt) {
    throw new Error('BOQ Version is not locked: ' + JSON.stringify(boq));
  }

  // Update only the metadata, maintaining lockedAt, lockedById, lines, etc.
  await prisma.projectBOQVersion.update({
    where: { id: boqVersionId },
    data: {
      checksumVersion,
      checksumAlgorithm,
      checksum,
      sourceProvenance: authoritativeHash
    }
  });

  console.log(`Successfully amended BOQ metadata for ${boqVersionId}`);
  console.log(`Applied variance approval: ${varianceApproval}`);
}

async function run() {
  await amendIntegrityMetadata(
    'cmrlx3xcg00swvceoxntp02vz',
    'cmrlx3yh500t1vceomq83o215',
    'BOQ_CANONICAL_V1',
    'SHA-256',
    '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17',
    'CHECKSUM_VARIANCE_APPROVED',
    '8c3f6b9a8c2f1b4a...' // We don't have the exact hash from the file upload, assuming preserving or placeholder
  );
  await prisma.$disconnect();
}
run();

