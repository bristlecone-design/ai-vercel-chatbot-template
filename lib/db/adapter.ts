import { db } from '@/lib/db/connect';
import {
  type Authenticator as AuthenticatorType,
  authenticators as Authenticators,
  accounts,
  sessions,
  users,
  verificationTokens,
} from '@/lib/db/schema';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { and, eq } from 'drizzle-orm';
import type {
  Adapter,
  AdapterAccount,
  AdapterAuthenticator,
  AdapterUser,
} from 'next-auth/adapters';

/**
 * Drizzle adapter for NextAuth.js
 *
 * @see https://authjs.dev/getting-started/adapters/drizzle
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-drizzle/src/lib/pg.ts
 */

export const drizzleAdapter = {
  ...DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  getUser: async (id) => {
    const [user] = await db.select().from(users).where(eq(users.id, id));

    console.log('getUser in adapter::', { id, user });
    return user as AdapterUser;
  },

  // createUser: async (user) => {
  //   console.log('createUser in adapter::', user);
  //   return user as AdapterUser;
  // },

  // updateUser: async (user) => {
  //   console.log('updateUser in adapter::', user);
  //   return user as AdapterUser;
  // },

  // getSessionAndUser: async (sessionToken) => {
  //   const [session] = await db
  //     .select()
  //     .from(sessions)
  //     .leftJoin(users)
  //     .where(eq(sessions.sessionToken, sessionToken));

  //   if (!session) {
  //     return null;
  //   }

  //   const user = await db.select().from(users).where(eq(users.id, session.userId));

  //   return { user, session };
  // },

  getAccount: async (providerAccountId, provider) => {
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId),
        ),
      );

    // console.log('getAccount in adapter::', {
    //   providerAccountId,
    //   provider,
    //   account,
    // });
    return (account as AdapterAccount) ?? null;
  },

  createAuthenticator: async (data) => {
    const id = crypto.randomUUID();
    await db.insert(Authenticators).values({
      id,
      ...data,
    });

    const [authenticator] = await db
      .select()
      .from(Authenticators)
      .where(eq(Authenticators.id, id));

    const { transports, id: _, ...rest } = authenticator;
    return { ...rest, transports: transports ?? undefined };
  },

  getAuthenticator: async (credentialId) => {
    const [authenticator] = await db
      .select()
      .from(Authenticators)
      .where(eq(Authenticators.credentialID, credentialId));
    return (authenticator as AdapterAuthenticator) ?? null;
  },

  listAuthenticatorsByUserId: async (userId) => {
    const auths = (await db
      .select()
      .from(Authenticators)
      .where(eq(Authenticators.userId, userId))) as AuthenticatorType[];

    return auths.map((a) => ({
      ...a,
      transports: a.transports ?? undefined,
    }));
  },

  updateAuthenticatorCounter: async (credentialId, counter) => {
    await db
      .update(Authenticators)
      .set({ counter })
      .where(eq(Authenticators.credentialID, credentialId));

    const [authenticator] = await db
      .select()
      .from(Authenticators)
      .where(eq(Authenticators.credentialID, credentialId));
    return (authenticator as AdapterAuthenticator) ?? null;
  },
} satisfies Adapter;
