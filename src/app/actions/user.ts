'use server';

import { revalidatePath } from 'next/cache';

const BACKEND_URL = process.env.NEXT_PUBLIC_AWS_BACKEND_URL || process.env.AWS_BACKEND_URL || 'http://localhost:3001';

// Placeholder fetchWithAuth definition
// In a real application, this would likely be imported from a utility file.
const fetchWithAuth = async (url: string, options?: RequestInit) => {
  // Implement your authentication logic here, e.g., adding an Authorization header
  // For this example, we'll just forward the fetch call.
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`, // Add your auth token here
      ...options?.headers,
    },
    ...options,
  };
  
  const response = await fetch(`${BACKEND_URL}${url}`, defaultOptions);
  // You might want to handle specific authentication errors (e.g., 401, 403) here
  // if (!response.ok) {
  //   // Handle API errors
  //   const errorData = await response.json();
  //   throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
  // }
  return response;
};

const API_ROUTE_PREFIX = '/api/user'; // This will be your Next.js API route that proxies to AWS

export async function getSystemRoles() {
  try {
    const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/getSystemRoles`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Failed to get system roles: API returned non-JSON response.");
      return [];
    }
    const json = await response.json();
    if (!json.success) {
      console.error('Failed to get system roles:', json.error);
      return []; // Return empty array on failure
    }
    return json.data; // Expecting `data` to be roles.map(r => r.name)
  } catch (error) {
    console.error('Network error in getSystemRoles:', error);
    return [];
  }
}

export async function deleteSystemRole(roleName: string) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/deleteSystemRole`, {
    method: 'POST',
    body: JSON.stringify({ roleName }),
  });
  const json = await response.json();
  if (json.success) {
    revalidatePath('/users');
  }
  return { success: json.success, error: json.error };
}

export async function updateSystemRole(oldName: string, newName: string) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/updateSystemRole`, {
    method: 'POST',
    body: JSON.stringify({ oldName, newName }),
  });
  const json = await response.json();
  if (json.success) {
    revalidatePath('/users');
  }
  return { success: json.success, error: json.error };
}

export async function createSystemRole(roleName: string) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/createSystemRole`, {
    method: 'POST',
    body: JSON.stringify({ roleName }),
  });
  const json = await response.json();
  if (json.success) {
    revalidatePath('/users');
  }
  return { success: json.success, error: json.error, name: json.name };
}

export async function createUser(data: { name: string, email: string, role: string }) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/createUser`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (json.success) {
    revalidatePath('/users');
  }
  return { success: json.success, error: json.error };
}

export async function updateUser(id: string, data: { name: string, email: string, role: string, password?: string }) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/updateUser`, {
    method: 'POST',
    body: JSON.stringify({ id, data }), // Send both id and data in the body
  });
  const json = await response.json();
  if (json.success) {
    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
  }
  return { success: json.success, error: json.error };
}

export async function deleteUser(id: string) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/deleteUser`, {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  const json = await response.json();
  if (json.success) {
    revalidatePath('/users');
  }
  return { success: json.success, error: json.error };
}
