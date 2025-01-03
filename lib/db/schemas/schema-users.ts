import { type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';

// https://orm.drizzle.team/docs/zod
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

/**
 * Users and Collaborators
 */

export const userType = pgEnum('userType', ['user', 'admin', 'system']);

export const userTypeSchema = createSelectSchema(userType);

export type UserType = z.infer<typeof userTypeSchema>;

export const users = pgTable('user', {
  id: text('id')
    .notNull()
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
  blog: text('blog'),
  url: text('url'),
  urlSocial: text('urlSocial'),
  urlPay: text('urlPay'),
  company: text('company'),
  organization: text('organization'),
  profession: text('profession'),
  investor: json('investor').array().default(sql`'{}'::json[]`),
  partner: json('partner').array().default(sql`'{}'::json[]`),
  interests: text('interests').array().notNull().default(sql`ARRAY[]::text[]`),
  image: text('image'),
  picture: text('picture'), // Alias or fallback for image
  avatar: text('avatar'), // Alias or fallback for image
  banner: text('banner'),
  location: text('location'),
  hireable: boolean('hireable').default(false),
  address: text('address'),
  phoneVerified: boolean('phoneVerified').default(false),
  onboarded: boolean('onboarded').default(false),
  followerCount: integer('followerCount').default(0),
  verified: boolean('verified').default(false),
  meta: json('meta').default({}),
});

export type User = InferSelectModel<typeof users>;

export const userInsertSchema = createInsertSchema(users);

export const userSelectSchema = createSelectSchema(users);

export const userProfileSchema = userSelectSchema.pick({
  id: true,
  url: true,
  urlSocial: true,
  urlPay: true,
  bio: true,
  name: true,
  role: true,
  email: true,
  profession: true,
  location: true,
  username: true,
  waitlist: true,
  privateBeta: true,
  allowed: true,
  blocked: true,
  public: true,
  active: true,
  logins: true,
  onboarded: true,
  company: true,
  organization: true,
  interests: true,
  avatar: true,
  image: true,
  banner: true,
  createdAt: true,
  updatedAt: true,
  followerCount: true,
});

/**
 * Collaborator
 */

export const collaborators = pgTable(
  'collaborator',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId('col')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    active: boolean('active').default(false),
    blocked: boolean('blocked').default(false),
    meta: json('meta').default({}),

    // Relationships
    userId: text('userId').references(() => users.id),
  },
  (table) => [
    {
      collaboratorIndex: index('collaboratorIndex').using('gin', table.userId),
    },
  ],
);

export type Collaborator = InferSelectModel<typeof collaborators>;

export const collaboratorSchema = createInsertSchema(collaborators);
