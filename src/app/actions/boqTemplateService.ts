"use server";

import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

export async function generateBOQTemplate(projectId?: string) {
  try {
    const templatePath = path.join(process.cwd(), "public", "templates", "Final_BOQ_Bid_Detailed_Cost_Breakdown_Template.xlsx");
    
    if (!fs.existsSync(templatePath)) {
      throw new Error("Template file not found on server.");
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet("BOQ_DATA_ENTRY");
    
    if (!sheet) {
      throw new Error("BOQ_DATA_ENTRY worksheet missing from template.");
    }

    // Unprotect sheet to edit, then protect again (password: antigravity)
    sheet.unprotect();

    // Fetch project details if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (project) {
        // Search for PROJECT:, LOCATION:, SUBJECT: and fill the cell to the right
        // We only scan the first 15 rows where letterhead is expected
        for (let rowNumber = 1; rowNumber <= 15; rowNumber++) {
          const row = sheet.getRow(rowNumber);
          if (!row) continue;

          row.eachCell((cell, colNumber) => {
            if (cell.type === ExcelJS.ValueType.String) {
              const text = cell.value?.toString().trim().toUpperCase() || "";
              if (text === "PROJECT:") {
                const targetCell = row.getCell(colNumber + 1);
                targetCell.value = project.name || "";
              } else if (text === "LOCATION:") {
                const targetCell = row.getCell(colNumber + 1);
                targetCell.value = project.location || "";
              } else if (text === "SUBJECT:") {
                const targetCell = row.getCell(colNumber + 1);
                targetCell.value = project.description || "Program of Works";
              }
            }
          });
        }
      }
    }

    // Protect the sheet again
    await sheet.protect("antigravity", {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    // Audit Log
    const cookieStore = await (await import("next/headers")).cookies();
    const email = cookieStore.get('demo_user_email')?.value || 'jburns@demo.com';
    const user = await prisma.user.findFirst({ where: { email } });
    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userRole: user.role,
          moduleName: "BOQ_TEMPLATE_CENTER",
          actionType: "TEMPLATE_DOWNLOADED",
          remarks: `Downloaded blank BOQ template for project: ${projectId || 'None'}`
        }
      });
    }
    
    return {
      success: true,
      data: Buffer.from(buffer).toString('base64'),
      fileName: `BOQ_Template_${projectId || "Blank"}.xlsx`
    };

  } catch (error: any) {
    console.error("Error generating BOQ template:", error);
    return {
      success: false,
      error: error.message || "Failed to generate BOQ template."
    };
  }
}
