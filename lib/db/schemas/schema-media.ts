import { type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { genId } from '../../id';
import { message } from './schema-chats';
import { experiences } from './schema-experiences';
import { posts } from './schema-posts';
import { users, collaborators } from './schema-users';

/**
 * Media and Related
 */

export const media = pgTable(
  'media',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('med')),
    blobId: text('blobId'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    title: text('title').notNull(),
    description: text('description'),
    semanticDescription: text('semanticDescription'),
    url: text('url').notNull(),
    urlOriginal: text('urlOriginal'),
    urlDownload: text('urlDownload'),
    alt: text('alt'),
    caption: text('caption'),
    credit: text('credit'),
    creditLink: text('creditLink'),
    creditLinkText: text('creditLinkText'),
    language: text('language').default('en'),
    order: integer('order').default(0),

    staffPick: boolean('staffPick').default(false),
    featured: boolean('featured').default(false),
    hidden: boolean('hidden').default(false),
    public: boolean('public').default(true),
    pinned: boolean('pinned').default(false),
    removed: boolean('removed').default(false),

    downloadable: boolean('downloadable').default(true),
    remixable: boolean('remixable').default(true),
    price: real('price'),
    forSale: boolean('forSale').default(false),
    forLicense: boolean('forLicense').default(false),
    purchaseNotes: text('purchaseNotes'),
    usageNotes: text('usageNotes'),

    extension: text('extension'),
    aspectRatio: real('aspectRatio'),
    make: text('make'),
    model: text('model'),
    tags: text('tags').array().default(sql`ARRAY[]::text[]`),
    focalLength: text('focalLength'),
    focalLengthFormatted: text('focalLengthFormatted'),
    focalLength35: text('focalLength35'),
    focalLengthIn35MmFormatFormatted: text('focalLengthIn35MmFormatFormatted'),
    aperture: text('aperture'),
    iso: integer('iso'),
    isoFormatted: text('isoFormatted'),
    fNumber: integer('fNumber'),
    fNumberFormatted: text('fNumberFormatted'),
    lensMake: text('lensMake'),
    lensModel: text('lensModel'),
    exposureTime: text('exposureTime'),
    exposureTimeFormatted: text('exposureTimeFormatted'),
    exposureCompensation: text('exposureCompensation'),
    exposureCompensationFormatted: text('exposureCompensationFormatted'),
    locationName: text('locationName'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    filmSimulation: text('filmSimulation'),
    priorityOrder: doublePrecision('priorityOrder'),
    takenAt: timestamp('takenAt'),
    takenAtNaive: text('takenAtNaive'),
    takenAtNaiveFormatted: text('takenAtNaiveFormatted'),
    blurData: text('blurData'),
    meta: json('meta').default({}),
    storagePath: text('storagePath'),
    isTTS: boolean('isTTS').default(false),

    // Relationships
    userId: text('userId').references(() => users.id),
    postId: text('postId').references(() => posts.id),
    chatMessageId: text('chatMessageId').references(() => message.id),
    experienceId: text('experienceId').references(() => experiences.id),
    // originalId: text('originalId').references(() => media.id),
    originalUrl: text('originalUrl'),
  },
  (table) => [
    {
      mediaIndex: index('mediaIndex').using(
        'gin',
        table.title,
        table.description,
        table.tags,
      ),
    },
  ],
);

export type Media = InferSelectModel<typeof media>;

export const mediaSchema = createInsertSchema(media);

export const mediaModelSchema = createSelectSchema(media);

export type MediaInsert = InferInsertModel<typeof media>;

export const mediaInsertSchema = createInsertSchema(media);

/**
 * Media Likes
 */

export const mediaLikes = pgTable(
  'mediaLike',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('mdl')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),

    // Relationships
    userId: text('userId').references(() => users.id),
    mediaId: text('mediaId').references(() => media.id),
  },
  (table) => [
    {
      mediaLikeIndex: index('mediaLikeIndex').using(
        'gin',
        table.userId,
        table.mediaId,
      ),
    },
  ],
);

export type MediaLike = InferSelectModel<typeof mediaLikes>;

export const mediaLikeSchema = createInsertSchema(mediaLikes);

/**
 * Media Collaborators
 */

export const collaboratorMedia = pgTable(
  'collaboratorMedia',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('clm')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),

    // Relationships
    collaboratorId: text('collaboratorId').references(() => collaborators.id),
    mediaId: text('mediaId').references(() => media.id),
  },
  (table) => [
    {
      collaboratorMediaIndex: index('collaboratorMediaIndex').using(
        'gin',
        table.collaboratorId,
        table.mediaId,
      ),
    },
  ],
);

export type CollaboratorMedia = InferSelectModel<typeof collaboratorMedia>;

export const collaboratorMediaSchema = createInsertSchema(collaboratorMedia);

/**
 * Media Audio
 */
export const audioMedia = pgTable(
  'audioMedia',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('aud')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    model: text('model').notNull(),
    language: text('language').default('en'),
    voice: text('voice'),

    // Relationships
    userId: text('userId').references(() => users.id),
    mediaId: text('mediaId').references(() => media.id),
    experienceId: text('experienceId').references(() => experiences.id),
  },
  (table) => [
    {
      audioMediaIndex: index('audioMediaIndex').using(
        'gin',
        table.model,
        table.language,
        table.voice,
      ),
    },
  ],
);

export type AudioMediaInsert = InferInsertModel<typeof audioMedia>;

export type AudioMedia = InferSelectModel<typeof audioMedia>;

export const audioMediaSchema = createInsertSchema(audioMedia);

export const audioMediaModelSchema = createSelectSchema(audioMedia);
