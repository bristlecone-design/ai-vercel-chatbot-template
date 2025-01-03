'use server';

import { db } from '@/lib/db/connect';
import { media } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import { getNextImageUrlForManipulation } from '@/lib/next-image';
import type { PhotoBasicExifData } from '@/types/photo';
import { and, eq } from 'drizzle-orm';

/**
 * Add a featured image to a user's featured images list
 *
 * @note Only adds to Postgres, not @vercel/blob
 *
 * @see /api/user/photos/upload/client/route.ts for adding to @vercel/blob
 */
export async function addUserFeaturedImg(
  userId: string,
  imgPath: string,
  photoRecord: PhotoBasicExifData,
  imgTitle?: string,
): Promise<any> {
  try {
    const lookupRecord = await db
      .select()
      .from(media)
      .where(and(eq(media.urlOriginal, imgPath), eq(media.userId, userId)));

    if (lookupRecord) {
      console.log(`**** Featured image already exists for user`, lookupRecord);
      return lookupRecord;
    }

    const optimizedUrl = getNextImageUrlForManipulation(
      imgPath,
      3840,
      75,
      'https://experience.nv.guide',
    );

    const { blurData, extension, exif } = photoRecord;

    const {
      iso,
      make,
      model,
      aspectRatio,
      focalLength,
      focalLength35,
      fNumber,
      exposureTime,
      exposureCompensation,
      latitude,
      longitude,
      filmSimulation,
      takenAt,
      takenAtNaive,
    } = exif || {};

    const createRecord = await db.insert(media).values({
      userId,
      url: optimizedUrl || imgPath,
      urlOriginal: imgPath,
      title: imgTitle || '',
      featured: true,
      extension: extension || undefined,
      blurData: blurData || undefined,
      iso: iso ? Number(iso) : undefined,
      make: make || undefined,
      model: model || undefined,
      aspectRatio: aspectRatio ? Number(aspectRatio) : undefined,
      focalLength: focalLength ? String(focalLength) : undefined,
      focalLength35: focalLength35 ? String(focalLength35) : undefined,
      fNumber: fNumber ? Number(fNumber) : undefined,
      exposureTime: exposureTime ? String(exposureTime) : undefined,
      exposureCompensation: exposureCompensation
        ? String(exposureCompensation)
        : undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      filmSimulation: filmSimulation || undefined,
      takenAt: takenAt ? new Date(takenAt) : undefined,
      takenAtNaive: takenAtNaive ? takenAtNaive : undefined,
    });

    return createRecord;
  } catch (e) {
    console.error(`Error in addUserFeaturedImg`, getErrorMessage(e));
    return false;
  }
}
