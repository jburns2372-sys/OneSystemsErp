'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Standard fetchWithAuth wrapper
async function fetchWithAuth(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }
  
  // Assuming backend always returns { success: boolean, error?: string, ... }
  if (data.success === false) {
    throw new Error(data.error || 'Operation failed on backend');
  }

  return data;
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const data = await fetchWithAuth('/api/auth/login', { // Call AWS backend via API route 'auth'
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // If backend reports success and provides user info
    if (data.success && data.user) {
      // Create simple session cookie
      const cookieStore = await cookies();
      cookieStore.set('session', data.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      if (data.user.role === 'DIRECTORS') {
        redirect('/executive/home');
      } else {
        redirect('/');
      }
    } else {
      // This case should ideally be caught by fetchWithAuth throwing an error,
      // but as a fallback for unexpected successful-but-no-user responses.
      return { error: data.error || 'Login failed due to unexpected response' };
    }

  } catch (error: any) {
    console.error("Auth Error (Next.js Proxy):", error);
    return { error: error.message || 'Authentication error: Unknown error' };
  }
}

export async function logout() {
  try {
    // Call the backend endpoint (even if it performs no specific server-side logic for logout)
    await fetchWithAuth('/api/auth/logout', { method: 'POST' });

    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('simulatedRole');
    redirect('/login');
  } catch (error: any) {
    console.error("Logout Error (Next.js Proxy):", error);
    // Even if the backend call fails, attempt to clear client-side cookies for a better UX
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('simulatedRole');
    redirect('/login'); // Redirect anyway
    return { error: error.message || 'Logout failed, but session cleared.' };
  }
}
