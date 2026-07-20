const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.scheduleWBS.createMany({
      data: [
        {
          id: "13e40032-7146-4600-8ffd-d685788f4fef",
          scheduleId: "cmrj37h9c0007vch8zewgahac",
          code: "CONST",
          name: "Construction Phase",
          level: 1,
          orderIndex: 1
        }
      ]
    });
    console.log("SUCCESS!");
  } catch(e) {
    console.error("ERROR:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
