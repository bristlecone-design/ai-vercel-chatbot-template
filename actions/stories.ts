'use server';
import { db } from '@/lib/db/connect';
import { type Story, experiences, promptCollection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_PROMPT_STORIES, CACHE_KEY_PROMPT_STORY } from './cache-keys';

/**
 * Get a single story (collection) by Experience ID
 */
export async function getSingleStoryByExpId(id: string): Promise<Story | null> {
  const [record] = await db
    .selectDistinct()
    .from(promptCollection)
    .where(eq(experiences.id, id));

  if (!record) return null;

  return record;
}

export async function getCachedStoryByExpId(
  expId: string,
): Promise<Story | null> {
  return unstable_cache(getSingleStoryByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT_STORY],
  })(expId).then((story) => story);
}

/**
 * Get all stories (collections) by Experience ID
 */
export async function getAllStoriesByExpId(id: string): Promise<Array<Story>> {
  return db
    .selectDistinct()
    .from(promptCollection)
    .where(eq(experiences.id, id));
}

export async function getCachedAllStoriesByExpId(
  expId: string,
): Promise<Array<Story>> {
  return unstable_cache(getAllStoriesByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT_STORIES],
  })(expId).then((stories) => stories);
}
