import { type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';

import { genChatId, genId } from '@/lib/id';
import type { AdapterAccount } from 'next-auth/adapters';

// https://orm.drizzle.team/docs/zod
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { z } from 'zod';

// https://orm.drizzle.team/docs/column-types/pg#enum
export const entityEnum = pgEnum('entityType', [
  'place',
  'post',
  'guide',
  'discovery',
  'experience',
  'embedding',
  'content',
  'generic',
  'event',
  'research',
  'other',
]);

/**
 * User
 */

export const userType = pgEnum('userType', ['user', 'admin', 'system']);

export const users = pgTable('user', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => genId('usr')),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  blocked: boolean('blocked').default(false),
  active: boolean('active').default(false),
  allowed: boolean('allowed').default(false),
  enabled: boolean('enabled').default(false),
  waitlist: boolean('waitlist').default(true),
  privateBeta: boolean('privateBeta').default(false),
  public: boolean('public').default(true),
  logins: integer('logins').default(0),
  role: varchar('role', { length: 16, enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  email: varchar('email', { length: 64 }).notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  password: varchar('password', { length: 64 }),
  salt: varchar('salt', { length: 64 }),
  username: text('username'), // Unique username
  name: text('name'), // Full name
  givenName: text('givenName'), // First name
  familyName: text('familyName'), // Last name
  bio: text('bio'),
  url: text('url'),
  urlSocial: text('urlSocial'),
  urlPay: text('urlPay'),
  company: text('company'),
  organization: text('organization'),
  profession: text('profession'),
  interests: text('interests').array().notNull().default(sql`ARRAY[]::text[]`),
  image: text('image'),
  picture: text('picture'), // Alias or fallback for image
  avatar: text('avatar'), // Alias or fallback for image
  banner: text('banner'),
  location: text('location'),
  hireable: boolean('hireable').default(false),
  address: text('address'),
  phoneVerified: boolean('phoneVerified').default(false),
  onboarded: boolean('onboarded').default(false),
  followerCount: integer('followerCount').default(0),
  meta: json('meta').default({}),
});

export type User = InferSelectModel<typeof users>;

export const userInsertSchema = createInsertSchema(users);

export const userSelectSchema = createSelectSchema(users);

export const userProfileSchema = userSelectSchema.pick({
  id: true,
  url: true,
  urlSocial: true,
  urlPay: true,
  bio: true,
  name: true,
  role: true,
  email: true,
  profession: true,
  location: true,
  username: true,
  waitlist: true,
  privateBeta: true,
  allowed: true,
  blocked: true,
  public: true,
  active: true,
  logins: true,
  onboarded: true,
  company: true,
  organization: true,
  interests: true,
  avatar: true,
  image: true,
  banner: true,
  createdAt: true,
  updatedAt: true,
  followerCount: true,
});

/**
 * Collaborator
 */

export const collaborators = pgTable(
  'collaborator',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId('col')),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    active: boolean('active').default(false),
    blocked: boolean('blocked').default(false),
    meta: json('meta').default({}),

    // Relationships
    userId: text('userId').references(() => users.id),
  },
  (table) => [
    {
      collaboratorIndex: index('collaboratorIndex').using('gin', table.userId),
    },
  ],
);

export type Collaborator = InferSelectModel<typeof collaborators>;

export const collaboratorSchema = createInsertSchema(collaborators);

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

/**
 * Account
 */

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    {
      compositePk: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export type Account = InferSelectModel<typeof accounts>;

export const accountSchema = createInsertSchema(accounts);

/**
 * Session
 */

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export type Session = InferSelectModel<typeof sessions>;

export const sessionSchema = createInsertSchema(sessions);

/**
 * Verification
 */

export const verificationNumberSessions = pgTable(
  'verificationNumberSessions',
  {
    verificationNumber: text('verificationNumber').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => {
    return [
      {
        pk: primaryKey({ columns: [table.userId, table.createdAt] }),
      },
    ];
  },
);

export type VerificationNumberSession = InferSelectModel<
  typeof verificationNumberSessions
>;

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);

export type VerificationToken = InferSelectModel<typeof verificationTokens>;

export const verificationTokensSchema = createInsertSchema(verificationTokens);

/**
 * Auth
 */

export const authenticators = pgTable(
  'authenticator',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId('ath')),
    credentialID: text('credentialId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ],
);

export type Authenticator = InferSelectModel<typeof authenticators>;

export const authenticatorSchema = createInsertSchema(authenticators);

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
  attachments: json('attachment').default([]),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export type MessageSave = Omit<Message, 'attachments'> & {
  attachments?: unknown;
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

/**
 * Place
 */

export const places = pgTable(
  'places',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => genId('place')),
    placeId: text('placeId').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    name: text('name').notNull(),
    description: text('description'),
    shortDescription: text('shortDescription'),
    aliases: text('aliases').array().notNull().default(sql`ARRAY[]::text[]`),
    address: text('address'),
    formattedAddress: text('formattedAddress'),
    formattedAddressShort: text('formattedAddressShort'),
    formattedPhoneNumber: text('formattedPhoneNumber'),
    addressHtml: text('addressHtml'),
    addressComponents: json('addressComponents')
      .array()
      .notNull()
      .default(sql`'{}'::json[]`),
    city: text('city'),
    state: text('state'),
    icon: text('icon'),
    iconBackgroundColor: text('iconBackgroundColor'),
    iconMaskBaseUri: text('iconMaskBaseUri'),
    reference: text('reference'),
    location: text('location'),
    vicinity: text('vicinity'),
    rating: text('rating'),
    userRatingsTotal: integer('userRatingsTotal'),
    utcOffset: integer('utcOffset'),
    permanentlyClosed: boolean('permanentlyClosed'),
    businessStatus: text('businessStatus'),
    types: text('types').array().notNull().default(sql`ARRAY[]::text[]`),
    primaryType: text('primaryType'),
    openingHours: json('openingHours'),
    priceLevel: text('priceLevel'),
    reviews: json('reviews').array().notNull().default(sql`'{}'::json[]`),
    geometry: json('geometry'), // @deprecated
    coordinates: json('coordinates'),
    viewPort: json('viewPort'),
    evChargeOpts: json('evChargeOpts'),
    parkingOpts: json('parkingOpts'),
    plusCode: json('plusCode'),
    photo: json('photo'),
    photos: json('photos').array().notNull().default(sql`'{}'::json[]`),
    url: text('url'),
    website: text('website'),
    meta: json('meta').default({}),
  },
  (table) => [
    {
      placeIndex: index('placeIndex').using(
        'gin',
        table.name,
        table.description,
        table.address,
      ),
    },
  ],
);

export const placesSchema = createInsertSchema(places, {
  placeId: z.string().optional(),
});

export type Place = InferSelectModel<typeof places>;

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
    title: text('title').notNull(),
    url: text('url').default(''),
    text: text('text').notNull(), // source used to generate the embedding
    description: text('description').notNull(), // A description of the embedding for humans. If defined, this will/can be used to give the AI assistant more context.
    note: text('note').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    keywords: text('keywords').array().notNull().default(sql`ARRAY[]::text[]`),
    model: text('model').notNull(), // Model used to generate the embedding
    usage: text('usage').notNull(), // Usage of the embedding
    meta: json('meta').default({}),

    // Relationships
    chatId: text('chatId')
      .notNull()
      .references(() => chat.id),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    placeId: text('placeId')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
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

/**
 * Post
 */

export const postType = pgEnum('postType', [
  'general',
  'article',
  'collaboration',
  'other',
]);

export const postVisibilityType = pgEnum('PostVisibilityType', [
  'public',
  'private',
  'followers',
  'authenticated',
]);

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

/**
 * Experience
 */

export const experienceType = pgEnum('experienceType', [
  'post',
  'discover',
  'experience',
]);

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
    visibility: postVisibilityType().default('public'),
    views: integer('views').default(0),
    upVoted: integer('upVoted').default(0),
    pinned: boolean('pinned').default(false),
    staffPick: boolean('staffPick').default(false),
    hideGeoLocation: boolean('hideGeoLocation').default(false),
    location: text('location'),
    latitude: integer('latitude'),
    longitude: integer('longitude'),
    type: entityEnum().default('experience'),
    subType: experienceType().default('experience'),
    meta: json('meta').default({}),
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
        table.prompt,
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

// Create a drizzle schema from the prisma Prompt model above
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
    activities: text('activities')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    interests: text('interests')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    model: text('model').notNull(),
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
    userId: text('userId').references(() => users.id),
    experienceId: text('experienceId').references(() => experiences.id),
    promptId: text('promptId').references(() => prompt.id),
    storyId: text('storyId').references(() => promptCollection.id),
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

export const promptCollaboratorSchema = createInsertSchema(promptCollaborators);

/**
 * Media
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
    tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
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
