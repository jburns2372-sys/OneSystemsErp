const fs = require('fs');

const schemaPath = './prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Update SubcontractPackage
const packageRegex = /(model SubcontractPackage \{[\s\S]*?)(createdAt\s+DateTime\s+@default\(now\(\)\))/;
if (packageRegex.test(schema)) {
  schema = schema.replace(packageRegex, `$1
  // Expanded fields for Subcontracting Module
  subcontractType     String?
  tradeCategory       String?
  durationDays        Int?
  advanceRecoupmentTerms String?
  billingFrequency    String?
  taxTreatment        String?
  liquidatedDamagesClause String?
  backChargeClause    String?
  requiredAttachments Json?
  preparedById        String?
  reviewedById        String?
  approvedById        String?

  $2`);
} else {
  console.log("Could not find SubcontractPackage block.");
}

// Update JobOrder
const jobOrderRegex = /(model JobOrder \{[\s\S]*?)(createdAt\s+DateTime\s+@default\(now\(\)\))/;
if (jobOrderRegex.test(schema)) {
  schema = schema.replace(jobOrderRegex, `$1
  // Expanded fields for Job Order Module
  jobOrderType        String?
  tradeCategory       String?
  scopeOfWork         String?
  quantity            Float?
  unit                String?
  unitCost            Float?
  lumpSumAmount       Float?
  requiredManpower    String?
  requiredTools       String?
  qualityRequirement  String?
  inspectionRequirement String?
  retentionPct        Float?
  taxTreatment        String?
  isThresholdExceeded Boolean @default(false)
  thresholdWarning    String?

  $2`);
} else {
  console.log("Could not find JobOrder block.");
}

fs.writeFileSync(schemaPath, schema);
console.log("schema.prisma patched successfully.");
