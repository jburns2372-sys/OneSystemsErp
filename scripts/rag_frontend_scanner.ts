import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const IGNORED_WORDS = new Set(['div', 'span', 'import', 'export', 'const', 'return', 'the', 'and', 'or', 'a', 'an', 'is', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'of', 'in', 'as']);

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function main() {
  console.log("Starting Auto-Scan of Frontend Labels for RAG Coverage...");

  const files = scanDirectory(path.join(process.cwd(), 'src', 'app'));
  const foundPhrases = new Set<string>();

  const regex = />([A-Z][A-Za-z0-9\s]{2,30})<\//g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const phrase = match[1].trim();
      if (phrase.length > 3 && !IGNORED_WORDS.has(phrase.toLowerCase())) {
        foundPhrases.add(phrase);
      }
    }
  }

  console.log(`Found ${foundPhrases.size} potential frontend labels. Seeding...`);

  let added = 0;
  for (const phrase of foundPhrases) {
    const normalized = phrase.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    try {
      await prisma.aiUiActionRegistry.upsert({
        where: { normalizedLabel_actionType: { normalizedLabel: normalized, actionType: 'page_text' } },
        create: {
          uiLabel: phrase,
          normalizedLabel: normalized,
          actionType: 'page_text'
        },
        update: {}
      });
      added++;
    } catch (e) {
      // Ignore dupes
    }
  }

  console.log(`\n✅ Frontend Auto-Scan Complete! Added ${added} new keywords based on UI labels.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
