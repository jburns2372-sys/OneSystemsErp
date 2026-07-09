const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ACTIONS_DIR = path.join(process.cwd(), 'src/app/actions');
const AWS_ROUTES_DIR = path.join(process.cwd(), 'apps/aws-backend/src/routes');
const AWS_INDEX_PATH = path.join(process.cwd(), 'apps/aws-backend/src/index.ts');

const PROMPT_TEMPLATE = `You are an expert TypeScript developer performing a migration.
I have a Next.js Server Action file that directly accesses a Prisma database.
I need to decouple it into two separate files:
1. An AWS Express.js Router file that handles the Prisma logic.
2. A Next.js Server Action file that acts as a simple proxy to the AWS backend using a \`fetchWithAuth\` wrapper.

### INSTRUCTIONS:
- The AWS Express router should export a standard \`Router()\` from 'express'. Map each exported function from the original file to a \`router.post('/functionName', ...)\` endpoint.
- Use \`req.body\` to extract arguments. Return \`res.json({ success: true, ... })\`. Handle try/catch and return 500 on error.
- The Next.js Server Action MUST maintain the EXACT SAME exported function names and arguments as the original file, so the UI doesn't break!
- The Next.js Action must use \`fetchWithAuth('/api/ROUTE_NAME/functionName', { method: 'POST', body: JSON.stringify({...args}) })\`.
- DO NOT FORGET to include \`revalidatePath\` or \`revalidateTag\` in the Next.js Action if it was in the original file (call it after a successful fetch).
- Include the standard \`fetchWithAuth\` definition at the top of the Next.js file.

You MUST return EXACTLY a valid JSON object with no markdown formatting, no \`\`\`json wrappers. Just raw JSON.
Format:
{
  "awsBackendCode": "import { Router } from 'express';\\n...",
  "nextjsProxyCode": "'use server';\\n..."
}

Here is the original Next.js Server Action code:
`;

async function migrateFile(filePath: string, fileName: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('import { prisma }')) {
    console.log(`Skipping ${fileName} (no prisma import)`);
    return null;
  }

  const routeName = fileName.replace('.ts', '');
  
  console.log(`Migrating ${fileName}...`);
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATE + "\n\n" + content + "\n\nRoute Name for API should be: " + routeName }] }],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text || '{}';
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.log('JSON Parse failed. Response was:', resultText);
      return null;
    }

    // Write AWS Route
    const awsRoutePath = path.join(AWS_ROUTES_DIR, fileName);
    fs.writeFileSync(awsRoutePath, result.awsBackendCode);

    // Overwrite Next.js Action
    fs.writeFileSync(filePath, result.nextjsProxyCode);

    console.log(`✅ Successfully migrated ${fileName}`);
    return routeName;
  } catch (error: any) {
    console.error(`❌ Failed to migrate ${fileName}:`, error.message);
    return null;
  }
}

async function run() {
  const files = fs.readdirSync(ACTIONS_DIR).filter((f: string) => f.endsWith('.ts'));
  const migratedRoutes: string[] = [];

  for (const file of files) {
    const routeName = await migrateFile(path.join(ACTIONS_DIR, file), file);
    if (routeName) {
      migratedRoutes.push(routeName);
    }
  }

  if (migratedRoutes.length > 0) {
    console.log('\nRegistering routes in index.ts...');
    let indexContent = fs.readFileSync(AWS_INDEX_PATH, 'utf8');
    
    const imports = migratedRoutes.map(r => `import ${r}Routes from './routes/${r}';`).join('\n');
    indexContent = indexContent.replace(/(import .*;\n)+/, (match: string) => match + imports + '\n');

    const uses = migratedRoutes.map(r => `app.use('/api/${r}', ${r}Routes);`).join('\n');
    indexContent = indexContent.replace(/(app\.use\('\/api\/.*'.*;\n)+/, (match: string) => match + uses + '\n');

    fs.writeFileSync(AWS_INDEX_PATH, indexContent);
    console.log('✅ Registered all new routes');
  }
  
  console.log('\nMigration Complete!');
}

run();
