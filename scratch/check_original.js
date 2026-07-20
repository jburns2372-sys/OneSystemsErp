const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/public/uploads/accomplishments', '1781009169427-444429790-Project_Accomplishment_Report_Template.xlsx');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellStyles: true });
const wsName = workbook.SheetNames[0];
const ws = workbook.Sheets[wsName];

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
    console.log("Mobilization not found in original file");
}
