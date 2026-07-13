const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.scheduleWBS.create({
  data: {
    scheduleId: 'test_schedule_id',
    code: 'TEST',
    name: 'Test',
    level: 1
  }
}).then(res => {
  console.log("SUCCESS:", res);
  process.exit(0);
}).catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
