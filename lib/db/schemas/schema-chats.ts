import type { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { genChatId, genId } from '@/lib/id';

import type {
  MessageAnnotations,
  MessageAttachment,
  MessageParts,
} from '@/types/chat-msgs';
// https://orm.drizzle.team/docs/zod
import { createInsertSchema } from 'drizzle-zod';
import { users } from './schema-users';

/**
 * Chats, Messages and Votes
 */

// export const chatRoles = pgEnum('ChatRole', [
//   'system',
//   'user',
//   'assistant',
//   'tool',
// ]);

export const chat = pgTable('chat', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => genChatId()),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  public: boolean('public').default(false),
  sharePath: text('sharePath'),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const chatSchema = createInsertSchema(chat);

export const message = pgTable('message', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => genId('msg')),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  parts: json('parts').default([]),
  annotations: json('annotations').default([]),
  attachments: json('attachment').default([]),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export type MessageSave = Omit<
  Message,
  'attachments' | 'annotations' | 'parts'
> & {
  attachments?: MessageAttachment[];
  annotations?: MessageAnnotations;
  parts?: MessageParts;
};

export const messageSchema = createInsertSchema(message);

export const vote = pgTable(
  'vote',
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

export const voteSchema = createInsertSchema(vote);

/**
 * Document and Suggestion
 */
export const document = pgTable(
  'document',
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

export const documentSchema = createInsertSchema(document);

export const docSuggestion = pgTable(
  'docSuggestion',
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

export type DocSuggestion = InferSelectModel<typeof docSuggestion>;

export const docSuggestionSchema = createInsertSchema(docSuggestion);
