const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://v4_r7_clean:npg_dIqBCiLgW2a8@ep-solitary-surf-aps3rmax-pooler.c-7.us-east-1.aws.neon.tech/v4_r7_clean?sslmode=require&channel_binding=require'
    }
  }
});
prisma.projectSchedule.count().then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
