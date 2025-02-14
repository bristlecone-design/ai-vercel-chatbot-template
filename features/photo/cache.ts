import { createCameraKey } from '@/features/camera';
import {
  parseCachedPhotoDates,
  parseCachedPhotosDates,
} from '@/features/photo';
import {
  getPhoto,
  getPhotos,
  getPhotosMeta,
  getPhotosMostRecentUpdate,
  getPhotosNearId,
  getUniqueCameras,
  getUniqueFilmSimulations,
  getUniqueTags,
  getUniqueTagsHidden,
} from '@/features/photo/db/query';
import {
  expirePath,
  expireTag,
  unstable_cache,
  unstable_noStore,
} from 'next/cache';

import type { GetPhotosOptions } from './db';

import {
  PATHS_ADMIN,
  PATH_ADMIN,
  PATH_GRID,
  PATH_ROOT,
  PREFIX_CAMERA,
  PREFIX_FILM_SIMULATION,
  PREFIX_TAG,
  pathForPhoto,
} from '@/config/site-paths';

// Table key
const KEY_PHOTOS = 'photos';
const KEY_PHOTO = 'photo';
// Field keys
const KEY_TAGS = 'tags';
const KEY_CAMERAS = 'cameras';
const KEY_FILM_SIMULATIONS = 'film-simulations';
// Type keys
const KEY_COUNT = 'count';
const KEY_HIDDEN = 'hidden';
const KEY_DATE_RANGE = 'date-range';

const getPhotosCacheKeyForOption = (
  options: GetPhotosOptions,
  option: keyof GetPhotosOptions,
): string | null => {
  switch (option) {
    // Complex keys
    case 'camera': {
      const value = options[option];
      return value ? `${option}-${createCameraKey(value)}` : null;
    }
    case 'takenBefore':
    case 'takenAfterInclusive': {
      const value = options[option];
      return value ? `${option}-${value.toISOString()}` : null;
    }
    // Primitive keys
    default:
      const value = options[option];
      return value !== undefined ? `${option}-${value}` : null;
  }
};

const getPhotosCacheKeys = (options: GetPhotosOptions = {}) => {
  const tags: string[] = [];

  // Write the above keys forEach as a for loop for better performance
  for (const key in options) {
    const tag = getPhotosCacheKeyForOption(
      options,
      key as keyof GetPhotosOptions,
    );
    if (tag) {
      tags.push(tag);
    }
  }

  return tags;
};

export const revalidatePhotosKey = () => expireTag(KEY_PHOTOS);

export const expireTagsKey = () => expireTag(KEY_TAGS);

export const revalidateCamerasKey = () => expireTag(KEY_CAMERAS);

export const revalidateFilmSimulationsKey = () =>
  expireTag(KEY_FILM_SIMULATIONS);

export const revalidateAllKeys = () => {
  revalidatePhotosKey();
  expireTagsKey();
  revalidateCamerasKey();
  revalidateFilmSimulationsKey();
};

export const revalidateAdminPaths = () => {
  for (const path of PATHS_ADMIN) {
    expirePath(path, 'layout');
  }
};

export const revalidateAllKeysAndPaths = () => {
  revalidateAllKeys();

  for (const path of PATHS_ADMIN) {
    expirePath(path, 'layout');
  }
};

export const revalidatePhoto = (photoId: string) => {
  // Tags
  expireTag(photoId);
  expireTagsKey();
  revalidateCamerasKey();
  revalidateFilmSimulationsKey();
  // Paths
  expirePath(pathForPhoto({ photo: photoId }), 'layout');
  expirePath(PATH_ROOT, 'layout');
  expirePath(PATH_GRID, 'layout');
  expirePath(PREFIX_TAG, 'layout');
  expirePath(PREFIX_CAMERA, 'layout');
  expirePath(PREFIX_FILM_SIMULATION, 'layout');
  expirePath(PATH_ADMIN, 'layout');
};

// Cache

export const getPhotosCached = (...args: Parameters<typeof getPhotos>) =>
  unstable_cache(getPhotos, [KEY_PHOTOS, ...getPhotosCacheKeys(...args)])(
    ...args,
  ).then(parseCachedPhotosDates);

export const getPhotosNearIdCached = (
  ...args: Parameters<typeof getPhotosNearId>
) =>
  unstable_cache(getPhotosNearId, [KEY_PHOTOS, ...getPhotosCacheKeys(args[1])])(
    ...args,
  ).then(({ photos, indexNumber }) => {
    const [photoId, { limit }] = args;
    const photo = photos.find(({ id }) => id === photoId);
    const isPhotoFirst = photos.findIndex((p) => p.id === photoId) === 0;
    return {
      photo: photo ? parseCachedPhotoDates(photo) : undefined,
      photos: parseCachedPhotosDates(photos),
      ...(limit && {
        photosGrid: photos.slice(
          isPhotoFirst ? 1 : 2,
          isPhotoFirst ? limit - 1 : limit,
        ),
      }),
      indexNumber,
    };
  });

export const getPhotosMetaCached = (
  ...args: Parameters<typeof getPhotosMeta>
) =>
  unstable_cache(getPhotosMeta, [
    KEY_PHOTOS,
    KEY_COUNT,
    KEY_DATE_RANGE,
    ...getPhotosCacheKeys(...args),
  ])(...args);

export const getPhotosMostRecentUpdateCached = unstable_cache(
  () => getPhotosMostRecentUpdate(),
  [KEY_PHOTOS, KEY_COUNT, KEY_DATE_RANGE],
);

export const getPhotoCached = (...args: Parameters<typeof getPhoto>) =>
  unstable_cache(getPhoto, [KEY_PHOTOS, KEY_PHOTO])(...args).then((photo) =>
    photo ? parseCachedPhotoDates(photo) : undefined,
  );

export const getUniqueTagsCached = unstable_cache(getUniqueTags, [
  KEY_PHOTOS,
  KEY_TAGS,
]);

export const getUniqueTagsHiddenCached = unstable_cache(getUniqueTagsHidden, [
  KEY_PHOTOS,
  KEY_TAGS,
  KEY_HIDDEN,
]);

export const getUniqueCamerasCached = unstable_cache(getUniqueCameras, [
  KEY_PHOTOS,
  KEY_CAMERAS,
]);

export const getUniqueFilmSimulationsCached = unstable_cache(
  getUniqueFilmSimulations,
  [KEY_PHOTOS, KEY_FILM_SIMULATIONS],
);

// No store

export const getPhotosNoStore = (...args: Parameters<typeof getPhotos>) => {
  unstable_noStore();
  return getPhotos(...args);
};

export const getPhotoNoStore = (...args: Parameters<typeof getPhoto>) => {
  unstable_noStore();
  return getPhoto(...args);
};
