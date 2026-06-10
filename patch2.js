const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject commit functions at the top level
const commitFunctions = `  const commitPercentageEdit = (rowIndex: number, val: string, unitCost: number) => {
    const parsedVal = parseFloat(val) || 0;
    const newData = [...data];
    const newRow = [...newData[rowIndex]];
    
    const prevAmount = parseFloat(String(newRow[10])) || 0;
    const prevPercentage = unitCost > 0 ? (prevAmount / unitCost) * 100 : 0;
    const totalPercentage = prevPercentage + parsedVal;

    if (totalPercentage > 100) {
      window.alert("percentage input exceeds 100%");
      return;
    }

    const totalAmount = unitCost * (totalPercentage / 100);
    newRow[9] = totalAmount;
    newRow[11] = totalAmount - prevAmount;
    newRow[12] = totalAmount;

    let totalProjCost = 0;
    for (let r = newData.length - 1; r >= 0; r--) {
      const rStr = newData[r].join(" ").toUpperCase();
      if (rStr.includes("TOTAL PROJECT COST")) {
        totalProjCost = parseFloat(String(newData[r][5])) || 0;
        break;
      }
    }
    if (totalProjCost > 0) {
      newRow[13] = (newRow[12] / totalProjCost) * 100;
    } else {
      newRow[13] = 0;
    }

    if (val !== "" || newRow[12] > 0) {
      const totalItemCost = parseFloat(String(newRow[5])) || 0;
      if (newRow[12] < totalItemCost - 0.01) {
        newRow[14] = "Ongoing";
      } else {
        newRow[14] = "Completed";
      }
    } else {
      newRow[14] = "";
    }

    newData[rowIndex] = newRow;
    setData(newData);
  };

  const commitQuantityEdit = (rowIndex: number, val: string, unitCost: number, originalQty: number) => {
    const parsedVal = parseFloat(val) || 0;
    const newData = [...data];
    const newRow = [...newData[rowIndex]];
    
    const prevAmount = parseFloat(String(newRow[10])) || 0;
    const prevQty = unitCost > 0 ? prevAmount / unitCost : 0;
    const totalQtyNew = prevQty + parsedVal;

    if (totalQtyNew > originalQty) {
      window.alert("qty input exceeds awarded boq");
      return;
    }

    newRow[7] = val === "" ? prevQty : totalQtyNew;

    const totalAmount = unitCost * newRow[7];
    newRow[9] = totalAmount;
    newRow[11] = totalAmount - prevAmount;
    newRow[12] = totalAmount;

    let totalProjCost = 0;
    for (let r = newData.length - 1; r >= 0; r--) {
      const rStr = newData[r].join(" ").toUpperCase();
      if (rStr.includes("TOTAL PROJECT COST")) {
        totalProjCost = parseFloat(String(newData[r][5])) || 0;
        break;
      }
    }
    if (totalProjCost > 0) {
      newRow[13] = (newRow[12] / totalProjCost) * 100;
    } else {
      newRow[13] = 0;
    }

    if (val !== "" || newRow[12] > 0) {
      const totalItemCost = parseFloat(String(newRow[5])) || 0;
      if (newRow[12] < totalItemCost - 0.01) {
        newRow[14] = "Ongoing";
      } else {
        newRow[14] = "Completed";
      }
    } else {
      newRow[14] = "";
    }

    newData[rowIndex] = newRow;
    setData(newData);
  };

`;

content = content.replace('const handleSave = async (isLocking: boolean = false) => {', commitFunctions + '  const handleSave = async (isLocking: boolean = false) => {');

// 2. Fix isOneLot input
const isOneLotOld = `                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingValue(val);
                          
                          const parsedVal = parseFloat(val) || 0;
                          const prevPercentage = unitCost > 0 ? (prevAmount / unitCost) * 100 : 0;
                          const totalPercentage = prevPercentage + parsedVal;

                          if (totalPercentage > 100) {
                            window.alert("percentage input exceeds 100%");
                            return;
                          }

                          const newData = [...data];
                          const newRow = [...newData[rowIndex]];

                          const totalAmount = unitCost * (totalPercentage / 100);
                          newRow[9] = totalAmount;
                          newRow[11] = totalAmount - prevAmount;
                          newRow[12] = totalAmount;

                          let totalProjCost = 0;
                          for (let r = newData.length - 1; r >= 0; r--) {
                            const rStr = newData[r].join(" ").toUpperCase();
                            if (rStr.includes("TOTAL PROJECT COST")) {
                              totalProjCost = parseFloat(String(newData[r][5])) || 0;
                              break;
                            }
                          }
                          if (totalProjCost > 0) {
                            newRow[13] = (newRow[12] / totalProjCost) * 100;
                          } else {
                            newRow[13] = 0;
                          }

                          if (val !== "" || newRow[12] > 0) {
                            const totalItemCost = parseFloat(String(newRow[5])) || 0;
                            if (newRow[12] < totalItemCost - 0.01) {
                              newRow[14] = "Ongoing";
                            } else {
                              newRow[14] = "Completed";
                            }
                          } else {
                            newRow[14] = "";
                          }

                          newData[rowIndex] = newRow;
                          setData(newData);
                        }}`;

const isOneLotNew = `                        onBlur={() => {
                          commitPercentageEdit(rowIndex, editingValue, unitCost);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            commitPercentageEdit(rowIndex, editingValue, unitCost);
                            setEditingCell(null);
                            setSelectedCell({ r: rowIndex + 1, c: colIndex });
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            commitPercentageEdit(rowIndex, editingValue, unitCost);
                            setEditingCell(null);
                            setSelectedCell({ r: rowIndex - 1, c: colIndex });
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        onChange={(e) => setEditingValue(e.target.value)}`;

content = content.replace(isOneLotOld, isOneLotNew);

// 3. Fix !isOneLot input
const notOneLotOld = `                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          const qtyVal = parseFloat(val) || 0;

                          if (qtyVal > originalQty) {
                            window.alert("qty input exceeds awarded boq");
                            return;
                          }

                          const newData = [...data];
                          const newRow = [...newData[rowIndex]];

                          newRow[7] = val === "" ? "" : val;

                          const totalAmount = unitCost * qtyVal;
                          newRow[9] = totalAmount;

                          const prev = parseFloat(String(newRow[10])) || 0;
                          newRow[11] = totalAmount - prev;
                          newRow[12] = totalAmount;

                          let totalProjCost = 0;
                          for (let r = newData.length - 1; r >= 0; r--) {
                            const rStr = newData[r].join(" ").toUpperCase();
                            if (rStr.includes("TOTAL PROJECT COST")) {
                              totalProjCost = parseFloat(String(newData[r][5])) || 0;
                              break;
                            }
                          }

                          if (totalProjCost > 0) {
                            newRow[13] = (newRow[12] / totalProjCost) * 100;
                          } else {
                            newRow[13] = 0;
                          }

                          if (val !== "" || newRow[12] > 0) {
                            const totalItemCost = parseFloat(String(newRow[5])) || 0;
                            if (newRow[12] < totalItemCost - 0.01) {
                              newRow[14] = "Ongoing";
                            } else {
                              newRow[14] = "Completed";
                            }
                          } else {
                            newRow[14] = "";
                          }

                          newData[rowIndex] = newRow;
                          setData(newData);
                        }}`;

const notOneLotNew = `                        onBlur={() => {
                          commitQuantityEdit(rowIndex, editingValue, unitCost, originalQty);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            commitQuantityEdit(rowIndex, editingValue, unitCost, originalQty);
                            setEditingCell(null);
                            setSelectedCell({ r: rowIndex + 1, c: colIndex });
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            commitQuantityEdit(rowIndex, editingValue, unitCost, originalQty);
                            setEditingCell(null);
                            setSelectedCell({ r: rowIndex - 1, c: colIndex });
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        onChange={(e) => setEditingValue(e.target.value)}`;

content = content.replace(notOneLotOld, notOneLotNew);

// Also fix the value={currentInput} to be displayValue in the !isOneLot input, as my previous patch didn't do it because I skipped !isOneLot earlier since I realized the frontend already worked?
// Wait, for !isOneLot, the patch I wrote earlier had:
// value={displayValue}
// Let me just replace `value={currentInput}` with `value={displayValue}` manually in case it's there.
content = content.replace(/value=\{currentInput\}\s*placeholder="Qty"/g, 'value={editingCell === cellId ? editingValue : currentInput}\n                        placeholder="0"');

fs.writeFileSync(file, content);
console.log("Done");
