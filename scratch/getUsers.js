const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ where: { email: 'admin01@demo.com' } }).then(u => {
  console.log("admin01@demo.com Hash:", u.passwordHash, "Password:", u.password);
  process.exit(0);
});
