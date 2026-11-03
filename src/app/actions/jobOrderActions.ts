'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';
import { getBackendUrl } from '@/lib/backendUrl';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_ROUTE_PREFIX = '/api/jobOrderActions'; // New common prefix for all actions

async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchAuthenticatedBackend(endpoint, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || parsed.message || errorText;
    } catch {
      // non-JSON error body
    }
    throw new Error(errorMessage || `Backend Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// --- JOB ORDER READ (Now Proxied to AWS Backend) ---

export async function getJobOrders(projectId?: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/getJobOrders`, {
      method: 'POST',
      body: JSON.stringify({ projectId })
    });
    return result.data; // Original returned array directly, backend returns { success: true, data: [...] }
  } catch (error: any) {
    console.error("Get Job Orders Error:", error);
    // Original returned raw array or Prisma error, now returning consistent error structure
    return { success: false, error: error.message };
  }
}

export async function getJobOrderById(id: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/getJobOrderById`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return result; // Original returned { success: true, data: {...} }, matches backend
  } catch (error: any) {
    console.error("Get Job Order By Id Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getConsolidatedBoqItemsByProjectId(projectId: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/getConsolidatedBoqItemsByProjectId`, {
      method: 'POST',
      body: JSON.stringify({ projectId })
    });
    return result; // Original returned { success: true, items: [...] }, matches backend
  } catch (error: any) {
    console.error("Get Consolidated BOQ Items Error:", error);
    return { success: false, error: error.message };
  }
}

// --- JOB ORDER MUTATIONS (Proxied to AWS Backend via new RPC-style endpoints) ---

export async function createJobOrder(data: any) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/createJobOrder`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    revalidatePath('/subcontracting/job-orders');
    revalidatePath('/job-orders/dashboard');
    return result; // Original returned result of fetchWithAuth, matches backend
  } catch (error: any) {
    console.error("Create Job Order Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateJobOrder(id: string, data: any) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/updateJobOrder`, {
      method: 'POST',
      body: JSON.stringify({ id, data }) // Pass both id and data in the body for the RPC call
    });
    
    revalidatePath('/job-orders/dashboard');
    return result; // Original returned result of fetchWithAuth, matches backend
  } catch (error: any) {
    console.error("Update Job Order Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteJobOrder(id: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/deleteJobOrder`, {
      method: 'POST',
      body: JSON.stringify({ id }) // Pass id in the body for the RPC call
    });
    
    revalidatePath('/job-orders/dashboard');
    return result; // Original returned result of fetchWithAuth, matches backend
  } catch (error: any) {
    console.error("Delete Job Order Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateJobOrderStatus(id: string, newStatus: any) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/updateJobOrderStatus`, {
      method: 'POST',
      body: JSON.stringify({ id, newStatus }) // Pass both id and newStatus in the body
    });
    
    revalidatePath(`/job-orders/${id}`);
    return result; // Original returned result of fetchWithAuth, matches backend
  } catch (error: any) {
    console.error("Update Job Order Status Error:", error);
    return { success: false, error: error.message };
  }
}

export async function unlockJobOrder(id: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/unlockJobOrder`, {
      method: 'POST',
      body: JSON.stringify({ id }) // Pass id in the body for the RPC call
    });
    
    revalidatePath(`/job-orders/${id}`);
    return result; // Original returned result of fetchWithAuth, matches backend
  } catch (error: any) {
    console.error("Unlock Job Order Error:", error);
    return { success: false, error: error.message };
  }
}
