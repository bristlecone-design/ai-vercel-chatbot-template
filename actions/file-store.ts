import { type PutBlobResult, put } from '@vercel/blob';

/**
 * Upload a file to Vercel's Blob Storage
 */
export async function uploadFileToBlobStorage(
  file: File,
  fileName?: string,
  publicAccess = true,
): Promise<PutBlobResult | undefined> {
  if (!file) {
    return undefined;
  }

  const nameTouse = fileName || file.name;

  const response = await put(nameTouse, file, {
    contentType: file.type,
    // TODO: Update this to be private when Vercel supports it
    access: publicAccess ? 'public' : 'public',
  });

  return response;
}
