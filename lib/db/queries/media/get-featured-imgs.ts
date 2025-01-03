'use server';

import { db } from '@/lib/db/connect';
import { getErrorMessage } from '@/lib/errors';
import { mapMediaRecordToMediaWithExif } from '@/lib/media/media-utils';

import { mapDbUserToClientFriendlyPhotoAuthor } from '@/lib/user/user-utils';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { getImageThumbnailBase64 } from '@/features/photo/server';
import { media } from '@/lib/db/schema';
import type { MediaModel } from '@/types/media';
import type { PhotoBasicExifData } from '@/types/photo';

import type { MediaActionIncludeOpts } from './media-action-types';
import {
  CACHE_KEY_FEATURED_PHOTOS,
  CACHE_KEY_FEATURED_PHOTOS_COUNT,
} from '@/actions/cache-keys';
import { getCachedUserProfileById, getUserProfileById } from '../user';

/**
 * Add multiple featured images to a user's featured images list
 *
 * @todo Implement this function
 */
// export async function addUserFeaturedImgs(
//   userId: string,
//   imgPaths: string[],
// ): Promise<boolean> {
//   try {
//     // Call @addUserFeaturedImg for each imgPath
//     const results = await Promise.all(
//       // imgPaths.map((imgPath) => addUserFeaturedImg(userId, imgPath)),
//     );

//     return Boolean(results.flat());
//   } catch (e) {
//     console.error(`Error in addUserFeaturedImgs`, getErrorMessage(e));
//     return false;
//   }
// }

/**
 * Get a user's featured images
 */
export async function getUserFeaturedImgs(
  userId: string,
  publicOnly = true,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = false,
) {
  const records = await db
    .select()
    .from(media)
    .where(
      and(
        eq(media.userId, userId),
        eq(media.featured, true),
        eq(media.removed, false),
        eq(media.public, publicOnly),
      ),
    )
    .orderBy(desc(media.takenAt), asc(media.createdAt));

  if (!records || !records.length) {
    return undefined;
  }

  const { user: includeUser = true } = includeOpts;
  const hasIncludeOpts = includeUser;

  if (!hasIncludeOpts) {
    return records as MediaModel[];
  }

  const [Author] = await Promise.all([
    cached ? getCachedUserProfileById(userId) : getUserProfileById(userId),
  ]);

  return records.map((record) => {
    return { ...record, User: Author } as MediaModel;
  });
}

/**
 * Get a user's public featured images
 */
export async function getUserPublicFeaturedImgs(
  userId: string,
  includeOpts = {} as MediaActionIncludeOpts,
  cached = false,
): Promise<MediaModel[]> {
  const records = await db
    .select()
    .from(media)
    .where(
      and(
        eq(media.userId, userId),
        eq(media.featured, true),
        eq(media.public, true),
        eq(media.removed, false),
      ),
    )
    .orderBy(desc(media.createdAt), asc(media.takenAt));

  const { user: includeUser = true } = includeOpts;
  const hasIncludeOpts = includeUser;

  if (!hasIncludeOpts) {
    return records as MediaModel[];
  }

  const [Author] = await Promise.all([
    cached ? getCachedUserProfileById(userId) : getUserProfileById(userId),
  ]);

  return records.map((record) => {
    return { ...record, User: Author } as MediaModel;
  });
}

/**
 * Get user's public featured images and cache them
 *
 * @note wraps @getUserPublicFeaturedImgs in a cache function
 */
export async function getCachedUserPublicFeaturedImgs(
  ...args: Parameters<typeof getUserPublicFeaturedImgs>
) {
  const userId = args[0];
  return unstable_cache(getUserPublicFeaturedImgs, [], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_FEATURED_PHOTOS],
  })(...args).then((imgs) => imgs);
}

/**
 * Get a user's public featured images count only
 */
export async function getUserPublicFeaturedImgsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(media)
    .where(
      and(
        eq(media.featured, true),
        eq(media.public, true),
        eq(media.userId, userId),
      ),
    );

  return result[0]?.count || 0;
}

/**
 * Get a user's cached public featured images count only
 *
 * @note wraps @getUserPublicFeaturedImgsCount in a cache function
 */
export async function getCachedUserPublicFeaturedImgsCount(
  ...args: Parameters<typeof getUserPublicFeaturedImgsCount>
) {
  const userId = args[0];
  return unstable_cache(getUserPublicFeaturedImgsCount, [], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_FEATURED_PHOTOS_COUNT],
  })(...args).then((imgs) => imgs);
}

/**
 * Get a user's public featured images with exif data and blur data
 */
export async function getUserPublicFeaturedImgsWithExifAndBlurData(
  userId: string,
  cached = true,
  includeThumbnail = false,
): Promise<PhotoBasicExifData[]> {
  try {
    const featuredImgs = await (cached
      ? getCachedUserPublicFeaturedImgs(userId)
      : getUserPublicFeaturedImgs(userId));

    if (featuredImgs?.length) {
      const featuredImgsWithData = await Promise.all(
        featuredImgs.map(async (asset) => {
          const assetWithExif = mapMediaRecordToMediaWithExif(asset);
          const photoAuthor = asset.User
            ? mapDbUserToClientFriendlyPhotoAuthor(asset.User)
            : undefined;
          return photoAuthor
            ? { ...assetWithExif, user: photoAuthor }
            : assetWithExif;
        }),
      );

      if (!featuredImgsWithData.length) {
        return [];
      }

      // Get the thumbnail data if requested
      if (includeThumbnail) {
        const featuredImgsWithThumbnailData = await Promise.all(
          featuredImgsWithData.map(async (asset) => {
            const { urlOriginal, url, aspectRatio } = asset;
            const thumbnail = await getImageThumbnailBase64(
              urlOriginal || url,
              undefined,
              aspectRatio ? Number(aspectRatio) : undefined,
            );

            return {
              ...asset,
              thumbnail: thumbnail,
            } as PhotoBasicExifData;
          }),
        );

        return featuredImgsWithThumbnailData.filter(
          Boolean,
        ) as PhotoBasicExifData[];
      }

      return featuredImgsWithData.filter(Boolean) as PhotoBasicExifData[];
    }

    return [];
  } catch (e) {
    console.error(
      `Error in getUserPublicFeaturedImgsWithExifAndBlurData`,
      getErrorMessage(e),
    );
    return [];
  }
}

/**
 * Get a user's featured images with exif data and blur data
 */
export async function getUserFeaturedImgsWithExifAndBlurData(
  userId: string,
  includeThumbnail = false,
): Promise<PhotoBasicExifData[]> {
  try {
    const featuredImgs = await getUserFeaturedImgs(userId);

    if (featuredImgs?.length) {
      const featuredImgsWithData = await Promise.all(
        featuredImgs.map(async (asset) => {
          const assetWithExif = mapMediaRecordToMediaWithExif(asset);
          const photoAuthor = asset.User
            ? mapDbUserToClientFriendlyPhotoAuthor(asset.User)
            : undefined;
          return photoAuthor
            ? { ...assetWithExif, user: photoAuthor }
            : assetWithExif;
        }),
      );

      if (!featuredImgsWithData.length) {
        return [];
      }

      // Get the thumbnail data if requested
      if (includeThumbnail) {
        const featuredImgsWithThumbnailData = await Promise.all(
          featuredImgsWithData.map(async (asset) => {
            const { urlOriginal, url, aspectRatio } = asset;
            const thumbnail = await getImageThumbnailBase64(
              urlOriginal || url,
              undefined,
              aspectRatio ? Number(aspectRatio) : undefined,
            );

            return {
              ...asset,
              thumbnail: thumbnail,
            } as PhotoBasicExifData;
          }),
        );

        return featuredImgsWithThumbnailData.filter(
          Boolean,
        ) as PhotoBasicExifData[];
      }

      return featuredImgsWithData.filter(Boolean) as PhotoBasicExifData[];
    }

    return [];
  } catch (e) {
    console.error(
      `Error in getUserFeaturedImgsWithExifAndBlurData`,
      getErrorMessage(e),
    );
    return [];
  }
}

/**
 * Get all user featured images
 */
export async function getAllUsersFeaturedImgs() {
  try {
    const records = await db
      .select()
      .from(media)
      .where(eq(media.featured, true))
      .orderBy(desc(media.takenAt), asc(media.createdAt));

    if (!records || !records.length) {
      return undefined;
    }

    return records;
  } catch (e) {
    console.error(`Error in getAllUserFeaturedImgs`, getErrorMessage(e));
    return undefined;
  }
}

export async function getCachedAllUsersFeaturedImgs(
  ...args: Parameters<typeof getAllUsersFeaturedImgs>
) {
  return unstable_cache(getAllUsersFeaturedImgs, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_FEATURED_PHOTOS],
  })(...args).then((imgs) => imgs);
}

/**
 * Get all users' featured images with exif data and blur data
 */
export async function getAllUsersFeaturedImgsWithExifAndBlurData(options?: {
  generateBlurData?: boolean;
  generateThumbnail?: boolean;
}): Promise<PhotoBasicExifData[]> {
  try {
    const { generateBlurData = true, generateThumbnail = true } = options || {};
    const featuredImgs = await getAllUsersFeaturedImgs();

    if (featuredImgs?.length) {
      const featuredImgsWithData = await Promise.all(
        featuredImgs.map(async (asset) => {
          const assetWithExif = mapMediaRecordToMediaWithExif(asset);
          return assetWithExif;
        }),
      );

      if (!featuredImgsWithData.length) {
        return [];
      }

      return featuredImgsWithData.filter(Boolean) as PhotoBasicExifData[];
    }

    return [];
  } catch (e) {
    console.error(
      `Error in getAllUsersFeaturedImgsWithExifAndBlurData`,
      getErrorMessage(e),
    );
    return [];
  }
}
