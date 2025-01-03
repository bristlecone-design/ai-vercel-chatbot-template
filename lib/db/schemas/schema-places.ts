import { type InferSelectModel, sql } from 'drizzle-orm';
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
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Places
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
