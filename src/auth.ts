import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateCredentials } from '@/lib/auth-security/login';
import { authConfig } from './auth.config';

// Module augmentation to add custom fields to NextAuth Session
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    sessionVersion: number;
    mustChangePassword: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      sessionVersion: number;
      mustChangePassword: boolean;
    };
  }
}

// Module augmentation for JWT
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: string;
    sessionVersion: number;
    mustChangePassword: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        return authenticateCredentials(credentials?.email, credentials?.password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
});
