'use server';

import { getCachedUserProfileByUsername } from '@/actions/user';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';

import { getUserSession } from '@/lib/session';

import { mapAndInferAuthAndProfileProps } from './profile-shared-utils';

export async function getAndVerifyUserProfileDataAccessByUsername(
  userName: string,
  authSession?: Session | undefined,
  noAccessRedirect = '/',
) {
  const session = authSession ?? (await getUserSession());
  const userProfile = await getCachedUserProfileByUsername(userName);

  if (!userProfile) {
    redirect('/lost');
  }

  const {
    authUser,
    isProfilePublic,
    isInPrivateBeta,
    isAuthenticated,
    isAuthUserOwnProfile,
    profileUserFirstName,
    profileUserLastName,
    profileUserAvatar,
    profileUserBanner,
    profileUsername,
    profileUserBio,
    profileUserProfession,
    profileUserInterests,
    profileDisplayName,
    profileAbsoluteUrl,
    profileRelativeUrl,
  } = mapAndInferAuthAndProfileProps(session?.user, userProfile);

  if (!isProfilePublic) {
    if (!isAuthUserOwnProfile || !isAuthenticated) {
      redirect(noAccessRedirect);
    }
  }

  return {
    session,
    userProfile,
    authUser,
    isProfilePublic,
    isInPrivateBeta,
    isAuthenticated,
    isAuthUserOwnProfile,
    profileUserFirstName,
    profileUserLastName,
    profileUserAvatar,
    profileUserBanner,
    profileUsername,
    profileUserBio,
    profileUserProfession,
    profileUserInterests,
    profileDisplayName,
    profileAbsoluteUrl,
    profileRelativeUrl,
  };
}
