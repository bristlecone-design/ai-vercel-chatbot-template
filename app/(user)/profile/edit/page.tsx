import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserProfileForm } from '@/features/profile/user-profile-form';

import { getBaseUrl } from '@/lib/getBaseUrl';
import { getUserFromSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import { Prose } from '@/components/prose';

import { UserProfileViewSkeleton } from '../[userName]/_shared/profile-skeletons';
import { UserPublicProfileView } from '../[userName]/_shared/shared-profile-banner-view';
import { getAndVerifyUserProfileDataAccessByUsername } from '../[userName]/_shared/shared-profile-data-retriever';

import type { CommonPageProps } from '@/types/page';

// export const maxDuration = 300;

// export const runtime = 'nodejs';

// Revalidate every x-time (in seconds)
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
// export const revalidate = 60; // 1 minute

export async function generateMetadata(
  props: CommonPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // const searchParams = await props.searchParams;
  const userSession = await getUserFromSession();
  // console.log(`**** user session`, { userSession });

  if (!userSession || !userSession.username) {
    console.warn('**** user session not found', { userSession });
    return redirect('/profile');
  }

  const username = userSession.username;
  const { userProfile, authUser, isAuthUserOwnProfile } =
    await getAndVerifyUserProfileDataAccessByUsername(username);

  if (!userProfile) {
    redirect('/lost');
  }

  if (!isAuthUserOwnProfile) {
    console.warn('**** user profile id does not match session user id', {
      userProfileId: userProfile.id,
      sessionUserId: authUser?.id,
    });
    redirect('/profile');
  }

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  const title = 'Edit Profile';

  return {
    title: title,
    openGraph: {
      images: previousImages,
      title: title,
      url: `${getBaseUrl()}/profile/edit`,
    },
  };
}

export default async function UserProfileEditPage(props: CommonPageProps) {
  const searchParams = await props.searchParams;
  const userSession = await getUserFromSession();
  // console.log('**** user session', { userSession });

  if (!userSession || !userSession.username) {
    console.warn('**** user session not found', { userSession });
    return redirect('/profile');
  }

  const username = userSession.username;
  const { userProfile, authUser, isAuthUserOwnProfile } =
    await getAndVerifyUserProfileDataAccessByUsername(username);

  if (!userProfile) {
    redirect('/lost');
  }

  if (!isAuthUserOwnProfile) {
    console.warn('**** user profile id does not match session user id', {
      userProfileId: userProfile.id,
      sessionUserId: authUser?.id,
    });
    redirect('/profile');
  }

  return (
    <React.Suspense
      fallback={
        <UserProfileViewSkeleton
          noExperiences
          noTabContent
          numberOfExperiences={0}
        />
      }
    >
      <UserPublicProfileView
        noShowBio
        noShowInterests
        noShowProfessions
        userName={username}
      >
        <Prose className={cn('w-full max-w-full py-8 prose-img:my-0')}>
          <h2 className="flex items-start justify-between gap-2.5 sm:items-center">
            Edit Profile
          </h2>
          <p>
            Your profile is used to personalize your{' '}
            <Link href="/" className="link-primary">
              discovery experience
            </Link>{' '}
            on the platform.
          </p>
          <UserProfileForm
            noTitle
            noSaveBtn
            userProfile={userProfile}
            // formRef={formRef}
            // disabled={isFormProcessing || experienceCreated}
            // handleOnComplete={handleOnCreateExperienceComplete}
            inputClassName="text-foreground/80"
            // handleOnUpdateSuccess={handleOnUpdateSuccess}
          />
        </Prose>
      </UserPublicProfileView>
    </React.Suspense>
  );
}
