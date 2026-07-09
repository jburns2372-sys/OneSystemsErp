export async function extractPowBoqData(uploadId: string, projectId: string) {
  return {
    success: true,
    message: 'BOQ Extraction disabled due to missing Prisma models',
    sectionsCount: 0,
    itemsCount: 0
  };
}
