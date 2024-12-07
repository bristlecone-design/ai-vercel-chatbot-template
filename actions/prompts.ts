'use server';
import { db } from '@/lib/db/connect';
import { type Prompt, experiences, prompt } from '@/lib/db/schema';
import type { ExperienceUserPromptModel } from '@/types/experience-prompts';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_PROMPT } from './cache-keys';
import type { ExperienceIncludeOpts } from './experience-action-types';
import { getExperiencesByPromptId } from './experiences';
import { getCachedStoryById } from './stories';
import { getCachedUserProfileById } from './user';

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
  ...args: Parameters<typeof getSinglePromptByExpId>
): Promise<Prompt | null> {
  const [expId] = args;
  return unstable_cache(getSinglePromptByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT],
  })(...args).then((prompt) => prompt);
}

/**
 * Get all prompts by Experience ID
 */
export async function getAllPromptsByExpId(id: string): Promise<Array<Prompt>> {
  return db.selectDistinct().from(prompt).where(eq(experiences.id, id));
}

export async function getCachedAllPromptsByExpId(
  ...args: Parameters<typeof getAllPromptsByExpId>
): Promise<Array<Prompt>> {
  const [expId] = args;
  return unstable_cache(getAllPromptsByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT],
  })(...args).then((prompts) => prompts);
}

type PromptIncludeOpts = ExperienceIncludeOpts & {
  experiences?: boolean;
  experiencePrompts?: boolean;
};

/**
 * Get all prompts
 */
export async function getAllPrompts(
  includeOpts = {} as PromptIncludeOpts,
): Promise<Array<ExperienceUserPromptModel> | null> {
  const records = await db.selectDistinct().from(prompt);

  if (!records || !records.length) return null;

  const { author = false, experiences = false, story = false } = includeOpts;

  const mappedPrompts: ExperienceUserPromptModel[] = await Promise.all(
    records.map(async (prompt) => {
      const userPromptModel = prompt as any as ExperienceUserPromptModel;
      const { authorId, promptCollectionId } = prompt;
      if (author && authorId) {
        userPromptModel.Author = await getCachedUserProfileById(authorId);
      }

      if (experiences) {
        userPromptModel.Experiences = await getExperiencesByPromptId(prompt.id);
      }

      if (story && promptCollectionId) {
        userPromptModel.Story = await getCachedStoryById(promptCollectionId);
        userPromptModel.storyId = promptCollectionId;
      }

      return userPromptModel as ExperienceUserPromptModel;
    }),
  );

  return mappedPrompts;
}

// Cached version of getAllPrompts
export async function getCachedAllPrompts(
  ...args: Parameters<typeof getAllPrompts>
): Promise<Array<ExperienceUserPromptModel> | null> {
  return unstable_cache(getAllPrompts, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_PROMPT],
  })(...args).then((prompts) => prompts);
}
