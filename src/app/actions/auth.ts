'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  let redirectPath = '';
  
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    if (user.status !== 'ACTIVE') {
      return { error: 'Account is disabled or locked' };
    }

    let isValid = false;
    
    // First try bcrypt compare
    try {
      isValid = await bcrypt.compare(password, user.passwordHash || user.password || '');
    } catch (e) {
      // Ignore invalid hash errors
    }
    
    // Fallback: If bcrypt failed, check if the password is stored in plain text
    // REMOVED plaintext comparison for Phase 2 compliance
    
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    // Check if a database-backed session strategy (sessionVersion) is in use
    const userWithSession = await prisma.user.findUnique({
      where: { id: user.id },
      select: { sessionVersion: true }
    }) as any;

    const sessionValue = userWithSession?.sessionVersion !== undefined
      ? `${user.id}:${userWithSession.sessionVersion}`
      : user.id;

    // Create simple session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    if (user.role === 'DIRECTORS') {
      redirectPath = '/executive/home';
    } else {
      redirectPath = '/';
    }

  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error("Auth Error:", error);
    return { error: 'Authentication error: Unknown error' };
  }
  
  if (redirectPath) {
    redirect(redirectPath);
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('simulatedRole');
  redirect('/login');
}
