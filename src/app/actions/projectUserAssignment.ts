'use server';

import { revalidatePath } from 'next/cache';

// fetchWithAuth wrapper definition
const fetchWithAuth = async (url: string, options?: RequestInit) => {
  // In a real application, this would typically involve an API_BASE_URL prefix
  // and potentially token handling (e.g., from cookies or session).
  // For Next.js Server Actions, direct relative paths to /api routes usually work
  // if you have a rewrite configured in next.config.js to your AWS backend.
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
    // The backend's 500 error will have { success: false, error: message }
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export async function getUserProjectAssignments(userId: string) {
  try {
    const result = await fetchWithAuth('/api/projectUserAssignment/getUserProjectAssignments', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    // The backend returns { success: true, data: assignments }
    return result.data;
  } catch (error: any) {
    console.error('Error fetching user project assignments:', error.message);
    // Re-throw the error as original method didn't return a specific error object
    throw error;
  }
}

export async function getProjectTeamMembers(projectId: string) {
  try {
    const result = await fetchWithAuth('/api/projectUserAssignment/getProjectTeamMembers', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
    // The backend returns { success: true, data: members }
    return result.data;
  } catch (error: any) {
    console.error('Error fetching project team members:', error.message);
    throw error;
  }
}

export async function addProjectAssignment(data: {
  userId: string;
  projectId: string;
  projectRole: string;
  accessLevel: string;
  remarks?: string;
}) {
  try {
    const result = await fetchWithAuth('/api/projectUserAssignment/addProjectAssignment', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    // Backend returns { success: boolean, error?: string }
    if (result.success) {
      revalidatePath('/users/[id]', 'page');
      revalidatePath('/projects/[id]', 'page');
    }
    return result;
  } catch (error: any) {
    console.error('Error adding project assignment:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateProjectAssignment(assignmentId: string, data: {
  projectRole?: string;
  accessLevel?: string;
  assignmentStatus?: string;
}) {
  try {
    const result = await fetchWithAuth('/api/projectUserAssignment/updateProjectAssignment', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, data }),
    });
    // Backend returns { success: boolean, error?: string }
    if (result.success) {
      revalidatePath('/users/[id]', 'page');
      revalidatePath('/projects/[id]', 'page');
    }
    return result;
  } catch (error: any) {
    console.error('Error updating project assignment:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAssignment(assignmentId: string) {
  try {
    const result = await fetchWithAuth('/api/projectUserAssignment/deleteProjectAssignment', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });
    // Backend returns { success: boolean, error?: string }
    if (result.success) {
      revalidatePath('/users/[id]', 'page');
      revalidatePath('/projects/[id]', 'page');
    }
    return result;
  } catch (error: any) {
    console.error('Error deleting project assignment:', error.message);
    return { success: false, error: error.message };
  }
}
