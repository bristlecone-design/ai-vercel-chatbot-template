'use server';

import type {
  ExperienceModel,
  PartialExperienceModel,
} from '@/types/experiences';
import type {
  ExperienceIncludeOpts,
  PartialExperienceIncludeOpts,
  PartialExperienceModelOpts,
} from './experience-action-types';

import { db } from '@/lib/db/connect';
import { experiences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  getCachedUserExperienceIds,
  getMappedExperienceModelsById,
} from './experiences';
/**
 * Get partial experience by ID
 */
export async function getPartialExperienceById(
  id: string,
  includeOpts = {} as PartialExperienceIncludeOpts,
  cached = false,
): Promise<PartialExperienceModel | null> {
  const [record] = await db
    .selectDistinct({
      id: experiences.id,
      createdAt: experiences.createdAt,
      updatedAt: experiences.updatedAt,
      pinned: experiences.pinned,
      pinnedAt: experiences.pinnedAt,
      removed: experiences.removed,
      blocked: experiences.blocked,
      public: experiences.public,
      visibility: experiences.visibility,
      views: experiences.views,
      content: experiences.content,
      title: experiences.title,
      prompt: experiences.prompt,
      description: experiences.description,
      location: experiences.location,
      // latitude: experiences.latitude,
      // longitude: experiences.longitude,
      // ctas: experiences.ctas,
      // Relationships
      authorId: experiences.authorId,
      promptId: experiences.promptId,
      storyId: experiences.storyId,
    })
    .from(experiences)
    .where(eq(experiences.id, id));

  if (!record) return null;

  // Include options with defaults
  const { author = true, media = false, ...restIncludeOpts } = includeOpts;

  const mappedModels = await getMappedExperienceModelsById(
    record.id,
    record.authorId,
    { author, media, ...restIncludeOpts },
    cached,
  );

  return {
    ...record,
    Author: mappedModels.Author,
    Prompt: mappedModels.Prompt as ExperienceModel['Prompt'],
    Story: mappedModels.Story as ExperienceModel['Story'],
    Media: media ? mappedModels.Media : undefined,
    Bookmarks: mappedModels.Bookmarks,
    Likes: mappedModels.Likes,
  } as PartialExperienceModel;
}

export async function getCachedPartialExperienceById(
  ...args: Parameters<typeof getPartialExperienceById>
): Promise<PartialExperienceModel | null> {
  const expId = args[0];
  return unstable_cache(getPartialExperienceById, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId],
  })(...args).then((exp) => exp);
}

/**
 * Get list of partial user experience models for frontend
 *
 * @note Partiality allows us to reduce the data payload for the frontend, then the frontend can lazy-load the full experience data as needed
 */
export async function getPartialUserExperiencesForFrontend(
  userId: string,
  opts = {} as PartialExperienceModelOpts,
  includeOpts = {} as ExperienceIncludeOpts,
) {
  const userExperienceIds = await getCachedUserExperienceIds(userId, opts);

  if (!userExperienceIds) return [];

  // Get the partial experiences
  const experiences = await Promise.all(
    userExperienceIds.map((expId) =>
      getCachedPartialExperienceById(expId, includeOpts),
    ),
  );

  return (
    experiences ? experiences.filter(Boolean) : []
  ) as PartialExperienceModel[];
}

/**
 * Get a single partial user experience model for frontend by ID
 */
export async function getPartialSingleUserExperienceForFrontend(
  expId: string,
  includeOpts = {} as ExperienceIncludeOpts,
) {
  const experience = (await getCachedPartialExperienceById(
    expId,
    includeOpts,
  )) as PartialExperienceModel | null;

  if (!experience) return null;

  return experience;
}
