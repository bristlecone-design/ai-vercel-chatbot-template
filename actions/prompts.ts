'use server';
import { mapPromptRecordToClientFriendlyVersion } from '@/features/experiences/utils/experience-prompt-utils';
import { db } from '@/lib/db/connect';
import {
  type Prompt,
  type PromptInsert,
  type PromptModel,
  type Story,
  experiences,
  prompt,
  promptCollaborators,
  promptCollection,
} from '@/lib/db/schema';
import type {
  ExperienceUserPromptModel,
  GeneratedExperienceUserPrompt,
  GeneratedExperienceUserPrompts,
  PromptCollaboratorBaseModel,
  PromptCollaboratorModel,
  PromptStoryModel,
} from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';
import type { USER_PROFILE_MODEL } from '@/types/user';
import { and, desc, eq, inArray, isNull, not, or, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { clearTagCache } from './cache';
import {
  CACHE_KEY_COMPLETED_PROMPT_STORIES,
  CACHE_KEY_COMPLETED_PROMPT_STORY,
  CACHE_KEY_COMPLETE_USER_PROMPTS,
  CACHE_KEY_EXPERIENCE_PROMPT,
  CACHE_KEY_INCOMPLETE_PROMPTS,
  CACHE_KEY_PROMPT,
  CACHE_KEY_PROMPTS,
  CACHE_KEY_PROMPT_STORIES,
  CACHE_KEY_PROMPT_STORY,
  CACHE_KEY_PUBLIC_PROMPTS,
} from './cache-keys';
import type { PromptCollaboratorIncludeOpts } from './collaborator-action-types';
import {
  getCachedExperiencesByStoryId,
  getCachedSingleExperienceByPromptId,
  getExperiencesByPromptId,
  getExperiencesByStoryId,
  getSingleExperience,
  getSingleExperienceByPromptId,
} from './experiences';
import type {
  PromptIncludeOpts,
  PromptStoryIncludeOpts,
} from './prompt-action-types';
import { getCachedStoryById } from './stories';
import type { PromptCollectionIncludeOpts } from './story-collection-types';
import { getCachedUserProfileById, getUserProfileById } from './user';

/**
 * Get the mapped relationship models by prompt ID
 */
export async function getMappedPromptModelsByPromptId(
  promptId: string,
  userId?: string | null,
  includeOpts = {} as PromptIncludeOpts,
  cached = true,
): Promise<{
  Author?: USER_PROFILE_MODEL;
  Collaborator?: USER_PROFILE_MODEL;
  Experience?: ExperienceModel;
  Prompt?: Prompt | null;
  Story?: Story | null;
}> {
  const {
    user: includeUser = true,

    // For Prompt Collaborator Record
    collaborator: includeCollaborator = false,
    experience: includeExperience = false,
    prompt: includePrompt = false,
    story: includeStory = false,
  } = includeOpts;

  // Core Prompt Record
  const [Author] = await Promise.all([
    includeUser && userId
      ? cached
        ? getCachedUserProfileById(userId)
        : getUserProfileById(userId)
      : undefined,
  ]);

  // Prompt Collaborator Record
  const [Collaborator, Experience, Prompt, Story] = await Promise.all([
    includeCollaborator ? Author : undefined,

    includeExperience
      ? cached
        ? getCachedSingleExperienceByPromptId(promptId)
        : getSingleExperienceByPromptId(promptId)
      : undefined,

    includePrompt
      ? cached
        ? getCachedSinglePromptById(promptId)
        : getSinglePromptById(promptId)
      : undefined,

    includeStory
      ? cached
        ? getCachedSinglePromptCollectionById(promptId)
        : getSinglePromptCollectionById(promptId)
      : undefined,
  ]);

  return {
    Author,
    Collaborator,
    Experience,
    Prompt,
    Story,
  };
}

/**
 * Get the mapped relationship models for a story model by story ID
 *
 * @note Relationship models include Prompts, Experiences, and Collaborators
 */
export async function getMappedPromptCollectionModelsByStoryId(
  storyId: string,
  includeOpts = {} as PromptStoryIncludeOpts,
  cached = true,
): Promise<{
  Prompts: PromptStoryModel['Prompts'];
  Experiences: PromptStoryModel['Experiences'];
  Collaborators: PromptStoryModel['Collaborators'];
}> {
  const {
    collaborators: includeCollaborators = false,
    experiences: includeExperiences = false,
    prompts: includePrompts = false,
  } = includeOpts;

  // const promptCollaboratorIncludeOpts = {
  //   collaborator: includeCollaborators,
  //   experience: includeExperiences,
  //   prompt: includePrompts,
  // } as PromptCollaboratorIncludeOpts;

  // Prompt Collaborator Record
  const [Prompts, Experiences, Collaborators] = await Promise.all([
    includePrompts
      ? cached
        ? getCachedAllPromptsByStoryId(storyId)
        : getAllPromptsByStoryId(storyId)
      : undefined,

    includeExperiences
      ? cached
        ? getCachedExperiencesByStoryId(storyId)
        : getExperiencesByStoryId(storyId)
      : undefined,

    includeCollaborators
      ? cached
        ? getCachedAllPromptCollaboratorUsersByStoryId(storyId, cached)
        : getAllPromptCollaboratorUsersByStoryId(storyId, cached)
      : undefined,
  ]);

  return {
    Prompts: Prompts || [],
    Experiences: Experiences || [],
    Collaborators: Collaborators || [],
  };
}

/**
 * Get mapped models for a prompt record
 */
export async function getMappedSinglePromptModels(
  record: Prompt,
  includeOpts = {} as PromptIncludeOpts,
  cached = true,
): Promise<ExperienceUserPromptModel> {
  const {
    user: includeUser = true,

    // For Prompt Collaborator Record
    collaborator: includeCollaborator = false,
    experience: includeExperience = false,
    prompt: includePrompt = false,
  } = includeOpts;

  // TODO: Account for prompt collaborator record atts
  const hasIncludeOpts = includeUser;

  if (!hasIncludeOpts) {
    return record as ExperienceUserPromptModel;
  }

  const userId = record.authorId;

  if (!userId) {
    return record as ExperienceUserPromptModel;
  }

  const mappedModels = await getMappedPromptModelsByPromptId(
    record.id,
    userId,
    includeOpts,
    cached,
  );

  const { Author, Collaborator, Experience, Prompt } = mappedModels;

  return {
    ...record,
    User: Author,
    Collaborator,
    Experience,
    Prompt,
  } as ExperienceUserPromptModel;
}

export async function getCachedMappedSinglePromptModels(
  ...args: Parameters<typeof getMappedSinglePromptModels>
) {
  return unstable_cache(getMappedSinglePromptModels, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_PROMPTS],
  })(...args).then((media) => media);
}

/**
 * Get a single prompt by ID
 */
export async function getSinglePromptById(id: string): Promise<Prompt | null> {
  const [record] = await db.select().from(prompt).where(eq(prompt.id, id));

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
 * Get a single experience prompt by ID
 *
 * @note An Experience Prompt is a prompt that is associated with an experience and other related data, e.g. Story, Collaborator, etc.
 */
export async function getSingleExperiencePromptById(
  id: string,
  includeOpts = {} as PromptIncludeOpts,
  cached = false,
): Promise<ExperienceUserPromptModel | null> {
  const prompt = await (cached
    ? getCachedSinglePromptById(id)
    : getSinglePromptById(id));

  if (!prompt) return null;

  const {
    user: includeUser = true,

    // For Prompt Collaborator Record
    collaborator: includeCollaborator = false,
    experience: includeExperience = false,
    prompt: includePrompt = false,
    story: includeStory = false,
  } = includeOpts;

  // TODO: Account for prompt collaborator record atts
  const hasIncludeOpts =
    includeUser || includeCollaborator || includeExperience || includePrompt;

  if (!hasIncludeOpts) {
    return prompt as ExperienceUserPromptModel;
  }

  const mappedModel = await getMappedSinglePromptModels(
    prompt,
    includeOpts,
    cached,
  );

  return mappedModel;
}

export async function getCachedSingleExperiencePromptById(
  ...args: Parameters<typeof getSingleExperiencePromptById>
): Promise<ExperienceUserPromptModel | null> {
  const [promptId] = args;
  return unstable_cache(getSingleExperiencePromptById, [], {
    revalidate: 86400, // 24 hours
    tags: [promptId, CACHE_KEY_EXPERIENCE_PROMPT],
  })(...args).then((prompt) => prompt);
}

/**
 * Get a single prompt by Experience ID
 */
export async function getSinglePromptByExpId(
  id: string,
): Promise<Prompt | undefined> {
  const [record] = await db.select().from(prompt).where(eq(prompt.id, id));

  if (!record) return undefined;

  return record;
}

export async function getCachedSinglePromptByExpId(
  ...args: Parameters<typeof getSinglePromptByExpId>
): Promise<Prompt | undefined> {
  const [expId] = args;
  return unstable_cache(getSinglePromptByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT],
  })(...args).then((prompt) => prompt);
}

/**
 * Get single prompt with story by prompt ID
 */

/**
 * Get all prompts by Experience ID
 */
export async function getAllPromptsByExpId(id: string): Promise<Array<Prompt>> {
  return db.select().from(prompt).where(eq(experiences.id, id));
}

export async function getCachedAllPromptsByExpId(
  ...args: Parameters<typeof getAllPromptsByExpId>
) {
  const [expId] = args;
  return unstable_cache(getAllPromptsByExpId, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_PROMPT],
  })(...args).then((prompts) => prompts);
}

/**
 * Get all prompts by story ID (prompt collection ID)
 */
export async function getAllPromptsByStoryId(
  storyId: string,
): Promise<Array<PromptModel> | null> {
  return db.select().from(prompt).where(eq(prompt.promptCollectionId, storyId));
}

export async function getCachedAllPromptsByStoryId(
  ...args: Parameters<typeof getAllPromptsByStoryId>
) {
  const [storyId] = args;
  return unstable_cache(getAllPromptsByStoryId, [], {
    revalidate: 86400, // 24 hours
    tags: [storyId, `${storyId}-${CACHE_KEY_PROMPT_STORIES}`],
  })(...args).then((prompts) => prompts);
}

/**
 * Get all prompts
 */
export async function getAllPrompts(
  includeOpts = {} as PromptIncludeOpts,
): Promise<Array<ExperienceUserPromptModel> | null> {
  const records = await db.select().from(prompt);

  if (!records || !records.length) return null;

  const { user = false, experiences = false, story = false } = includeOpts;

  const mappedPrompts: ExperienceUserPromptModel[] = await Promise.all(
    records.map(async (prompt) => {
      const userPromptModel = prompt as any as ExperienceUserPromptModel;
      const { authorId, promptCollectionId } = prompt;
      if (user && authorId) {
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
    .select()
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
    .select()
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
  const [location, randomSize] = args;
  return unstable_cache(getAnonymousUserPrompts, [], {
    revalidate: 86400, // 24 hours
    tags: [`anonymous-${location}-${randomSize}-${CACHE_KEY_PUBLIC_PROMPTS}`],
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
    .select()
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
  const [userId, location, randomSize] = args;
  return unstable_cache(getUserIncompletePrompts, [], {
    revalidate: 86400, // 24 hours
    tags: [
      `incomplete-${userId}-${location}-${randomSize}-${CACHE_KEY_INCOMPLETE_PROMPTS}`,
    ],
  })(...args).then((prompts) => prompts);
}

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
    .select()
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

export async function getCachedUserAllCompletedPrompts(
  ...args: Parameters<typeof getUserAllCompletedPrompts>
) {
  const [userId] = args;
  return unstable_cache(getUserAllCompletedPrompts, [], {
    revalidate: 86400, // 24 hours
    tags: [`completed-${userId}-${CACHE_KEY_COMPLETE_USER_PROMPTS}`],
  })(...args).then((prompts) => prompts);
}

export async function getFeaturedPromptCollections(
  featured = true,
  published = true,
  includeOpts = {} as PromptCollectionIncludeOpts,
): Promise<PromptStoryModel[] | undefined> {
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

  if (!records) return undefined;

  const hasIncludeOpts =
    includePrompts || includeExperiences || includeCollaborators;

  if (!hasIncludeOpts) {
    return records.map((record) => {
      return {
        ...record,
        Prompts: [],
        Experiences: [],
        Collaborators: [],
      } as PromptStoryModel;
    });
  }

  const promptStoryIncludeOpts = {
    prompts: includePrompts,
    experiences: includeExperiences,
    collaborators: includeCollaborators,
  } as PromptStoryIncludeOpts;

  const mappedRecords = await Promise.all(
    records.map(async (record) => {
      const storyId = record.id;

      const mappedModels = await getMappedPromptCollectionModelsByStoryId(
        storyId,
        promptStoryIncludeOpts,
        true,
      );

      return {
        ...record,
        ...mappedModels,
      } as PromptStoryModel;
    }),
  );

  return mappedRecords;
}

// Cached version of getFeaturedPromptCollections
export async function getCachedFeaturedPromptCollections(
  ...args: Parameters<typeof getFeaturedPromptCollections>
) {
  const [featured, published, includeOpts] = args;
  return unstable_cache(getFeaturedPromptCollections, [], {
    revalidate: 86400, // 24 hours
    tags: [
      `featured-stories-${featured}-${published}-${CACHE_KEY_PROMPT_STORIES}`,
    ],
  })(...args).then((prompts) => prompts);
}

/**
 * Get single prompt collection by ID
 */
export async function getSinglePromptCollectionById(
  id: string,
): Promise<Story | undefined> {
  const [record] = await db
    .select()
    .from(promptCollection)
    .where(eq(promptCollection.id, id));

  if (!record) return undefined;

  return record;
}

// Cached version of getSinglePromptCollectionById
export async function getCachedSinglePromptCollectionById(
  ...args: Parameters<typeof getSinglePromptCollectionById>
) {
  const [id] = args;
  return unstable_cache(getSinglePromptCollectionById, [], {
    revalidate: 86400, // 24 hours
    tags: [id, `${id}-${CACHE_KEY_PROMPT_STORY}`],
  })(...args).then((prompt) => prompt);
}

/**
 * Get additional prompts for anonymous (public) guest with the option to exclude certain prompts
 */
export async function getAdditionalAnonymousPrompts(
  excludeIds: string[] = [],
  take = 15,
) {
  const records = await db
    .select({
      id: prompt.id,
      model: prompt.model,
      prompt: prompt.prompt,
      title: prompt.title,
      location: prompt.location,
      authorId: prompt.authorId,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    })
    .from(prompt)
    .where(
      and(
        or(eq(prompt.location, 'public'), isNull(prompt.location)),
        not(inArray(prompt.id, excludeIds)),
      ),
    )
    .orderBy(desc(prompt.createdAt))
    .limit(take);

  return records;
}

/**
 * Get additional user prompts with the option to exclude certain prompts
 */
export async function getAdditionalUserPrompts(
  userId: string,
  excludeIds: string[] = [],
  take = 15,
) {
  const records = await db
    .select({
      id: prompt.id,
      model: prompt.model,
      prompt: prompt.prompt,
      title: prompt.title,
      location: prompt.location,
      authorId: prompt.authorId,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    })
    .from(prompt)
    .where(
      and(eq(prompt.authorId, userId), not(inArray(prompt.id, excludeIds))),
    )
    .orderBy(desc(prompt.createdAt))
    .limit(take);

  return records;
}

/**
 * Save multiple prompts
 */
export async function saveMultiplePrompts(
  data: PromptInsert[],
  cacheKeys?: string[],
) {
  const records = await db.insert(prompt).values(data).returning({
    id: prompt.id,
    model: prompt.model,
    prompt: prompt.prompt,
    title: prompt.title,
    location: prompt.location,
    authorId: prompt.authorId,
    content: prompt.content,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  });

  if (cacheKeys) {
    for await (const ck of cacheKeys) {
      // console.info('**** Clearing prmpt cache for::', ck, cacheKeys);
      await clearTagCache(ck);
    }
  }

  return records;
}

/**
 * Get a list of prompts by values in the prompt field/column
 */
export async function getPromptsByValues(promptValues: string[], take = 25) {
  const records = await db
    .select()
    .from(prompt)
    .where(inArray(prompt.prompt, promptValues))
    .orderBy(desc(prompt.createdAt))
    .limit(take);

  return records;
}

/**
 * Delete a prompt collaborator record by experience ID and prompt ID
 */
export async function deletePromptCollaboratorByExpAndPromptId(
  experienceId: string,
  promptId: string,
) {
  const records = await db
    .delete(promptCollaborators)
    .where(
      and(
        eq(promptCollaborators.experienceId, experienceId),
        eq(promptCollaborators.promptId, promptId),
      ),
    )
    .returning();

  return { count: records.length, data: records };
}

/**
 * Get a prompt collaborator record by exp ID
 *
 * @note This is a helper function to get a prompt collaborator record by experience ID, notably for the /prompts/completed/[expId] page
 */
export async function getPromptCollaboratorByExpId(
  expId: string,
  includeOpts = {} as PromptCollaboratorIncludeOpts,
  cached = true,
): Promise<PromptCollaboratorModel | null> {
  const [record] = await db
    .select()
    .from(promptCollaborators)
    .where(eq(promptCollaborators.experienceId, expId));

  if (!record) return null;

  const {
    collaborator = true,
    experience = true,
    prompt = true,
  } = includeOpts || {};

  // const hasIncludeOpts = collaborator || experience || prompt;

  // if (!hasIncludeOpts) {
  //   return record as unknown as PromptCollaboratorBaseModel;
  // }

  // const userId = record.userId;

  // if (!userId || !record.promptId) {
  //   return record as unknown as PromptCollaboratorBaseModel;
  // }

  const mappedModels = await getMappedPromptModelsByPromptId(
    record.promptId,
    record.userId,
    {
      collaborator,
      experience,
      prompt,
    },
    cached,
  );

  const { Collaborator, Experience, Prompt } = mappedModels;

  return {
    ...record,
    // User: Author,
    Collaborator,
    Experience,
    Prompt,
  } as PromptCollaboratorModel;
}

/**
 * Get cached prompt collaborator record by exp ID
 */
export async function getCachedPromptCollaboratorByExpId(
  ...args: Parameters<typeof getPromptCollaboratorByExpId>
) {
  const expId = args[0];
  return unstable_cache(getPromptCollaboratorByExpId, [], {
    revalidate: 604800, // 1 week
    tags: [expId, `${expId}-${CACHE_KEY_PROMPT}`],
  })(...args).then((record) => (record ? record : undefined));
}

/**
 * Get story (prompt collection) by prompt ID
 */
export async function getPromptCollaboratorByPromptId(
  promptId: string,
  includeOpts = {} as PromptCollaboratorIncludeOpts,
  cached = true,
): Promise<PromptCollaboratorModel | PromptCollaboratorBaseModel | null> {
  const [record] = await db
    .select()
    .from(promptCollaborators)
    .where(eq(promptCollaborators.promptId, promptId));

  if (!record) return null;

  const {
    collaborator = true,
    experience = true,
    prompt = true,
  } = includeOpts || {};

  const hasIncludeOpts = collaborator || experience || prompt;

  if (!hasIncludeOpts) {
    return record as unknown as PromptCollaboratorBaseModel;
  }

  const userId = record.userId;

  if (!userId || !record.promptId) {
    return record as unknown as PromptCollaboratorBaseModel;
  }

  const mappedModels = await getMappedPromptModelsByPromptId(
    record.promptId,
    userId,
    {
      collaborator,
      experience,
      prompt,
    },
    cached,
  );

  const { Collaborator, Experience, Prompt } = mappedModels;

  return {
    ...record,
    // User: Author,
    Collaborator,
    Experience,
    Prompt,
  } as PromptCollaboratorModel;
}

/**
 * Get cached prompt collaborator record by exp ID
 */
export async function getCachedPromptCollaboratorByPromptId(
  ...args: Parameters<typeof getPromptCollaboratorByPromptId>
) {
  const promptId = args[0];
  return unstable_cache(getPromptCollaboratorByPromptId, [], {
    revalidate: 604800, // 1 week
    tags: [promptId, `${promptId}-${CACHE_KEY_COMPLETED_PROMPT_STORY}`],
  })(...args).then((record) => (record ? record : undefined));
}

/**
 * Get a prompt collaborator record by story ID
 *
 * @note This is a helper function to get a prompt collaborator record by story ID
 */
export async function getPromptCollaboratorByStoryId(
  storyId: string,
  includeOpts = {} as PromptCollaboratorIncludeOpts,
  cached = true,
): Promise<PromptCollaboratorModel | PromptCollaboratorBaseModel | null> {
  const [record] = await db
    .select()
    .from(promptCollaborators)
    .where(eq(promptCollaborators.storyId, storyId));

  if (!record) return null;

  const {
    collaborator = true,
    experience = true,
    prompt = true,
  } = includeOpts || {};

  const hasIncludeOpts = collaborator || experience || prompt;

  if (!hasIncludeOpts) {
    return record as unknown as PromptCollaboratorBaseModel;
  }

  const userId = record.userId;

  if (!userId || !record.promptId) {
    return record as unknown as PromptCollaboratorBaseModel;
  }

  const mappedModels = await getMappedPromptModelsByPromptId(
    record.promptId,
    userId,
    {
      collaborator,
      experience,
      prompt,
    },
    cached,
  );

  const { Collaborator, Experience, Prompt } = mappedModels;

  return {
    ...record,
    // User: Author,
    Collaborator,
    Experience,
    Prompt,
  } as PromptCollaboratorModel;
}

/**
 * Get cached prompt collaborator record by exp ID
 */
export async function getCachedPromptCollaboratorByStoryId(
  ...args: Parameters<typeof getPromptCollaboratorByStoryId>
) {
  const expId = args[0];
  return unstable_cache(getPromptCollaboratorByStoryId, [], {
    revalidate: 604800, // 1 week
    tags: [expId, `${expId}-${CACHE_KEY_PROMPT}`],
  })(...args).then((record) => (record ? record : undefined));
}

/**
 * Get all prompt collaborator model records by story ID
 */
export async function getAllPromptCollaboratorsByStoryId(
  storyId: string,
  includeOpts = {} as PromptCollaboratorIncludeOpts,
  cached = true,
): Promise<PromptCollaboratorModel[] | PromptCollaboratorBaseModel[] | null> {
  const records = await db
    .select()
    .from(promptCollaborators)
    .where(eq(promptCollaborators.storyId, storyId));

  if (!records || !records.length) return null;

  const {
    collaborator = true,
    experience = true,
    prompt = true,
  } = includeOpts || {};

  const hasIncludeOpts = collaborator || experience || prompt;

  if (!hasIncludeOpts) {
    return records as unknown as PromptCollaboratorBaseModel[];
  }

  const mappedRecords = await Promise.all(
    records.map(async (record) => {
      const { userId, promptId } = record;

      if (!userId || !promptId) return undefined;

      const mappedModels = await getMappedPromptModelsByPromptId(
        promptId,
        userId,
        {
          collaborator,
          experience,
          prompt,
        },
      );

      const { Collaborator, Experience, Prompt } = mappedModels;

      return {
        ...record,
        // User: Author,
        Collaborator,
        Experience,
        Prompt,
      };
    }),
  );

  return mappedRecords as PromptCollaboratorModel[];
}

/**
 * Get all cached prompt collaborator records by story ID
 */
export async function getCachedAllPromptCollaboratorsByStoryId(
  ...args: Parameters<typeof getAllPromptCollaboratorsByStoryId>
) {
  const storyId = args[0];
  return unstable_cache(getAllPromptCollaboratorsByStoryId, [], {
    revalidate: 604800, // 1 week
    tags: [storyId, `${storyId}-${CACHE_KEY_COMPLETED_PROMPT_STORIES}`],
  })(...args).then((record) => (record ? record : undefined));
}

/**
 * Get all prompt collaborator user profile records by story ID
 *
 * @note - This function is used to get all the users associated to a story by their prompt collaborator records (aka: anyone who has completed a prompt in a story)
 *
 */
export async function getAllPromptCollaboratorUsersByStoryId(
  storyId: string,
  cached = true,
): Promise<USER_PROFILE_MODEL[] | null> {
  const records = await db
    .select({
      userId: promptCollaborators.userId,
    })
    .from(promptCollaborators)
    .where(eq(promptCollaborators.storyId, storyId));

  if (!records || !records.length) return null;

  const users = await Promise.all(
    records
      .map(async (record) => {
        const { userId } = record;

        if (!userId) return undefined;

        const userModel = await (cached
          ? getCachedUserProfileById(userId)
          : getUserProfileById(userId));

        return userModel;
      })
      .filter(Boolean),
  );

  return users as USER_PROFILE_MODEL[];
}

/**
 * Get all cached prompt collaborator user profile records by story ID
 */
export async function getCachedAllPromptCollaboratorUsersByStoryId(
  ...args: Parameters<typeof getAllPromptCollaboratorUsersByStoryId>
) {
  const storyId = args[0];
  return unstable_cache(getAllPromptCollaboratorUsersByStoryId, [], {
    revalidate: 604800, // 1 week
    tags: [storyId, `${storyId}-${CACHE_KEY_COMPLETED_PROMPT_STORIES}`],
  })(...args).then((record) => (record ? record : undefined));
}

/**
 * Get all prompt collaborator records (stories) with a user ID, prompt ID, experience ID, and story ID
 */
export async function getAllCompletedPromptStories() {
  const records = await db
    .select()
    .from(promptCollaborators)
    .where(
      and(
        not(eq(promptCollaborators.promptId, '')),
        not(eq(promptCollaborators.experienceId, '')),
        not(eq(promptCollaborators.storyId, '')),
      ),
    );

  if (!records) return null;

  // Iterate through the records and return the mapped models for each record
  const mappedRecords = await Promise.all(
    records
      .map(async (record) => {
        const { userId, promptId, storyId } = record;

        if (!userId || !promptId || !storyId) return undefined;

        const mappedModels = await getMappedPromptModelsByPromptId(
          promptId,
          userId,
          {
            user: true,
            collaborator: true,
            experience: true,
            prompt: true,
            story: true,
          },
        );

        const { Collaborator, Experience, Prompt, Story } = mappedModels;

        return {
          ...record,
          // User: Author,
          Collaborator,
          Experience,
          Prompt,
          Story,
        };
      })
      .filter(Boolean),
  );

  return mappedRecords as unknown as PromptCollaboratorModel[];
}

/**
 * Get all prompt collaborator records (stories) with a prompt ID and experience ID, and optionally story path
 */
export async function getCompletedPromptCollaborationsByPromptIdAndExpId(
  promptId: string,
  experienceId: string,
  storyPath?: string,
  includeOpts = {} as PromptCollaboratorIncludeOpts,
  cached = true,
) {
  const [record] = await db
    .select()
    .from(promptCollaborators)
    .where(
      and(
        eq(promptCollaborators.promptId, promptId),
        eq(promptCollaborators.experienceId, experienceId),
        // storyPath ? eq(promptCollection.path, storyPath) : undefined,
      ),
    );

  if (!record) return null;

  const { userId, storyId } = record;

  if (!userId || !storyId) return undefined;

  const storyByPath = storyPath
    ? await (cached
        ? getCachedSinglePromptCollectionByPath(storyPath)
        : getSinglePromptCollectionByPath(storyPath))
    : undefined;

  // Iterate through the records and return the mapped models for each record

  const mappedModels = await getMappedPromptModelsByPromptId(
    promptId,
    userId,
    {
      user: false,
      collaborator: true,
      experience: true,
      prompt: true,
      // Don't include story if storyByPath is defined
      story: !storyByPath,
    },
    cached,
  );

  const { Collaborator, Experience, Prompt, Story } = mappedModels;

  return {
    ...record,
    // User: Author,
    Collaborator,
    Experience,
    Prompt,
    Story: storyByPath || Story,
  } as PromptCollaboratorModel;
}

// Cached version of getCompletedPromptCollaborationsByPromptIdAndExpId
export async function getCachedCompletedPromptCollaborationsByPromptIdAndExpId(
  ...args: Parameters<typeof getCompletedPromptCollaborationsByPromptIdAndExpId>
) {
  const promptId = args[0];
  const expId = args[1];
  return unstable_cache(
    getCompletedPromptCollaborationsByPromptIdAndExpId,
    [],
    {
      revalidate: 604800, // 1 week
      tags: [
        promptId,
        expId,
        `${promptId}-${expId}-${CACHE_KEY_COMPLETED_PROMPT_STORIES}`,
      ],
    },
  )(...args).then((record) => (record ? record : undefined));
}

/**
 * Get a Single Prompt Collection (set of prompts) by path
 */
export async function getSinglePromptCollectionByPath(
  path: string,
  includeOpts = {} as PromptCollectionIncludeOpts,
) {
  const {
    prompts = true,
    experiences = true,
    collaborators = false,
  } = includeOpts || {};

  const [record] = await db
    .select()
    .from(promptCollection)
    .where(
      and(
        eq(promptCollection.path, path),
        // eq(promptCollection.published, published),
      ),
    );

  if (!record) return undefined;

  const hasIncludeOpts = prompts || experiences || collaborators;

  if (!hasIncludeOpts) {
    return {
      ...record,
      Prompts: [],
      Experiences: [],
      Collaborators: [],
    } as PromptStoryModel;
  }

  const mappedModels = await getMappedPromptCollectionModelsByStoryId(
    record.id,
    {
      prompts,
      experiences,
      collaborators,
    },
  );

  return {
    ...record,
    ...mappedModels,
  } as PromptStoryModel;
}

export async function getCachedSinglePromptCollectionByPath(
  ...args: Parameters<typeof getSinglePromptCollectionByPath>
) {
  const path = args[0];
  return unstable_cache(getSinglePromptCollectionByPath, [], {
    revalidate: 86400, // 24 hours
    tags: [path, `${path}-${CACHE_KEY_PROMPT_STORY}`],
  })(...args).then((record) => (record ? record : undefined));
}
