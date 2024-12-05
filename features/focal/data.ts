import { getPhotosCached, getPhotosMetaCached } from '@/features/photo/cache';

export const getPhotosFocalLengthDataCached = ({
  focal,
  limit,
}: {
  focal: number;
  limit?: number;
}) =>
  Promise.all([
    getPhotosCached({ focal, limit }),
    getPhotosMetaCached({ focal }),
  ]);
