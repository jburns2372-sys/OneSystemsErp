const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.project.findUnique({where:{id:'cmrirhhw30000ic0406v47smb'}}).then(p => {
  console.log("Project:", p?.id, p?.name);
}).finally(()=>prisma.$disconnect());
