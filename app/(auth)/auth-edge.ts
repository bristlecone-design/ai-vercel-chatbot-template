// import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

// import prisma from '@/lib/prisma/client';

import { authConfig } from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  // https://authjs.dev/getting-started/adapters/prisma
  // adapter: PrismaAdapter(prisma),
  //   session: { strategy: 'jwt' },
  ...authConfig,
});
