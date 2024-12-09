'use server';

import { put } from '@vercel/blob';

import { getErrorMessage } from '@/lib/errors';
import { getUserSession } from '@/lib/session';
import {
  createFileBlobUserAvatarPathKey,
  createFileBlobUserBannerPathKey,
} from '@/lib/storage/vercel-blob-utils';

import type { CustomPutBlobResult } from '@/types/blob';

/**
 * Upload a single blob to the Vercel Blob Storage.
 *
 * @resource https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#put
 */
export async function uploadSingleBlob(
  blob: Blob | File,
  name: string,
  userId: string,
  chatId: string,
  multipart = false,
): Promise<Partial<CustomPutBlobResult>> {
  const user = await getUserSession();
  if (!user) {
    return {
      error: true,
      message: 'Unauthorized',
    };
  }

  try {
    const blobName = blob instanceof File ? blob.name : name;
    const blobKey = `${userId}/${chatId}/${blobName}`;
    const blobResult = await put(blobKey, blob, {
      access: 'public',
      multipart,
    });

    return {
      ...blobResult,
      error: false,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      message: errMsg,
    };
  }
}

/**
 * Upload multiple blobs to the Vercel Blob Storage.
 *
 * @note simply reiterates the `uploadSingleBlob` function for each blob.
 */
export async function uploadMultipleBlobs(
  blobs: Blob[],
  names: string[],
  userId: string,
  chatId: string,
  multipart = false,
): Promise<Partial<CustomPutBlobResult[]>> {
  const results = await Promise.all(
    blobs.map((blob, index) =>
      uploadSingleBlob(blob, names[index], userId, chatId, multipart),
    ),
  );

  return results as Partial<CustomPutBlobResult[]>;
}

/**
 * Upload a user's avatar to the Vercel Blob Storage server-side.
 */
export async function uploadUserAvatar(
  blob: Blob | File,
  userId: string,
  fileName = '',
  folder = 'avatar',
  multipart = false,
): Promise<Partial<CustomPutBlobResult>> {
  const blobKey = createFileBlobUserAvatarPathKey(
    userId,
    blob,
    fileName,
    folder,
  );

  try {
    const blobResult = await put(blobKey, blob, {
      access: 'public',
      multipart,
    });

    return {
      ...blobResult,
      error: false,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      message: errMsg,
    };
  }
}

/**
 * Upload a user's banner to the Vercel Blob Storage.
 */
export async function uploadUserBanner(
  blob: Blob | File,
  userId: string,
  fileName = '',
  folder = 'banner',
  multipart = false,
): Promise<Partial<CustomPutBlobResult>> {
  const blobKey = createFileBlobUserBannerPathKey(
    userId,
    blob,
    fileName,
    folder,
  );

  try {
    const blobResult = await put(blobKey, blob, {
      access: 'public',
      multipart,
    });

    return {
      ...blobResult,
      error: false,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      message: errMsg,
    };
  }
}

/**
 * Upload audio blob to the Vercel Blob Storage.
 */
export async function uploadAudioBlob(
  blob: Blob | File,
  fileName = '',
  folder = 'audio',
  multipart = false,
): Promise<Partial<CustomPutBlobResult>> {
  const blobKey = `${folder}/${fileName}`;

  try {
    const blobResult = await put(blobKey, blob, {
      access: 'public',
      multipart,
    });

    return {
      ...blobResult,
      error: false,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      message: errMsg,
    };
  }
}

/**
 * Upload an experience audio blob to the Vercel Blob Storage.
 *
 * @note This wraps the `uploadAudioBlob` function with a specific folder.
 */
export async function uploadExperienceAudioBlob(
  formData: FormData,
  multipart = false,
): Promise<Partial<CustomPutBlobResult>> {
  const blob = formData.get('audio') as Blob;
  const expId = formData.get('expId') as string;

  if (!blob || !expId) {
    return {
      error: true,
      message: 'Missing audio blob or experience ID',
    };
  }

  const authorId = formData.get('authorId') as string;
  const voice = formData.get('voice') as string;
  const language = formData.get('language') as string;

  const baseFileName = `id-${expId}`;

  const authorFileName = authorId
    ? `${baseFileName}-${authorId}`
    : baseFileName;

  const languageFileName = language
    ? `${authorFileName}-${language}`
    : authorFileName;

  const finalFileName = voice
    ? `${languageFileName}-${voice}`
    : languageFileName;

  return uploadAudioBlob(blob, finalFileName, 'exp-audio', multipart);
}
