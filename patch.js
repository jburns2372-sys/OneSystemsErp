const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix isOneLot
content = content.replace(/const isOneLot = \(qtyVal === 1 && \(unitVal === "lot" \|\| unitVal === "assy"\)\) \|\| \(originalQty === 1 && \s*\(originalUnit === "lot" \|\| originalUnit === "assy"\)\);/g, 'const isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");');

// Fix the exact string match for the second one if the regex misses due to newline
content = content.replace('const isOneLot = (qtyVal === 1 && (unitVal === "lot" || unitVal === "assy")) || (originalQty === 1 && \n(originalUnit === "lot" || originalUnit === "assy"));', 'const isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");');

content = content.replace('const isOneLot = (qtyVal === 1 && (unitVal === "lot" || unitVal === "assy")) || (originalQty === 1 && \r\n(originalUnit === "lot" || originalUnit === "assy"));', 'const isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");');

// 2. Remove commitPercentageEdit and commitQuantityEdit
content = content.replace(/const commitPercentageEdit = [\s\S]*?const commitQuantityEdit = [\s\S]*?newData\[rowIndex\] = newRow;\s*setData\(newData\);\s*\};\s*/g, '');

// 3. Rewrite isOneLot rendering logic
const isOneLotTarget = `              if (!isHeader && isOneLot && colIndex === 9 && unitCost > 0) {
                const currentInput = cell !== null && cell !== undefined ? String(cell) : "";
                const currentPercentage = parseFloat(currentInput) || 0;
                const calculatedTotal = unitCost * (currentPercentage / 100);
                
                const cellId = \`\${rowIndex}-\${colIndex}\`;
                const isEditing = !fileRecord.isLockedOriginal && !isPreviouslyCompleted && (editingCell === cellId || currentPercentage === 0 || currentInput === "");

                if (isEditing) {
                  const displayValue = editingCell === cellId ? editingValue : currentInput;
                  cellContent = (
                    <div className="flex flex-col items-end gap-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          className="w-full bg-blue-800/80 text-white font-bold border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-right shadow-inner"
                          value={displayValue}
                          placeholder="%"
                          step="0.01"
                          autoFocus={editingCell === cellId}
                          onFocus={() => {
                            setEditingCell(cellId);
                            setEditingValue(currentInput);
                          }}
                          onBlur={() => {
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
                          onChange={(e) => setEditingValue(e.target.value)}
                        />
                        <span className="text-sm font-bold text-gray-400">%</span>
                      </div>
                    </div>
                  );
                } else {
                  if (isPreviouslyCompleted) {
                    cellContent = "0";
                  } else {
                    cellContent = (
                      <div
                        className={\`w-full h-full min-w-[120px] text-right bg-blue-900/40 border border-blue-500/50 p-1 rounded text-blue-100 \${!isPreviouslyCompleted ? 'cursor-text hover:bg-blue-800/60 transition-colors' : 'font-bold'}\`}
                        onClick={() => {
                          if (!isPreviouslyCompleted) {
                            setEditingCell(cellId);
                            setEditingValue(currentInput);
                          }
                        }}
                        title={!isPreviouslyCompleted ? "Click to edit percentage" : "Completed"}
                      >
                        {calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    );
                  }
                }
              }`;

const isOneLotReplacement = `              if (!isHeader && isOneLot && colIndex === 9 && unitCost > 0) {
                const monetaryValue = parseFloat(String(cell)) || 0;
                const prevAmount = parseFloat(String(row[10])) || 0;
                const thisPeriodAmount = monetaryValue - prevAmount;
                
                let thisPeriodPercentage = unitCost > 0 ? (thisPeriodAmount / unitCost) * 100 : 0;
                thisPeriodPercentage = Math.round(thisPeriodPercentage * 10000) / 10000;

                const cellId = \`\${rowIndex}-\${colIndex}\`;
                const isEditing = !fileRecord.isLockedOriginal && !isPreviouslyCompleted && (editingCell === cellId || thisPeriodPercentage === 0);

                if (isEditing) {
                  const displayValue = editingCell === cellId ? editingValue : (thisPeriodPercentage === 0 ? "" : thisPeriodPercentage.toString());
                  cellContent = (
                    <div className="flex flex-col items-end gap-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          className="w-full bg-blue-800/80 text-white font-bold border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-right shadow-inner"
                          value={displayValue}
                          placeholder="0"
                          step="0.01"
                          autoFocus={editingCell === cellId}
                          onFocus={() => {
                            setEditingCell(cellId);
                            setEditingValue(displayValue);
                          }}
                          onBlur={() => setEditingCell(null)}
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
                          }}
                        />
                        <span className="text-sm font-bold text-gray-400">%</span>
                      </div>
                    </div>
                  );
                } else {
                  if (isPreviouslyCompleted) {
                    cellContent = "0";
                  } else {
                    cellContent = (
                      <div
                        className={\`w-full h-full min-w-[120px] text-right bg-blue-900/40 border border-blue-500/50 p-1 rounded text-blue-100 \${!isPreviouslyCompleted ? 'cursor-text hover:bg-blue-800/60 transition-colors' : 'font-bold'}\`}
                        onClick={() => {
                          if (!isPreviouslyCompleted) {
                            setEditingCell(cellId);
                            setEditingValue(thisPeriodPercentage === 0 ? "" : thisPeriodPercentage.toString());
                          }
                        }}
                        title={!isPreviouslyCompleted ? "Click to edit percentage" : "Completed"}
                      >
                        {monetaryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    );
                  }
                }
              }`;

content = content.replace(isOneLotTarget, isOneLotReplacement);

// 4. Rewrite !isOneLot rendering logic
const notOneLotTarget = `              } else if (!isHeader && !isOneLot && colIndex === 7 && unitCost > 0) {
                const currentInput = cell !== null && cell !== undefined ? String(cell) : "";
                const encodedQty = parseFloat(currentInput) || 0;
  
                const cellId = \`\${rowIndex}-\${colIndex}\`;
                const isEditing = !fileRecord.isLockedOriginal && !isPreviouslyCompleted && (editingCell === cellId || currentInput === "");
  
                if (isEditing) {
                  cellContent = (
                    <div className="flex flex-col items-end gap-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          className="w-full bg-blue-800/80 text-white font-bold border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-right shadow-inner"
                          value={currentInput}
                          placeholder="Qty"
                          step="0.01"
                          autoFocus={editingCell === cellId}
                          onBlur={() => setEditingCell(null)}
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
                          }}
                        />
                      </div>
                    </div>
                  );
                } else {
                  if (isPreviouslyCompleted) {
                    cellContent = "0";
                  } else {
                    cellContent = (
                      <div
                        className={\`w-full h-full min-w-[120px] text-right bg-blue-900/40 border border-blue-500/50 p-1 rounded font-bold text-blue-100 whitespace-nowrap \${!isPreviouslyCompleted ? 'cursor-text hover:bg-blue-800/60 transition-colors' : ''}\`}
                        onClick={() => {
                          if (!isPreviouslyCompleted) {
                            setEditingCell(cellId);
                            setEditingValue(currentInput);
                          }
                        }}
                        title={!isPreviouslyCompleted ? "Click to edit quantity" : "Completed"}
                      >
                        {encodedQty.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    );
                  }
                }
              }`;

const notOneLotReplacement = `              } else if (!isHeader && !isOneLot && colIndex === 7 && unitCost > 0) {
                const totalQty = parseFloat(String(cell)) || 0;
                const prevAmount = parseFloat(String(row[10])) || 0;
                const prevQty = unitCost > 0 ? prevAmount / unitCost : 0;
                
                let thisPeriodQty = totalQty - prevQty;
                thisPeriodQty = Math.round(thisPeriodQty * 10000) / 10000;
  
                const cellId = \`\${rowIndex}-\${colIndex}\`;
                const isEditing = !fileRecord.isLockedOriginal && !isPreviouslyCompleted && (editingCell === cellId || thisPeriodQty === 0);
  
                if (isEditing) {
                  const displayValue = editingCell === cellId ? editingValue : (thisPeriodQty === 0 ? "" : thisPeriodQty.toString());
                  cellContent = (
                    <div className="flex flex-col items-end gap-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          className="w-full bg-blue-800/80 text-white font-bold border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-right shadow-inner"
                          value={displayValue}
                          placeholder="0"
                          step="0.01"
                          autoFocus={editingCell === cellId}
                          onFocus={() => {
                            setEditingCell(cellId);
                            setEditingValue(displayValue);
                          }}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingValue(val);
                            
                            const parsedVal = parseFloat(val) || 0;
                            const totalQtyNew = prevQty + parsedVal;
  
                            if (totalQtyNew > originalQty) {
                              window.alert("qty input exceeds awarded boq");
                              return;
                            }
  
                            const newData = [...data];
                            const newRow = [...newData[rowIndex]];
  
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
                          }}
                        />
                      </div>
                    </div>
                  );
                } else {
                  if (isPreviouslyCompleted) {
                    cellContent = "0";
                  } else {
                    cellContent = (
                      <div
                        className={\`w-full h-full min-w-[120px] text-right bg-blue-900/40 border border-blue-500/50 p-1 rounded font-bold text-blue-100 whitespace-nowrap \${!isPreviouslyCompleted ? 'cursor-text hover:bg-blue-800/60 transition-colors' : ''}\`}
                        onClick={() => {
                          if (!isPreviouslyCompleted) {
                            setEditingCell(cellId);
                            setEditingValue(thisPeriodQty === 0 ? "" : thisPeriodQty.toString());
                          }
                        }}
                        title={!isPreviouslyCompleted ? "Click to edit quantity" : "Completed"}
                      >
                        {totalQty.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    );
                  }
                }
              }`;

content = content.replace(notOneLotTarget, notOneLotReplacement);

fs.writeFileSync(file, content);
console.log("Done");
