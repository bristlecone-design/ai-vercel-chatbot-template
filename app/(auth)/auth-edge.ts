// import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth, { type Session } from 'next-auth';

// import prisma from '@/lib/prisma/client';

import { PATH_ROOT } from '@/config/site-paths';
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

export const KEY_CREDENTIALS_SIGN_IN_ERROR = 'CredentialsSignin';
export const KEY_CREDENTIALS_SIGN_IN_ERROR_URL =
  'https://errors.authjs.dev#credentialssignin';
export const KEY_CALLBACK_URL = 'callbackUrl';

export const runAuthenticatedAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  }

  throw new Error('Unauthorized server action request');
};

export const generateAuthSecret = () =>
  fetch('https://generate-secret.vercel.app/32', { cache: 'no-cache' }).then(
    (res) => res.text(),
  );

export const signOutAndRedirectAction = async (
  redirectPath: string | undefined = PATH_ROOT,
  redirect = true,
) => {
  return signOut({ redirectTo: redirectPath, redirect });
};

export const getAuthAction = async () => await auth();

export const logClientAuthUpdate = async (data: Session | null | undefined) => {
  console.log('Client auth update', data);
};
