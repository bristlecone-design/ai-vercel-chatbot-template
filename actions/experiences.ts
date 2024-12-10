'use server';

import { getImageThumbnailBase64 } from '@/features/photo/server';
import { db } from '@/lib/db/connect';

import {
  type Bookmark,
  type Experience,
  type ExperienceLikes,
  type Media,
  type Prompt,
  type Story,
  experiences,
  media,
} from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import {
  isImage,
  isImageExtension,
  sortRawMediaByLatLong,
} from '@/lib/media/media-utils';
import { mapDbUserToClientFriendlyUser } from '@/lib/user/user-utils';
import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';
import type { USER_PROFILE_MODEL, User } from '@/types/user';
import { count, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  getAllBookmarksByExpId,
  getCachedAllBookmarksByExpId,
} from './bookmarks';
import {
  CACHE_KEY_USER_EXPERIENCE,
  CACHE_KEY_USER_EXPERIENCES,
  CACHE_KEY_USER_EXPERIENCE_MEDIA,
  CACHE_KEY_USER_EXPERIENCE_SINGLE_MEDIA,
} from './cache-keys';
import type {
  ExperienceIncludeOpts,
  PartialExperienceModelOpts,
} from './experience-action-types';
import { updateExperience } from './experiences-updates';
import { getAndMapUserGeo } from './geo';
import { getAllLikesByExpId, getCachedAllLikesByExpId } from './likes';
import {
  getCachedSinglePromptByExpId,
  getCachedSinglePromptCollectionById,
  getSinglePromptByExpId,
  getSinglePromptCollectionById,
} from './prompts';
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
 * Get the mapped relationship models by experience ID
 */
export async function getMappedExperienceModelsById(
  expId: string,
  authorId?: string | null,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = true,
): Promise<{
  Author?: USER_PROFILE_MODEL;
  Prompt?: Prompt | null;
  Story?: Story | null;
  Media?: Media[];
  Bookmarks?: Bookmark[];
  Likes?: ExperienceLikes[];
}> {
  const {
    author: includeAuthor = true,
    media: includeMedia = true,
    story: includeStory = true,
    prompts: includePrompt = true,
    bookmarks: includeBookmarks = false,
    likes: includeLikes = false,
  } = includeOpts;

  const [Author, Media, Prompt, Story, Bookmarks, Likes] = await Promise.all([
    includeAuthor && authorId
      ? cached
        ? getCachedUserById(authorId)
        : getUserById(authorId)
      : undefined,

    includeMedia
      ? cached
        ? getCachedAllExperienceMediaByExpId(expId)
        : getCachedAllExperienceMediaByExpId(expId)
      : undefined,

    includePrompt
      ? cached
        ? getCachedSinglePromptByExpId(expId)
        : getSinglePromptByExpId(expId)
      : undefined,

    includeStory
      ? cached
        ? getCachedSinglePromptCollectionById(expId)
        : getSinglePromptCollectionById(expId)
      : undefined,

    includeBookmarks
      ? cached
        ? getCachedAllBookmarksByExpId(expId)
        : getAllBookmarksByExpId(expId)
      : undefined,

    includeLikes
      ? cached
        ? getCachedAllLikesByExpId(expId)
        : getAllLikesByExpId(expId)
      : undefined,
  ]);

  return {
    Author: Author
      ? mapDbUserToClientFriendlyUser(Author as unknown as User)
      : undefined,
    Media,
    Prompt,
    Story,
    Bookmarks,
    Likes,
  };
}

/**
 * Get mapped relationship models for a specific experience record
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

  const mappedModels = await getMappedExperienceModelsById(
    record.id,
    authorId,
    includeOpts,
    cached,
  );

  return {
    ...record,
    Author: mappedModels.Author,
    Media: mappedModels.Media,
    Prompt: mappedModels.Prompt,
    Story: mappedModels.Story,
    Bookmarks: mappedModels.Bookmarks,
    Likes: mappedModels.Likes,
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
export async function getUserExperienceIds(
  userId: string,
  queryOpts = {} as PartialExperienceModelOpts,
): Promise<string[]> {
  const { visibility, numToTake = 100 } = queryOpts;

  const records = await db
    .selectDistinct({ id: experiences.id })
    .from(experiences)
    .where(eq(experiences.authorId, userId))
    .limit(numToTake);

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

/**
 * Get single experience by prompt ID
 */
export async function getSingleExperienceByPromptId(
  promptId: string,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = false,
): Promise<ExperienceModel | undefined> {
  const [record] = await db
    .selectDistinct()
    .from(experiences)
    .where(eq(experiences.promptId, promptId));

  if (!record) return undefined;

  return getMappedExperienceModels(record, includeOpts, cached);
}

export async function getCachedSingleExperienceByPromptId(
  ...args: Parameters<typeof getSingleExperienceByPromptId>
) {
  const promptId = args[0];
  return unstable_cache(getSingleExperienceByPromptId, [promptId], {
    revalidate: 86400, // 24 hours
    tags: [promptId],
  })(...args).then((exp) => exp);
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
 * Get a single user experience for the frontend by ID
 */
export async function getSingleUserExperienceForFrontend(
  expId: string,
  includeOpts = {} as ExperienceIncludeOpts,
  cached = true,
) {
  // Destructure for defaults
  const {
    author: includeAuthor = true,
    media: includeMedia = true,
    mediaThumbnail: includeMediaThumbs = true,
    prompts: includePrompt = true,
    story: includeStory = true,
    bookmarks: includeBookmarks = true,
    likes: includeLikes = true,
  } = includeOpts;

  // Include options
  const includeOptsProps = {
    author: includeAuthor,
    media: includeMedia,
    story: includeStory,
    prompts: includePrompt,
    bookmarks: includeBookmarks,
    likes: includeLikes,
    mediaThumbnail: includeMediaThumbs,
  } as ExperienceIncludeOpts;

  const experience = await (cached
    ? getCachedSingleExperience(expId, includeOptsProps)
    : getSingleExperience(expId, includeOptsProps));

  if (!experience) return null;

  // Allow us to compare the cachedAt time
  const cachedAt = new Date();
  const mappedExperience = {
    ...experience,
    cachedAt,
    cachedAtTimestamp: cachedAt.getTime(),
  } as ExperienceModel;

  // Media
  if (includeMedia && experience.Media) {
    if (includeMediaThumbs) {
      const experienceMedia = sortRawMediaByLatLong(
        experience.Media,
      ) as ExperienceMediaModel[];

      if (experienceMedia) {
        const expWithMediaThumbs =
          await getSingleExperienceMediaThumbnails(experienceMedia);

        mappedExperience.Media = expWithMediaThumbs;
      }
    }
  }

  return mappedExperience as ExperienceModel;
}

export async function getCachedSingleUserExperienceForFrontend(
  ...args: Parameters<typeof getSingleUserExperienceForFrontend>
) {
  const expId = args[0];
  return unstable_cache(getSingleUserExperienceForFrontend, [], {
    // Revalidate in 1 hour
    revalidate: 431200, // 12 hours
    // Various ways to tag and revalidate
    tags: [expId, `${expId}-${CACHE_KEY_USER_EXPERIENCE}`],
  })(...args).then((exp) => exp);
}

/**
 * Get user experiences for frontend
 *
 * @note First gets the experience IDs, then fetches the experiences
 * @note This allows us to cache and revalidate the experience IDs for better performance and user experience
 */
export async function getUserExperiencesForFrontend(
  authorId: string,
  queryOpts = {} as PartialExperienceModelOpts,
  includeOpts = {} as ExperienceIncludeOpts,
): Promise<ExperienceModel[]> {
  //
  const userExperienceIds = await getCachedUserExperienceIds(
    authorId,
    queryOpts,
  );

  if (!userExperienceIds) return [];

  /**
   * Iterate through the experience IDs and fetch the experiences via @getCachedSingleUserExperienceForFrontend
   *
   * This allows us to cache and revalidate the experiences at the individual level for better performance and user experience
   */
  const experiences = await Promise.all(
    userExperienceIds.map((expId) =>
      getCachedSingleUserExperienceForFrontend(expId, includeOpts),
    ),
  );

  return (experiences ? experiences.filter(Boolean) : []) as ExperienceModel[];
}

/**
 * Get cached user profile experiences for frontend
 *
 * @note Wraps @getUserExperiencesForFrontend in a cache function
 */
export async function getCachedUserProfileExperiencesForFrontend(
  ...args: Parameters<typeof getUserExperiencesForFrontend>
) {
  const profileId = args[0];
  return unstable_cache(getUserExperiencesForFrontend, [], {
    revalidate: 43200, // 12 hours
    tags: [`${profileId}-${CACHE_KEY_USER_EXPERIENCES}`],
  })(...args).then((experiences) => (experiences ? experiences : undefined));
}

/**
 * Get a user's experienc count by ID
 */
export async function getUserExperienceCountForFrontend(
  authorId: string,
  queryOpts = {} as PartialExperienceModelOpts,
): Promise<number> {
  const { visibility, numToTake = 100 } = queryOpts;
  const [result] = await db
    .select({ count: count() })
    .from(experiences)
    .where(eq(experiences.authorId, authorId))
    .limit(numToTake);

  return result.count || 0;
}
