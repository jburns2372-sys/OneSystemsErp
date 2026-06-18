import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAiPolicies() {
  console.log("Seeding Knowledge Center AI Policies...");

  // Get an admin user to own the policy
  const admin = await prisma.user.findFirst({
    where: { role: 'PROJECT_DIRECTOR' }
  });

  const uploaderId = admin ? admin.id : 'SYSTEM';

  const policyText = `POLICY: Delivery Receipt Verification Rules
When evaluating a transaction in the "Delivery Receiving" module, specifically the action "Encode Delivery Receipt", the following rules are mandatory:

1. Vendor Matching: The vendor/supplier name on the uploaded document MUST exactly match the PO's supplier name.
2. PO Matching: The document MUST explicitly reference the correct Purchase Order Number or be related to the transaction.
3. Item Details: The items received MUST match the expected items on the PO.

If any of these conditions are violated, or if the user uploads a completely unrelated image/document (like a photo of an animal, person, or generic internet image), the system MUST return a BLOCKING ISSUE and reject the transaction.`;

  // Check if exists
  const existing = await prisma.notebookReference.findUnique({
    where: { referenceCode: 'POL-AI-DELIVERY-001' }
  });

  if (!existing) {
    const policy = await prisma.notebookReference.create({
      data: {
        referenceCode: 'POL-AI-DELIVERY-001',
        title: 'Delivery Receipt AI Validation Rules',
        description: 'Mandatory rules for Delivery Receiving AI verification.',
        fileName: 'Delivery_Validation_Rules.txt',
        fileType: 'text/plain',
        filePath: '/mock-paths/Delivery_Validation_Rules.txt',
        category: 'PROCUREMENT',
        moduleScope: 'Delivery Receiving',
        companyWide: true,
        mandatoryFlag: true,
        status: 'ACTIVE',
        uploadedBy: uploaderId,
        uploadedByRole: 'PROJECT_DIRECTOR',
        approvedBy: uploaderId,
        approvedByRole: 'PROJECT_DIRECTOR',
        effectiveDate: new Date(),
        versions: {
          create: {
            versionNumber: 1,
            fileName: 'Delivery_Validation_Rules.txt',
            filePath: '/mock-paths/Delivery_Validation_Rules.txt',
            extractedText: policyText,
            aiSummary: 'Mandatory rules for receiving deliveries.',
            status: 'ACTIVE',
            indexedStatus: 'COMPLETED',
            uploadedBy: uploaderId,
            approvedBy: uploaderId,
            effectiveDate: new Date()
          }
        }
      }
    });
    console.log(`Created AI Policy: ${policy.title}`);
  } else {
    console.log("AI Policy already exists.");
  }
}

// Allow running directly
if (require.main === module) {
  seedAiPolicies()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
