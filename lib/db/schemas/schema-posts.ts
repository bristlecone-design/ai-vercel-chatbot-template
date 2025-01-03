import type { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';

// https://orm.drizzle.team/docs/zod
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { embeddings } from './schema-embeddings';
import { users } from './schema-users';
import { entityEnum } from './schema-entities';

/**
 * Posts
 */

export const postType = pgEnum('postType', [
  'general',
  'article',
  'collaboration',
  'other',
]);

export const postTypeSchema = createSelectSchema(postType);

export type PostType = z.infer<typeof postTypeSchema>;

export const postVisibilityType = pgEnum('PostVisibilityType', [
  'public',
  'private',
  'followers',
  'authenticated',
]);

export const postVisibilityTypeSchema = createSelectSchema(postVisibilityType);

export type PostVisibilityType = z.infer<typeof postVisibilityTypeSchema>;

// Create a drizzle table from the prisma Post model above
export const posts = pgTable(
  'post',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('pst')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    title: text('title'),
    content: text('content'),
    pinned: boolean('pinned').default(false),
    viewCount: integer('viewCount').default(0),
    location: text('location'),
    latitude: integer('latitude'),
    longitude: integer('longitude'),
    public: boolean('public').default(true),
    published: boolean('published').default(false),
    visibility: postVisibilityType().default('public'),
    blocked: boolean('blocked').default(false),
    authorId: text('authorId').references(() => users.id),
    type: entityEnum().default('post'),
    embeddingsId: text('embeddingsId').references(() => embeddings.id),
  },
  (table) => [
    {
      postIndex: index('postIndex').using(
        'gin',
        table.title,
        table.content,
        table.location,
      ),
    },
  ],
);

export type Post = InferSelectModel<typeof posts>;

export const postsSchema = createInsertSchema(posts);
