'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Base URL for the AWS backend API. This should point to your AWS Express.js application.
const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || 'http://localhost:3001'; // Default for local development

/**
 * A wrapper around fetch that includes authentication headers and handles API responses.
 */
async function fetchWithAuth(url: string, options?: RequestInit) {
  const __session = await verifySession();
  if (!__session?.id) {
    redirect('/login');
  }

  const response = await fetchAuthenticatedBackend(url, {
    ...options,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Server error: ${response.statusText || 'Unknown'}` };
    }
    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

const API_ROUTE_PREFIX = '/api/user-roles'; // This will be appended to BACKEND_API_BASE_URL

export async function getUsersWithRoles() {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/getUsersWithRoles`, {
    method: 'POST',
  });
  
  // Assuming the backend returns { success: true, users: [...], roles: [...] } on success
  if (response.success) {
    return { users: response.users, roles: response.roles };
  }
  throw new Error(response.error || 'Failed to fetch users and roles.');
}

export async function assignRoleToUser(userId: string, roleId: string) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/assignRoleToUser`, {
    method: 'POST',
    body: JSON.stringify({ userId, roleId }),
  });
  
  if (response.success) {
    revalidatePath('/admin/user-roles');
  }
  return response; // Returns { success: true } or { success: false, error: ... }
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/removeRoleFromUser`, {
    method: 'POST',
    body: JSON.stringify({ userId, roleId }),
  });
  
  if (response.success) {
    revalidatePath('/admin/user-roles');
  }
  return response; // Returns { success: true } or { success: false, error: ... }
}

export async function updateUserStatus(userId: string, status: string) {
  // Served by the authenticated, RBAC-guarded Express handler
  // POST /api/user-roles/updateUserStatus (apps/aws-backend/src/routes/user-roles.ts).
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/updateUserStatus`, {
    method: 'POST',
    body: JSON.stringify({ userId, status }),
  });
  
  if (!response?.success) {
    throw new Error(response?.error || 'Failed to update user status.');
  }
  revalidatePath('/admin/user-roles');
  return response; // Returns { success: true, status }
}
