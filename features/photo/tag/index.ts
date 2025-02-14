import {
  capitalizeWords,
  convertStringToArray,
  formatCount,
  formatCountDescriptive,
} from '@/lib/strings';

import {
  absolutePathForTag,
  absolutePathForTagImage,
  getPathComponents,
} from '@/config/site-paths';
import type { Photo } from '@/types/photo';
import {
  photoQuantityText,
  type PhotoDateRange,
  descriptionForPhotoSet,
} from '..';

// Reserved tags
export const TAG_FAVS = 'favs';
export const TAG_HIDDEN = 'hidden';

export type TagsWithMeta = {
  tag: string;
  count: number;
}[];

export const formatTag = (tag?: string) =>
  capitalizeWords(tag?.replaceAll('-', ' '));

export const getValidationMessageForTags = (tags?: string) => {
  const reservedTags = (convertStringToArray(tags) ?? [])
    .filter((tag) => isTagFavs(tag) || isTagHidden(tag))
    .map((tag) => tag.toLocaleUpperCase());
  return reservedTags.length
    ? `Reserved tags: ${reservedTags.join(', ').toLocaleLowerCase()}`
    : undefined;
};

export const titleForTag = (
  tag: string,
  photos: Photo[] = [],
  explicitCount?: number,
) =>
  [formatTag(tag), photoQuantityText(explicitCount ?? photos.length)].join(' ');

export const shareTextForTag = (tag: string) =>
  isTagFavs(tag) ? 'Favorite photos' : `Photos tagged '${formatTag(tag)}'`;

export const sortTags = (tags: string[], tagToHide?: string) =>
  tags
    .filter((tag) => tag !== tagToHide)
    .sort((a, b) => (isTagFavs(a) ? -1 : a.localeCompare(b)));

export const sortTagsObject = (tags: TagsWithMeta, tagToHide?: string) =>
  tags
    .filter(({ tag }) => tag !== tagToHide)
    .sort(({ tag: a }, { tag: b }) => (isTagFavs(a) ? -1 : a.localeCompare(b)));

export const sortTagsWithoutFavs = (tags: string[]) => sortTags(tags, TAG_FAVS);

export const sortTagsObjectWithoutFavs = (tags: TagsWithMeta) =>
  sortTagsObject(tags, TAG_FAVS);

export const descriptionForTaggedPhotos = (
  photos: Photo[] = [],
  dateBased?: boolean,
  explicitCount?: number,
  explicitDateRange?: PhotoDateRange,
) =>
  descriptionForPhotoSet(
    photos,
    'tagged',
    dateBased,
    explicitCount,
    explicitDateRange,
  );

export const generateMetaForTag = (
  tag: string,
  photos: Photo[],
  explicitCount?: number,
  explicitDateRange?: PhotoDateRange,
) => ({
  url: absolutePathForTag(tag),
  title: titleForTag(tag, photos, explicitCount),
  description: descriptionForTaggedPhotos(
    photos,
    true,
    explicitCount,
    explicitDateRange,
  ),
  images: absolutePathForTagImage(tag),
});

export const isTagFavs = (tag: string) => tag.toLocaleLowerCase() === TAG_FAVS;

export const isPhotoFav = ({ tags }: Photo) => tags.some(isTagFavs);

export const isPathFavs = (pathname?: string) =>
  getPathComponents(pathname).tag === TAG_FAVS;

export const isTagHidden = (tag: string) => tag.toLowerCase() === TAG_HIDDEN;

export const addHiddenToTags = (tags: TagsWithMeta, hiddenPhotosCount = 0) => {
  if (hiddenPhotosCount > 0) {
    return tags
      .filter(({ tag }) => tag === TAG_FAVS)
      .concat({ tag: TAG_HIDDEN, count: hiddenPhotosCount })
      .concat(tags.filter(({ tag }) => tag !== TAG_FAVS));
  } else {
    return tags;
  }
};

export const convertTagsForForm = (tags: TagsWithMeta = []) =>
  sortTagsObjectWithoutFavs(tags).map(({ tag, count }) => ({
    value: tag,
    annotation: formatCount(count),
    annotationAria: formatCountDescriptive(count, 'tagged'),
  }));
