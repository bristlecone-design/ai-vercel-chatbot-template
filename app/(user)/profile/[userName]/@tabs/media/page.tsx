import React from 'react';
import { getUserPublicFeaturedImgsWithExifAndBlurData } from '@/actions/media/get-featured-imgs';

import type {
  ProfilePageProps,
  ProfileTabProps,
} from '../../_shared/profile-page-types';
import { UserProfileTabsMediaSectionSkeleton } from '../../_shared/profile-skeletons';
import { getAndVerifyUserProfileDataAccessByUsername } from '../../_shared/shared-profile-data-retriever';
import { UserProfileMediaTabContent } from '../../_shared/shared-tabs-media-content';

// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

export async function MediaTabContent({ userName }: ProfileTabProps) {
  // console.log(`**** props in experiences tab content`, { userName });
  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);
  const { userProfile } = profileData;
  // console.log(`**** retrieved profileData`, profileData);

  const waitlistCount = await getCachedWaitlistCount();

  const userFeaturedAssets = await getUserPublicFeaturedImgsWithExifAndBlurData(
    userProfile.id,
    true // Retrieve cached data
  );

  return (
    <UserProfileMediaTabContent
      mediaAssets={userFeaturedAssets}
      usersCount={waitlistCount}
    />
  );
}

export default async function ExperiencesTabPage(props: ProfilePageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { children } = props;

  // console.log("**** props in experiences tab page", {
  //   params,
  //   searchParams,
  //   children,
  // });
  const { userName } = params;

  return (
    <React.Suspense fallback={<UserProfileTabsMediaSectionSkeleton />}>
      <MediaTabContent userName={userName} />
    </React.Suspense>
  );
}
