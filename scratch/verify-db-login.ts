import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.uat-v4-r7.credentials.local' });
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'finance@onesystemserp.com' },
    include: { projectAssignments: true }
  });
  if (!user) return console.log('User not found: finance@onesystemserp.com');
  
  console.log(`Finance User Status: ${user.status}`);
  console.log(`Finance User Role: ${user.role}`);
  console.log(`Assignments: ${JSON.stringify(user.projectAssignments)}`);
}

check().catch(console.error).finally(() => prisma.$disconnect());
