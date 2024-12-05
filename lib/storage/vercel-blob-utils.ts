export function createFileBlobUserAvatarPathKey(
  userId: string,
  blob: Blob | File,
  fileName?: string,
  folder = 'avatar',
) {
  const blobName = blob instanceof File ? blob.name : fileName || 'avatar';
  return `${userId}/${folder}/${blobName}`;
}

export function createFileBlobUserBannerPathKey(
  userId: string,
  blob: Blob | File,
  fileName?: string,
  folder = 'banner',
) {
  const blobName = blob instanceof File ? blob.name : fileName || 'avatar';
  return `${userId}/${folder}/${blobName}`;
}
