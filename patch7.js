const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add tableStartRow state
const oldState = '  const [isSaving, setIsSaving] = useState(false);';
const newState = '  const [isSaving, setIsSaving] = useState(false);\n  const [tableStartRow, setTableStartRow] = useState(0);';
content = content.replace(oldState, newState);

// 2. Set tableStartRow in loadData and remove empty row filtering
const oldLoadDataStart = `              startRowIndex = i; // Keep the header row
              break;
            }
          }

          // Filter out completely empty rows
          let cleanedData = jsonData.slice(startRowIndex).filter(row => row.some(cell => cell !== ""));`;

const newLoadDataStart = `              startRowIndex = i; // Keep the header row
              break;
            }
          }
          setTableStartRow(startRowIndex);

          // Do NOT filter out completely empty rows to perfectly preserve Excel physical row alignment!
          let cleanedData = jsonData.slice(startRowIndex);`;
content = content.replace(oldLoadDataStart, newLoadDataStart);

// 3. Update handleSave to use tableStartRow as the origin
const oldSheetAdd = `      // Inject modified data back into the sheet starting at A1
      XLSX.utils.sheet_add_aoa(ws, excelDataToSave, { origin: "A1" });`;

const newSheetAdd = `      // Inject modified data back into the sheet at exactly the original row index offset!
      XLSX.utils.sheet_add_aoa(ws, excelDataToSave, { origin: { r: tableStartRow, c: 0 } });`;
content = content.replace(oldSheetAdd, newSheetAdd);

fs.writeFileSync(file, content);
console.log("Done");
