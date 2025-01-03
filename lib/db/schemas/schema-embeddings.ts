import type { InferSelectModel } from 'drizzle-orm';
import {
  index,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';

import { genId } from '@/lib/id';
import { chat, message } from './schema-chats';
import { resource } from './schema-content-resources';
import { entityEnum } from './schema-entities';
import { places } from './schema-places';
import { users } from './schema-users';

/**
 * Embeddings
 */

// https://orm.drizzle.team/docs/guides/vector-similarity-search
export const embeddings = pgTable(
  'embeddings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('emb')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),

    type: entityEnum().default('content'),

    content: text('content').notNull(), // source used to generate the embedding

    contentHash: text('contentHash'), // hash of the content as an alternative to the content for lookup

    description: text('description'), // A description of the embedding for humans. If defined, this will/can be used to give the AI assistant more context.

    embedding: vector('embedding', { dimensions: 1536 }),

    model: text('model').notNull(), // Model used to generate the embedding

    usage: text('usage').notNull(), // Usage of the embedding

    meta: json('meta').default({}),

    // Relationships: required
    resourceId: varchar('resourceId', { length: 191 })
      .references(() => resource.id, { onDelete: 'cascade' })
      .notNull(),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Relationships: optional
    chatId: text('chatId').references(() => chat.id),

    messageId: text('messageId').references(() => message.id),

    placeId: text('placeId').references(() => places.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    {
      embeddingIndex: index('embeddingIndex').using(
        'hnsw',
        table.embedding.op('vector_cosine_ops'),
      ),
    },
  ],
);

export type Embeddings = InferSelectModel<typeof embeddings>;
