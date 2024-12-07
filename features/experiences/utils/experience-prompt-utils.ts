import {
  CACHE_KEY_COMPLETE_PROMPTS,
  CACHE_KEY_INCOMPLETE_PROMPTS,
} from '@/actions/cache-keys';
import { mapDbUserToClientFriendlyUser } from '@/lib/user/user-utils';

import type {
  ExperienceUserPromptModel,
  GeneratedExperienceUserPrompt,
  GeneratedExperienceUserPrompts,
  PromptCollaboratorModel,
} from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';

/**
 * Retrieve the corresponding experience model using an existing prompt model
 */
export function findPromptsExperience(
  prompt: GeneratedExperienceUserPrompt,
  experiences: ExperienceModel[],
  userId?: string,
) {
  return experiences.find((exp) => {
    if (userId) {
      return exp.promptId === prompt.id && exp.authorId === userId;
    }

    return exp.promptId === prompt.id;
  });
}

type OmitKeys = keyof ExperienceUserPromptModel;

const DEFAULT_KEYS_TO_OMIT = [
  'embeddingsId',
  'meta',
  'type',
  'viewCount',
  'private',
  'published',
  'archived',
] as OmitKeys[];

/**
 * Take a prompt record and map it to a client side friendly version.
 *
 * @promptRecord The prompt record to map.
 *
 * @returns The client side friendly version of the prompt record.
 */
export function mapPromptRecordToClientFriendlyVersion(
  promptRecord: ExperienceUserPromptModel,
  omit = DEFAULT_KEYS_TO_OMIT,
): GeneratedExperienceUserPrompt {
  const recordKeys = Object.keys(promptRecord) as OmitKeys[];
  return recordKeys.reduce((acc, key) => {
    if (!omit.includes(key as OmitKeys)) {
      acc[key] = promptRecord[key];
    }

    return acc;
  }, {} as GeneratedExperienceUserPrompt);
}

/**
 * Take a prompt model and map it to an experience model.
 */
export function mapPromptModelToExperienceModel(
  prompt: GeneratedExperienceUserPrompt,
): ExperienceModel {
  const { Experience } = prompt;

  if (!Experience) {
    throw new Error('Experience model is required');
  }

  const { Author, Collaborator } = prompt;

  const rawAuthor = Author || Collaborator;

  return {
    ...Experience,
    promptId: prompt.id,
    Prompt: prompt,
    Author: rawAuthor ? mapDbUserToClientFriendlyUser(rawAuthor) : undefined,
  } as ExperienceModel;
}

/**
 * Take a prompt collaborator record and map it to a client side friendly version as a prompt.
 */
export function mapPromptCollaboratorToPrompt(
  promptCollaborator: PromptCollaboratorModel,
): GeneratedExperienceUserPrompt {
  // Base model for the prompt
  const oPrompt = mapPromptRecordToClientFriendlyVersion(
    promptCollaborator.Prompt,
  );

  const oCollaborator = mapDbUserToClientFriendlyUser(
    promptCollaborator.Collaborator,
  );

  const oExperience = promptCollaborator.Experience;

  // Final map of the prompt
  return mapPromptRecordToClientFriendlyVersion({
    ...oPrompt,
    content: oExperience.content,
    Collaborator: oCollaborator,
    Experience: oExperience,
  } as ExperienceUserPromptModel);
}

export function createSimpleGeneratedIncompletePromptCacheKey(
  userId: string | undefined,
) {
  return userId
    ? `${userId}-${CACHE_KEY_INCOMPLETE_PROMPTS}`
    : CACHE_KEY_INCOMPLETE_PROMPTS;
}

export function createGeneratedIncompletePromptCacheKey(
  userId: string | undefined,
  userLocation?: string | undefined,
) {
  return userId && userLocation
    ? `${userId}-${userLocation}-${CACHE_KEY_INCOMPLETE_PROMPTS}`
    : createSimpleGeneratedIncompletePromptCacheKey(userId);
}

export function createGeneratedCompletePromptCacheKey(
  userId: string | undefined,
  userLocation?: string,
) {
  return userId && userLocation
    ? `${userId}-${userLocation}-${CACHE_KEY_COMPLETE_PROMPTS}`
    : userId
      ? `${userId}-${CACHE_KEY_COMPLETE_PROMPTS}`
      : CACHE_KEY_COMPLETE_PROMPTS;
}

/**
 * Get a unique list of experiences prompt challenges based on the prompt property.
 */
export function getUniquePrompts(items: GeneratedExperienceUserPrompts) {
  return items.reduce((acc: GeneratedExperienceUserPrompts, item) => {
    const existing = acc.find(
      (i) => i.prompt.toLowerCase() === item.prompt.toLowerCase(),
    );
    if (!existing) {
      acc.push(item);
    }

    return acc;
  }, [] as GeneratedExperienceUserPrompts);
}

/**
 * Create User Completed Prompt Challenge Permalink
 *
 * @note Prompt permalinks are unique based on the promptId and experienceId
 * @note A prompt ID can be derived from an experience ID/Model
 *
 * @format /prompts/completed/:experienceId
 */
export function createUserCompletedPromptChallengePermalink(
  expId = '',
  basePath = '/prompts/completed',
) {
  return `${basePath}/${expId}`;
}

/**
 * Create Prompt Challenge Permalink (Public/invite)
 *
 * @format /prompts/:promptId
 */
export function createPromptChallengePermalink(
  promptId = '',
  basePath = '/prompts',
) {
  return `${basePath}/${promptId}`;
}

/**
 * Create Prompt Collection (Stories) Root Permalink
 *
 * @format /prompts/stories
 */
export function createFeaturedStorySeriesRootPermalink(
  basePath = '/prompts/stories',
) {
  return `${basePath}`;
}

/**
 * Create Prompt Collection (Stories) Permalink
 *
 * @format /prompts/stories/:storyPath
 */
export function createPromptCollectionStoryPermalink(
  storyPath = '',
  basePath = '/prompts/stories',
) {
  return `${basePath}/${storyPath}`;
}

/**
 * Create Single Story Prompt Challenge Permalink
 *
 * @format /prompts/stories/:storyPath/:promptId
 */
export function createSingleStoryPromptChallengePermalink(
  promptId = '',
  storyPath = '',
) {
  return `${createPromptCollectionStoryPermalink(storyPath)}/${promptId}`;
}

/**
 * Create Single Completed Story Prompt Challenge Permalink
 *
 * @format /prompts/stories/:collectionId/:storyId/completed/:experienceId
 */
export function createSingleCompletedStoryPromptChallengePermalink(
  expId = '',
  promptId = '',
  storyPath = '',
) {
  return `${createSingleStoryPromptChallengePermalink(promptId, storyPath)}/completed/${expId}`;
}

/**
 * Sort prompts by featured
 */
export function sortPromptsByFeatured(prompts: ExperienceUserPromptModel[]) {
  return prompts.sort((a, b) => {
    if (a.featured && !b.featured) {
      return -1;
    }

    if (!a.featured && b.featured) {
      return 1;
    }

    return 0;
  });
}

/**
 * Sort prompts by pinned
 */
export function sortPromptsByPinned(prompts: ExperienceUserPromptModel[]) {
  return prompts.sort((a, b) => {
    if (a.pinned && !b.pinned) {
      return -1;
    }

    if (!a.pinned && b.pinned) {
      return 1;
    }

    return 0;
  });
}

/**
 * Sort prompts by featured then pinned
 */
export function sortPromptsByFeaturedThenPinned(
  prompts: ExperienceUserPromptModel[],
) {
  return sortPromptsByPinned(sortPromptsByFeatured(prompts));
}

/**
 * Get unique prompts from a list of prompts by the prompt attribute
 */
export function getUniquePromptsFromList(prompts: ExperienceUserPromptModel[]) {
  return prompts.reduce((acc, prompt) => {
    const existing = acc.find((p) => p.prompt === prompt.prompt);
    if (!existing) {
      acc.push(prompt);
    }

    return acc;
  }, [] as ExperienceUserPromptModel[]);
}

/**
 * Derive story title from raw title
 *
 * @note This function is used to derive a story title from a raw title by splitting the title by a configurable delimiter, e.g. ':'.
 */
export function deriveStoryTitleFromRawTitle(
  rawTitle: string,
  delimiter = ':',
) {
  const [title] = rawTitle.split(delimiter);
  return title.trim();
}
