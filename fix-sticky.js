const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

const mapStart = content.indexOf('{data.map((row, rowIndex) => {');
const emptyStateStart = content.indexOf('{data.length === 0 && (');

const renderLogicStart = content.indexOf('const isHeader = rowIndex === 0 || rowIndex === 1;');
const renderLogicEnd = content.lastIndexOf(');', emptyStateStart);
const renderLogic = content.substring(renderLogicStart, renderLogicEnd + 2);

const renderRowFn = `  // --- HELPER TO RENDER A ROW ---
  const renderDataRow = (row: any[], rowIndex: number, isHeader: boolean) => {
    return (
      <tr 
        key={rowIndex} 
        className={\`\${isHeader ? 'bg-[#1e1e2d] text-gray-100 font-bold' : 'hover:bg-[#1f1f2e] transition-colors bg-[#15151e]'}\`}
      >
        {(() => {
          const cellsToRender = [];
          for (let c = 0; c < row.length; c++) {
            let cellValue = row[c];
            let colSpan = 1;
            
            // Handle Excel Merged Cells in Header Rows
            if (isHeader && cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== "") {
              // Look ahead for empty strings (which represent the rest of a merged cell)
              while (c + 1 < row.length && (row[c + 1] === null || row[c + 1] === undefined || String(row[c + 1]).trim() === "")) {
                colSpan++;
                c++;
              }
            }

            cellsToRender.push({ cell: cellValue, colSpan, originalColIndex: c - colSpan + 1 });
          }

          return cellsToRender.map(({ cell, colSpan, originalColIndex }) => {
            const colIndex = originalColIndex;
            let isNumeric = false;
            let formattedCell = cell;

            if (!isHeader && typeof cell === "number") {
              isNumeric = true;
              formattedCell = cell.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else if (typeof formattedCell === "string") {
              formattedCell = formattedCell.replace(/\\n/g, " ").replace(/\\r/g, "");
            }

            const alignClass = isHeader ? 'text-center' : isNumeric ? 'text-right' : 'text-left';
            const colorClass = isHeader ? 'text-gray-300' : isNumeric ? 'text-blue-200 font-mono' : 'text-gray-100';
            const bgClass = isHeader ? 'bg-[#222230]' : '';
            
            let isDescription = false;
            try {
              isDescription = data.slice(0, 10).some(r => {
                const val = String(r[colIndex] || "").toLowerCase();
                return val.includes("description");
              });
            } catch(e) {}

            let widthClass = isDescription ? 'min-w-[500px] whitespace-nowrap' : 'whitespace-nowrap';
            if (colIndex === 7 || colIndex === 8) widthClass += ' w-1';
            if (colIndex === 9) widthClass += ' w-5';
            
            let cellContent: React.ReactNode = formattedCell;
            
            let isOneLot = false;
            let unitCost = 0;
            let originalQty = 0;
            
            if (!isHeader) {
              const qtyVal = parseFloat(String(row[7])) || 0;
              const unitVal = String(row[8]).toLowerCase().trim();
              originalQty = parseFloat(String(row[3])) || 0;
              const originalUnit = String(row[2]).toLowerCase().trim();
              
              isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");
              unitCost = parseFloat(String(row[4])) || 0;
            }

            if (!isHeader && isOneLot && colIndex === 9 && unitCost > 0) {
              const currentInput = cell !== null && cell !== undefined ? String(cell) : "";
              const currentPercentage = parseFloat(currentInput) || 0;
              const calculatedTotal = unitCost * (currentPercentage / 100);

              const cellId = \`\${rowIndex}-\${colIndex}\`;
              const isEditing = editingCell === cellId || currentInput === "";

              if (isEditing) {
                cellContent = (
                  <div className="flex flex-col items-end gap-1 min-w-[120px]">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        className="w-full bg-black/40 text-blue-300 font-bold border border-blue-500/50 rounded px-2 py-1 focus:outline-none focus:border-blue-400 focus:bg-black text-right"
                        value={currentInput}
                        placeholder="50"
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
                          const newData = [...data];
                          const newRow = [...newData[rowIndex]];
                          
                          const encodedPercentage = parseFloat(val) || 0;
                          newRow[9] = val === "" ? "" : val;
                          
                          const totalAmount = unitCost * (encodedPercentage / 100); 
                          newRow[11] = totalAmount;
                          
                          const prev = parseFloat(String(newRow[10])) || 0;
                          newRow[12] = prev + totalAmount;
                          
                          let totalProjCost = 0;
                          for (let r = newData.length - 1; r >= 0; r--) {
                            const rStr = newData[r].join(" ").toUpperCase();
                            if (rStr.includes("TOTAL PROJECT COST")) {
                              totalProjCost = parseFloat(String(newData[r][5])) || 0;
                              break;
                            }
                          }
                          
                          if (totalProjCost > 0) {
                            newRow[13] = newRow[12] / totalProjCost;
                          }
                          
                          if (val !== "") {
                            if (encodedPercentage < 100) {
                              newRow[14] = "Ongoing";
                            } else if (encodedPercentage >= 100) {
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
                cellContent = (
                  <div 
                    className="w-full h-full min-w-[120px] text-right cursor-text hover:bg-white/5 transition-colors p-1 rounded"
                    onClick={() => setEditingCell(cellId)}
                    title="Click to edit percentage"
                  >
                    {calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                );
              }
            } else if (!isHeader && !isOneLot && colIndex === 7 && unitCost > 0) {
              const currentInput = cell !== null && cell !== undefined ? String(cell) : "";
              const encodedQty = parseFloat(currentInput) || 0;

              const cellId = \`\${rowIndex}-\${colIndex}\`;
              const isEditing = editingCell === cellId || currentInput === "";

              if (isEditing) {
                cellContent = (
                  <div className="flex flex-col items-end gap-1 min-w-[60px]">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        className="w-full bg-black/40 text-blue-300 font-bold border border-blue-500/50 rounded px-2 py-1 focus:outline-none focus:border-blue-400 focus:bg-black text-right"
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
                          newRow[11] = totalAmount;
                          
                          const prev = parseFloat(String(newRow[10])) || 0;
                          newRow[12] = prev + totalAmount;
                          
                          let totalProjCost = 0;
                          for (let r = newData.length - 1; r >= 0; r--) {
                            const rStr = newData[r].join(" ").toUpperCase();
                            if (rStr.includes("TOTAL PROJECT COST")) {
                              totalProjCost = parseFloat(String(newData[r][5])) || 0;
                              break;
                            }
                          }
                          
                          if (totalProjCost > 0) {
                            newRow[13] = newRow[12] / totalProjCost;
                          }
                          
                          if (val !== "") {
                            const totalItemCost = parseFloat(String(newRow[5])) || 0;
                            if (newRow[12] < totalItemCost) {
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
                cellContent = (
                  <div 
                    className="w-full h-full min-w-fit text-right cursor-text hover:bg-white/5 transition-colors p-1 rounded font-bold text-blue-200 whitespace-nowrap"
                    onClick={() => setEditingCell(cellId)}
                    title="Click to edit quantity"
                  >
                    {encodedQty.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                );
              }
            }

            return (
              <td 
                key={colIndex} 
                colSpan={colSpan}
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}
              className={\`px-4 py-3 \${widthClass} \${alignClass} \${colorClass} \${bgClass} \${isHeader ? 'text-xs uppercase tracking-wider font-bold' : 'leading-relaxed'}\`}
              >
                {cellContent}
              </td>
            );
          });
        })()}
      </tr>
    );
  };
`;

const returnStart = content.indexOf('  if (!mounted) return null;');

const newStructure = `${renderRowFn}

  if (!mounted) return null;

  return (
    <div 
      className="relative w-full h-full rounded-xl bg-[#0f0f13] flex flex-col shadow-2xl transition-all duration-300 border border-gray-700 overflow-hidden"
    >
      <div className="h-14 bg-[#1a1a24] border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
            <FiFileText className="text-blue-400" size={18} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm m-0 leading-tight">
              {fileRecord.fileName}
            </h2>
            <p className="text-gray-400 text-xs m-0">Native Data Grid View (Synced with BOQ)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition disabled:opacity-50"
            title="Save Changes"
          >
            {isSaving ? (
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <FiSave size={16} />
            )}
            {isSaving ? "Saving..." : "Save"}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-red-500 hover:text-white text-gray-300 rounded transition"
              title="Close Viewer"
            >
              <FiX size={16} />
              Close
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0f0f13] p-4 relative">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            Extracting data from file...
          </div>
        ) : (
          <div className="min-w-max border border-gray-800 rounded-lg bg-[#15151e] shadow-2xl relative">
            <table className="w-full text-sm text-left text-gray-300 border-collapse">
              <thead className="sticky top-0 z-30 shadow-md bg-[#1e1e2d]">
                {data.slice(0, 2).map((row, rowIndex) => renderDataRow(row, rowIndex, true))}
              </thead>
              <tbody>
                {data.slice(2).map((row, rowIndex) => renderDataRow(row, rowIndex + 2, false))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={20} className="px-6 py-12 text-center text-gray-500 italic">
                      No data found or file format unrecognized.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`;

const newContent = content.substring(0, returnStart) + newStructure;
fs.writeFileSync(file, newContent);
console.log('Successfully refactored table for sticky header.');
