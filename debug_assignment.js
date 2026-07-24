const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runChecks() {
  try {
    const userEmail = "finance@onesystemserp.com";
    const actorEmail = "j.burns2372@gmail.com";
    const targetProjectId = "cmrirhhw30000ic0406v47smb";

    const user = await prisma.user.findFirst({ where: { email: { equals: userEmail, mode: "insensitive" } } });
    if (!user) {
      console.log("Check 1 failed: No user"); return;
    }
    const assignments = await prisma.projectUserAssignment.findMany({
      where: { userId: user.id, projectId: targetProjectId, assignmentStatus: "active" }
    });
    if (assignments.length === 0) {
       console.log("Check 5 failed: No assignment"); return;
    }
    
    console.log("Global role:", user.role);
    console.log("Project role:", assignments[0].projectRole);
    
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

runChecks();
