import { type InferSelectModel, sql } from 'drizzle-orm';
import { boolean, json, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { users } from './schema-users';

/**
 * Discovery Suggestion
 */

export const discoverySuggestionEnum = pgEnum('discoverySuggestionType', [
  'discover',
  'experience',
  'share',
  'learn',
  'other',
]);

export const discoverySuggestionEnumSchema = createSelectSchema(
  discoverySuggestionEnum,
);

export type DiscoverySuggestionEnum = z.infer<
  typeof discoverySuggestionEnumSchema
>;

export const discoverySuggestion = pgTable('discoverySuggestion', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => genId('ds')),
  genId: text('genId'),
  title: text('title').notNull(),
  action: text('label').notNull(),
  suggestion: text('suggestion').notNull(),
  type: discoverySuggestionEnum().default('discover'),
  municipalities: text('municipalities')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  activities: text('activities')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  interests: text('interests').array().notNull().default(sql`ARRAY[]::text[]`),

  // Visibility
  public: boolean('public').default(false),

  // Meta
  meta: json('meta').default({}),

  // Relationships
  userId: text('userId').references(() => users.id),
});

export type DiscoverySuggestion = InferSelectModel<typeof discoverySuggestion>;

export const discoverySuggestionInsertSchema =
  createInsertSchema(discoverySuggestion);

export const discoverySuggestionSchema =
  createSelectSchema(discoverySuggestion);
