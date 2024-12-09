import type { BASE_PHOTO_AUTHOR_KEY_TYPES, PhotoAuthor } from '@/types/photo';
import type { USER_PROFILE_MODEL } from '@/types/user';

export const BASE_PHOTO_AUTHOR_KEYS: BASE_PHOTO_AUTHOR_KEY_TYPES = [
  'id',
  'url',
  'urlSocial',
  'bio',
  'name',
  'banner',
  'public',
  'profession',
  'avatar',
  'image',
  'email',
  'location',
  'organization',
  'username',
  'waitlist',
];

export function mapUserToPhotoAuthorObj(
  user: USER_PROFILE_MODEL,
  profileKeys = BASE_PHOTO_AUTHOR_KEYS,
): PhotoAuthor | null {
  if (!user) {
    return null;
  }

  // Iterate over the keys and build the object
  return profileKeys.reduce((acc, key) => {
    if (user[key]) {
      // @ts-ignore
      acc[key] = user[key];
    }

    return acc as PhotoAuthor;
  }, {} as PhotoAuthor);
}
