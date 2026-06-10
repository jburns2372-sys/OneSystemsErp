const fs = require('fs');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const rbac = fs.readFileSync('prisma/rbac_models.prisma', 'utf8');

// Also we need to add the new relations to the `User` model.
// Let's modify the User model using regex before appending.
let newSchema = schema;

if (!newSchema.includes('model Role {')) {
  newSchema += '\n' + rbac;
  
  // Update User model fields
  newSchema = newSchema.replace(
    '  updatedAt     DateTime  @updatedAt\n',
    `  updatedAt     DateTime  @updatedAt
  passwordHash  String?
  status        String    @default("ACTIVE")
  defaultRole   String?
  department    String?
  lastLoginAt   DateTime?

  userRoles        UserRole[]
  auditLogs        AuditLog[]        @relation("AuditLogs")
  aiValidationLogs AIValidationLog[] @relation("AIValidationLogs")
  userLoginLogs    UserLoginLog[]    @relation("UserLoginLogs")
`
  );

  fs.writeFileSync('prisma/schema.prisma', newSchema);
  console.log('Appended RBAC models and updated User model successfully.');
} else {
  console.log('RBAC models already exist in schema.prisma');
}
