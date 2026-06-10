const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add saveAsNewAccomplishmentFileAction import
content = content.replace(
  /saveFileEditAction\s*}/,
  'saveFileEditAction, saveAsNewAccomplishmentFileAction }'
);

// 2. Add workbook state
content = content.replace(
  /const \[isLoading, setIsLoading\] = useState\(true\);/,
  'const [isLoading, setIsLoading] = useState(true);\n  const [workbook, setWorkbook] = useState<any>(null);'
);

// 3. Store workbook in loadData
content = content.replace(
  /const wb = XLSX\.read\(arrayBuffer, { type: "array" }\);/,
  'const wb = XLSX.read(arrayBuffer, { type: "array" });\n        setWorkbook(wb);'
);

// 4. Update handleSave logic
const oldHandleSave = `  const handleSave = async () => {
    try {
      setIsSaving(true);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const base64Data = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      
      const result = await saveFileEditAction(fileRecord.id, base64Data);
      
      if (result.success) {
        toast.success("File saved successfully!", { id: "save-file" });
      } else {
        toast.error("Failed to save: " + result.error, { id: "save-error" });
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving.", { id: "save-error" });
    } finally {
      setIsSaving(false);
    }
  };`;

const newHandleSave = `  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Request new filename
      const defaultName = fileRecord.fileName.replace('.xlsx', '_updated.xlsx');
      const newName = window.prompt("Save As: Enter a new file name", defaultName);
      if (!newName) {
        setIsSaving(false);
        return; // User cancelled
      }
      
      let finalFileName = newName;
      if (!finalFileName.toLowerCase().endsWith('.xlsx')) {
        finalFileName += '.xlsx';
      }

      // Update the existing workbook to preserve all styles, formatting, and merged cells
      if (!workbook) {
        toast.error("Original workbook data missing. Cannot save safely.", { id: "save-error" });
        setIsSaving(false);
        return;
      }
      
      const wsName = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsName];
      
      // Inject modified data back into the sheet starting at A1
      XLSX.utils.sheet_add_aoa(ws, data, { origin: "A1" });
      
      // Generate base64
      const base64Data = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      
      // Save as completely new file record
      const result = await saveAsNewAccomplishmentFileAction(fileRecord.projectId, base64Data, finalFileName, fileRecord.fileType);
      
      if (result.success) {
        toast.success("File saved as " + finalFileName + "!", { id: "save-file" });
        if (onClose) {
          onClose(); // Close the modal to show the new file in the dashboard
        }
      } else {
        toast.error("Failed to save: " + result.error, { id: "save-error" });
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving.", { id: "save-error" });
    } finally {
      setIsSaving(false);
    }
  };`;

content = content.replace(oldHandleSave, newHandleSave);

fs.writeFileSync(file, content);
console.log('Successfully updated AccomplishmentDataGrid.tsx with Save As logic.');
