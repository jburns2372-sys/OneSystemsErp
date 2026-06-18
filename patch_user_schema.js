const fs = require('fs');

const schemaPath = './prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Find User model block
const userRegex = /(model User \{[\s\S]*?)(createdAt\s+DateTime\s+@default\(now\(\)\))/;
if (userRegex.test(schema)) {
  schema = schema.replace(userRegex, `$1
  // Added Subcontractor Relations
  createdSubcontractors    Subcontractor[] @relation("SubcontractorCreatedBy")
  updatedSubcontractors    Subcontractor[] @relation("SubcontractorUpdatedBy")

  $2`);
  fs.writeFileSync(schemaPath, schema);
  console.log("schema.prisma User model patched successfully.");
} else {
  console.log("Could not find User block.");
}
