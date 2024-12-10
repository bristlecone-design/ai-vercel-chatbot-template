'use server';

import { db } from '@/lib/db/connect';

import { type ExperienceSave, experiences } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import type { AIExperienceCallToActionSuggestionModel } from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';
import { eq, sql } from 'drizzle-orm';
import { unstable_expirePath as expirePath } from 'next/cache';
import {
  CACHE_KEY_USER_EXPERIENCE,
  CACHE_KEY_USER_EXPERIENCE_MEDIA,
} from './cache-keys';
import type { ExperienceIncludeOpts } from './experience-action-types';
import { getMappedExperienceModels } from './experiences';

export async function updateExperience(
  id: string,
  data: Partial<ExperienceSave>,
  includeOpts = {} as ExperienceIncludeOpts,
  expirePathKey = CACHE_KEY_USER_EXPERIENCE,
): Promise<{ updated: boolean; data: ExperienceModel }> {
  // const dataKeys = Object.keys(data) as (keyof Experience)[];
  // const dataKeysReturning = dataKeys.map((key) => ({
  //   [key]: experiences[key],
  // }));

  const updated = await db
    .update(experiences)
    .set(data)
    .where(eq(experiences.id, id))
    .returning();

  const record = updated[0];

  if (!record) return { updated: false, data: record };

  if (expirePathKey) {
    expirePath(expirePathKey);
  }

  const { media = true, ...restIncludeOpts } = includeOpts;
  const baseIncludeOpts = {
    media,
    ...restIncludeOpts,
  };

  // Include options
  if (baseIncludeOpts) {
    expirePath(CACHE_KEY_USER_EXPERIENCE_MEDIA);
  }

  const mappedRecord = await getMappedExperienceModels(record, baseIncludeOpts);

  return { updated: true, data: mappedRecord };
}

/**
 * Update an experience with CTAs or remove them
 */
export async function updateExperienceCTAs(
  expId: string,
  ctas: AIExperienceCallToActionSuggestionModel[] | null,
) {
  try {
    return updateExperience(expId, {
      ctas: ctas ? ctas : [],
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error updating experience CTAs:', error);
    return errMsg;
  }
}

/**
 * Update an experience's content and rich content columns by ID
 */
export async function updateExperienceContent(
  expId: string,
  rawContent: string,
  richContent: string,
) {
  try {
    const update = (await updateExperience(expId, {
      content: rawContent,
      richContent,
    })) as unknown as ExperienceModel;
    return {
      error: false,
      data: update,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error updating experience content:', error);
    return {
      error: true,
      data: null,
      msg: `Failed to update experience content: ${errMsg}`,
    };
  }
}

/**
 * Increment an experience's view count by ID
 */
export async function updateExperienceViewCount(
  expId: string,
  incrementBy = 1,
) {
  try {
    const record = await db
      .update(experiences)
      .set({
        views: sql`${experiences.views} + ${incrementBy}`,
      })
      .where(eq(experiences.id, expId))
      .returning();

    return record as unknown as ExperienceModel;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error incrementing experience view count:', error);
    return errMsg;
  }
}

/**
 * Update an experience's pin status
 *
 * @note This function is used to pin/unpin an experience
 * @note This function wraps the updateExperience function
 */
export async function updateExperiencePinStatus(id: string, pinned: boolean) {
  try {
    return updateExperience(id, {
      pinned,
      pinnedAt: pinned ? new Date() : null,
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error updating experience pin status:', error);
    return errMsg;
  }
}

/**
 * Dettach a prompt from an experience
 */
export async function detachPromptFromExperience(expId: string) {
  try {
    return updateExperience(expId, {
      promptId: null,
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error detaching prompt from experience:', error);
    return errMsg;
  }
}

/**
 * Dettach a prompt collection (story) from an experience
 */
export async function detachPromptStoryFromExperience(expId: string) {
  try {
    return updateExperience(expId, {
      storyId: null,
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error(
      'Error detaching prompt collection (story) from experience:',
      error,
    );
    return errMsg;
  }
}
