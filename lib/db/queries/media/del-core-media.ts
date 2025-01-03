'use server';

import { db } from '@/lib/db/connect';

import { media } from '@/lib/db/schema';

import { eq } from 'drizzle-orm';

/**
 * Delete media image by ID
 */
export async function deleteMedia(mediaId: string) {
  const [record] = await db
    .delete(media)
    .where(eq(media.id, mediaId))
    .returning();

  return { deleted: Boolean(record), data: record };
}
