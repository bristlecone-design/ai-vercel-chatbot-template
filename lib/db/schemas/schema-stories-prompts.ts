import { type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';

// https://orm.drizzle.team/docs/zod
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { embeddings } from './schema-embeddings';
import { experiences } from './schema-experiences';
import { userType, users } from './schema-users';

/**
 * Prompts and Stories
 */

export const prompt = pgTable(
  'prompt',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('prm')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    title: text('title').notNull(),
    content: text('content'),
    prompt: text('prompt').notNull(),
    location: text('location'),
    activities: text('activities').array().default(sql`ARRAY[]::text[]`),
    interests: text('interests').array().default(sql`ARRAY[]::text[]`),
    model: text('model'),
    pinned: boolean('pinned').default(false),
    featured: boolean('featured').default(false),
    published: boolean('published').default(true),
    private: boolean('private').default(false),
    archived: boolean('archived').default(false),
    viewCount: integer('viewCount').default(0),
    type: userType().default('user'),
    meta: json('meta').default({}),

    // Relationships
    authorId: text('authorId').references(() => users.id),
    embeddingsId: text('embeddingsId').references(() => embeddings.id),
    promptCollectionId: text('promptCollectionId').references(
      () => promptCollection.id,
    ),
  },
  (table) => [
    {
      promptIndex: index('promptIndex').using(
        'gin',
        table.title,
        table.prompt,
        table.model,
      ),
    },
  ],
);

export type Prompt = InferSelectModel<typeof prompt>;

// Alias for Prompt
export type PromptModel = InferSelectModel<typeof prompt>;

export type PromptInsert = InferInsertModel<typeof prompt>;

export const promptSchema = createInsertSchema(prompt);

export const promptModelSchema = createSelectSchema(prompt);

export const promptCollection = pgTable(
  'promptCollection',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId('prm')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    title: text('title').notNull(),
    path: text('path').notNull(),
    description: text('description'),
    shortDescription: text('shortDescription'),
    banner: text('banner'),
    logo: text('logo'),
    website: text('website'),
    videoUrl: text('videoUrl'),
    videoCaption: text('videoCaption'),
    featured: boolean('featured').default(false),
    pinned: boolean('pinned').default(false),
    published: boolean('published').default(true),
    meta: json('meta').default({}),
  },
  (table) => [
    {
      promptCollectionIndex: index('promptCollectionIndex').using(
        'gin',
        table.title,
        table.path,
      ),
    },
  ],
);

export type PromptCollection = InferSelectModel<typeof promptCollection>;

export const promptCollectionSchema = createInsertSchema(promptCollection);

export const promptCollectionModelSchema = createSelectSchema(promptCollection);

// Alias for PromptCollection
export type Story = InferSelectModel<typeof promptCollection>;

export const storySchema = createInsertSchema(promptCollection);

export const promptCollaborators = pgTable(
  'promptCollaborator',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('prc')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    published: boolean('published').default(true),

    // Relationships
    userId: text('userId')
      .references(() => users.id)
      .notNull(),
    experienceId: text('experienceId')
      .references(() => experiences.id)
      .notNull(),
    promptId: text('promptId')
      .references(() => prompt.id)
      .notNull(),
    storyId: text('storyId')
      .references(() => promptCollection.id)
      .notNull(),
  },
  (table) => [
    {
      promptCollaboratorIndex: index('promptCollaboratorIndex').using(
        'gin',
        table.userId,
        table.promptId,
        table.experienceId,
        table.storyId,
      ),
    },
  ],
);

export type PromptCollaborator = InferSelectModel<typeof promptCollaborators>;

export const promptCollaboratorSchema = createSelectSchema(promptCollaborators);
