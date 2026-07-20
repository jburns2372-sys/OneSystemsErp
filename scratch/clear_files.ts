// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing broken accomplishment file records...");

  // Delete versions first to avoid foreign key constraints
  const deletedVersions = await prisma.projectAccomplishmentFileVersion.deleteMany({});
  console.log(`Deleted ${deletedVersions.count} file versions.`);

  // Delete the actual files
  const deletedFiles = await prisma.projectAccomplishmentFile.deleteMany({});
  console.log(`Deleted ${deletedFiles.count} broken accomplishment files.`);

  console.log("Cleanup complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
