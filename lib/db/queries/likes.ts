'use server';
import { db } from '@/lib/db/connect';
import {
  type ExperienceLikes,
  experienceLikes,
  experiences,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

/**
 * Get a single like by Experience ID
 */
export async function getSingleLikeByExpId(
  id: string,
): Promise<ExperienceLikes | null> {
  const [record] = await db
    .select()
    .from(experienceLikes)
    .where(eq(experiences.id, id));

  if (!record) return null;

  return record;
}

export async function getCachedSingleLikeByExpId(
  expId: string,
): Promise<ExperienceLikes | null> {
  return unstable_cache(getSingleLikeByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_LIKE],
  })(expId).then((like) => like);
}

/**
 * Get all likes by Experience ID
 */
export async function getAllLikesByExpId(
  id: string,
): Promise<Array<ExperienceLikes>> {
  return db
    .select()
    .from(experienceLikes)
    .where(eq(experienceLikes.experienceId, id));
}

export async function getCachedAllLikesByExpId(
  expId: string,
): Promise<Array<ExperienceLikes>> {
  return unstable_cache(getAllLikesByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_LIKES],
  })(expId).then((likes) => likes);
}
