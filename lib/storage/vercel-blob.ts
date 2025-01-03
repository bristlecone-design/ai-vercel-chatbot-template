import { copy, del, list } from '@vercel/blob';
import { upload as uploadClient } from '@vercel/blob/client';

import { getErrorMessage } from '../errors';
import {
  createFileBlobUserAvatarPathKey,
  createFileBlobUserBannerPathKey,
} from './vercel-blob-utils';

import { PATH_API_VERCEL_BLOB_UPLOAD } from '@/config/site-paths';
import type { CustomPutBlobResult } from '@/types/blob';

const VERCEL_BLOB_STORE_ID = process.env.BLOB_READ_WRITE_TOKEN?.match(
  /^vercel_blob_rw_([a-z0-9]+)_[a-z0-9]+$/i,
)?.[1].toLowerCase();

export const VERCEL_BLOB_BASE_URL = VERCEL_BLOB_STORE_ID
  ? `https://${VERCEL_BLOB_STORE_ID}.public.blob.vercel-storage.com`
  : undefined;

export const isUrlFromVercelBlob = (url?: string) =>
  VERCEL_BLOB_BASE_URL && url?.startsWith(VERCEL_BLOB_BASE_URL);

export const vercelBlobUploadFromClient = async (
  file: File | Blob,
  fileName: string,
) =>
  uploadClient(fileName, file, {
    access: 'public',
    handleUploadUrl: PATH_API_VERCEL_BLOB_UPLOAD,
  }).then(({ url }) => url);

export const vercelBlobCopy = (
  sourceUrl: string,
  destinationFileName: string,
  addRandomSuffix?: boolean,
): Promise<string> =>
  copy(sourceUrl, destinationFileName, {
    access: 'public',
    addRandomSuffix,
  }).then(({ url }) => url);

export const vercelBlobDelete = (fileName: string) => del(fileName);

export const vercelBlobList = (prefix: string) =>
  list({ prefix }).then(({ blobs }) =>
    blobs.map(({ url, uploadedAt }) => ({
      url,
      uploadedAt,
    })),
  );

/**
 * Upload a user's avatar to the Vercel Blob Storage client-side.
 *
 * @reference https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
 */
export async function uploadUserAvatarClient(
  blob: Blob | File,
  userId: string,
  fileName = '',
  folder = 'avatar',
  multipart = false,
  clientPayload?: string, // Stringified JSON object
  uploadUrl = '/api/user/profile/avatar/client',
): Promise<Partial<CustomPutBlobResult>> {
  const blobKey = createFileBlobUserAvatarPathKey(
    userId,
    blob,
    fileName,
    folder,
  );

  try {
    const blobResult = await uploadClient(blobKey, blob as File, {
      access: 'public',
      multipart,
      clientPayload,
      handleUploadUrl: uploadUrl,
    });
    console.log('blobResult for client avatar upload:', blobResult);

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
 * Upload a user's banner to the Vercel Blob Storage client-side.
 *
 * @reference https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
 */
export async function uploadUserBannerClient(
  blob: Blob | File,
  userId: string,
  fileName = '',
  folder = 'banner',
  multipart = false,
  clientPayload?: string, // Stringified JSON object
  uploadUrl = '/api/user/profile/banner/client',
): Promise<Partial<CustomPutBlobResult>> {
  const blobKey = createFileBlobUserBannerPathKey(
    userId,
    blob,
    fileName,
    folder,
  );

  try {
    const blobResult = await uploadClient(blobKey, blob as File, {
      access: 'public',
      multipart,
      clientPayload,
      handleUploadUrl: uploadUrl,
    });
    console.log('blobResult for client banner upload:', blobResult);

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
