'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Define the backend URL for the Server Action context

// fetchWithAuth wrapper points to the new backend API routes
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const res = await fetchAuthenticatedBackend(`/api/accomplishmentFileActions${endpoint}`, {
    ...options,
    method: 'POST',
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Backend Error for ${endpoint}: ${res.status} ${errorText}`);
    throw new Error(`Backend Error: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function uploadAccomplishmentFileAction(projectId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString('base64'); // Encode file content for JSON payload

    // currentUserId needs to be extracted from cookies if it was to be used, currently undefined.
    const currentUserId = undefined; // Original was undefined

    const result = await fetchWithAuth('/uploadAccomplishmentFileAction', {
      body: JSON.stringify({
        projectId,
        base64File,
        fileName: file.name,
        fileSize: buffer.length,
        fileType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        currentUserId,
      })
    });

    revalidatePath(`/accomplishments`);
    return result; // Backend should return { success: true, ... }
  } catch (error: any) {
    console.error("Error uploading accomplishment file (proxy):", error);
    return { success: false, error: error.message || "Failed to upload file" };
  }
}

export async function deleteAccomplishmentFileAction(fileId: string) {
  try {
    const result = await fetchWithAuth('/deleteAccomplishmentFileAction', {
      body: JSON.stringify({ fileId }),
    });

    revalidatePath(`/accomplishments`);
    return result; // Backend should return { success: true }
  } catch (error: any) {
    console.error("Error deleting accomplishment file (proxy):", error);
    return { success: false, error: error.message || "Failed to delete file" };
  }
}

export async function extractAccomplishmentDataAction(fileId: string) {
  try {
    const result = await fetchWithAuth('/extractAccomplishmentDataAction', {
      body: JSON.stringify({ fileId }),
    });
    // Original did not revalidate here, so we won't add it.
    return result; // Backend should return { success: true, message: ... }
  } catch (error: any) {
    console.error("Error extracting accomplishment data (proxy):", error);
    return { success: false, error: error.message || "Failed to extract data" };
  }
}

export async function aiValidateAccomplishmentAction(fileId: string) {
  try {
    const result = await fetchWithAuth('/aiValidateAccomplishmentAction', {
      body: JSON.stringify({ fileId }),
    });

    revalidatePath(`/accomplishments`);
    return result; // Backend should return { success: true, message: ... }
  } catch (error: any) {
    console.error("Error AI validating accomplishment (proxy):", error);
    return { success: false, error: error.message || "Failed AI Validation" };
  }
}

export async function createWorkingCopyAction(fileId: string) {
  try {
    const result = await fetchWithAuth('/createWorkingCopyAction', {
      body: JSON.stringify({ fileId }),
    });

    revalidatePath("/accomplishments");
    return result; // Backend should return { success: true, workingFilePath: ... }
  } catch (error: any) {
    console.error("Error creating working copy (proxy):", error);
    return { success: false, error: error.message || "Failed to create working copy" };
  }
}

export async function saveFileEditAction(fileId: string, base64Data: string, isLocked: boolean = false) {
  try {
    const result = await fetchWithAuth('/saveFileEditAction', {
      body: JSON.stringify({
        fileId,
        base64Data,
        isLocked,
      })
    });

    revalidatePath("/accomplishments");
    return result; // Backend should return { success: true, file: ... }
  } catch (error: any) {
    console.error("Error saving edited file (proxy):", error);
    return { success: false, error: error.message || "Failed to save file edits" };
  }
}

export async function saveAsNewAccomplishmentFileAction(projectId: string, base64Data: string, newFileName: string, originalFileType: string, isLocked: boolean = false) {
  try {
    const result = await fetchWithAuth('/saveAsNewAccomplishmentFileAction', {
      body: JSON.stringify({
        projectId,
        base64Data,
        newFileName,
        originalFileType,
        isLocked,
      })
    });

    revalidatePath("/accomplishments");
    return result; // Backend should return { success: true, file: ... }
  } catch (error: any) {
    console.error("Error saving as new file (proxy):", error);
    return { success: false, error: error.message || "Failed to save as new file" };
  }
}

export async function createSuccessiveBillingAction(projectId: string, templateFileId: string) {
  try {
    const result = await fetchWithAuth('/createSuccessiveBillingAction', {
      body: JSON.stringify({
        projectId,
        templateFileId,
      })
    });

    revalidatePath("/accomplishments");
    return result; // Backend should return { success: true, message: ..., file: ... }
  } catch (error: any) {
    console.error("Error creating successive billing (proxy):", error);
    return { success: false, error: error.message || "Failed to create successive billing" };
  }
}
