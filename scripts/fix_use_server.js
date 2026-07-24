const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const directory = path.join(__dirname, '..', 'src');

walkDir(directory, function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.startsWith("import { verifySession } from '@/lib/dal/auth';\n'use server';")) {
      content = content.replace("import { verifySession } from '@/lib/dal/auth';\n'use server';", "'use server';\nimport { verifySession } from '@/lib/dal/auth';");
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed use server in ${filePath}`);
    } else if (content.startsWith("import { verifySession } from '@/lib/dal/auth';\n\"use server\";")) {
      content = content.replace("import { verifySession } from '@/lib/dal/auth';\n\"use server\";", "\"use server\";\nimport { verifySession } from '@/lib/dal/auth';");
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed use server in ${filePath}`);
    }
  }
});
