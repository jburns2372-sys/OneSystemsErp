import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const id = 'cmri5atwh0000vcos810qc8ij';
  
  try {
    await prisma.project.delete({
      where: { id }
    });
    console.log("Deleted successfully.");
  } catch (error: any) {
    console.error("Failed to delete:", error.message);
  }
}

main();
