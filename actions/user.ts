'use server';

import { db } from '@/lib/db/connect';
import { type User, users } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';

import { mapDbUserToClientFriendlyUser } from '@/lib/user/user-utils';
import type { USER_PROFILE_MODEL } from '@/types/user';
import { and, count, desc, eq } from 'drizzle-orm';
import { unstable_expirePath as expirePath, unstable_cache } from 'next/cache';

import { clearTagCache } from './cache';
import {
  CACHE_KEY_USER_PROFILE,
  CACHE_KEY_USER_PROFILES,
  CACHE_KEY_USER_WAITLIST_PROFILES,
} from './cache-keys';

/**
 * Update a user
 */
export async function updateUser(
  userId: string,
  data: Partial<User>,
  pathToRevalidate?: string,
): Promise<{ updated: boolean; data: User }> {
  try {
    const [result] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();

    // Revalidate cache
    if (result) {
      clearTagCache(result.id);

      if (pathToRevalidate) {
        expirePath(pathToRevalidate);
      }
    }

    return { updated: Boolean(result), data: result };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to update user', errMsg);
    throw errMsg;
  }
}

/**
 * Add/Insert a new user
 */
export async function insertUser(data: User): Promise<User> {
  try {
    const [result] = await db.insert(users).values(data).returning();

    return result;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to insert user', errMsg);
    throw errMsg;
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const [record] = await db.select().from(users).where(eq(users.id, id));
    return record;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get user by id from database', errMsg);
    throw errMsg;
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
): Promise<USER_PROFILE_MODEL | undefined> {
  try {
    const user = await getUserById(userId);
    return user ? mapDbUserToClientFriendlyUser(user) : undefined;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get user profile by id', errMsg);
    throw errMsg;
  }
}

export async function getCachedUserProfileById(
  userId: string,
): Promise<USER_PROFILE_MODEL | undefined> {
  return unstable_cache(getUserProfileById, [userId], {
    revalidate: 86400, // 24 hours
    tags: [userId, CACHE_KEY_USER_PROFILE],
  })(userId).then((user) => user);
}

/**
 * Get a list of user profiles by an array of user IDs
 *
 * @note This function wraps getUserProfileById and maps each result to a user profile
 */
export async function getUserProfilesByIds(
  userIds: string[],
): Promise<Array<USER_PROFILE_MODEL>> {
  const userProfiles = await Promise.all(
    userIds.map((userId) => getUserProfileById(userId)),
  );

  return userProfiles.filter(Boolean) as Array<USER_PROFILE_MODEL>;
}

// Cached version of getUserProfilesByIds
export async function getCachedUserProfilesByIds(
  userIds: string[],
): Promise<Array<USER_PROFILE_MODEL>> {
  return unstable_cache(getUserProfilesByIds, [], {
    revalidate: 86400, // 24 hours
    tags: [userIds.join(','), CACHE_KEY_USER_PROFILES],
  })(userIds).then((userProfiles) => userProfiles);
}

/**
 * Get a user's profile by username
 *
 */
export async function getUserProfileByUsername(
  username: string,
): Promise<USER_PROFILE_MODEL | undefined> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user ? mapDbUserToClientFriendlyUser(user) : undefined;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get user profile by username', errMsg);
    throw errMsg;
  }
}

// Cached version of getUserProfileByUsername
export async function getCachedUserProfileByUsername(
  ...args: Parameters<typeof getUserProfileByUsername>
): Promise<USER_PROFILE_MODEL | undefined> {
  const [username] = args;
  return unstable_cache(getUserProfileByUsername, [], {
    revalidate: 86400, // 24 hours
    tags: [username, CACHE_KEY_USER_PROFILE],
  })(...args).then((user) => user);
}

/**
 * Get 'allowed' key for a user, specifically for access control
 *
 * @param userId
 *
 * @returns boolean - whether the user is allowed
 */
export async function getUserAllowedStatus(userId: string): Promise<boolean> {
  try {
    const [user] = await db
      .select({ allowed: users.allowed })
      .from(users)
      .where(eq(users.id, userId));

    return Boolean(user.allowed);
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get user allowed status', errMsg);
    throw errMsg;
  }
}

/**
 * Get a username by userId
 */
export async function getUsernameByUserId(
  userId: string,
): Promise<string | null> {
  try {
    const [user] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId));

    return user.username;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get username by userId', errMsg);
    throw errMsg;
  }
}

/**
 * Get a username by email
 */
export async function getUsernameByEmail(
  email: string,
): Promise<string | null> {
  try {
    const [user] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.email, email));

    return user.username;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get username by email', errMsg);
    throw errMsg;
  }
}

/**
 * Update user password by email
 */
export async function updateUserPasswordByEmail(
  email: string,
  password: string,
  salt: string,
): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({ password, salt })
      .where(eq(users.email, email));
    return true;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to update user password by email', errMsg);
    throw errMsg;
  }
}

/**
 * Lookup a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get user by email', errMsg);
    throw errMsg;
  }
}

/**
 * Does user exist by email
 *
 */
export async function doesUserExistByEmail(email: string): Promise<boolean> {
  const count = await db.$count(users, eq(users.email, email));
  return Boolean(count);
}

/**
 * Update user's username
 */
export async function updateUserUsername(
  userId: string,
  username: string,
): Promise<boolean> {
  try {
    await db.update(users).set({ username }).where(eq(users.id, userId));

    return true;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to update user username', errMsg);
    throw errMsg;
  }
}

/**
 * Get all user waitlist count (total)
 *
 * @note This is a count of all users who are on the waitlist
 *
 */
export async function getUserWaitlistCount(baseCount = 1208): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count(users.waitlist) })
      .from(users)
      .where(eq(users.waitlist, true));

    const resultCount = result.count;
    return resultCount + baseCount;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get user waitlist count', errMsg);
    throw errMsg;
  }
}

// Cached version of getUserWaitlistCount
export async function getCachedUserWaitlistCount(): Promise<number> {
  return unstable_cache(getUserWaitlistCount, [], {
    revalidate: 86400, // 24 hours
    tags: [CACHE_KEY_USER_WAITLIST_PROFILES],
  })().then((count) => count);
}

/**
 * Get all users with waitlist status
 */
export async function getUsersWithWaitlistStatus(
  waitlist = true,
): Promise<Array<User>> {
  try {
    return db.select().from(users).where(eq(users.waitlist, waitlist));
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get users with waitlist status', errMsg);
    throw errMsg;
  }
}

/**
 * Get all users on the waitlist
 *
 * @note This function wraps getUsersWithWaitlistStatus and filters for users on the waitlist
 */
export async function getAllWaitlistedUsers(): Promise<Array<User>> {
  return getUsersWithWaitlistStatus(true);
}

/**
 * Toggle the "allowed" status of a user
 *
 * @param userId
 * @param allowed - whether the user is allowed
 *
 * @returns boolean - whether the operation was successful
 */
export async function toggleUserAllowedStatus(
  userId: string,
  allowed: boolean,
): Promise<{ updated: boolean; data: User }> {
  try {
    const [result] = await db
      .update(users)
      .set({ allowed })
      .where(eq(users.id, userId))
      .returning();

    // Revalidate cache
    if (result) {
      clearTagCache(userId);
    }

    return { updated: Boolean(result), data: result };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to toggle user allowed status', errMsg);
    throw errMsg;
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<Array<User>> {
  try {
    return db.select().from(users);
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get all users', errMsg);
    throw errMsg;
  }
}

/**
 * Get all public users
 *
 * @note Accounts for users who are public and not blocked with a username
 */
export async function getAllPublicUsers(): Promise<Array<User>> {
  try {
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.allowed, true),
          eq(users.public, true),
          eq(users.blocked, false),
        ),
      )
      .orderBy(desc(users.createdAt));
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to get all public users', errMsg);
    throw errMsg;
  }
}

/**
 * Delete / remove a user
 *
 * @param userId
 *
 * @returns boolean - whether the operation was successful
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await db.delete(users).where(eq(users.id, userId));
    return true;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to delete user', errMsg);
    throw errMsg;
  }
}

/**
 * Update a user's banner image
 */
export async function updateUserBanner(
  userId: string,
  banner: string,
): Promise<boolean> {
  try {
    await db.update(users).set({ banner }).where(eq(users.id, userId));

    return true;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to update user banner', errMsg);
    throw errMsg;
  }
}

/**
 * Clear a user's banner image
 *
 * @note This function wraps updateUserBanner and clears the banner
 */
export async function clearUserBanner(userId: string): Promise<boolean> {
  return updateUserBanner(userId, '');
}

/**
 * Update a user's avatar image
 */
export async function updateUserAvatar(
  userId: string,
  avatar: string,
): Promise<boolean> {
  try {
    await db.update(users).set({ avatar }).where(eq(users.id, userId));

    return true;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Failed to update user avatar', errMsg);
    throw errMsg;
  }
}

/**
 * Clear a user's avatar image
 *
 * @note This function wraps updateUserAvatar and clears the avatar
 */
export async function clearUserAvatar(userId: string): Promise<boolean> {
  return updateUserAvatar(userId, '');
}
