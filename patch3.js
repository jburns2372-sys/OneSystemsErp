const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'autoFocus={editingCell === cellId}\n                        onBlur={() => {',
  'autoFocus={editingCell === cellId}\n                        onFocus={() => {\n                          setEditingCell(cellId);\n                          setEditingValue(currentInput);\n                        }}\n                        onBlur={() => {'
);

fs.writeFileSync(file, content);
console.log("Done");
