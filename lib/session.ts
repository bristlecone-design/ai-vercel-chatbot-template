'use server';

import type { Session } from 'next-auth';

import 'next/cache';

import fetcher from './fetcher';
import { getBaseUrl } from './getBaseUrl';

import { auth } from '@/app/(auth)/auth';
import { removeTrailingParamFromImageUrl } from '@/app/(auth)/utils-client';
import type { USER_PROFILE_MODEL } from '@/types/user';

export async function getUserSession(): Promise<Session | undefined> {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return undefined;
  }

  const mappedSession = {
    ...session,
    user: {
      ...user,
      image: removeTrailingParamFromImageUrl(user?.image as string | undefined),
      id: user.id,
    },
    // id: user?.id || token?.id,
  };

  return mappedSession as Session;
}

export async function getUserFromSession(): Promise<
  Session['user'] | undefined
> {
  const session = await getUserSession();
  return session?.user;
}

export async function fetchUserProfileFromDb(
  userId: string,
  apiPath = '/api/user/profile',
): Promise<USER_PROFILE_MODEL | undefined> {
  // 'use cache';

  // cacheTag(
  //   userId,
  //   CACHE_KEY_USER_PROFILE,
  //   `${userId}-${CACHE_KEY_USER_PROFILE}`
  // );

  // cacheLife('default');

  const baseUrl = getBaseUrl();
  const finalUrl = `${baseUrl}${apiPath}/${userId}`;

  const response = await fetcher<{ user: USER_PROFILE_MODEL }>(finalUrl, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  if (!response.user) {
    return undefined;
  }

  return response.user;
}
