const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Update Project relation
if (!schema.includes('equipmentDeployments EquipmentDeployment[]')) {
  schema = schema.replace(
    /materialReturns\s+MaterialReturn\[\]/,
    'materialReturns      MaterialReturn[]\n  equipmentDeployments EquipmentDeployment[]'
  );
}

// 2. Update Worker relation
if (!schema.includes('equipmentDeployments EquipmentDeployment[]')) {
  schema = schema.replace(
    /weeklyPayrollDetails\s+WeeklyPayrollDetail\[\]/,
    'weeklyPayrollDetails      WeeklyPayrollDetail[]\n  equipmentDeployments      EquipmentDeployment[]'
  );
}

// 3. Update User relation
if (!schema.includes('deploymentsRequested')) {
  schema = schema.replace(
    /aiPrompts\s+AIPrompt\[\]/,
    'aiPrompts              AIPrompt[]\n  deploymentsRequested   EquipmentDeployment[] @relation("DeploymentRequestedBy")\n  deploymentsApproved    EquipmentDeployment[] @relation("DeploymentApprovedBy")'
  );
}

// 4. Update EquipmentDeployment
const deploymentRegex = /model EquipmentDeployment \{[\s\S]*?\n\}/;
const newDeploymentModel = `model EquipmentDeployment {
  id              String    @id @default(cuid())
  equipmentId     String
  projectId       String
  driverId        String?
  targetDate      DateTime  @default(now())
  expectedReturnDate DateTime?
  dateDeployed    DateTime?
  dateReturned    DateTime?
  status          String    @default("REQUESTED") // REQUESTED, APPROVED, DISPATCHED, RETURNED, REJECTED
  purpose         String?
  notes           String?
  
  requestedById   String?
  approvedById    String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  equipment       Equipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  driver          Worker?   @relation(fields: [driverId], references: [id])
  requestedBy     User?     @relation("DeploymentRequestedBy", fields: [requestedById], references: [id])
  approvedBy      User?     @relation("DeploymentApprovedBy", fields: [approvedById], references: [id])
}`;

schema = schema.replace(deploymentRegex, newDeploymentModel);

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Schema patched successfully.');
