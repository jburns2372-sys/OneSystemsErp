const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/app/actions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace synchronous cookies() with asynchronous await cookies()
  content = content.replace(/const cookieStore = cookies\(\);/g, 'const cookieStore = await cookies();');
  
  fs.writeFileSync(filePath, content);
}
console.log('Fixed cookies() await in frontend actions!');
