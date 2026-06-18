'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;

  if (!userId) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!name || !email) {
    return { success: false, error: 'Name and email are required.' };
  }

  if (password && password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  try {
    const dataToUpdate: any = {
      name,
      email,
    };

    if (password) {
      // In a real application, ensure you hash the password before saving. 
      // Based on auth.ts, passwords here might be plain text for prototype, 
      // but update this as per project security standards.
      dataToUpdate.password = password;
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    revalidatePath('/');
    revalidatePath('/profile');

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error: any) {
    // Handle unique constraint failure for email
    if (error.code === 'P2002') {
      return { success: false, error: 'Email is already in use by another account.' };
    }
    return { success: false, error: 'An error occurred while updating the profile.' };
  }
}
