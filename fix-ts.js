const fs = require('fs');

function replaceInFile(path, search, replacement) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.split(search).join(replacement);
  fs.writeFileSync(path, content);
  console.log(`Replaced in ${path}`);
}

replaceInFile('src/app/variation-orders/[id]/page.tsx', 'preCheckVariationOrder(voId)', "preCheckVariationOrder(voId, 'SYSTEM')");
replaceInFile('src/app/supplier-payables/page.tsx', 'bill.endorsedForPayment', '(bill as any).endorsedForPayment');
replaceInFile('src/app/subcontracting/packages/[id]/page.tsx', 'pkg.isLocked', '(pkg as any).isLocked');
replaceInFile('src/app/subcontracting/progress-hub/report-viewer/page.tsx', 'pkg.itemBreakdown', '(pkg as any).itemBreakdown');
replaceInFile('src/app/supplier-payables/subcontract/[id]/page.tsx', 'subcontractor.tradeCategory', '(subcontractor as any).tradeCategory');
replaceInFile('src/app/supplier-payables/subcontract/[id]/page.tsx', 'subcontractor.vatStatus', '(subcontractor as any).vatStatus');

// Fix users/page.tsx TS2322: Type 'string | null' is not assignable to type 'string'.
replaceInFile('src/app/users/page.tsx', 'value={newUser.roleCode}', 'value={newUser.roleCode || ""}');
replaceInFile('src/app/users/page.tsx', 'value={newUser.description}', 'value={newUser.description || ""}');
