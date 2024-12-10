import React from 'react';
import { redirect } from 'next/navigation';

import { getUserSession } from '@/lib/session';

import type { ProfilePageProps } from './_shared/profile-page-types';
import { UserProfileViewSkeleton } from './_shared/profile-skeletons';
import { UserPublicProfileView } from './_shared/shared-profile-banner-view';
import { getAndVerifyUserProfileDataAccessByUsername } from './_shared/shared-profile-data-retriever';

// export const runtime = 'edge';

async function PromiseUserProfileView({
  params,
  session,
}: {
  params: ProfilePageProps['params'];
  session: ProfilePageProps['session'];
}) {
  const userName = (await params).userName;

  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);

  const {
    userProfile,
    authUser,
    isProfilePublic,
    isAuthenticated,
    isAuthUserOwnProfile,
  } = profileData;

  if (!isProfilePublic) {
    if (!isAuthUserOwnProfile || !isAuthenticated) {
      redirect('/profile');
    }
  }

  return (
    <UserPublicProfileView
      userName={userName}
      userProfile={userProfile}
      authUser={authUser}
    />
  );
}

export default async function DefaultUserProfilePage(props: ProfilePageProps) {
  // const searchParams = await props.searchParams;
  // const params = await props.params;

  // const { children } = props;

  // console.log('**** props in default user profile page', {
  //   params,
  //   searchParams,
  //   children,
  // });
  const session = await getUserSession();
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
      <PromiseUserProfileView params={props.params} session={session} />
    </React.Suspense>
  );
}
