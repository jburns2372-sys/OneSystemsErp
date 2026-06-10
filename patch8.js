const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix tryEditCell to display percentage instead of peso amount for isOneLot items
content = content.replace(
  /if \(isOneLot && c === 9\) \{\s*setEditingCell\(`\$\{r\}-\$\{c\}`\);\s*setEditingValue\(initialChar !== undefined \? initialChar : String\(row\[9\] \?\? ""\)\);\s*return true;\s*\}/g,
  "if (isOneLot && c === 9) {\\n" +
  "      setEditingCell(`${r}-${c}`);\\n" +
  "      const thisPeriodAmt = parseFloat(String(row[11])) || 0;\\n" +
  "      const thisPeriodPct = unitCost > 0 ? (thisPeriodAmt / unitCost) * 100 : 0;\\n" +
  "      setEditingValue(initialChar !== undefined ? initialChar : (thisPeriodAmt > 0 ? thisPeriodPct.toString() : \\"\\"));\\n" +
  "      return true;\\n" +
  "    }"
);

// 2. Fix loadData to stop squaring the total amount
content = content.replace(
  /let totalToDate = parseFloat\(String\(row\[9\]\)\) \|\| 0;\s*if \(isOneLot\) \{\s*totalToDate = totalItemCost \* \(totalToDate \/ 100\);\s*\}/g,
  "let totalToDate = parseFloat(String(row[9])) || 0;"
);

fs.writeFileSync(file, content);
console.log('Patch applied successfully.');
