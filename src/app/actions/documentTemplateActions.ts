"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadDocumentTemplate(formData: FormData) {
  try {
    const fileUrl = formData.get("fileUrl") as string;
    const fileName = formData.get("fileName") as string;
    const templateName = formData.get("templateName") as string;
    const templateType = formData.get("templateType") as string; // PROGRESS_BILLING or CERTIFICATE_OF_PAYMENT
    const uploadedById = formData.get("uploadedById") as string | null;

    if (!fileUrl || !fileName || !templateType || !templateName) {
      throw new Error("Missing required fields");
    }

    // Usually there's only one active template per type, we can optionally deprecate the others
    await prisma.documentTemplate.updateMany({
      where: { templateType },
      data: { status: "INACTIVE" },
    });

    const template = await prisma.documentTemplate.create({
      data: {
        fileUrl,
        fileName,
        templateName,
        templateType,
        uploadedById: uploadedById || null,
        status: "ACTIVE",
      },
    });

    revalidatePath("/progress-billings/templates");
    return { success: true, data: template };
  } catch (error: any) {
    console.error("Template Upload Error:", error);
    return { success: false, error: error.message || "Failed to upload template" };
  }
}

export async function fetchActiveTemplates() {
  try {
    const templates = await prisma.documentTemplate.findMany({
      where: { status: "ACTIVE" },
      orderBy: { templateType: "asc" },
      include: {
        uploadedBy: { select: { name: true } },
      },
    });
    return { success: true, data: templates };
  } catch (error: any) {
    console.error("Fetch Templates Error:", error);
    return { success: false, error: "Failed to load templates" };
  }
}
