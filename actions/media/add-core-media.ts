import { db } from '@/lib/db/connect';
import {
  type AudioMediaInsert,
  type Media,
  type MediaInsert,
  audioMedia,
  media,
} from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import { getNextImageUrlForManipulation } from '@/lib/next-image';
import type { AudioMediaModel } from '@/types/audio';
import type { MediaAudio, MediaModelWithExif } from '@/types/media';
import type { PhotoBasicExifData } from '@/types/photo';
import { and, eq } from 'drizzle-orm';
import {
  getCachedSingleMedia,
  getCachedSingleMediaByUrlAndUserId,
} from './get-core-media';
import type { AudioMediaIncludeOpts } from './media-action-types';

/**
 * Add a media record to the database
 */
export async function addMediaRecord(data: MediaInsert): Promise<Media> {
  try {
    const [result] = await db.insert(media).values(data).returning();

    return result;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to insert user', errMsg);
    throw errMsg;
  }
}

/**
 * Add a media asset to a user's media library
 *
 * @note Only adds to Postgres, not @vercel/blob
 *
 * @see /api/user/media/upload/client/route.ts for adding to @vercel/blob
 */
export async function addUserSingleMedia(
  userId: string,
  imgPath: string,
  photoRecord: PhotoBasicExifData | MediaModelWithExif,
  imgTitle?: string,
) {
  try {
    const lookupRecord = await getCachedSingleMediaByUrlAndUserId(
      imgPath,
      userId,
    );

    if (lookupRecord) {
      console.warn('**** Media already exists for user', lookupRecord);
      return lookupRecord;
    }

    const optimizedUrl = getNextImageUrlForManipulation(
      imgPath,
      3840,
      75,
      'https://experience.nv.guide',
    );

    const { blurData, extension, exif, title: photoTitle } = photoRecord;

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

    const [insertRecord] = await db
      .insert(media)
      .values({
        userId,
        url: optimizedUrl || imgPath,
        urlOriginal: imgPath,
        title: imgTitle || photoTitle || '',
        featured: false,
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
        takenAtNaive: takenAtNaive || undefined,
      })
      .returning();

    return insertRecord;
  } catch (e) {
    console.error('Error in addUserFeaturedImg', getErrorMessage(e));
    return false;
  }
}

/**
 * Save an Experience audio media record to the database. Experience audio media is generated from text-to-speech (TTS).
 *
 * @note This is an upsert operation.
 *
 * @note The audio media record is saved to the database, not the @vercel/blob
 * @note The source of the audio media record is from the OpenAI API
 * @note The media URL is the @vercel/blob URL
 *
 * @lifeCycle OpenAI -> @vercel/blob -> Prisma
 */
export async function saveExperienceAudioMediaRecord(
  mediaId: string | undefined,
  experienceId: string,
  audioUrl: string,
  audioDownloadUrl: string,
  title: string,
  storagePath: string, // Path on @vercel/blob
  audioText: string,
  model: string,
  voiceModel: string,
  language: string,
  userId = '110200990', // Defaults to Experience NV Account
): Promise<MediaAudio> {
  const payload = {
    userId,
    experienceId,
    url: audioUrl,
    urlOriginal: audioUrl,
    urlDownload: audioDownloadUrl,
    storagePath,
    blobId: storagePath || undefined,
    title,
    language,
    isTTS: true,
    meta: {
      audioText: audioText || '',
      voiceModel: voiceModel || '',
    },
  } as Media;

  /**
   * If the audio media record already exists, update the media record
   */
  if (mediaId) {
    const [updatedRecord] = await db
      .update(media)
      .set(payload)
      .where(eq(media.id, mediaId))
      .returning();

    return {
      voice: voiceModel,
      ...updatedRecord,
    } as MediaAudio;
  }

  /**
   * If the audio media record does not exist, create a new media record
   */

  const [newRecord] = await db.insert(media).values(payload).returning();

  if (newRecord) {
    await createAudioMediaConnection(
      newRecord.id,
      experienceId,
      userId,
      model,
      language,
      voiceModel,
    );
  }

  return {
    voice: voiceModel,
    ...newRecord,
  } as MediaAudio;
}

export async function createAudioMediaConnection(
  mediaId: string | undefined,
  expId: string,
  userId: string,
  model: string,
  language: string,
  voice: string,
  includeOpts = {} as AudioMediaIncludeOpts,
): Promise<AudioMediaModel> {
  const [lookupRecord] = await db
    .select()
    .from(audioMedia)
    .where(
      and(
        mediaId ? eq(audioMedia.id, mediaId) : undefined,
        eq(audioMedia.userId, userId),
        eq(audioMedia.language, language),
        eq(audioMedia.voice, voice),
        eq(audioMedia.model, model),
      ),
    );

  const { media: includeMedia = true } = includeOpts;

  if (lookupRecord) {
    console.warn('**** Audio media already exists for user', lookupRecord);
    const mediaRecord =
      includeMedia && mediaId ? await getCachedSingleMedia(mediaId) : undefined;

    return (
      mediaRecord ? { ...lookupRecord, Media: mediaRecord } : lookupRecord
    ) as AudioMediaModel;
  }

  const mediaRecord = await (mediaId
    ? getCachedSingleMedia(mediaId)
    : addMediaRecord({
        userId,
        url: '',
        urlOriginal: '',
        title: 'Audio Media',
      }));

  /**
   * Create if does not exist
   */
  const createPayload = {
    model,
    language,
    voice,
    experienceId: expId,
    userId,
    mediaId: mediaRecord.id,
  } as AudioMediaInsert;

  const [newRecord] = await db
    .insert(audioMedia)
    .values(createPayload)
    .returning();

  return {
    Media: mediaRecord,
    ...newRecord,
  } as AudioMediaModel;
}

export async function updateAudioMediaConnection(
  audioMediaId: string,
  expId?: string,
  userId?: string,
  model?: string,
) {
  const [record] = await db
    .update(audioMedia)
    .set({
      model,
      experienceId: expId,
      userId,
    })
    .where(eq(audioMedia.id, audioMediaId))
    .returning();

  return record;
}
