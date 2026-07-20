const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const callSites = [];
const directory = path.join(__dirname, '..', 'src');

walkDir(directory, function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes(".get('session')") || line.includes('cookieStore.get("session")')) {
        callSites.push({
          file: filePath.replace(path.join(__dirname, '..') + path.sep, ''),
          line: i + 1,
          content: line.trim()
        });
      }
    });
  }
});

fs.writeFileSync(path.join(__dirname, 'gate5d_cookie_inventory.json'), JSON.stringify(callSites, null, 2));
console.log(`Found ${callSites.length} cookie readers.`);
