'use server';

import { db } from '@/lib/db/connect';

import { type MediaInsert, media } from '@/lib/db/schema';

import { eq } from 'drizzle-orm';
import { unstable_expirePath as expirePath } from 'next/cache';

import { getMappedSingleMediaModels } from './get-core-media';
import type { MediaActionIncludeOpts } from './media-action-types';
import { CACHE_KEY_USER_EXPERIENCE_MEDIA } from '@/actions/cache-keys';

/**
 * Update media image attrs, e.g. Title, Caption, etc.
 */
export async function updateMediaAttrs(
  mediaId: string,
  data: Partial<MediaInsert>,
  includeOpts = {} as MediaActionIncludeOpts,
  options = {} as { expirePathKey?: string; cached?: boolean },
) {
  const [record] = await db
    .update(media)
    .set(data)
    .where(eq(media.id, mediaId))
    .returning();

  if (!record) return { updated: false, data: record };

  const { expirePathKey = CACHE_KEY_USER_EXPERIENCE_MEDIA, cached = true } =
    options;

  if (expirePathKey) {
    expirePath(expirePathKey);
  }

  const mappedRecord = await getMappedSingleMediaModels(
    record,
    includeOpts,
    cached,
  );

  return { updated: true, data: mappedRecord };
}

/**
 * Update media image visibility status, e.g. hidden, public, etc.
 */
export async function updateMediaPublicVisibility(
  mediaId: string,
  visible: boolean,
) {
  const [record] = await db
    .update(media)
    .set({
      public: visible,
    })
    .where(eq(media.id, mediaId))
    .returning();

  return record;
}

/**
 * Update media image downloadable status
 */
export async function updateMediaDownloadable(
  mediaId: string,
  downloadable: MediaInsert['downloadable'],
) {
  const [record] = await db
    .update(media)
    .set({
      downloadable,
    })
    .where(eq(media.id, mediaId))
    .returning();

  return record;
}

/**
 * Update media image remixable status
 */
export async function updateMediaRemixable(
  mediaId: string,
  remixable: boolean,
) {
  const [record] = await db
    .update(media)
    .set({
      remixable,
    })
    .where(eq(media.id, mediaId))
    .returning();

  return record;
}
