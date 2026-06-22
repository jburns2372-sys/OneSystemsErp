'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email }
    });
  } catch (error: any) {
    return { error: 'Database connection error: ' + (error.message || 'Unknown error') };
  }

  if (!user || user.password !== password) {
    return { error: 'Invalid email or password' };
  }

  // Create simple session cookie
  const cookieStore = await cookies();
  cookieStore.set('session', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  if (user.role === 'DIRECTORS') {
    redirect('/executive/home');
  } else {
    redirect('/');
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('simulatedRole');
  redirect('/login');
}
