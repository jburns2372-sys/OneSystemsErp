"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { FiX, FiSave, FiDownload, FiFileText, FiLock } from "react-icons/fi";
import { toast } from "sonner";
import { saveFileEditAction, saveAsNewAccomplishmentFileAction } from "@/app/actions/accomplishmentFileActions";

interface AccomplishmentDataGridProps {
  fileRecord: any;
  onClose?: () => void;
}

export default function AccomplishmentDataGrid({ fileRecord, onClose }: AccomplishmentDataGridProps) {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [data, setData] = useState<any[][]>([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [workbook, setWorkbook] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tableStartRow, setTableStartRow] = useState(0);

  const tryEditCell = (r: number, c: number, initialChar?: string) => {
    if (fileRecord?.isLockedOriginal) return false;
    const row = data[r];
    if (!row) return false;
    const unitCost = parseFloat(String(row[4])) || 0;
    if (unitCost <= 0) return false;

    const remarks = String(row[14] || "").toLowerCase().trim();
    if (remarks === "completed") return false;

    const qtyVal = parseFloat(String(row[7])) || 0;
    const unitVal = String(row[8]).toLowerCase().trim();
    const originalQty = parseFloat(String(row[3])) || 0;
    const originalUnit = String(row[2]).toLowerCase().trim();
    
    const isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");
    
    if (isOneLot && c === 9) {
      setEditingCell(`${r}-${c}`);
      const thisPeriodAmt = parseFloat(String(row[11])) || 0;
      const thisPeriodPct = unitCost > 0 ? (thisPeriodAmt / unitCost) * 100 : 0;
      setEditingValue(initialChar !== undefined ? initialChar : (thisPeriodAmt > 0 ? thisPeriodPct.toString() : ""));
      return true;
    } else if (!isOneLot && c === 7) {
      setEditingCell(`${r}-${c}`);
      setEditingValue(initialChar !== undefined ? initialChar : String(row[7] ?? ""));
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return; // Let input handle it
      if (!selectedCell) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCell(prev => prev ? { r: Math.max(2, prev.r - 1), c: prev.c } : null);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCell(prev => prev ? { r: Math.min(data.length - 1, prev.r + 1), c: prev.c } : null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCell(prev => prev ? { r: prev.r, c: Math.max(0, prev.c - 1) } : null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const maxC = data[selectedCell.r]?.length ? data[selectedCell.r].length - 1 : 15;
        setSelectedCell(prev => prev ? { r: prev.r, c: Math.min(maxC, prev.c + 1) } : null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        tryEditCell(selectedCell.r, selectedCell.c);
      } else if (e.key.length === 1 && /[0-9.]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (tryEditCell(selectedCell.r, selectedCell.c, e.key)) {
           e.preventDefault();
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (tryEditCell(selectedCell.r, selectedCell.c, "")) {
           e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, data, fileRecord]);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        setIsLoading(true);
        const targetPath = fileRecord.workingFilePath || fileRecord.originalFilePath;
        const response = await fetch(targetPath);
        if (!response.ok) throw new Error("Failed to fetch file");
        const arrayBuffer = await response.arrayBuffer();

        const parsedWorkbook = XLSX.read(arrayBuffer, { type: "array" });
        setWorkbook(parsedWorkbook);
        const firstSheetName = parsedWorkbook.SheetNames[0];
        const worksheet = parsedWorkbook.Sheets[firstSheetName];

        // Convert to 2D Array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];

        // Find the starting row (looking for "Item" or "Description" or similar)
        let startRowIndex = 0;
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.some(cell => {
            const str = String(cell).toLowerCase();
            return str.includes("item") || str.includes("description");
          })) {
            startRowIndex = i; // Keep the header row
            break;
          }
        }

          // DO NOT filter out completely empty rows! Filtering them out destroys the row mapping and causes Excel shifting bugs.
          let cleanedData = jsonData.slice(startRowIndex);
  
          // Clean up corrupted Excel files that have multiple "TOTAL PROJECT COST" rows
          // due to the previous bug. Keep only the FIRST instance.
          let foundTotalProjectCost = false;
          cleanedData = cleanedData.filter(row => {
            const rStr = row.join(" ").toUpperCase();
            if (rStr.includes("TOTAL PROJECT COST")) {
              if (foundTotalProjectCost) return false; // Remove duplicates
              foundTotalProjectCost = true;
            }
            return true;
          });

        // Remove bottom signatory rows by truncating the array when "Prepared by" or similar is found
        const endRowIndex = cleanedData.findIndex(row =>
          row.some(cell => {
            if (typeof cell !== "string") return false;
            const str = cell.toLowerCase().trim();
            return str.includes("prepared by") || str.includes("reviewed by") || str.includes("noted by");
          })
        );

        if (endRowIndex !== -1) {
          cleanedData = cleanedData.slice(0, endRowIndex);
        }

        // Strip phantom trailing empty columns from Excel by calculating the true length of the header
        let maxCols = 0;
        const headerRowsToCheck = cleanedData.slice(0, 2);
        headerRowsToCheck.forEach(row => {
          let cols = row.length;
          while (cols > 0 && (row[cols - 1] === null || row[cols - 1] === undefined || String(row[cols - 1]).trim() === "")) {
            cols--;
          }
          if (cols > maxCols) maxCols = cols;
        });

        if (maxCols > 0) {
          cleanedData = cleanedData.map(row => row.slice(0, maxCols));
        }

        let totalProjCost = 0;
        for (let r = cleanedData.length - 1; r >= 0; r--) {
          const rStr = cleanedData[r].join(" ").toUpperCase();
          if (rStr.includes("TOTAL PROJECT COST")) {
            totalProjCost = parseFloat(String(cleanedData[r][5])) || 0;
            break;
          }
        }

        // Auto-recalculate formulas for all applicable rows on load
        cleanedData = cleanedData.map((row, i) => {
          if (i < 2) return row; // Skip headers
          
          const totalItemCost = parseFloat(String(row[5])) || 0;
          if (totalItemCost > 0) {
            const qtyVal = parseFloat(String(row[7])) || 0;
            const unitVal = String(row[8]).toLowerCase().trim();
            const originalQty = parseFloat(String(row[3])) || 0;
            const originalUnit = String(row[2]).toLowerCase().trim();
            const isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");
            
            let totalToDate = parseFloat(String(row[9])) || 0;
            
            const prev = parseFloat(String(row[10])) || 0;
            
            row[11] = totalToDate - prev; // Col 12 = Col 10 - Col 11
            row[12] = totalToDate; // Col 13 = Col 10
            
            if (totalProjCost > 0) {
              row[6] = (totalItemCost / totalProjCost) * 100; // Col 7 (Weighted %)
              row[13] = (row[12] / totalProjCost) * 100; // Col 14 (%)
            } else {
              row[6] = 0;
              row[13] = 0;
            }
            
            if (row[12] >= totalItemCost - 0.01) {
              row[14] = "Completed";
            } else {
              row[14] = "Ongoing";
            }
          } else {
            row[11] = "";
            row[12] = "";
            row[13] = "";
          }
          return row;
        });

        setData(cleanedData);
      } catch (error) {
        console.error("Error loading Excel:", error);
        toast.error("Failed to parse the Excel data.");
      } finally {
        setIsLoading(false);
      }
    }

    if (fileRecord) {
      loadData();
    }
  }, [fileRecord]);

    const commitPercentageEdit = (rowIndex: number, val: string, unitCost: number, currentData?: any[][]) => {
      const parsedVal = parseFloat(val) || 0;
      const baseData = currentData || data;
      const newData = [...baseData];
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

    const totalItemCost = parseFloat(String(newRow[5])) || 0;
    if (newRow[12] >= totalItemCost - 0.01) {
      newRow[14] = "Completed";
    } else {
      newRow[14] = "Ongoing";
    }

    newData[rowIndex] = newRow;
    setData(newData);
    return newData;
  };

  const commitQuantityEdit = (rowIndex: number, val: string, unitCost: number, originalQty: number, currentData?: any[][]) => {
    const parsedVal = parseFloat(val) || 0;
    const baseData = currentData || data;
    const newData = [...baseData];
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

    const totalItemCost = parseFloat(String(newRow[5])) || 0;
    if (newRow[12] >= totalItemCost - 0.01) {
      newRow[14] = "Completed";
    } else {
      newRow[14] = "Ongoing";
    }

    newData[rowIndex] = newRow;
    setData(newData);
    return newData;
  };

  const handleSave = async (isLocking: boolean = false) => {
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
      
      let finalFileName = fileRecord.fileName;
      let isOverwrite = false;
      
      if (!isLocking) {
        if (window.confirm("Click 'OK' to overwrite the current file.\nClick 'Cancel' to save as a new file.")) {
          isOverwrite = true;
        } else {
          const defaultName = fileRecord.fileName.replace('.xlsx', '_updated.xlsx');
          const newName = window.prompt("Save As: Enter a new file name", defaultName);
          if (!newName) {
            setIsSaving(false);
            return; // User cancelled
          }
          finalFileName = newName;
          if (!finalFileName.toLowerCase().endsWith('.xlsx')) finalFileName += '.xlsx';
        }
      } else {
        if (!confirm("Are you sure you want to LOCK this document? It will be marked as final and can no longer be edited.")) {
          setIsSaving(false);
          return;
        }
        isOverwrite = true;
      }
      
      toast.loading(isLocking ? "Locking document..." : "Saving...", { id: "save-file" });

      // Clean data if locking
      // Using dataToSave from above
      if (isLocking) {
        dataToSave = dataToSave.map((row, i) => {
          if (i < 2) return row;
          const newRow = [...row];
          const qtyVal = parseFloat(String(row[7])) || 0;
          const unitVal = String(row[8]).toLowerCase().trim();
          const originalQty = parseFloat(String(row[3])) || 0;
          const originalUnit = String(row[2]).toLowerCase().trim();
          const unitCost = parseFloat(String(row[4])) || 0;
          
          const isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");
          
          if (isOneLot && unitCost > 0) {
            const currentInput = row[9] !== null && row[9] !== undefined ? String(row[9]) : "";
            if (currentInput === "") {
              const prev = parseFloat(String(newRow[10])) || 0;
              newRow[9] = prev; 
              newRow[11] = 0; 
              newRow[12] = prev;

              let totalProjCost = 0;
              for (let r = dataToSave.length - 1; r >= 0; r--) {
                const rStr = dataToSave[r].join(" ").toUpperCase();
                if (rStr.includes("TOTAL PROJECT COST")) {
                  totalProjCost = parseFloat(String(dataToSave[r][5])) || 0;
                  break;
                }
              }
              if (totalProjCost > 0) newRow[13] = (newRow[12] / totalProjCost) * 100;
              
              const tItemCost = parseFloat(String(newRow[5])) || 0;
              if (newRow[12] >= tItemCost - 0.01) {
                newRow[14] = "Completed";
              } else {
                newRow[14] = "Ongoing";
              }
            }
          }
          return newRow;
        });
        setData(dataToSave); // Trigger re-render to show zeros instantly
      }

      // Update the existing workbook to preserve all styles, formatting, and merged cells
      if (!workbook) {
        toast.error("Original workbook data missing. Cannot save safely.", { id: "save-file" });
        setIsSaving(false);
        return;
      }

      const wsName = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsName];

      // Normalize percentages to decimals for Excel
      const excelDataToSave = dataToSave.map((row, i) => {
        if (i < 2) return row;
        const newRow = [...row];
        if (typeof newRow[6] === 'number') newRow[6] = newRow[6] / 100;
        
        const rIndex = tableStartRow + i;
        const c11 = ws[XLSX.utils.encode_cell({ r: rIndex, c: 11 })];
        const c12 = ws[XLSX.utils.encode_cell({ r: rIndex, c: 12 })];
        const c13 = ws[XLSX.utils.encode_cell({ r: rIndex, c: 13 })];

        if (c11 && c11.f) {
          newRow[11] = undefined;
        }
        
        if (c12 && c12.f) {
          newRow[12] = undefined;
        }
        
        if (c13 && c13.f) {
          newRow[13] = undefined;
        } else if (typeof newRow[13] === 'number') {
          newRow[13] = newRow[13] / 100;
        }
        
        return newRow;
      });

      // Inject modified data back into the sheet at exactly the original row index offset!
      XLSX.utils.sheet_add_aoa(ws, excelDataToSave, { origin: { r: tableStartRow, c: 0 } });

      // Generate base64
      const base64Data = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      
      let result;
      if (isOverwrite) {
        result = await saveFileEditAction(fileRecord.id, base64Data, isLocking);
      } else {
        result = await saveAsNewAccomplishmentFileAction(fileRecord.projectId, base64Data, finalFileName, fileRecord.fileType, isLocking);
      }
      
      if (result.success) {
        toast.success(isLocking ? "Document permanently locked!" : "File saved successfully!", { id: "save-file" });
        
        // If locking, or if saved as a brand new file, close the window.
        // If just saving/overwriting, leave the window open so they can continue editing.
        if (isLocking || !isOverwrite) {
          if (onClose) {
            onClose(); 
          } else {
            router.push("/progress-billings");
            router.refresh();
          }
        }
      } else {
        toast.error("Failed to save: " + result.error, { id: "save-file" });
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving.", { id: "save-file" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- HELPER TO RENDER A ROW ---
    const renderDataRow = (row: any[], rowIndex: number, isHeader: boolean) => {
      let isEditableRow = false;
      if (!isHeader && !fileRecord?.isLockedOriginal) {
        const unitCost = parseFloat(String(row[4])) || 0;
        const remarks = String(row[14] || "").toLowerCase().trim();
        if (unitCost > 0 && remarks !== "completed") {
          isEditableRow = true;
        }
      }

      return (
        <tr
          key={rowIndex}
          className={`${isHeader ? 'bg-[#1e1e2d] text-gray-100 font-bold' : isEditableRow ? 'bg-[#1e293b]/40 hover:bg-[#1e293b]/60 transition-colors' : 'hover:bg-[#1f1f2e] transition-colors bg-[#15151e]'}`}
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
              if (colIndex === 6 || colIndex === 13) {
                formattedCell = cell.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + "%";
              } else if (colIndex === 3 || colIndex === 7) {
                formattedCell = cell.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
              } else {
                formattedCell = cell.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
            } else if (typeof formattedCell === "string") {
              formattedCell = formattedCell.replace(/\n/g, " ").replace(/\r/g, "");
            }

            const alignClass = isHeader ? 'text-center' : isNumeric ? 'text-right' : 'text-left';
            const colorClass = isHeader ? 'text-gray-300' : isNumeric ? 'text-blue-200 font-mono' : 'text-gray-100';

            let isOneLot = false;
            let unitCost = 0;
            let originalQty = 0;
            let isEditableCell = false;
            let itemRemarks = "";
            let thisPeriodAmount = 0;
            let isPreviouslyCompleted = false;

            if (!isHeader) {
              const qtyVal = parseFloat(String(row[7])) || 0;
              const unitVal = String(row[8]).toLowerCase().trim();
              originalQty = parseFloat(String(row[3])) || 0;
              const originalUnit = String(row[2]).toLowerCase().trim();

              isOneLot = (qtyVal === 1 && unitVal === "lot") || (originalQty === 1 && originalUnit === "lot");
              unitCost = parseFloat(String(row[4])) || 0;
              
              // Hide zeros for non-priced items (like headers) in the progress/cost columns
              if (originalQty === 0 && unitCost === 0) {
                if (colIndex >= 3 && colIndex <= 13 && parseFloat(String(cell)) === 0) {
                  formattedCell = "";
                }
              } else if (unitCost === 0 && colIndex === 9) {
                formattedCell = "";
              }

              // Enforce "1" in Column 8 for 1 Lot / Assy items
              if (isOneLot && colIndex === 7) {
                formattedCell = "1";
              }

              itemRemarks = String(row[14] || "").toLowerCase().trim();
              thisPeriodAmount = parseFloat(String(row[11])) || 0;
              isPreviouslyCompleted = itemRemarks === "completed" && thisPeriodAmount <= 0;

              if (!fileRecord?.isLockedOriginal && unitCost > 0 && !isPreviouslyCompleted) {
                 if (isOneLot && colIndex === 9) isEditableCell = true;
                 if (!isOneLot && colIndex === 7) isEditableCell = true;
              }
            } else if (isHeader) {
              // Hide zeros for category headers
              if (colIndex === 9 && (formattedCell === 0 || String(formattedCell).trim() === "0")) {
                formattedCell = "";
              }
            }

            const bgClass = isHeader ? 'bg-[#222230]' : isEditableCell ? 'bg-blue-900/60 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.6)]' : '';

            let isDescription = false;
            try {
              isDescription = data.slice(0, 10).some(r => {
                const val = String(r[colIndex] || "").toLowerCase();
                return val.includes("description");
              });
            } catch (e) { }

            let widthClass = isDescription ? 'break-words' : 'whitespace-nowrap';
            
            const widthMap: Record<number, string> = {
              0: '2%',    // Item No
              1: '40%',   // Description
              2: '2%',    // Unit/s
              3: '3%',    // Qty
              4: '5%',    // Unit Cost
              5: '5%',    // Total Cost
              6: '4%',    // Weighted %
              7: '4%',    // Qty This Period
              8: '2%',    // Unit/s
              9: '5%',    // Total This Period
              10: '6%',   // PREVIOUS
              11: '6%',   // THIS PERIOD
              12: '7%',   // ACCOMPLISHMENT TO DATE
              13: '4%',   // %
              14: '5%'    // Remarks
            };
            const targetWidth = widthMap[colIndex] || '0%';
            const widthStyle: React.CSSProperties = (!colSpan || colSpan === 1) 
              ? { width: targetWidth, minWidth: targetWidth, maxWidth: targetWidth } 
              : {};
            
            let cellContent: React.ReactNode = formattedCell;

            if (!isHeader && isOneLot && colIndex === 9 && unitCost > 0) {
              const monetaryValue = parseFloat(String(cell)) || 0;
              const prevAmount = parseFloat(String(row[10])) || 0;
              const thisPeriodAmount = monetaryValue - prevAmount;
              
              let thisPeriodPercentage = unitCost > 0 ? (thisPeriodAmount / unitCost) * 100 : 0;
              thisPeriodPercentage = Math.round(thisPeriodPercentage * 10000) / 10000;

              const cellId = `${rowIndex}-${colIndex}`;
              const isEditing = !fileRecord.isLockedOriginal && !isPreviouslyCompleted && (editingCell === cellId || thisPeriodPercentage === 0);

              if (isEditing) {
                const displayValue = editingCell === cellId ? editingValue : (thisPeriodPercentage === 0 ? "" : thisPeriodPercentage.toString());
                cellContent = (
                  <div className="flex flex-col items-end gap-1 w-full">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        className="w-full max-w-[70px] bg-blue-800/80 text-white font-bold border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-right shadow-inner"
                        value={displayValue}
                        placeholder="0"
                        step="0.01"
                        autoFocus={editingCell === cellId}
                        onFocus={() => {
                          setEditingCell(cellId);
                          setEditingValue(displayValue);
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
                      className={`w-full h-full min-w-[40px] text-right bg-blue-900/40 border border-blue-500/50 p-1 rounded text-blue-100 ${!isPreviouslyCompleted ? 'cursor-text hover:bg-blue-800/60 transition-colors' : 'font-bold'}`}
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
            } else if (!isHeader && !isOneLot && colIndex === 7 && unitCost > 0) {
              const currentInput = cell !== null && cell !== undefined ? String(cell) : "";
              const encodedQty = parseFloat(currentInput) || 0;

              const cellId = `${rowIndex}-${colIndex}`;
              const isEditing = !fileRecord.isLockedOriginal && !isPreviouslyCompleted && (editingCell === cellId || currentInput === "");

              if (isEditing) {
                cellContent = (
                  <div className="flex flex-col items-end gap-1 w-full">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        className="w-full max-w-[70px] bg-blue-800/80 text-white font-bold border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-right shadow-inner"
                        value={editingCell === cellId ? editingValue : currentInput}
                        placeholder="0"
                        step="0.01"
                        autoFocus={editingCell === cellId}
                        onFocus={() => {
                          setEditingCell(cellId);
                          setEditingValue(currentInput);
                        }}
                        onBlur={() => {
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
                        onChange={(e) => setEditingValue(e.target.value)}
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
                      className={`w-full h-full min-w-[40px] text-right bg-blue-900/40 border border-blue-500/50 p-1 rounded font-bold text-blue-100 whitespace-nowrap ${!isPreviouslyCompleted ? 'cursor-text hover:bg-blue-800/60 transition-colors' : ''}`}
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
            }

            return (
              <td
                key={colIndex}
                colSpan={colSpan}
                onClick={() => setSelectedCell({ r: rowIndex, c: colIndex })}
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  ...(isHeader ? {
                    position: 'sticky',
                    top: rowIndex === 0 ? '0' : '41px',
                    zIndex: rowIndex === 0 ? 40 : 39,
                    backgroundColor: '#1e1e2d',
                    height: rowIndex === 0 ? '41px' : 'auto'
                  } : {})
                }}
                className={`px-1 lg:px-2 ${isHeader ? 'whitespace-nowrap' : (isDescription ? 'break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis')} ${isHeader && rowIndex === 0 ? '' : 'py-1 lg:py-2'} ${alignClass} ${colorClass} ${bgClass} ${isHeader ? 'text-[10px] lg:text-xs uppercase tracking-wider font-bold' : 'text-[11px] leading-snug'} ${selectedCell?.r === rowIndex && selectedCell?.c === colIndex ? 'ring-2 ring-inset ring-blue-500 bg-blue-900/30' : ''}`}
              >
                {cellContent}
              </td>
            );
          });
        })()}
      </tr>
    );
  };


  if (!mounted) return null;

  // Calculate Grand Totals safely up to the "Total Project Cost" row to prevent double-counting
  let grandTotalCost = 0;
  let grandTotalPrevious = 0;
  let grandTotalThisPeriod = 0;
  let grandTotalToDate = 0;

  let totalProjectCostIndex = data.findIndex(r => String(r[1]).toUpperCase().includes("TOTAL PROJECT COST"));
  if (totalProjectCostIndex === -1) totalProjectCostIndex = data.length;

  for (let i = 2; i < totalProjectCostIndex; i++) {
    const row = data[i];
    if (!row) continue;
    const unitCost = parseFloat(String(row[4])) || 0;
    if (unitCost > 0) {
      grandTotalCost += parseFloat(String(row[5])) || 0;
      grandTotalPrevious += parseFloat(String(row[10])) || 0;
      grandTotalThisPeriod += parseFloat(String(row[11])) || 0;
      grandTotalToDate += parseFloat(String(row[12])) || 0;
    }
  }

  const grandToDatePercentage = grandTotalCost > 0 ? (grandTotalToDate / grandTotalCost) * 100 : 0;

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
          {!fileRecord.isLockedOriginal && (
            <>
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded transition disabled:opacity-50"
                title="Lock and Finalize"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiLock size={16} />
                )}
                Lock
              </button>
              <button
                onClick={() => handleSave(false)}
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
            </>
          )}
          <button 
            onClick={() => {
              if (onClose) onClose();
              else window.close();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-red-500 hover:text-white text-gray-300 rounded transition"
            title="Close Viewer"
          >
            <FiX size={16} />
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#0f0f13] p-4 relative flex flex-col min-h-0">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            Extracting data from file...
          </div>
        ) : (
          <div className="flex-1 border border-gray-800 rounded-lg bg-[#15151e] shadow-2xl relative overflow-auto">
            <table className="w-full text-[10px] lg:text-xs text-left text-gray-300 border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {Array.from({ length: 15 }).map((_, i) => {
                  const widthMap: Record<number, string> = {
                    0: '2%',    // Item No
                    1: '40%',   // Description
                    2: '2%',    // Unit/s
                    3: '3%',    // Qty
                    4: '5%',    // Unit Cost
                    5: '5%',    // Total Cost
                    6: '4%',    // Weighted %
                    7: '4%',    // Qty This Period
                    8: '2%',    // Unit/s
                    9: '5%',    // Total This Period
                    10: '6%',   // PREVIOUS
                    11: '6%',   // THIS PERIOD
                    12: '7%',   // ACCOMPLISHMENT TO DATE
                    13: '4%',   // %
                    14: '5%'    // Remarks
                  };
                  return <col key={i} style={{ width: widthMap[i] || '0%' }} />;
                })}
              </colgroup>
              <thead className="sticky top-0 z-30 shadow-md bg-[#1e1e2d] [&>tr>td]:bg-[#1e1e2d]">
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
              <tfoot className="sticky bottom-0 z-30 bg-[#222230] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-300 border-t border-gray-700">GRAND TOTAL:</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-300 border-t border-gray-700">
                    {grandTotalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={4} className="px-4 py-3 border-t border-gray-700"></td>
                  <td className="px-4 py-3 text-right font-bold text-yellow-300 border-t border-gray-700">
                    {grandTotalPrevious.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-300 border-t border-gray-700">
                    {grandTotalThisPeriod.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-purple-300 border-t border-gray-700">
                    {grandTotalToDate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-pink-300 border-t border-gray-700">
                    {grandToDatePercentage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </td>
                  <td className="px-4 py-3 border-t border-gray-700"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
