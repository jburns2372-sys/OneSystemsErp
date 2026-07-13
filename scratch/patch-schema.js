const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const targetProjectSchedule = `    generationRulesVersion String?
  
    createdAt          DateTime  @default(now())`;
const replacementProjectSchedule = `    generationRulesVersion String?
    validationMetrics  String?   @db.Text
    feasibilityFlags   String?   @db.Text
  
    createdAt          DateTime  @default(now())`;
content = content.replace(targetProjectSchedule, replacementProjectSchedule);

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Updated schema.prisma');
