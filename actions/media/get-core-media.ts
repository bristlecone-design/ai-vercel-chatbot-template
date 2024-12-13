'use server';

import { db } from '@/lib/db/connect';

import { type Media, audioMedia, media } from '@/lib/db/schema';
import { mapMediaRecordToMediaWithExif } from '@/lib/media/media-utils';

import type { MediaAudio, MediaModel, MediaModelWithExif } from '@/types/media';
import type { PhotoBasicExifData } from '@/types/photo';

import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_PHOTO, CACHE_KEY_PHOTOS } from '../cache-keys';
import { getCachedUserProfileById, getUserProfileById } from '../user';
import { addUserSingleMedia } from './add-core-media';
import type {
  AudioMediaIncludeOpts,
  MediaActionIncludeOpts,
} from './media-action-types';

/**
 * Get mapped models for a media record
 */
export async function getMappedSingleMediaModels(
  record: Media,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
): Promise<MediaModel> {
  const { user: includeUser = true } = includeOpts;
  const hasIncludeOpts = includeUser;

  if (!hasIncludeOpts) {
    return record as MediaModel;
  }

  const userId = record.userId;

  if (!userId) {
    return record as MediaModel;
  }

  const [Author] = await Promise.all([
    includeUser
      ? cached
        ? getCachedUserProfileById(userId)
        : getUserProfileById(userId)
      : undefined,
  ]);

  return { ...record, User: Author } as MediaModel;
}

export async function getCachedMappedSingleMediaModels(
  ...args: Parameters<typeof getMappedSingleMediaModels>
) {
  return unstable_cache(getMappedSingleMediaModels, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_PHOTOS],
  })(...args).then((media) => media);
}

/**
 * Get mapped models for an array of media records
 *
 * @note This function is used to map media records to media models, it wraps @getMappedSingleMediaModels
 */
export async function getMappedMultipleMediaModels(
  records: Media[],
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
): Promise<MediaModel[]> {
  return Promise.all(
    records.map((record) =>
      getMappedSingleMediaModels(record, includeOpts, cached),
    ),
  );
}

/**
 * Get media by author ID
 */
export async function getMediaByAuthorId(
  userId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
): Promise<MediaModel[]> {
  const records = await db.select().from(media).where(eq(media.userId, userId));
  // .orderBy(desc(media.createdAt), asc(media.takenAt));

  const { user: includeUser = true } = includeOpts;
  const hasIncludeOpts = includeUser;

  if (!hasIncludeOpts) {
    return records as MediaModel[];
  }

  const [Author] = await Promise.all([
    includeUser
      ? cached
        ? getCachedUserProfileById(userId)
        : getUserProfileById(userId)
      : undefined,
  ]);

  return records.map((record) => {
    return { ...record, User: Author } as MediaModel;
  });
}

/**
 * Get media by author ID and cache it
 */
export async function getCachedMediaByAuthorId(
  ...args: Parameters<typeof getMediaByAuthorId>
) {
  const userId = args[0];
  return unstable_cache(getMediaByAuthorId, [], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_PHOTOS],
  })(...args).then((media) => media);
}

/**
 * Get media by experience ID
 */
export async function getMediaByExperienceId(
  experienceId: string,
  isTTS = false,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const records = await db
    .select()
    .from(media)
    .where(and(eq(media.experienceId, experienceId), eq(media.isTTS, isTTS)));

  return getMappedMultipleMediaModels(records, includeOpts, cached);
}

/**
 * Get media by experience ID and cache it
 */
export async function getCachedMediaByExperienceId(
  ...args: Parameters<typeof getMediaByExperienceId>
) {
  const userId = args[0];
  return unstable_cache(getMediaByExperienceId, [], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_PHOTOS],
  })(...args).then((media) => media);
}

/**
 * Get media image by ID
 */
export async function getSingleMedia(
  mediaOrBlobId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const [record] = await db
    .select()
    .from(media)
    .where(or(eq(media.id, mediaOrBlobId), eq(media.blobId, mediaOrBlobId)));

  return getMappedSingleMediaModels(record, includeOpts, cached);
}

/**
 * Get media image by ID and cache it
 *
 * @note wrap @getSingleMedia in a cache function
 */
export async function getCachedSingleMedia(
  ...args: Parameters<typeof getSingleMedia>
) {
  const userId = args[0];
  return unstable_cache(getSingleMedia, [], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_PHOTO],
  })(...args).then((media) => media);
}

/**
 * Get media image by ID and its metadata, e.g. exif data
 */
export async function getSingleMediaWithExif(
  mediaOrBlobId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  options?: {
    cached?: boolean;
    generateBlurData?: boolean;
    generateThumbnail?: boolean;
  },
): Promise<PhotoBasicExifData | null> {
  const { cached = true } = options || {};
  const { user: includeUser = true } = includeOpts;

  const media = await getSingleMedia(
    mediaOrBlobId,
    { user: includeUser },
    cached,
  );

  if (!media) {
    return null;
  }

  const mediaUser = media.User;

  const { exif, blurData } = mapMediaRecordToMediaWithExif(media);
  const {
    id,
    url,
    language,
    urlOriginal,
    urlDownload,
    public: publiclyVisible,
    downloadable,
    remixable,
    staffPick,
    title,
    caption,
    locationName,
    usageNotes,
    price,
  } = media;

  return {
    id,
    url,
    urlOriginal,
    urlDownload,
    user: mediaUser,
    title,
    caption,
    language,
    locationName,
    price,
    usageNotes,
    exif,
    blurData,
    staffPick,
    public: publiclyVisible,
    downloadable: downloadable || false,
    remixable: remixable || false,
    // blobId,
    // blurData,
    // exif,
    // imageResizedBase64,
    // url: url || media.url,
  } as unknown as PhotoBasicExifData;
}

/**
 * Get single media by ID and cache it
 *
 * @note wrap @getSingleMediaWithExif in a cache function
 */
export async function getCachedSingleMediaWithExif(
  ...args: Parameters<typeof getSingleMediaWithExif>
) {
  const mediaOrBlobId = args[0];
  return unstable_cache(getSingleMediaWithExif, [], {
    revalidate: 86400, // 24 hours
    tags: [mediaOrBlobId, CACHE_KEY_PHOTO],
  })(...args).then((media) => media);
}

/**
 * Get single media by url or urlOriginal
 */
export async function getSingleMediaByUrl(
  url: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const [record] = await db
    .select()
    .from(media)
    .where(or(eq(media.url, url), eq(media.urlOriginal, url)));

  const { user: includeUser = true } = includeOpts;
  return getMappedSingleMediaModels(record, { user: includeUser }, cached);
}

/**
 * Get single media by url or urlOriginal and cache it
 */
export async function getCachedSingleMediaByUrl(
  ...args: Parameters<typeof getSingleMediaByUrl>
) {
  const url = args[0];
  return unstable_cache(getSingleMediaByUrl, [], {
    revalidate: 86400, // 24 hours
    tags: [url, CACHE_KEY_PHOTO],
  })(...args).then((media) => media);
}

/**
 * Get a single media by URL and user ID
 */
export async function getSingleMediaByUrlAndUserId(
  url: string,
  userId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const [record] = await db
    .select()
    .from(media)
    .where(
      and(
        or(eq(media.url, url), eq(media.urlOriginal, url)),
        eq(media.userId, userId),
      ),
    );

  const { user: includeUser = true } = includeOpts;
  return getMappedSingleMediaModels(record, { user: includeUser }, cached);
}

export async function getCachedSingleMediaByUrlAndUserId(
  ...args: Parameters<typeof getSingleMediaByUrlAndUserId>
) {
  const url = args[0];
  const userId = args[1];
  return unstable_cache(getSingleMediaByUrlAndUserId, [], {
    revalidate: 86400, // 24 hours
    tags: [`media-${userId}-${url}`, CACHE_KEY_PHOTO],
  })(...args).then((media) => media);
}

/**
 * Get single media by url or urlOriginal and exif data
 */
export async function getSingleMediaByUrlWithExif(
  urlProp: string,
  includeOpts = {} as MediaActionIncludeOpts,
  options?: {
    cached?: boolean;
    generateBlurData?: boolean;
    generateThumbnail?: boolean;
  },
) {
  const { cached = true } = options || {};
  const { user: includeUser = true } = includeOpts;
  const media = await getSingleMediaByUrl(
    urlProp,
    {
      user: includeUser,
    },
    cached,
  );

  if (!media) {
    return null;
  }

  const mediaUser = media.User;

  const { exif, blurData } = mapMediaRecordToMediaWithExif(media);
  const {
    id,
    url,
    urlOriginal,
    urlDownload,
    public: publiclyVisible,
    downloadable,
    remixable,
    staffPick,
    title,
    caption,
    locationName,
    usageNotes,
    price,
  } = media;

  return {
    id,
    url,
    urlOriginal,
    urlDownload,
    user: mediaUser,
    title,
    caption,
    locationName,
    price,
    usageNotes,
    exif,
    blurData,
    staffPick,
    public: publiclyVisible,
    downloadable: downloadable || false,
    remixable: remixable || false,
  } as unknown as PhotoBasicExifData;
}

/**
 * Get single media with exif data by url or urlOriginal and cache it
 *
 * @note wrap @getSingleMediaByUrlWithExif in a cache function
 */
export async function getCachedSingleMediaByUrlWithExif(
  ...args: Parameters<typeof getSingleMediaByUrlWithExif>
) {
  const url = args[0];
  return unstable_cache(getSingleMediaByUrlWithExif, [], {
    revalidate: 86400, // 24 hours
    tags: [url, CACHE_KEY_PHOTOS],
  })(...args).then((media) => media);
}

/**
 * Get multiple media images by ID
 */
export async function getMultipleMedia(
  mediaIds: string[],
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const records = await db
    .select()
    .from(media)
    .where(inArray(media.id, mediaIds));

  const { user: includeUser = true } = includeOpts;

  return getMappedMultipleMediaModels(
    records,
    {
      user: includeUser,
    },
    cached,
  );
}

/**
 * Get a single media (image) record by user ID
 */
export async function getUserSingleMedia(
  userId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const [record] = await db
    .select()
    .from(media)
    .where(eq(media.userId, userId));

  return getMappedSingleMediaModels(record, includeOpts, cached);
}

/**
 * Get multiple media images by user ID
 */
export async function getUserMultipleMedia(
  userId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = true,
) {
  const records = await db.select().from(media).where(eq(media.userId, userId));

  if (!records.length) {
    return [];
  }

  const { user: includeUser = true } = includeOpts;

  return getMappedMultipleMediaModels(records, { user: includeUser }, cached);
}

/**
 * Delete media image by ID
 */
export async function deleteMedia(mediaId: string) {
  const [record] = await db
    .delete(media)
    .where(eq(media.id, mediaId))
    .returning();

  return { deleted: Boolean(record), data: record };
}

/**
 * Toggle a media's remove status
 */
export async function toggleMediaRemoveStatus(
  mediaId: string,
  removed: boolean,
) {
  const [record] = await db
    .update(media)
    .set({
      removed,
    })
    .where(eq(media.id, mediaId))
    .returning();

  return record;
}

/**
 * Connect media record to a user by ID
 */
export async function connectMediaToUser(userId: string, mediaId: string) {
  const [record] = await db
    .update(media)
    .set({
      userId,
    })
    .where(eq(media.id, mediaId))
    .returning();

  return record;
}

/**
 * connect media record to an experience record by ID
 */
export async function connectMediaToExperience(
  experienceId: string,
  mediaId: string,
) {
  const [record] = await db
    .update(media)
    .set({
      experienceId,
    })
    .where(eq(media.id, mediaId))
    .returning();

  return record;
}

/**
 * Clone a media record (aka: remix) and connect it to a user and, optionally, an experience
 */
export async function cloneMediaAndConnectToUserAndExperience(
  mediaId: string,
  userId: string,
  experienceId?: string,
) {
  if (!mediaId) {
    return null;
  }

  const sourceMedia = await getSingleMedia(mediaId);

  if (!sourceMedia) {
    return null;
  }

  const userIdToUse = userId || sourceMedia.userId;

  if (!userIdToUse) {
    return null;
  }

  const originalIdToUse = sourceMedia.id;
  const originalUrlToUse = sourceMedia.originalUrl;

  const clonedMediaPayload = {
    ...sourceMedia,
    id: undefined,
    Remixes: undefined,
    userId: userIdToUse,
    originalId: originalIdToUse,
    originalUrl: originalUrlToUse,
  } as unknown as MediaModelWithExif;

  const clonedMedia = await addUserSingleMedia(
    userIdToUse,
    clonedMediaPayload.url,
    clonedMediaPayload,
    clonedMediaPayload.title,
  );

  if (experienceId && clonedMedia) {
    await connectMediaToExperience(experienceId, clonedMedia.id);
  }

  return clonedMedia;
}

/**
 * Retrieve an audio media record for an Experience
 */
export async function getExperienceAudioMediaRecord(
  experienceId: string,
  userId = '110200990',
  includeOpts = {} as AudioMediaIncludeOpts,
  // language = 'en'
): Promise<MediaAudio[]> {
  const records = await db
    .select()
    .from(audioMedia)
    .where(
      and(
        or(
          eq(audioMedia.experienceId, experienceId),
          eq(audioMedia.userId, userId),
        ),
        // eq(media.isTTS, true),
      ),
    )
    .orderBy(desc(audioMedia.updatedAt));

  if (!records || !records.length) {
    return [];
  }

  const { media: includeMedia = true } = includeOpts;

  const mappedMediaRecords = await Promise.all(
    records
      .map(async (record) => {
        if (!record.mediaId) {
          return null;
        }

        const mediaRecord = includeMedia
          ? await getSingleMedia(record.mediaId)
          : null;

        return {
          voice: record.voice,
          ...mediaRecord,
        } as MediaAudio;
      })
      .filter(Boolean) as Promise<MediaAudio>[],
  );

  return mappedMediaRecords;
}
