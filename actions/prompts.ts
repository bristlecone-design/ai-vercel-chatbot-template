'use server';
import { db } from '@/lib/db/connect';
import { type Prompt, experiences, prompt } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_PROMPT } from './cache-keys';

/**
 * Get a single prompt by Experience ID
 */
export async function getSinglePromptByExpId(
  id: string,
): Promise<Prompt | null> {
  const [record] = await db
    .selectDistinct()
    .from(prompt)
    .where(eq(experiences.id, id));

  if (!record) return null;

  return record;
}

export async function getCachedSinglePromptByExpId(
  expId: string,
): Promise<Prompt | null> {
  return unstable_cache(getSinglePromptByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT],
  })(expId).then((prompt) => prompt);
}

/**
 * Get all prompts by Experience ID
 */
export async function getAllPromptsByExpId(id: string): Promise<Array<Prompt>> {
  return db.selectDistinct().from(prompt).where(eq(experiences.id, id));
}

export async function getCachedAllPromptsByExpId(
  expId: string,
): Promise<Array<Prompt>> {
  return unstable_cache(getAllPromptsByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT],
  })(expId).then((prompts) => prompts);
}
