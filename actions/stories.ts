'use server';

import { db } from '@/lib/db/connect';
import { type Story, experiences, promptCollection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_PROMPT_STORIES, CACHE_KEY_PROMPT_STORY } from './cache-keys';

/**
 * Get single story (collection) by ID
 */
export async function getSingleStoryById(
  id: string,
): Promise<Story | undefined> {
  const [record] = await db
    .selectDistinct()
    .from(promptCollection)
    .where(eq(promptCollection.id, id));

  if (!record) return undefined;

  return record as Story;
}

export async function getCachedStoryById(
  promptId: string,
): Promise<Story | undefined> {
  return unstable_cache(getSingleStoryById, [promptId], {
    revalidate: 86400, // 24 hours
    tags: [promptId, CACHE_KEY_PROMPT_STORY],
  })(promptId).then((story) => story);
}

/**
 * Get a single story (collection) by Experience ID
 */
export async function getSingleStoryByExpId(
  id: string,
): Promise<Story | undefined> {
  const [record] = await db
    .selectDistinct()
    .from(promptCollection)
    .where(eq(experiences.id, id));

  if (!record) return undefined;

  return record;
}

export async function getCachedStoryByExpId(
  expId: string,
): Promise<Story | undefined> {
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
