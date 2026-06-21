const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const roles = [
  "SUPER_ADMIN",
  "PROJECT_ENGINEER",
  "PROCUREMENT_OFFICER",
  "WAREHOUSEMAN",
  "ACCOUNTANT",
  "HR_OFFICER",
  "PAYROLL_MASTER",
  "FINANCE OFFICER",
  "PROJECT ACCOUNTANT",
  "PURCHASING OFFICER",
  "MATERIALS ENGINEER",
  "PROJECT MANAGER",
  "PROJECT DIRECTOR",
  "DIRECTORS",
  "STOCKMAN",
  "FOREMAN",
  "PEE",
  "PME",
  "ADMINISTRATOR",
  "GUEST USER",
  "LIASON OFFICER"
];

async function main() {
  for (let role of roles) {
    const roleName = role.toUpperCase().trim();
    const existing = await prisma.systemRole.findUnique({ where: { name: roleName } });
    if (!existing) {
      await prisma.systemRole.create({ data: { name: roleName } });
      console.log(`Created role: ${roleName}`);
    } else {
      console.log(`Role already exists: ${roleName}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
