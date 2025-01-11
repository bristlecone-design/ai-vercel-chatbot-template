import { genId } from '@/lib/id';
import { type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
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

export const resourceType = pgEnum('resourceType', [
  'image',
  'video',
  'audio',
  'text',
  'other',
]);

export const resourceTypeSchema = createSelectSchema(resourceType);

export type ResourceType = z.infer<typeof resourceTypeSchema>;

export const resource = pgTable('resource', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => genId('res')),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),

  // Title of the resource, e.g. 'Cute Cat'
  title: text('title'),

  // Core content of the resource, e.g. can be short-form or long-form text
  content: text('content').notNull(),

  // URL of the resource, e.g. 'https://example.com/cat.jpg'
  // This will usually reflect the URL of the resource itself, but not always
  // The URL, regardless, will be the primary identifier for the resource on Vercel's Blob storage infrastructure
  url: text('url').notNull().default(''),

  // The type of the resource, e.g. 'image', 'video', 'audio', 'text', etc.
  type: resourceType().default('text'),

  // Source info for the resource (e.g. if 3rd party)
  sourceUrl: text('url').default(''),
  sourceTitle: text('sourceTitle').default(''),
  sourceDescription: text('sourceDescription').default(''),
  sourceOpenGraphTitle: text('sourceOpenGraphTitle').default(''),
  sourceOpenGraphImage: text('sourceOpenGraphImage').default(''),
  sourceOpenGraphVideo: text('sourceOpenGraphVideo').default(''),

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

  // Collaborators is an array of user IDs who have access to the resource or contributed to it
  // collaborators: text('collaborators').array().default(sql`ARRAY[]::text[]`),

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

// Create a custom type out of the source info fields
export type ResourceSourceInfo = {
  url: Resource['sourceUrl'];
  title: Resource['sourceTitle'];
  description: Resource['sourceDescription'];
  ogTitle: Resource['sourceOpenGraphTitle'];
  ogImage: Resource['sourceOpenGraphImage'];
  ogVideo: Resource['sourceOpenGraphVideo'];
};
