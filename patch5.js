const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the data.map override
const oldDataMap = `      if (isLocking) {
        dataToSave = data.map((row, i) => {`;
const newDataMap = `      if (isLocking) {
        dataToSave = dataToSave.map((row, i) => {`;
content = content.replace(oldDataMap, newDataMap);

// 2. Fix the TOTAL PROJECT COST loop inside isLocking to use dataToSave instead of data
const oldProjCostLoop = `              let totalProjCost = 0;
              for (let r = data.length - 1; r >= 0; r--) {
                const rStr = data[r].join(" ").toUpperCase();
                if (rStr.includes("TOTAL PROJECT COST")) {
                  totalProjCost = parseFloat(String(data[r][5])) || 0;
                  break;
                }
              }`;
const newProjCostLoop = `              let totalProjCost = 0;
              for (let r = dataToSave.length - 1; r >= 0; r--) {
                const rStr = dataToSave[r].join(" ").toUpperCase();
                if (rStr.includes("TOTAL PROJECT COST")) {
                  totalProjCost = parseFloat(String(dataToSave[r][5])) || 0;
                  break;
                }
              }`;
content = content.replace(oldProjCostLoop, newProjCostLoop);

// 3. Fix the percentage formula and blanking inside isLocking
const oldIsLockingLogic = `            if (currentInput === "") {
              newRow[9] = ""; // Keep hidden
              newRow[11] = ""; // Keep hidden
              const prev = parseFloat(String(newRow[10])) || 0;
              newRow[12] = prev;

              let totalProjCost = 0;
              for (let r = dataToSave.length - 1; r >= 0; r--) {
                const rStr = dataToSave[r].join(" ").toUpperCase();
                if (rStr.includes("TOTAL PROJECT COST")) {
                  totalProjCost = parseFloat(String(dataToSave[r][5])) || 0;
                  break;
                }
              }
              if (totalProjCost > 0) newRow[13] = newRow[12] / totalProjCost;`;

const newIsLockingLogic = `            if (currentInput === "") {
              newRow[9] = 0; 
              newRow[11] = 0; 
              const prev = parseFloat(String(newRow[10])) || 0;
              newRow[12] = prev;

              let totalProjCost = 0;
              for (let r = dataToSave.length - 1; r >= 0; r--) {
                const rStr = dataToSave[r].join(" ").toUpperCase();
                if (rStr.includes("TOTAL PROJECT COST")) {
                  totalProjCost = parseFloat(String(dataToSave[r][5])) || 0;
                  break;
                }
              }
              if (totalProjCost > 0) newRow[13] = (newRow[12] / totalProjCost) * 100;`;
content = content.replace(oldIsLockingLogic, newIsLockingLogic);

// 4. Normalize percentages before saving
const oldSheetAdd = `      // Inject modified data back into the sheet starting at A1
      XLSX.utils.sheet_add_aoa(ws, dataToSave, { origin: "A1" });`;

const newSheetAdd = `      // Normalize percentages to decimals for Excel
      const excelDataToSave = dataToSave.map((row, i) => {
        if (i < 2) return row;
        const newRow = [...row];
        if (typeof newRow[6] === 'number') newRow[6] = newRow[6] / 100;
        if (typeof newRow[13] === 'number') newRow[13] = newRow[13] / 100;
        return newRow;
      });

      // Inject modified data back into the sheet starting at A1
      XLSX.utils.sheet_add_aoa(ws, excelDataToSave, { origin: "A1" });`;
content = content.replace(oldSheetAdd, newSheetAdd);

fs.writeFileSync(file, content);
console.log("Done");
