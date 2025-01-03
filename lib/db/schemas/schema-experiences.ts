import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
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
import { entityEnum } from './schema-entities';
import { postVisibilityType } from './schema-posts';
import { prompt, promptCollection } from './schema-stories-prompts';
import { users } from './schema-users';

/**
 * Experience
 */

export const experienceType = pgEnum('experienceType', [
  'post',
  'discover',
  'experience',
]);

export const experienceTypeSchema = createSelectSchema(experienceType);

export type ExperienceType = z.infer<typeof experienceTypeSchema>;

export const experiences = pgTable(
  'experience',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('exp')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    pinnedAt: timestamp('pinnedAt'),
    title: text('title'),
    name: text('name'),
    content: text('content').notNull(),
    richContent: text('richContent'),
    description: text('description'),
    prompt: text('prompt'),
    ctas: json('ctas').default({}),
    sharePath: text('sharePath'),
    public: boolean('public').default(false),
    blocked: boolean('blocked').default(false),
    removed: boolean('removed').default(false),
    published: boolean('published').default(true),
    visibility: postVisibilityType().notNull().default('public'),
    views: integer('views').default(0),
    upVoted: integer('upVoted').default(0),
    pinned: boolean('pinned').default(false),
    staffPick: boolean('staffPick').default(false),
    hideGeoLocation: boolean('hideGeoLocation').default(false),
    location: text('location'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    type: entityEnum().default('experience'),
    subType: experienceType().default('experience'),
    meta: json('meta').default({}),

    // Relationships
    authorId: text('authorId').references(() => users.id),
    embeddingsId: text('embeddingsId').references(() => embeddings.id),
    kvStorageId: text('kvStorageId'),
    promptId: text('promptId').references(() => prompt.id),
    storyId: text('storyId').references(() => promptCollection.id),
  },
  (table) => [
    {
      experienceIndex: index('experienceIndex').using(
        'gin',
        table.title,
        table.content,
        table.description,
      ),
    },
  ],
);

export type Experience = InferSelectModel<typeof experiences>;

export type ExperienceSave = InferInsertModel<typeof experiences>;

export const experiencesSchema = createInsertSchema(experiences);

export const experienceModelSchema = createSelectSchema(experiences);

/**
 * Experience Likes
 */
export const experienceLikes = pgTable(
  'experienceLikes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('exp')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),

    // Relationships
    userId: text('userId').references(() => users.id),
    experienceId: text('experienceId').references(() => experiences.id),
    promptId: text('promptId').references(() => prompt.id),
  },
  (table) => [
    {
      experienceLikesIndex: index('experienceLikesIndex').using(
        'gin',
        table.userId,
        table.experienceId,
        table.promptId,
      ),
    },
  ],
);

export type ExperienceLikes = InferSelectModel<typeof experienceLikes>;

export const experienceLikesSchema = createInsertSchema(experienceLikes);

export const experienceLikesModelSchema = createSelectSchema(experienceLikes);
