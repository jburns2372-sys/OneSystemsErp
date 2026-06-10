const fs = require('fs');

const transcriptPath = `C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\a8cad02c-18f9-4bad-a60c-e3b2f3d8fcf5\\.system_generated\\logs\\transcript.jsonl`;
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  const obj = JSON.parse(line);
  if (obj.step_index === 1388) {
    fs.writeFileSync('C:\\Users\\user\\Documents\\JD SOFTWARE PROJECTS\\PGH-PMS\\extracted_master.txt', obj.content);
    console.log('Extracted master instruction to extracted_master.txt');
    break;
  }
}
