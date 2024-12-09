'use server';

import { db } from '@/lib/db/connect';
import { media } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import { and, eq } from 'drizzle-orm';
import { deleteStorageAssetByUrl } from '../storage';

/**
 * Delete a single user's featured image
 *
 * @note deletes from postgres and @vercel/blob
 */
export async function deleteUserFeaturedImg(
  id: string,
  imgPath: string,
  deleteFromBlob = true,
): Promise<boolean> {
  try {
    const [delRecord] = await db
      .delete(media)
      .where(and(eq(media.id, id), eq(media.urlOriginal, imgPath)))
      .returning();

    if (deleteFromBlob && delRecord) {
      await deleteStorageAssetByUrl(delRecord.urlOriginal || imgPath);
    }

    return Boolean(delRecord);
  } catch (e) {
    console.error(`Error in deleteUserFeaturedImg`, getErrorMessage(e));
    return false;
  }
}
