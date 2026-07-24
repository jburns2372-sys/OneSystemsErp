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

    // If 'use server' is in the file but not at the top, and we imported verifySession at the top
    if (content.includes("'use server';") && !content.startsWith("'use server';")) {
       let lines = content.split('\n');
       let useServerIdx = lines.findIndex(l => l.trim() === "'use server';");
       if (useServerIdx > 0 && useServerIdx < 5) {
           // Remove 'use server';
           lines.splice(useServerIdx, 1);
           // Put it at the very top
           lines.unshift("'use server';");
           fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
           console.log(`Fixed use server in ${filePath}`);
       }
    }
  }
});
