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
    // Skip already modified auth files
    if (filePath.includes('src\\auth.ts') || filePath.includes('src/auth.ts')) return;
    if (filePath.includes('src\\proxy.ts') || filePath.includes('src/proxy.ts')) return;
    if (filePath.includes('src\\app\\actions\\auth.ts') || filePath.includes('src/app/actions/auth.ts')) return;
    if (filePath.includes('src\\app\\actions\\user.ts') || filePath.includes('src/app/actions/user.ts')) return;
    if (filePath.includes('src\\lib\\dal\\auth.ts') || filePath.includes('src/lib/dal/auth.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    let needsVerifySession = false;

    // Replace cookieStore.get('session')
    const regex1 = /const\s+(userId|sessionId|session|sessionToken|authToken)\s*=\s*(?:await\s+)?cookieStore\.get\(['"]session['"]\)\?\.value.*?;/g;
    content = content.replace(regex1, (match, varName) => {
      needsVerifySession = true;
      return `const __session = await verifySession();\n  const ${varName} = __session?.id || '';`;
    });

    const regex2 = /const\s+(userId|sessionId|session|sessionToken|authToken)\s*=\s*cookies\(\)\.get\(['"]session['"]\)\?\.value.*?;/g;
    content = content.replace(regex2, (match, varName) => {
      needsVerifySession = true;
      return `const __session = await verifySession();\n  const ${varName} = __session?.id || '';`;
    });
    
    // Also catch `return cookieStore.get('session')?.value || '';`
    const regex3 = /return\s+(?:await\s+)?cookieStore\.get\(['"]session['"]\)\?\.value.*?;/g;
    content = content.replace(regex3, () => {
      needsVerifySession = true;
      return `const __session = await verifySession();\n  return __session?.id || '';`;
    });

    if (content.includes('__session?.id') && filePath.includes('\\api\\') && content.includes('return NextResponse.json({ error: \'Unauthorized\' }')) {
      const authCheckRegex = /if\s*\(\!(userId|sessionId|session|sessionToken|authToken)\)\s*\{\s*return\s*NextResponse\.json/g;
      content = content.replace(authCheckRegex, 'if (!__session) { return NextResponse.json');
    }

    if (needsVerifySession && content !== original) {
      if (!content.includes('verifySession')) {
        if (!content.includes("from '@/lib/dal/auth'")) {
           content = "import { verifySession } from '@/lib/dal/auth';\n" + content;
        }
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
