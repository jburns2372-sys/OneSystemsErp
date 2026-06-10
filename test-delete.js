const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findFirst();
  if (!p) return console.log("No projects to delete.");
  
  console.log("Attempting to delete project:", p.id);
  try {
    await prisma.project.delete({ where: { id: p.id } });
    console.log("Successfully deleted!");
  } catch (e) {
    console.error("Deletion failed:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
