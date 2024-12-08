'use server';

import { getImageThumbnailBase64 } from '@/features/photo/server';
import { db } from '@/lib/db/connect';

import {
  type Experience,
  type ExperienceSave,
  type Media,
  experiences,
  media,
} from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import { isImage, isImageExtension } from '@/lib/media/media-utils';
import { mapDbUserToClientFriendlyPhotoAuthor } from '@/lib/user/user-utils';
import type { AIExperienceCallToActionSuggestionModel } from '@/types/experience-prompts';
import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';
import type { USER_PROFILE_MODEL } from '@/types/user';
import { eq } from 'drizzle-orm';
import { unstable_expirePath as expirePath, unstable_cache } from 'next/cache';
import { getCachedAllBookmarksByExpId } from './bookmarks';
import {
  CACHE_KEY_USER_EXPERIENCE,
  CACHE_KEY_USER_EXPERIENCE_MEDIA,
  CACHE_KEY_USER_EXPERIENCE_SINGLE_MEDIA,
} from './cache-keys';
import type { ExperienceIncludeOpts } from './experience-action-types';
import { getAndMapUserGeo } from './geo';
import { getCachedAllLikesByExpId } from './likes';
import { getCachedAllPromptsByExpId } from './prompts';
import { getCachedAllStoriesByExpId } from './stories';
import { getCachedUserById, getUserById } from './user';

/**
 * Get geo data from headers and map it to an experience record for the user
 */
export async function getUserGeoforExperience(data: Experience) {
  const geo = await getAndMapUserGeo();
  if (geo) {
    if (!data.longitude) {
      data.longitude = Number(geo.longitude);
    }
    if (!data.latitude) {
      data.latitude = Number(geo.latitude);
    }
    if (!data.location) {
      data.location = geo.city || geo.countryRegion;
    }
  }

  return data;
}

/**
 * Get mapped models for an experience
 */
export async function getMappedExperienceModels(
  record: Experience,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel> {
  const {
    author = true,
    media = true,
    story = true,
    prompts = true,
    bookmarks = false,
    likes = false,
  } = includeOpts;

  const hasIncludeOpts =
    author || media || story || prompts || bookmarks || likes;

  if (!hasIncludeOpts) {
    return record as ExperienceModel;
  }

  const { authorId } = record;

  const [Author, Media, Prompt, Story, Bookmark, Likes] = await Promise.all([
    author && authorId
      ? cached
        ? getCachedUserById(authorId)
        : getUserById(authorId)
      : undefined,
    media ? getCachedAllExperienceMediaByExpId(record.id) : undefined,
    prompts ? getCachedAllPromptsByExpId(record.id) : undefined,
    story ? getCachedAllStoriesByExpId(record.id) : undefined,
    bookmarks ? getCachedAllBookmarksByExpId(record.id) : undefined,
    likes ? getCachedAllLikesByExpId(record.id) : undefined,
  ]);

  return {
    ...record,
    Author: Author
      ? mapDbUserToClientFriendlyPhotoAuthor(
          Author as unknown as USER_PROFILE_MODEL,
        )
      : undefined,
    Media: Media,
    Prompt: Prompt,
    Story: Story,
    Bookmarks: Bookmark,
    Likes: Likes,
  } as ExperienceModel;
}

/**
 * Get mapped models for a list of experiences
 *
 * @note - This function is used to map a list of experiences to their respective models. It wraps the getMappedExperienceModels function.
 */
export async function getMappedExperienceModelsList(
  records: Experience[],
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel[]> {
  return await Promise.all(
    records.map(async (record) => {
      return getMappedExperienceModels(record, includeOpts, cached);
    }),
  );
}

/**
 * Get image thumbnail for an experience media
 */
export async function getSingleExperienceMediaThumbnail(
  url: string,
  width: number | undefined,
  aspectRatio: number | undefined,
) {
  const thumbnail = await getImageThumbnailBase64(
    url,
    undefined,
    aspectRatio ? Number(aspectRatio) : undefined,
  );

  return thumbnail;
}

export async function getCachedSingleExperienceMediaThumbnail(
  ...args: Parameters<typeof getSingleExperienceMediaThumbnail>
) {
  const mediaUrl = args[0];
  return unstable_cache(getSingleExperienceMediaThumbnail, [mediaUrl], {
    revalidate: 86400, // 24 hours
    tags: [mediaUrl, CACHE_KEY_USER_EXPERIENCE_SINGLE_MEDIA],
  })(...args).then((mediaThumbnail) =>
    mediaThumbnail ? mediaThumbnail : undefined,
  );
}

/**
 * Retrieve thumbnails for a set of experience media
 *
 * @note - Thumbnail call are cached
 */
export async function getSingleExperienceMediaThumbnails(
  media: ExperienceMediaModel[],
) {
  return await Promise.all(
    media.map(async (asset) => {
      const { urlOriginal, url, extension, aspectRatio } = asset;
      const mediaIsImage = extension
        ? isImageExtension(extension)
        : isImage(urlOriginal || url);

      if (!mediaIsImage) {
        return {
          ...asset,
        } as ExperienceMediaModel;
      }

      const urlToUse = urlOriginal || url;
      const thumbnail = await getCachedSingleExperienceMediaThumbnail(
        urlToUse,
        undefined,
        aspectRatio ? Number(aspectRatio) : undefined,
      );

      return {
        ...asset,
        thumbnail: thumbnail,
      } as ExperienceMediaModel;
    }),
  );
}

/**
 * Entry point for a set of experiences to get their media thumbnails
 */
export async function getExperiencesMediaThumbnails(
  experiences: ExperienceModel[],
): Promise<ExperienceModel[]> {
  return await Promise.all(
    experiences.map(async (exp) => {
      const { Media: media } = exp;

      const mappedMedia = await getSingleExperienceMediaThumbnails(
        media as ExperienceMediaModel[],
      );

      return {
        ...exp,
        Media: mappedMedia,
      };
    }),
  );
}

export async function getSingleExperienceMedia(expId: string): Promise<Media> {
  const record = await db
    .selectDistinct()
    .from(media)
    .where(eq(experiences.id, expId));

  return record[0];
}

export async function getCachedSingleExperienceMedia(
  expId: string,
): Promise<Media | undefined> {
  return unstable_cache(getSingleExperienceMedia, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_USER_EXPERIENCE_SINGLE_MEDIA],
  })(expId).then((media) => media);
}

export async function getAllExperienceMedia(expId: string): Promise<Media[]> {
  return db.selectDistinct().from(media).where(eq(experiences.id, expId));
}

export async function getCachedAllExperienceMediaByExpId(
  expId: string,
): Promise<Media[]> {
  return unstable_cache(getAllExperienceMedia, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId, CACHE_KEY_USER_EXPERIENCE_MEDIA],
  })(expId).then((media) => media);
}

/**
 * Get a single experience by ID
 */
export async function getSingleExperience(
  id: string,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel | null> {
  const [record] = await db
    .selectDistinct()
    .from(experiences)
    .where(eq(experiences.id, id));

  if (!record) return null;

  const mappedExperience = await getMappedExperienceModels(
    record,
    includeOpts,
    cached,
  );

  return mappedExperience;
}

export async function getCachedSingleExperience(
  ...args: Parameters<typeof getSingleExperience>
): Promise<ExperienceModel | null> {
  const expId = args[0];
  return unstable_cache(getSingleExperience, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId],
  })(...args).then((exp) => exp);
}

type PartialExperienceIncludeOpts = ExperienceIncludeOpts & {};

/**
 * Get partial experience by ID
 */
export async function getPartialExperienceById(
  id: string,
  includeOpts = {} as PartialExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel | null> {
  const [record] = await db
    .selectDistinct()
    .from(experiences)
    .where(eq(experiences.id, id));

  if (!record) return null;

  // Include options with defaults
  const { author = true } = includeOpts;

  return getMappedExperienceModels(record, { author, ...includeOpts }, cached);
}

export async function getCachedPartialExperienceById(
  ...args: Parameters<typeof getPartialExperienceById>
): Promise<ExperienceModel | null> {
  const expId = args[0];
  return unstable_cache(getPartialExperienceById, [expId], {
    revalidate: 86400, // 24 hours
    tags: [expId],
  })(...args).then((exp) => exp);
}

/**
 * Get list of experiences by an array of IDs
 */
export async function getExperiencesByIds(
  ids: string[],
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel[]> {
  const response = await Promise.all(
    ids.map(async (id) => {
      return getCachedSingleExperience(id, includeOpts, cached);
    }),
  );

  return response.filter((exp) => exp) as ExperienceModel[];
}

export async function getCachedExperiencesByIds(
  ...args: Parameters<typeof getExperiencesByIds>
): Promise<ExperienceModel[]> {
  const ids = args[0];
  return unstable_cache(getExperiencesByIds, [], {
    revalidate: 86400, // 24 hours
    tags: ids,
  })(...args).then((experiences) => experiences);
}

/**
 * Get a user's list of experience IDs
 */
export async function getUserExperienceIds(userId: string): Promise<string[]> {
  const records = await db
    .selectDistinct({ id: experiences.id })
    .from(experiences)
    .where(eq(experiences.authorId, userId));

  return records.map((record) => record.id);
}

export async function getCachedUserExperienceIds(
  ...args: Parameters<typeof getUserExperienceIds>
): Promise<string[]> {
  const userId = args[0];
  return unstable_cache(getUserExperienceIds, [userId], {
    revalidate: 86400, // 24 hours
    tags: [userId],
  })(...args).then((ids) => ids);
}

/**
 * Get a user's list of experiences by user ID
 *
 */
export async function getSingleUsersExperiences(
  userId: string,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel[]> {
  const ids = await (cached
    ? getCachedUserExperienceIds(userId)
    : getUserExperienceIds(userId));

  return getExperiencesByIds(ids, includeOpts, cached);
}

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

  // Include options
  if (includeOpts.media) {
    expirePath(CACHE_KEY_USER_EXPERIENCE_MEDIA);
  }

  const mappedRecord = await getMappedExperienceModels(record, includeOpts);

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
 * Get list of experiences by prompt ID
 */
export async function getExperiencesByPromptId(
  promptId: string,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel[] | undefined> {
  const records = await db
    .selectDistinct()
    .from(experiences)
    .where(eq(experiences.promptId, promptId));

  if (!records || !records.length) return undefined;

  return getMappedExperienceModelsList(records, includeOpts, cached);
}
