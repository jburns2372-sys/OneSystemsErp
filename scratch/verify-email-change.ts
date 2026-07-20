import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { id: 'cmqn5zlim0000vckg4hzn5u7o' } });
  
  if (!user) { console.error('User not found'); return; }
  console.log(`User ID: ${user.id}`);
  console.log(`Status: ${user.status}`);
  console.log(`Role: ${user.role}`);
  console.log(`Email: ${user.email}`);

  const audits = await prisma.auditLog.findMany({
    where: { userId: 'cmqn5zlim0000vckg4hzn5u7o', actionType: 'UAT_USER_EMAIL_CORRECTION' }
  });

  console.log(`Audit records found: ${audits.length}`);
  if (audits.length > 0) {
    const audit = audits[0];
    console.log(`Old value: ${audit.oldValue}`);
    console.log(`New value: ${audit.newValue}`);
    console.log(`Remarks: ${audit.remarks}`);
  }

  await prisma.$disconnect();
}

verify();
