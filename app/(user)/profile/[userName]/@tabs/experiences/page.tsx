// // 'use cache';

import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { ExperienceCreateMenu } from '@/features/experiences/posts/experience-post-create-menu';
import { ViewUserProfileLazyPartialExperiences } from '@/features/experiences/posts/experience-posts';
import { UserExperiencePostsProvider } from '@/features/experiences/posts/experience-posts-provider';
import { sortExperiencesForUserProfilePage } from '@/features/experiences/utils/experience-utils';

import { isVideo } from '@/lib/media/media-utils';

import type {
  ProfilePageProps,
  ProfileTabProps,
} from '../../_shared/profile-page-types';
import {
  UserProfileExperiencesSkeleton,
  UserProfileTabsExerienceSectionSkeleton,
} from '../../_shared/profile-skeletons';
import { getAndVerifyUserProfileDataAccessByUsername } from '../../_shared/shared-profile-data-retriever';
import { UserProfileExperienceTabContent } from '../../_shared/shared-tabs-experiences-content';

import type { PartialExperienceModel } from '@/types/experiences';
import type { AppUser } from '@/types/next-auth';
import type { USER_PROFILE_MODEL } from '@/types/user';
import { siteConfig } from '@/config/site-base';
import { getAboutTitleTemplate } from '@/config/site-meta';

// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

// export const runtime = 'edge';

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

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
    profileUserBanner,
    profileDisplayName,
    profileUsername,
    profileAbsoluteUrl,
  } = profileData;

  const siteDescription = siteConfig.description;

  const ogProfileTitle = isProfilePublic
    ? profileDisplayName
    : // ? `Experiences and Challenges | ${profileDisplayName}`
      'Private Profile Experiences';

  const ogSiteTitle = getAboutTitleTemplate(ogProfileTitle, '-');
  const ogSiteDescription = siteDescription;

  const ogDescription =
    isProfilePublic && profileUserBio ? profileUserBio : siteDescription;

  const ogCreators =
    profileUsername && isProfilePublic ? [`@${profileUsername}`] : undefined;

  const ogUrl = profileAbsoluteUrl;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];
  const previousVideos = (await parent).openGraph?.videos || [];

  const ogImages =
    profileUserAvatar && isProfilePublic
      ? ([profileUserAvatar, ...previousImages] as typeof previousImages)
      : previousImages;

  const ogVideos =
    profileUserBanner && isVideo(profileUserBanner) && isProfilePublic
      ? ([profileUserBanner, ...previousVideos] as typeof previousVideos)
      : previousVideos;

  return {
    title: ogSiteTitle,
    description: ogSiteDescription,
    openGraph: {
      images: ogImages,
      videos: ogVideos,
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

export async function ExperiencesTabContentRenderPartialItems({
  userProfile,
  // authUser,
  items = [],
}: {
  items?: PartialExperienceModel[];
  userProfile: USER_PROFILE_MODEL;
  authUser?: AppUser;
}) {
  const { id: profileId } = userProfile;
  const profileUserExperiences =
    items.length > 0
      ? items
      : profileId
        ? await getPartialUserExperiencesForFrontend(profileId)
        : [];

  // Determine if the user has liked or bookmarked the experience and other derived properties
  const sortedProfileUserExperiences = sortExperiencesForUserProfilePage(
    profileUserExperiences
  );

  return (
    <ViewUserProfileLazyPartialExperiences
      truncateContent
      experiences={sortedProfileUserExperiences}
    />
  );
}

export async function ExperiencesTabContent({ userName }: ProfileTabProps) {
  // console.log(`**** props in experiences tab content`, { userName });
  // const profileData = await getAndVerifyUserProfileDataAccessByUsername(userName);
  // const { userProfile, authUser, isAuthUserOwnProfile } = profileData;
  // // console.log(`**** retrieved profileData`, profileData);
  const waitlistCount = await getCachedWaitlistCount();

  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);
  const {
    userProfile,
    profileDisplayName,
    // profileUserFirstName,
    // profileUserLastName,
    // authUser,
    // isAuthenticated,
    isAuthUserOwnProfile,
  } = profileData;

  const profileUserExperiencesCount = await getUserExperienceCountForFrontend(
    userProfile.id
  );

  const profileUserPartialExperiences =
    await getPartialUserExperiencesForFrontend(userProfile.id);

  return (
    <UserExperiencePostsProvider
      noServerSync
      experiences={[]}
      userProfile={userProfile}
      profileUserId={userProfile.id}
      profileUsername={userProfile.username || userName}
      profileUserDisplayName={profileDisplayName}
      // profileUserLastName={profileUserLastName}
      // profileUserFirstName={profileUserFirstName}
      isAuthUserOwnProfile={isAuthUserOwnProfile}
    >
      <UserProfileExperienceTabContent
        experiencesCount={profileUserExperiencesCount}
        partialExperiences={profileUserPartialExperiences}
        usersCount={waitlistCount}
      >
        <React.Suspense
          fallback={
            <UserProfileExperiencesSkeleton
              expCount={profileUserExperiencesCount}
              className="px-0"
            />
          }
        >
          <ExperiencesTabContentRenderPartialItems
            items={profileUserPartialExperiences}
            userProfile={userProfile}
          />
        </React.Suspense>
      </UserProfileExperienceTabContent>
      <ExperienceCreateMenu />
    </UserExperiencePostsProvider>
  );
}

export default async function ExperiencesTabPage(props: ProfilePageProps) {
  // const searchParams = await props.searchParams;
  // const params = await props.params;

  // const { children } = props;

  // console.log(`**** props in experiences tab page`, {
  //   params,
  //   searchParams,
  //   children,
  // });

  const userName = (await props.params).userName;

  return (
    <React.Suspense
      fallback={
        <UserProfileTabsExerienceSectionSkeleton
          noCtaBlock
          numberOfExperiences={3}
          experienceSkeletonClassName="p-0"
          className="p-0"
        />
      }
    >
      <ExperiencesTabContent userName={userName} />
    </React.Suspense>
  );
}
