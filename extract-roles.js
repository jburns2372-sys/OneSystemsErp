const fs = require('fs');
const content = fs.readFileSync('roles.json', 'utf8');

const regex = /"([^"]+)":\s*{[\s\S]*?"PROJECT_MANAGEMENT":\s*{([^}]*)}/g;
let match;
const result = [];
while ((match = regex.exec(content)) !== null) {
  const roleName = match[1];
  const perms = match[2];
  
  const canApprove = perms.includes('"canApprove": true');
  const canSubmit = perms.includes('"canSubmit": true');
  
  if (canApprove || canSubmit) {
    result.push(`${roleName}: canApprove=${canApprove}, canSubmit=${canSubmit}`);
  }
}
console.log(result.join('\n'));
