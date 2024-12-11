import { redirect } from 'next/navigation';
import { UserProfileProvider } from '@/features/profile/user-profile-provider';

import { getUserFromSession } from '@/lib/session';
import { DiscoveryBgImageContainer } from '@/components/bg-image-random-client';
import { PrimaryContentContainer } from '@/components/layout-containers';

import { getAndVerifyUserProfileDataAccessByUsername } from '../[userName]/_shared/shared-profile-data-retriever';

import type { CommonPageProps } from '@/types/page';

export default async function Layout(props: CommonPageProps) {
  const searchParams = await props.searchParams;

  const { children } = props;

  const userSession = await getUserFromSession();
  if (!userSession || !userSession.username) {
    console.warn('**** user session not found', { userSession });
    return redirect('/');
  }

  const { username } = userSession;

  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(username);

  const {
    authUser,
    userProfile,
    isProfilePublic,
    isAuthenticated,
    isAuthUserOwnProfile,
    isInPrivateBeta,
    profileUserFirstName,
    // profileDisplayName,
  } = profileData;

  return (
    <UserProfileProvider
      userProfile={userProfile}
      isAuthUserOwnProfile={isAuthUserOwnProfile}
      isAuthenticated={isAuthenticated}
      isProfilePublic={isProfilePublic}
      isInPrivateBeta={isInPrivateBeta}
    >
      <DiscoveryBgImageContainer noFullSize className="">
        <PrimaryContentContainer
          className="z-auto"
          innerContainerClassName="bg-background text-foreground sm:rounded-2xl relative p-0 sm:p-4 overflow-clip"
        >
          {children}
        </PrimaryContentContainer>
      </DiscoveryBgImageContainer>
    </UserProfileProvider>
  );
}
