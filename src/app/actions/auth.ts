'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
    
    // Authenticate with Amazon Cognito
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID || "",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    await client.send(command);

    // Authentication successful in Cognito, now get internal user mapping
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { error: 'User authenticated in AWS but not found in ERP system' };
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
  } catch (error: any) {
    console.error("Auth Error:", error);
    // Handle Cognito specific errors
    if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
        return { error: 'Invalid email or password' };
    }
    return { error: 'Authentication error: ' + (error.message || 'Unknown error') };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('simulatedRole');
  redirect('/login');
}
