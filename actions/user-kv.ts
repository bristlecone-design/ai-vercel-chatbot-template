import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

import { getErrorMessage } from '@/lib/errors';

import type { USER_MODEL } from '@/types/user';

export async function addUser(
  userId: string,
  payload: Partial<USER_MODEL> = {},
): Promise<boolean> {
  try {
    const addRes = await kv.hmset(`users:${userId}`, {
      ...payload,
    });

    await kv.zadd('users', {
      score: Date.now(),
      member: `users:${userId}`,
    });

    return addRes === 'OK';
  } catch (e) {
    console.error('Error in addUser', getErrorMessage(e));
    return false;
  }
}

export async function getUser(
  userId: string,
  keysToOmit: string[] = [],
): Promise<USER_MODEL | undefined> {
  const record = (await kv.hgetall(`users:${userId}`)) as unknown;

  if (!record) {
    return undefined;
  }

  const user = record as Record<string, any>;

  if (keysToOmit.length) {
    for (const key of keysToOmit) {
      if (user[key]) {
        delete user[key];
      }
    }
  }

  if (!user.id) {
    user.id = userId;
  }

  return user as unknown as USER_MODEL;
}

export const DEFAULT_KEYS_TO_OMIT = ['password', 'salt'];

export async function getUserProfile(
  userId: string,
  keysToOmit: string[] = DEFAULT_KEYS_TO_OMIT,
): Promise<USER_MODEL | undefined> {
  return getUser(userId, keysToOmit);
}

/**
 * Update a user
 */
export async function updateUser(
  userId: string,
  payload: Partial<USER_MODEL> = {},
): Promise<boolean> {
  try {
    const updateRes = await kv.hmset(`users:${userId}`, payload);
    return updateRes === 'OK';
  } catch (error) {
    console.error('updateUser error', getErrorMessage(error));
    return false;
  }
}

enum ResultCode {
  Updated = 'Updated',
  NotUpdated = 'NotUpdated',
}

interface Result {
  type: string;
  resultCode: ResultCode;
}

/**
 * Update user and flag the onboarded flag as true (aka: complete)
 */
export async function updateUserOnboarded(
  _prevState: Result | undefined,
  formData: FormData,
): Promise<Result | undefined> {
  const userId = formData.get('userId') as string;
  const name = formData.get('email') as string;
  const email = formData.get('password') as string;
  const organization = formData.get('organization') as string;
  const expertise = formData.get('expertise') as string;
  const interests = formData.get('interests') as string;
  const location = formData.get('location') as string;

  try {
    const updatePayload = {
      name,
      email,
      organization,
      expertise,
      interests,
      location,
      onboarded: true,
    };
    // console.log(`updatePayload in updateUserOnboarded`, updatePayload);

    const updateRes = await fetch('/api/user/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...updatePayload,
      }),
    });

    const response = await updateRes.json();

    return {
      type: 'success',
      resultCode: response.updated ? ResultCode.Updated : ResultCode.NotUpdated,
    };
  } catch (error) {
    console.error('updateUserOnboarded error', getErrorMessage(error));
    return {
      type: 'error',
      resultCode: ResultCode.NotUpdated,
    };
  }
}

type GET_ALL_USERS_PROPS = {
  [key: string]: any;
};

/**
 * Get all users
 */
export async function getAllUsers(
  props?: GET_ALL_USERS_PROPS,
): Promise<USER_MODEL[]> {
  try {
    const pipeline = kv.pipeline();
    const users: string[] = await kv.zrange('users', 0, -1);

    for (const user of users) {
      pipeline.hgetall(user);
    }

    const results = await pipeline.exec();

    // console.log(`results`, results);
    return results.filter(Boolean) as Array<USER_MODEL>;
  } catch (error) {
    console.error('getAllUsers error', getErrorMessage(error));
    return [];
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
    const deleteRes = await kv.del(`users:${userId}`);
    await kv.zrem('users', `users:${userId}`);
    return deleteRes === 1;
  } catch (error) {
    console.error('deleteUser error', getErrorMessage(error));
    return false;
  }
}

/**
 * Toggle the "allowed" status of a user
 *
 * @param userId
 * @param allowed - whether the user is allowed
 *
 * @returns boolean - whether the operation was successful
 */
export async function toggleUserAllowedAccess(
  userId: string,
  allowed: boolean,
  path?: string,
): Promise<boolean> {
  try {
    console.log('toggleUserAllowed invoked', userId, allowed, path);
    const user = await getUser(userId);
    console.log('user found??', user);

    if (!user) {
      return false;
    }

    const updatedUser = {
      ...user,
      allowed,
    };

    const updateRes = await kv.hmset(`users:${userId}`, updatedUser);

    if (path && updateRes === 'OK') {
      revalidatePath(path);
    }

    return updateRes === 'OK';
  } catch (error) {
    console.error('toggleUserAllowed error', getErrorMessage(error));
    return false;
  }
}

/**
 * Get 'allowed' key for a user
 *
 * @param userId
 *
 * @returns boolean - whether the user is allowed
 */
export async function getUserAllowed(userId: string): Promise<boolean> {
  const user = await getUser(userId);

  if (!user) {
    return false;
  }

  return user.allowed === true;
}
