import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true; // We use our own Proxy and verifySession for authorization
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
