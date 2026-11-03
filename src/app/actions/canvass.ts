'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';
// @ts-nocheck

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';


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

export async function createCanvassForm(mrId: string) {
  return await fetchWithAuth('/api/canvass', {
    method: 'POST',
    body: JSON.stringify({ mrId })
  });
}

export async function addSupplierQuotation(canvassId: string, supplierId: string, items: any[]) {
  return await fetchWithAuth(`/api/canvass/${canvassId}/quotations`, {
    method: 'POST',
    body: JSON.stringify({ supplierId, items })
  });
}

export async function autoGeneratePOFromCanvass(canvassId: string, supplierId: string) {
  return await fetchWithAuth(`/api/canvass/${canvassId}/generate-po`, {
    method: 'POST',
    body: JSON.stringify({ supplierId })
  });
}

export async function sendCanvassEmail(canvassId: string, supplierIds: string[]) {
  return await fetchWithAuth(`/api/canvass/${canvassId}/email`, {
    method: 'POST',
    body: JSON.stringify({ supplierIds })
  });
}

export async function approveCanvassRecommendation(canvassId: string) {
  return await fetchWithAuth(`/api/canvass/${canvassId}/approve`, {
    method: 'POST'
  });
}

export async function endorseCanvassRecommendation(canvassId: string) {
  return await fetchWithAuth(`/api/canvass/${canvassId}/endorse`, {
    method: 'POST'
  });
}

export async function deleteCanvass(canvassId: string) {
  const result = await fetchWithAuth(`/api/canvass/${canvassId}`, {
    method: 'DELETE'
  });

  if (result.success) {
    revalidatePath('/procurement/canvassing');
  }

  return result;
}

export async function updateSupplierQuotation(quotationId: string, supplierId: string, items: any[]) {
  return await fetchWithAuth(`/api/canvass/quotations/${quotationId}`, {
    method: 'PUT',
    body: JSON.stringify({ supplierId, items })
  });
}
