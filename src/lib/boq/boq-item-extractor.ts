import { Worksheet } from 'exceljs';

export async function extractBOQItems(
  sheet: Worksheet,
  uploadedWorkbookFileId: string,
  projectId: string
) {
  return {
    success: true,
    message: 'BOQ Item extraction disabled due to missing Prisma models',
    sections: [],
    items: []
  };
}
