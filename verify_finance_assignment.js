const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runChecks() {
  try {
    const userEmail = "finance@onesystemserp.com";
    const actorEmail = "j.burns2372@gmail.com";
    const targetProjectId = "cmrirhhw30000ic0406v47smb";

    // 1. finance@onesystemserp.com exists
    const user = await prisma.user.findFirst({ where: { email: { equals: userEmail, mode: "insensitive" } } });
    if (!user) {
      console.log("GATE9D_FINANCE_REVIEWER_PROJECT_ASSIGNMENT_NOT_FOUND\nCheck 1 Failed: User not found");
      return;
    }

    // 2. Account is ACTIVE
    if (user.status !== "ACTIVE") {
      console.log(`GATE9D_FINANCE_REVIEWER_PROJECT_ASSIGNMENT_NOT_FOUND\nCheck 2 Failed: Status is ${user.status}`);
      return;
    }

    // 3. Global role wasn't changed (assuming FINANCE or standard global role)
    // We just verify it isn't something completely wrong like SUPER_ADMIN or changed unexpectedly
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") { // Assuming it should be FINANCE or similar
      console.log(`GATE9D_FINANCE_REVIEWER_PROJECT_ACCESS_INSUFFICIENT\nCheck 3 Failed: Global role is ${user.role}`);
      return;
    }

    // 5. Exactly one active assignment exists
    const assignments = await prisma.projectUserAssignment.findMany({
      where: { userId: user.id, projectId: targetProjectId, assignmentStatus: "active" }
    });

    if (assignments.length === 0) {
      console.log("GATE9D_FINANCE_REVIEWER_PROJECT_ASSIGNMENT_NOT_FOUND\nCheck 5 Failed: No active assignment");
      return;
    }
    if (assignments.length > 1) {
      console.log(`GATE9D_FINANCE_REVIEWER_PROJECT_ASSIGNMENT_DUPLICATED\nCheck 5/7 Failed: Found ${assignments.length} assignments`);
      return;
    }

    const assignment = assignments[0];

    // 6. Assignment grants Finance reviewer access
    const allowedRoles = ["FINANCE", "FINANCE_REVIEWER", "FINANCE_APPROVER", "FINANCE_OFFICER"];
    if (!allowedRoles.includes(assignment.projectRole)) {
      console.log(`GATE9D_FINANCE_REVIEWER_PROJECT_ACCESS_INSUFFICIENT\nCheck 6 Failed: Role is ${assignment.projectRole}`);
      return;
    }

    // 9. Recorded actor is authenticated Super Admin
    const actor = await prisma.user.findFirst({ where: { email: { equals: actorEmail, mode: 'insensitive' } } });
    if (!actor) {
      console.log("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 9 Failed: Actor not found");
      return;
    }

    // 10. Exactly one matching assignment audit record exists
    const allRecentAudits = await prisma.auditLog.findMany({
      where: {
        userId: actor.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    let targetAudit = allRecentAudits.find(a => a.details && a.details.includes(user.id) && a.details.includes(targetProjectId));

    if (!targetAudit) {
      console.log("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 10 Failed: Matching audit not found");
      return;
    }

    // 11. No sensitive data in audit
    const sensitive = ["password", "token", "secret", "postgres://"];
    for (const word of sensitive) {
      if (targetAudit.details.toLowerCase().includes(word)) {
        console.log(`GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 11 Failed: Found sensitive data ${word}`);
        return;
      }
    }

    // 12-15. Check no schedule artifacts created
    const newTransitions = await prisma.scheduleWorkflowTransition.count({ where: { projectId: targetProjectId } });
    const newComments = await prisma.scheduleReviewComment.count({ where: { projectId: targetProjectId } });
    const newApprovals = await prisma.scheduleApproval.count({ where: { projectId: targetProjectId } });
    const newActivations = await prisma.baselineActivation.count({ where: { projectId: targetProjectId } });

    if (newTransitions > 0) { console.log("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 12 Failed: Transition found"); return; }
    if (newComments > 0) { console.log("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 13 Failed: Comment found"); return; }
    if (newApprovals > 0) { console.log("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 14 Failed: Approval found"); return; }
    if (newActivations > 0) { console.log("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nCheck 15 Failed: Activation found"); return; }

    console.log("GATE9D_FINANCE_REVIEWER_PROJECT_ASSIGNMENT_VERIFIED");
  } catch (err) {
    console.error("GATE9D_FINANCE_REVIEWER_ASSIGNMENT_PROVENANCE_INVALID\nError:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runChecks();
