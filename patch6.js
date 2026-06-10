const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix isLocking logic for empty inputs to preserve previous progress correctly in the frontend data model
const oldIsLockingEmpty = `            if (currentInput === "") {
              newRow[9] = 0; 
              newRow[11] = 0; 
              const prev = parseFloat(String(newRow[10])) || 0;
              newRow[12] = prev;`;

const newIsLockingEmpty = `            if (currentInput === "") {
              const prev = parseFloat(String(newRow[10])) || 0;
              newRow[9] = prev; 
              newRow[11] = 0; 
              newRow[12] = prev;`;
content = content.replace(oldIsLockingEmpty, newIsLockingEmpty);

// 2. Prevent overwriting Excel formulas by passing undefined for Columns 12, 13, and 14 in the final output array
const oldExcelMap = `      const excelDataToSave = dataToSave.map((row, i) => {
        if (i < 2) return row;
        const newRow = [...row];
        if (typeof newRow[6] === 'number') newRow[6] = newRow[6] / 100;
        if (typeof newRow[13] === 'number') newRow[13] = newRow[13] / 100;
        return newRow;
      });`;

const newExcelMap = `      const excelDataToSave = dataToSave.map((row, i) => {
        if (i < 2) return row;
        const newRow = [...row];
        if (typeof newRow[6] === 'number') newRow[6] = newRow[6] / 100;
        
        // Skip writing to columns 12, 13, and 14 so that Excel's native formulas are preserved and handle the math
        newRow[11] = undefined;
        newRow[12] = undefined;
        newRow[13] = undefined;
        
        return newRow;
      });`;
content = content.replace(oldExcelMap, newExcelMap);

fs.writeFileSync(file, content);
console.log("Done");
