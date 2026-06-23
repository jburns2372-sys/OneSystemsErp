const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = "cmqplg5if02n2vcn0c74sscvu";
  
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      startDate: new Date('2026-06-12T00:00:00.000Z'),
      endDate: new Date('2026-12-08T00:00:00.000Z'),
      originalCompletionDate: new Date('2026-12-08T00:00:00.000Z')
    }
  });

  console.log("Successfully updated project:", updatedProject.name);
  console.log("Start Date:", updatedProject.startDate);
  console.log("End Date:", updatedProject.endDate);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
