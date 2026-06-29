const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'app', 'actions', 'accomplishmentFileActions.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Add helper function after imports
const helper = `
import fs from 'fs';
import path from 'path';

async function saveFileLocallyOrBlob(directory: string, fileName: string, buffer: Buffer, contentType?: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(\`\${directory}/\${fileName}\`, buffer, {
      access: 'public',
      contentType: contentType || "application/octet-stream",
    });
    return blob.url;
  } else {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', directory);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    return \`/uploads/\${directory}/\${fileName}\`;
  }
}
`;

// Insert the helper after the imports
content = content.replace(/import ExcelJS from "exceljs";/, `import ExcelJS from "exceljs";${helper}`);

// Replace line 23
content = content.replace(
  /const blob = await put\(`accomplishments\/\$\{newFileName\}`[^}]+\}\);\s*const publicPath = blob\.url;/m,
  `const publicPath = await saveFileLocallyOrBlob("accomplishments", newFileName, buffer, file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");`
);

// Replace line 151
content = content.replace(
  /const blob = await put\(`accomplishments\/\$\{newFileName\}`[^}]+\}\);\s*const originalFilePath = blob\.url;/m,
  `const originalFilePath = await saveFileLocallyOrBlob("accomplishments", newFileName, sourceBuffer, fileRecord.fileType);`
);

// Replace line 185
content = content.replace(
  /const blob = await put\(`accomplishments\/\$\{newFileName\}`[^}]+\}\);\s*const originalFilePath = blob\.url;/m,
  `const originalFilePath = await saveFileLocallyOrBlob("accomplishments", newFileName, buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");`
);

// Replace line 226
content = content.replace(
  /const blob = await put\(`accomplishments\/\$\{newPhysicalFileName\}`[^}]+\}\);\s*const physicalFilePath = blob\.url;/m,
  `const physicalFilePath = await saveFileLocallyOrBlob("accomplishments", newPhysicalFileName, buffer, "image/jpeg");`
);

// Replace line 365
content = content.replace(
  /const blob = await put\(`accomplishments\/\$\{newPhysicalFileName\}`[^}]+\}\);\s*const physicalFilePath = blob\.url;/m,
  `const physicalFilePath = await saveFileLocallyOrBlob("accomplishments", newPhysicalFileName, finalBuffer, "image/jpeg");`
);

fs.writeFileSync(targetFile, content);
console.log("Successfully patched accomplishmentFileActions.ts!");
