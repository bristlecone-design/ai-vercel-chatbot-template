import type { InferSelectModel } from 'drizzle-orm';
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';

// https://orm.drizzle.team/docs/zod
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { experiences } from './schema-experiences';
import { media } from './schema-media';
import { posts } from './schema-posts';
import { prompt } from './schema-stories-prompts';
import { collaborators, users } from './schema-users';

/**
 * Interactions, e.g. Bookmarks, Likes, Comments, etc.
 */

/**
 * Bookmarks
 */
export const bookmarks = pgTable(
  'bookmark',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('bmk')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),

    // Relationships
    userId: text('userId').references(() => users.id),
    collaboratorId: text('collaboratorId').references(() => collaborators.id),
    mediaId: text('mediaId').references(() => media.id),
    postId: text('postId').references(() => posts.id),
    experienceId: text('experienceId').references(() => experiences.id),
    promptId: text('promptId').references(() => prompt.id),
  },
  (table) => [
    {
      bookmarkIndex: index('bookmarkIndex').using(
        'gin',
        table.userId,
        table.collaboratorId,
        table.mediaId,
        table.postId,
        table.experienceId,
        table.promptId,
      ),
    },
  ],
);

export type Bookmark = InferSelectModel<typeof bookmarks>;

export const bookmarkSchema = createInsertSchema(bookmarks);

export const bookmarkModelSchema = createSelectSchema(bookmarks);

/**
 * Favorites
 */
export const favorites = pgTable(
  'favorites',
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

export const favoritesSchema = createInsertSchema(favorites);

/**
 * Follows
 */

export const follows = pgTable('follows', {
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  followedById: text('followedById').notNull(),
  followingId: text('followingId').notNull(),
});

export type Follow = InferSelectModel<typeof follows>;

export const followsSchema = createInsertSchema(follows);

export const followsSelectSchema = createSelectSchema(follows);
