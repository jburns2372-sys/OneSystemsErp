"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FiX, FiMaximize, FiMinimize, FiInfo, FiDownload, FiEdit2, FiSave, FiCopy, FiZoomIn, FiZoomOut, FiTarget, FiFileText } from "react-icons/fi";
import { toast } from "sonner";
import { createWorkingCopyAction, saveFileEditAction } from "@/app/actions/accomplishmentFileActions";
import { exportFortuneSheetToExcelJS } from "@/lib/excelExportService";

import "@fortune-sheet/react/dist/index.css";

// FortuneSheet must be dynamically imported
const Workbook = dynamic(() => import("@fortune-sheet/react").then((mod) => mod.Workbook), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white text-gray-500">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        Loading Native Excel Engine...
      </div>
    </div>
  ),
});

interface SpreadsheetViewerProps {
  fileRecord: any;
  onClose: () => void;
}

export default function SpreadsheetEditor({ fileRecord, onClose }: SpreadsheetViewerProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState(fileRecord.originalFilePath);
  const [isSaving, setIsSaving] = useState(false);
  
  const workbookRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const loadExcelFile = async (path: string, mode: "READ_ONLY" | "EDIT") => {
    setIsLoading(true);
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Failed to download file");
      
      const blob = await response.blob();
      const file = new File([blob], fileRecord.fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      // @ts-ignore
      const LuckyExcel = (await import("luckyexcel")).default;
      
      LuckyExcel.transformExcelToLucky(file, (exportJson: any) => {
        if (!exportJson || !exportJson.sheets || exportJson.sheets.length === 0) {
          toast.error("Failed to parse Excel file.");
          setIsLoading(false);
          return;
        }

        // Properly reset scroll and strip crash-causing properties from the Excel file
        const sheetData = exportJson.sheets.map((sheet: any) => {
          sheet.scrollLeft = 0;
          sheet.scrollTop = 0;
          
          // CRITICAL: Strip out any frozen panes saved inside the Excel file
          if (sheet.frozen) {
            delete sheet.frozen;
          }
          
          // CRITICAL: Prevent Excel's last active cell from auto-scrolling the viewer away from A1
          if (sheet.luckysheet_select_save) {
            delete sheet.luckysheet_select_save;
          }

          // CRITICAL: Unhide all columns and rows because hidden ones crash the viewer or hide data
          if (sheet.config) {
            if (sheet.config.colhidden) delete sheet.config.colhidden;
            if (sheet.config.rowhidden) delete sheet.config.rowhidden;
            
            // Force reset any columns that were squished to 0 width
            if (sheet.config.columnlen) {
              Object.keys(sheet.config.columnlen).forEach(key => {
                if (sheet.config.columnlen[key] <= 5) {
                  delete sheet.config.columnlen[key];
                }
              });
            }

            // Force reset any rows that were squished to 0 height
            if (sheet.config.rowlen) {
              Object.keys(sheet.config.rowlen).forEach(key => {
                if (sheet.config.rowlen[key] <= 5) {
                  delete sheet.config.rowlen[key];
                }
              });
            }
          }

          return sheet;
        });
        
        setData(sheetData);
        setIsEditMode(mode === "EDIT");
        setCurrentFilePath(path);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Error parsing the file.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fileRecord) {
      loadExcelFile(fileRecord.originalFilePath, "READ_ONLY");
    }
  }, [fileRecord]);

  const handleEditWorkingCopy = async () => {
    setIsLoading(true);
    try {
      const res = await createWorkingCopyAction(fileRecord.id as string);
      if (!res.success) {
        toast.error(res.error || "Failed to create working copy.");
        setIsLoading(false);
        return;
      }
      toast.success("Switched to Editable Working Copy.");
      await loadExcelFile(res.workingFilePath as string, "EDIT");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred switching to edit mode.");
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isEditMode) return;
    setIsSaving(true);
    try {
      toast.info("Compiling Excel file...");
      const blob = await exportFortuneSheetToExcelJS(data);
      const buffer = await blob.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");

      toast.info("Saving changes to server...");
      const res = await saveFileEditAction(fileRecord.id as string, base64Data);
      
      if (res.success) {
        toast.success("Changes saved successfully!");
      } else {
        toast.error(res.error || "Failed to save changes.");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error saving the Excel file.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (type: "ORIGINAL" | "EDITED") => {
    try {
      const link = document.createElement("a");
      link.href = type === "ORIGINAL" ? fileRecord.originalFilePath : currentFilePath;
      link.download = type === "ORIGINAL" ? `Original_${fileRecord.fileName}` : `Edited_${fileRecord.fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      toast.error("Failed to download file.");
    }
  };

  const handleGoToA1 = () => {
    setData((prev) => 
      prev.map(sheet => ({
        ...sheet,
        scrollLeft: 0,
        scrollTop: 0
      }))
    );
  };

  if (!mounted) return null;

  return (
    <div 
      className="fixed inset-0 bg-white flex flex-col shadow-2xl transition-all duration-300"
      style={{ 
        isolation: 'isolate', 
        zIndex: 2147483647
      }}
    >
      
      {/* Viewer Header / Toolbar */}
      <div className="flex flex-col bg-gray-900 shrink-0 z-10 shadow-sm border-b border-gray-700">
        
        {/* Top Info Bar */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FiFileText className="text-blue-400" size={20} />
            <h2 className="text-white font-semibold text-sm m-0">
              {fileRecord.fileName} {isEditMode && <span className="text-yellow-500 text-xs ml-2">(EDIT MODE)</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition"
              title="Toggle Fullscreen"
            >
              <FiMaximize size={16} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition"
              title="Close Viewer"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="h-12 flex items-center px-4 gap-4 overflow-x-auto">
          {!isEditMode ? (
            <button 
              onClick={handleEditWorkingCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm text-xs font-semibold whitespace-nowrap"
            >
              <FiEdit2 /> Edit Working Copy
            </button>
          ) : (
            <>
              <button 
                onClick={() => loadExcelFile(fileRecord.originalFilePath, "READ_ONLY")}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded shadow-sm text-xs font-semibold whitespace-nowrap"
              >
                <FiFileText /> View Original
              </button>
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white rounded shadow-sm text-xs font-semibold whitespace-nowrap"
              >
                <FiSave /> {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button 
                onClick={handleSaveChanges} // Triggers same action since action increments version automatically
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded shadow-sm text-xs font-semibold whitespace-nowrap"
              >
                <FiCopy /> Save New Version
              </button>
            </>
          )}

          <div className="w-[1px] h-6 bg-gray-700 mx-2 shrink-0"></div>

          <button onClick={() => handleDownload("ORIGINAL")} className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:bg-white/10 rounded text-xs font-semibold whitespace-nowrap">
            <FiDownload /> Download Original
          </button>
          {isEditMode && (
            <button onClick={() => handleDownload("EDITED")} className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:bg-white/10 rounded text-xs font-semibold whitespace-nowrap">
              <FiDownload /> Download Edited (.xlsx)
            </button>
          )}

          <div className="w-[1px] h-6 bg-gray-700 mx-2 shrink-0"></div>

          <button onClick={handleGoToA1} className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:bg-white/10 rounded text-xs font-semibold whitespace-nowrap">
            <FiTarget /> Go to A1
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm mt-[96px]">
          <div className="text-gray-800 text-lg animate-pulse font-bold flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading Spreadsheet Environment...
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div className="flex-1 relative bg-gray-100 w-full h-full overflow-hidden">
        {data.length > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Workbook 
              ref={workbookRef}
              data={data}
              onChange={(d) => setData(d as any)}
              allowEdit={isEditMode}
              showToolbar={true} // Enabled native toolbar for formulas and fonts
              showSheetTabs={true}
              showFormulaBar={true}
            />
          </div>
        )}
      </div>

    </div>
  );
}
