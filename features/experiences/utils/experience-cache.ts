import { clearTagCache } from '@/actions/cache';
import {
  CACHE_KEY_USER_EXPERIENCE,
  CACHE_KEY_USER_EXPERIENCES,
} from '@/actions/cache-keys';

/**
 * Clears the cache for a single experience
 *
 * @see experiences-db.ts for the cache key pattern
 */
export function clearSingleExperienceCacheTag(
  expId: string,
  key = CACHE_KEY_USER_EXPERIENCE,
) {
  const keyToClear = `${expId}-${key}`;
  console.log('**** Clearing cache for single experience', keyToClear);
  clearTagCache(keyToClear);
}

/**
 * Clears the cache for a user's experiences
 *
 * @see experiences-db.ts for the cache key pattern
 */
export function clearUserExperiencesCacheTag(
  userId?: string,
  key = CACHE_KEY_USER_EXPERIENCES,
) {
  const keyToClear = userId ? `${userId}-${key}` : key;
  console.log('**** Clearing cache for user experiences', keyToClear);
  clearTagCache(keyToClear);
}
