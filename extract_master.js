const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\a8cad02c-18f9-4bad-a60c-e3b2f3d8fcf5\\.system_generated\\logs\\transcript.jsonl', 'utf-8').split('\n');
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' && data.content && data.content.includes('MASTER ANTIGRAVITY INSTRUCTION')) {
      fs.writeFileSync('C:\\Users\\user\\Documents\\JD SOFTWARE PROJECTS\\PGH-PMS\\full_master_instruction.txt', data.content);
      console.log('Extracted to full_master_instruction.txt');
      break;
    }
  } catch (e) {
  }
}
