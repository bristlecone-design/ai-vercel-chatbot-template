import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { redirect } from 'next/navigation';
import { getCachedUserProfileByUsername } from '@/actions/user';

import { getUserSession } from '@/lib/session';

import { signOutAndRedirectAction } from '@/app/(auth)/auth-edge';

import { getUserProfileMetadataAssets } from './_shared/profile-metadata-utils';
import type { ProfilePageProps } from './_shared/profile-page-types';
import { UserProfileViewSkeleton } from './_shared/profile-skeletons';
import { UserPublicProfileView } from './_shared/shared-profile-banner-view';
import { getAndVerifyUserProfileDataAccessByUsername } from './_shared/shared-profile-data-retriever';

export const maxDuration = 300;

// export const runtime = 'edge';

// Revalidate every x-time (in seconds)
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

export async function generateMetadata(
  props: ProfilePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // const searchParams = await props.searchParams;
  const params = await props.params;
  const { userName } = params;

  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);

  const {
    userProfile,
    // authUser,
    isProfilePublic,
    isAuthenticated,
    isAuthUserOwnProfile,
  } = profileData;

  if (!isProfilePublic) {
    if (!isAuthUserOwnProfile || !isAuthenticated) {
      redirect('/profile');
    }
  }

  const {
    opengraphAssets,
    description: profileDescription,
    title: profileTitle,
    url: profileUrl,
  } = await getUserProfileMetadataAssets(userProfile);

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: profileTitle,
    description: profileDescription,
    openGraph: {
      images: opengraphAssets.length
        ? [...opengraphAssets, ...previousImages]
        : previousImages,
      title: profileTitle,
      description: profileDescription || undefined,
      url: profileUrl,
    },
    twitter: {
      images: opengraphAssets.length
        ? [...opengraphAssets, ...previousImages]
        : previousImages,
      title: profileTitle,
      description: profileDescription || undefined,
    },
  };
}

async function PromisedUserPublicProfilePage(props: ProfilePageProps) {
  // const searchParams = await props.searchParams;
  const params = await props.params;
  const session = await getUserSession();
  // Show the teaser dialog if the user is not logged in

  if (session?.blocked) {
    await signOutAndRedirectAction();
  }

  const { userName } = params;
  const userProfile = await getCachedUserProfileByUsername(userName);

  if (!userProfile) {
    redirect('/lost');
  }

  const authUser = session?.user;

  const isProfilePublic = userProfile.public;

  const isAuthenticated = Boolean(authUser);

  const isAuthUserOwnProfile = authUser
    ? String(authUser.id) === String(userProfile.id)
    : false;

  if (!isProfilePublic) {
    if (!isAuthUserOwnProfile || !isAuthenticated) {
      redirect('/profile');
    }
  }

  // console.log(`**** user data in user public profile root page`, {
  //   userName,
  //   userProfile,
  //   authUser,
  // });

  return (
    <UserPublicProfileView
      userName={userName}
      userProfile={userProfile}
      authUser={authUser}
    />
  );
}

export default async function UserProfilePage(props: ProfilePageProps) {
  // const searchParams = await props.searchParams;
  // const params = await props.params;

  // const { children } = props;

  // console.log('**** props in default user profile page', {
  //   params,
  //   searchParams,
  //   children,
  // });
  // const session = await getUserSession();
  // Show the teaser dialog if the user is not logged in

  return (
    <React.Suspense
      fallback={
        <UserProfileViewSkeleton
          noExperiences
          noTabSelectors
          noTabContent
          numberOfExperiences={1}
        />
      }
    >
      <PromisedUserPublicProfilePage {...props} />
    </React.Suspense>
  );
}
