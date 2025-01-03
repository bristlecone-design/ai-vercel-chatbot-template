import React from 'react';

import { getUserPublicFeaturedImgsWithExifAndBlurData } from '@/lib/db/queries/media/get-featured-imgs';
import { getUserWaitlistCount } from '@/lib/db/queries/user';

import type {
  ProfilePageProps,
  ProfileTabProps,
} from '../../_shared/profile-page-types';
import { UserProfileTabsDiscoveriesSectionSkeleton } from '../../_shared/profile-skeletons';
import { getAndVerifyUserProfileDataAccessByUsername } from '../../_shared/shared-profile-data-retriever';
import { UserProfileDiscoveriesTabContent } from '../../_shared/shared-tabs-discoveries-content';
import type { UserProfileExperienceTabContentProps } from '../../_shared/shared-tabs-experiences-content';

// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

export type ExperiencesTabContentProps = ProfileTabProps &
  UserProfileExperienceTabContentProps & {};

export async function DiscoveriesTabContent({ userName }: ProfileTabProps) {
  // console.log(`**** props in experiences tab content`, { userName });
  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);
  const { userProfile } = profileData;
  // console.log(`**** retrieved profileData`, profileData);

  const waitlistCount = await getUserWaitlistCount();

  const userFeaturedAssets = await getUserPublicFeaturedImgsWithExifAndBlurData(
    userProfile.id,
    true // Retrieve cached data
  );

  return (
    <UserProfileDiscoveriesTabContent
      mediaAssets={userFeaturedAssets}
      usersCount={waitlistCount}
    />
  );
}

export default async function DiscoveriesTabPage(props: ProfilePageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { children } = props;

  // console.log("**** props in discoveries tab page", {
  //   params,
  //   searchParams,
  //   children,
  // });
  const { userName } = params;

  return (
    <React.Suspense fallback={<UserProfileTabsDiscoveriesSectionSkeleton />}>
      <DiscoveriesTabContent userName={userName} />
    </React.Suspense>
  );
}
