'use server';
import { db } from '@/lib/db/connect';
import { type User, users } from '@/lib/db/schema';
import { mapDbUserToClientFriendlyUser } from '@/lib/user/user-utils';
import type { USER_PROFILE_MODEL } from '@/types/user';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_KEY_USER_PROFILE } from './cache-keys';

export async function getUserById(id: string): Promise<User> {
  try {
    const [record] = await db.select().from(users).where(eq(users.id, id));
    return record;
  } catch (error) {
    console.error('Failed to get user by id from database', error);
    throw error;
  }
}

export async function getCachedUserById(
  userId: string,
): Promise<User | undefined> {
  return unstable_cache(getUserById, [userId], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_USER_PROFILE],
  })(userId).then((user) => user);
}

/**
 * Get a user's profile by ID
 *
 * @note wraps getUserById and maps the result to a user profile
 */
export async function getUserProfileById(
  userId: string,
): Promise<USER_PROFILE_MODEL | null> {
  const user = await getUserById(userId);

  return user ? mapDbUserToClientFriendlyUser(user) : null;
}

export async function getCachedUserProfileById(
  userId: string,
): Promise<USER_PROFILE_MODEL | null> {
  return unstable_cache(getUserProfileById, [userId], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_USER_PROFILE],
  })(userId).then((user) => user);
}
