const fs = require('fs');

const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
const models = ['ProjectSchedule', 'BaselineActivation', 'ScheduleApproval', 'ScheduleReviewComment', 'AuditLog'];

models.forEach(model => {
  const regex = new RegExp(`model ${model} \\{[\\s\\S]*?\\}`, 'g');
  const match = schema.match(regex);
  if (match) {
    console.log(match[0]);
    console.log('---------------------------');
  } else {
    console.log(`Model ${model} not found.`);
  }
});
