import type React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { redirect } from 'next/navigation';
import { UserProfileProvider } from '@/features/profile/user-profile-provider';

import { DiscoveryBgImageContainer } from '@/components/bg-image-random-client';
import { PrimaryContentContainer } from '@/components/layout-containers';

import type { ProfilePageProps } from './_shared/profile-page-types';
import { getAndVerifyUserProfileDataAccessByUsername } from './_shared/shared-profile-data-retriever';
import SharedTabsContainer from './_shared/shared-tabs-content';

import { siteConfig } from '@/config/site-base';
import { getAboutTitleTemplate } from '@/config/site-meta';

// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

// export const runtime = 'edge';

/**
 * Partial Prerendering (PPR) enables you to combine static and dynamic components together in the same route.
 *
 * @see https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering
 */
// export const experimental_ppr = true;

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
    // userProfile,
    // authUser,
    isProfilePublic,
    isAuthenticated,
    isAuthUserOwnProfile,
    profileUserFirstName,
    profileUserBio,
    profileUserAvatar,
    profileDisplayName,
    profileUsername,
    profileAbsoluteUrl,
  } = profileData;

  const siteDescription = siteConfig.description;

  const ogProfileTitle = isProfilePublic
    ? profileDisplayName
    : 'Private Profile';

  const ogSiteTitle = getAboutTitleTemplate(ogProfileTitle);
  const ogSiteDescription = siteDescription;

  const ogDescription =
    isProfilePublic && profileUserBio ? profileUserBio : siteDescription;

  const ogCreators =
    profileUsername && isProfilePublic ? [`@${profileUsername}`] : undefined;

  const ogUrl = profileAbsoluteUrl;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  const ogImages =
    profileUserAvatar && isProfilePublic
      ? [profileUserAvatar, ...previousImages]
      : previousImages;

  return {
    title: ogSiteTitle,
    description: ogSiteDescription,
    openGraph: {
      images: ogImages,
      title: ogSiteTitle || undefined,
      description: ogDescription,
      url: ogUrl,
      creators: ogCreators,
    },
    twitter: {
      images: ogImages,
      title: ogSiteTitle || undefined,
      description: ogDescription,
    },
  };
}

export default async function Layout(
  props: ProfilePageProps & {
    tabs: React.ReactNode;
  }
) {
  // const searchParams = await props.searchParams;
  // const params = await props.params;

  // console.log(`**** props in main username profile layout file`, {
  //   params,
  //   searchParams,
  //   children,
  //   tabs,
  // });

  const userName = (await props.params).userName;

  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);

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

  if (!isProfilePublic) {
    if (!isAuthUserOwnProfile || !isAuthenticated) {
      redirect('/profile');
    }
  }

  const { children, tabs } = props;

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
          <SharedTabsContainer>{tabs}</SharedTabsContainer>
        </PrimaryContentContainer>
      </DiscoveryBgImageContainer>
    </UserProfileProvider>
  );
}
