import { type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';
import type { AdapterAccount } from 'next-auth/adapters';

// This is used to determine what type of user is logging in.
export type UserType = 'user' | 'admin';

export const users = pgTable('User', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => genId('usr')),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  blocked: boolean('blocked').default(false),
  active: boolean('active').default(false),
  allowed: boolean('allowed').default(false),
  enabled: boolean('enabled').default(false),
  waitlist: boolean('waitlist').default(true),
  privateBeta: boolean('privateBeta').default(false),
  public: boolean('public').default(true),
  logins: integer('logins').default(0),
  role: varchar('role', { length: 16, enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  email: varchar('email', { length: 64 }).notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  password: varchar('password', { length: 64 }),
  salt: varchar('salt', { length: 64 }),
  username: text('username'), // Unique username
  name: text('name'), // Full name
  givenName: text('givenName'), // First name
  familyName: text('familyName'), // Last name
  bio: text('bio'),
  url: text('url'),
  company: text('company'),
  profession: text('profession'),
  interests: text('interests').array().notNull().default(sql`'{}'::text[]`),
  image: text('image'),
  picture: text('picture'), // Alias or fallback for image
  avatar: text('avatar'), // Alias or fallback for image
  banner: text('banner'),
  location: text('location'),
  hireable: boolean('hireable').default(false),
  address: text('address'),
  phoneVerified: boolean('phoneVerified').default(false),
  onboarded: boolean('onboarded').default(false),
  meta: json('meta').default({}),
});

export type User = InferSelectModel<typeof users>;

export const accounts = pgTable(
  'Account',
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

export const sessions = pgTable('Session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export type Session = InferSelectModel<typeof sessions>;

export const verificationNumberSessions = pgTable(
  'VerificationNumberSessions',
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
  'VerificationToken',
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

export const authenticators = pgTable(
  'Authenticator',
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

export const favorites = pgTable(
  'Favorites',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return [
      {
        id: primaryKey({ columns: [table.userId] }),
      },
    ];
  },
);

export type Favorite = InferSelectModel<typeof favorites>;

export const chat = pgTable('Chat', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => genId('chat')),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => genId('msg')),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  attachments: json('attachment').default([]),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export type MessageSave = Omit<Message, 'attachments'> & {
  attachments?: unknown;
};

export const vote = pgTable(
  'Vote',
  {
    chatId: text('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: text('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return [primaryKey({ columns: [table.chatId, table.messageId] })];
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: text('id')
      .notNull()
      .$defaultFn(() => genId('doc')),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    userId: text('userId')
      .notNull()
      .references(() => users.id),
  },
  (table) => [primaryKey({ columns: [table.id, table.createdAt] })],
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: text('id')
      .notNull()
      .$defaultFn(() => genId('sug')),
    documentId: text('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: text('userId')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  ],
);

export type Suggestion = InferSelectModel<typeof suggestion>;
