import { genId } from '@/lib/id';
import { type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { users } from './schema-users';

/**
 * Resources
 *
 * Content resources for embeddings, e.g. images, videos, experiences, posts, etc.
 */

export const resource = pgTable('resource', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => genId('res')),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),

  title: text('title'),

  content: text('content').notNull(),

  url: text('url').default(''),

  verified: boolean('public').default(false),

  // Content analysis keywords/tags, e.g. 'cat', 'dog', 'tree', etc.
  keywords: text('keywords').array().notNull().default(sql`ARRAY[]::text[]`),

  // Content classification, e.g. 'image', 'video', 'audio', 'text', etc.
  categories: text('categories')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),

  // General note about the resource
  note: text('note'),

  // Relationships: required
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Relationships: optional
  // experienceId: text('experienceId').references(() => experiences.id),
  // embedId: text('embedId').references(() => embeddings.id, { onDelete: 'cascade' }),
});

export type Resource = InferSelectModel<typeof resource>;

// Schema for resources - used to validate API requests
export const resourceInsertSchema = createInsertSchema(resource)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const resourceSelectSchema = createSelectSchema(resource);

// Type for resources - used to type API request params and within Components
export type NewResourceParams = z.infer<typeof resourceInsertSchema>;
