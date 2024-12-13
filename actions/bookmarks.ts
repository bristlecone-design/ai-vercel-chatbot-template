'use server';
import { db } from '@/lib/db/connect';
import { type Bookmark, bookmarks, experiences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_BOOKMARK, CACHE_KEY_BOOKMARKS } from './cache-keys';

/**
 * Get a single bookmark by Experience ID
 */
export async function getSingleBookmarkByExpId(
  id: string,
): Promise<Bookmark | null> {
  const [record] = await db
    .select()
    .from(bookmarks)
    .where(eq(experiences.id, id));

  if (!record) return null;

  return record;
}

export async function getCachedSingleBookmarkByExpId(
  expId: string,
): Promise<Bookmark | null> {
  return unstable_cache(getSingleBookmarkByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_BOOKMARK],
  })(expId).then((bookmark) => bookmark);
}

/**
 * Get all bookmarks by Experience ID
 */
export async function getAllBookmarksByExpId(
  id: string,
): Promise<Array<Bookmark>> {
  return db.select().from(bookmarks).where(eq(bookmarks.experienceId, id));
}

export async function getCachedAllBookmarksByExpId(
  expId: string,
): Promise<Array<Bookmark>> {
  return unstable_cache(getAllBookmarksByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_BOOKMARKS],
  })(expId).then((bookmarks) => bookmarks);
}
