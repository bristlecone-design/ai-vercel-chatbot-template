import { getPhotosCached, getPhotosMetaCached } from '@/features/photo/cache';

import { cameraFromPhoto, getCameraFromParams } from '.';

export const getPhotosCameraDataCached = async (
  make: string,
  model: string,
  limit: number,
) => {
  const camera = getCameraFromParams({ make, model });
  return Promise.all([
    getPhotosCached({ camera, limit }),
    getPhotosMetaCached({ camera }),
  ]).then(
    ([photos, meta]) =>
      [photos, meta, cameraFromPhoto(photos[0], camera)] as const,
  );
};
