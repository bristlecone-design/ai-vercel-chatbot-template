'use server';
import { mapPromptRecordToClientFriendlyVersion } from '@/features/experiences/utils/experience-prompt-utils';
import { db } from '@/lib/db/connect';
import {
  type Prompt,
  experiences,
  prompt,
  promptCollaborators,
  promptCollection,
} from '@/lib/db/schema';
import type {
  ExperienceUserPromptModel,
  GeneratedExperienceUserPrompt,
  GeneratedExperienceUserPrompts,
} from '@/types/experience-prompts';
import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  CACHE_KEY_INCOMPLETE_PROMPTS,
  CACHE_KEY_PROMPT,
  CACHE_KEY_PROMPT_STORIES,
  CACHE_KEY_PUBLIC_PROMPTS,
} from './cache-keys';
import type { PromptCollaboratorIncludeOpts } from './collaborator-action-types';
import type { ExperienceIncludeOpts } from './experience-action-types';
import { getExperiencesByPromptId, getSingleExperience } from './experiences';
import { getCachedStoryById } from './stories';
import type { PromptCollectionIncludeOpts } from './story-collection-types';
import { getCachedUserProfileById } from './user';

/**
 * Get a single prompt by ID
 */
export async function getSinglePromptById(id: string): Promise<Prompt | null> {
  const [record] = await db
    .selectDistinct()
    .from(prompt)
    .where(eq(prompt.id, id));

  if (!record) return null;

  return record;
}

export async function getCachedSinglePromptById(
  ...args: Parameters<typeof getSinglePromptById>
): Promise<Prompt | null> {
  const [id] = args;
  return unstable_cache(getSinglePromptById, [id], {
    revalidate: 86400, // 24 hours
    tags: [id, CACHE_KEY_PROMPT],
  })(...args).then((prompt) => prompt);
}

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

/**
 * Get random prompts
 */
export async function getRandomPrompts(
  pageSize = 100,
): Promise<Array<ExperienceUserPromptModel> | null> {
  const randomResults = await db
    .selectDistinct()
    .from(prompt)
    .orderBy(sql`RAND()`)
    .limit(pageSize);

  if (!randomResults || !randomResults.length) {
    console.log(randomResults);
    return [];
  }

  return randomResults as unknown as ExperienceUserPromptModel[];
}

export async function getAnonymousUserPrompts(location = '', randomSize = 100) {
  const randomResults = await getRandomPrompts(randomSize);

  if (!randomResults || !randomResults.length) {
    console.log(randomResults);
    return [];
  }

  const randomIds = randomResults
    .filter(Boolean)
    .map((item) => item.id) as string[];

  const records = await db
    .selectDistinct()
    .from(prompt)
    .where(
      and(
        isNull(prompt.authorId),
        or(eq(prompt.location, location), isNull(prompt.location)),
        inArray(prompt.id, randomIds),
      ),
    );

  return records;
}

export async function getCachedAnonymousUserPrompts(
  ...args: Parameters<typeof getAnonymousUserPrompts>
) {
  return unstable_cache(getAnonymousUserPrompts, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_PUBLIC_PROMPTS],
  })(...args).then((prompts) => prompts);
}

export async function getUserIncompletePrompts(
  userId: string,
  location = '',
  randomSize = 100,
) {
  const randomResults = await getRandomPrompts(randomSize);

  if (!randomResults || !randomResults.length) {
    console.log(randomResults);
    return [];
  }

  const randomIds = randomResults
    .filter(Boolean)
    .map((item) => item.id) as string[];

  const records = await db
    .selectDistinct()
    .from(prompt)
    .leftJoin(promptCollaborators, isNull(promptCollaborators.promptId))
    .where(
      and(
        eq(prompt.authorId, userId),
        or(eq(prompt.location, location), isNull(prompt.location)),
        inArray(prompt.id, randomIds),
      ),
    );

  return records;
}

// Cached version of getUserIncompletePrompts
export async function getCachedUserIncompletePrompts(
  ...args: Parameters<typeof getUserIncompletePrompts>
) {
  return unstable_cache(getUserIncompletePrompts, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_INCOMPLETE_PROMPTS],
  })(...args).then((prompts) => prompts);
}

// Convert the above prisma query to a drizzle-orm query
export async function getUserAllCompletedPrompts(
  userId: string,
  includeOpts = {} as PromptCollaboratorIncludeOpts,
): Promise<GeneratedExperienceUserPrompts | undefined> {
  const {
    collaborator = true,
    experience = true,
    prompt = true,
  } = includeOpts || {};

  const records = await db
    .selectDistinct()
    .from(promptCollaborators)
    .where(eq(promptCollaborators.userId, userId))
    .orderBy(desc(promptCollaborators.createdAt));

  const mappedRecords = await Promise.all(
    records.map(async (record) => {
      let expUserPromptRecord: ExperienceUserPromptModel | null = null;
      let basePromptRecord: Prompt | null = null;

      // Retrieve and establish the base Prompt attributes
      if (prompt && record.promptId) {
        basePromptRecord = await getCachedSinglePromptById(record.promptId);
        if (basePromptRecord) {
          expUserPromptRecord = {
            ...record,
            ...basePromptRecord,
            title: basePromptRecord.title,
            prompt: basePromptRecord.prompt,
            model: basePromptRecord.model,
            // content: promptRecord.content,
          } as any as ExperienceUserPromptModel;
        }
      }

      if (!expUserPromptRecord) return null;

      // Retrieve and attach the Experience record
      if (experience && record.experienceId) {
        const experienceRecord = await getSingleExperience(record.experienceId);
        if (experienceRecord && !experienceRecord.removed) {
          expUserPromptRecord.Experience = experienceRecord;
          expUserPromptRecord.content = experienceRecord.content;
        }
      }

      // Retrieve and attach the Collaborator record (aka: the user who completed the prompt which is a User Profile)
      if (collaborator && record.userId) {
        const collaboratorRecord = await getCachedUserProfileById(
          record.userId,
        );
        if (collaboratorRecord) {
          expUserPromptRecord.Collaborator = collaboratorRecord;
        }
      }

      return mapPromptRecordToClientFriendlyVersion(
        expUserPromptRecord,
      ) satisfies GeneratedExperienceUserPrompt;
    }),
  );

  const filteredRecords = mappedRecords.filter(Boolean);

  if (!filteredRecords.length) return undefined;

  return filteredRecords as GeneratedExperienceUserPrompts;
}

// Turn the above prisma query into a drizzle-orm query
export async function getFeaturedPromptCollections(
  featured = true,
  published = true,
  includeOpts = {} as PromptCollectionIncludeOpts,
) {
  const {
    prompts: includePrompts = true,
    experiences: includeExperiences = true,
    collaborators: includeCollaborators = false,
  } = includeOpts || {};

  const records = await db
    .select()
    .from(promptCollection)
    .where(
      and(
        eq(promptCollection.featured, featured),
        eq(promptCollection.published, published),
        // eq(experiences.published, published),
      ),
    );

  if (!records) return null;

  // TBD: Implement the rest of the includeOpts

  return records;
}

// Cached version of getFeaturedPromptCollections
export async function getCachedFeaturedPromptCollections(
  ...args: Parameters<typeof getFeaturedPromptCollections>
) {
  return unstable_cache(getFeaturedPromptCollections, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_PROMPT_STORIES],
  })(...args).then((prompts) => prompts);
}
