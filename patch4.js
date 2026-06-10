const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update commitPercentageEdit to optionally take currentData and return newData
const oldCommitPercentageEdit = `  const commitPercentageEdit = (rowIndex: number, val: string, unitCost: number) => {
    const parsedVal = parseFloat(val) || 0;
    const newData = [...data];`;

const newCommitPercentageEdit = `  const commitPercentageEdit = (rowIndex: number, val: string, unitCost: number, currentData?: any[][]) => {
    const parsedVal = parseFloat(val) || 0;
    const baseData = currentData || data;
    const newData = [...baseData];`;

content = content.replace(oldCommitPercentageEdit, newCommitPercentageEdit);

const oldSetDataPerc = `    newData[rowIndex] = newRow;
    setData(newData);
  };`;
const newSetDataPerc = `    newData[rowIndex] = newRow;
    setData(newData);
    return newData;
  };`;
content = content.replace(oldSetDataPerc, newSetDataPerc);

// 2. Update commitQuantityEdit
const oldCommitQuantityEdit = `  const commitQuantityEdit = (rowIndex: number, val: string, unitCost: number, originalQty: number) => {
    const parsedVal = parseFloat(val) || 0;
    const newData = [...data];`;

const newCommitQuantityEdit = `  const commitQuantityEdit = (rowIndex: number, val: string, unitCost: number, originalQty: number, currentData?: any[][]) => {
    const parsedVal = parseFloat(val) || 0;
    const baseData = currentData || data;
    const newData = [...baseData];`;

content = content.replace(oldCommitQuantityEdit, newCommitQuantityEdit);

const oldSetDataQty = `    newData[rowIndex] = newRow;
    setData(newData);
  };`;
const newSetDataQty = `    newData[rowIndex] = newRow;
    setData(newData);
    return newData;
  };`;
content = content.replace(oldSetDataQty, newSetDataQty);

// 3. Update handleSave to call these functions and use the returned data
const oldHandleSave = `  const handleSave = async (isLocking: boolean = false) => {
    try {
      setIsSaving(true);
      
      let finalFileName = fileRecord.fileName;`;

const newHandleSave = `  const handleSave = async (isLocking: boolean = false) => {
    try {
      setIsSaving(true);

      let dataToSave = data;
      if (editingCell) {
        const [rStr, cStr] = editingCell.split('-');
        const r = parseInt(rStr);
        const c = parseInt(cStr);
        const row = data[r];
        const unitCost = parseFloat(String(row[4])) || 0;
        const originalQty = parseFloat(String(row[3])) || 0;
        
        if (c === 9) {
          const updated = commitPercentageEdit(r, editingValue, unitCost, data);
          if (updated) dataToSave = updated;
        } else if (c === 7) {
          const updated = commitQuantityEdit(r, editingValue, unitCost, originalQty, data);
          if (updated) dataToSave = updated;
        }
        setEditingCell(null);
      }
      
      let finalFileName = fileRecord.fileName;`;

content = content.replace(oldHandleSave, newHandleSave);

// 4. In handleSave, replace `data` with `dataToSave` in the loop that populates the Excel workbook
const oldLoop = `        data.forEach((row, rowIndex) => {`;
const newLoop = `        dataToSave.forEach((row, rowIndex) => {`;
content = content.replace(oldLoop, newLoop);

fs.writeFileSync(file, content);
console.log("Done");
