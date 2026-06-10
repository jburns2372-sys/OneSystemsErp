const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/public/uploads/accomplishments', '1781009169427-444429790-Project_Accomplishment_Report_Template.xlsx');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellStyles: true });
const wsName = workbook.SheetNames[0];
const ws = workbook.Sheets[wsName];

const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

let startRowIndex = 0;
for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row.some(cell => {
        const str = String(cell).toLowerCase();
        return str.includes("item") || str.includes("description");
    })) {
        startRowIndex = i;
        break;
    }
}

let cleanedData = jsonData.slice(startRowIndex);

const excelDataToSave = cleanedData.map((row, i) => {
    if (i < 2) return row;
    const newRow = [...row];
    if (typeof newRow[6] === 'number') newRow[6] = newRow[6] / 100;
    
    // Skip columns 12, 13, 14
    newRow[11] = undefined;
    newRow[12] = undefined;
    newRow[13] = undefined;
    
    return newRow;
});

// Simulate the user editing Mobilization
const mobRow = excelDataToSave.findIndex(row => String(row[1]).includes("Mobilization"));
if (mobRow !== -1) {
    excelDataToSave[mobRow][9] = 103229.00; // User sets Total to 103229.00
}

XLSX.utils.sheet_add_aoa(ws, excelDataToSave, { origin: { r: startRowIndex, c: 0 } });

console.log("After modification:");
const range = XLSX.utils.decode_range(ws['!ref']);
let foundRow = -1;
for (let r = range.s.r; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({r: r, c: 1})];
    if (cell && cell.v && String(cell.v).includes("Mobilization")) {
        foundRow = r;
        break;
    }
}

if (foundRow !== -1) {
    console.log("Mobilization found at row index:", foundRow);
    for (let c = 0; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({r: foundRow, c: c});
        const cell = ws[cellAddress];
        if (cell) {
            console.log("Cell " + cellAddress + " [Col " + c + "]: value = " + cell.v + ", formula = " + cell.f);
        }
    }
} else {
    console.log("Mobilization not found in modified file");
}
