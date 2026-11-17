'use server';
import { signIn, signOut } from '@/auth';
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // Home performs the existing authoritative role-specific redirect.
    return { redirect: '/' };

  } catch (error: any) {
    return { error: 'Invalid email or password' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session'); // Clear legacy session cookie if it exists
  cookieStore.delete('simulatedRole');
  await signOut({ redirectTo: '/login' });
}
