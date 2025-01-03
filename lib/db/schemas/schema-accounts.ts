import type { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';
import type { AdapterAccount } from 'next-auth/adapters';

// https://orm.drizzle.team/docs/zod
import { createInsertSchema } from 'drizzle-zod';
import { users } from './schema-users';

/**
 * Auth and Accounts
 */

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    {
      compositePk: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export type Account = InferSelectModel<typeof accounts>;

export const accountSchema = createInsertSchema(accounts);

/**
 * Session
 */

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export type Session = InferSelectModel<typeof sessions>;

export const sessionSchema = createInsertSchema(sessions);

/**
 * Verification
 */

export const verificationNumberSessions = pgTable(
  'verificationNumberSessions',
  {
    verificationNumber: text('verificationNumber').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => {
    return [
      {
        pk: primaryKey({ columns: [table.userId, table.createdAt] }),
      },
    ];
  },
);

export type VerificationNumberSession = InferSelectModel<
  typeof verificationNumberSessions
>;

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);

export type VerificationToken = InferSelectModel<typeof verificationTokens>;

export const verificationTokensSchema = createInsertSchema(verificationTokens);

/**
 * Auth
 */

export const authenticators = pgTable(
  'authenticator',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId('ath')),
    credentialID: text('credentialId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ],
);

export type Authenticator = InferSelectModel<typeof authenticators>;

export const authenticatorSchema = createInsertSchema(authenticators);
