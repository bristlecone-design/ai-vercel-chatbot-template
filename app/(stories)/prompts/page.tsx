import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { ExperienceCreateMenuPublic } from '@/features/experiences/posts/experience-post-create-menu-public';
import { UserExperiencePostsProvider } from '@/features/experiences/posts/experience-posts-provider';
import {
  ChallengePageViewSharedContent,
  ChallengePageViewSharedContentHeroContainer,
} from '@/features/prompts/prompt-shared-containers';
import {
  ViewPromptChallengeFormAuthenticated,
  ViewPromptChallengeFormPublic,
} from '@/features/prompts/view-prompt-challenge-form';
import PromptProvider from '@/state/prompt-provider';
import type { Session } from 'next-auth';

import {
  getUserAllCompletedPrompts,
  getUserIncompletePrompts,
} from '@/lib/db/queries/prompts';
import { getCachedUserWaitlistCount } from '@/lib/db/queries/user';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { getUserFromSession } from '@/lib/session';
import { BlockSkeleton } from '@/components/ui/skeleton';

import { getAndVerifyUserProfileDataAccessByUsername } from '@/app/(user)/profile/[userName]/_shared/shared-profile-data-retriever';

import type { ExperienceModel } from '@/types/experiences';
import type { CommonPageProps } from '@/types/page';

// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

interface ChallengePageProps {
  children: React.ReactNode;
}

export async function generateMetadata(
  props: CommonPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // const searchParams = props.searchParams;
  const previousImages = (await parent).openGraph?.images || [];
  const ogImages = [...previousImages];

  const title = 'Prompt Challenges';
  const description =
    'A fun way to share — and flex 💪🏽 — what you know about Nevada and learn from others.';
  const url = `${getBaseUrl()}/prompts`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: ogImages,
    },
    twitter: {
      title,
      description,
      images: ogImages,
      // creator: '@prompt',
    },
  };
}

async function ChallengePageViewAuthenticated({
  username,
  session,
}: {
  username: string;
  session?: Session;
}) {
  const {
    userProfile,
    authUser,
    isAuthUserOwnProfile,
    // isAuthenticated,
    // isInPrivateBeta,
    // isProfilePublic,
  } = await getAndVerifyUserProfileDataAccessByUsername(username, session);

  // const profileUserExperiences = await (isAuthUserOwnProfile && userProfile
  //   ? getCachedUserProfileExperiencesForFrontend(userProfile.id)
  //   : userProfile
  //     ? getCachedUserProfileExperiencesForFrontend(userProfile.id)
  //     : []);

  // // Determine if the user has liked or bookmarked the experience and other derived properties
  // const mappedProfileUserExperiences = sortExperiencesForUserProfilePage(
  //   (authUser && authUser.id
  //     ? mapExperiencesWithUserActions(
  //         profileUserExperiences as ExperienceModel[],
  //         authUser.id
  //       )
  //     : profileUserExperiences) as ExperienceModel[]
  // );

  const userCompletedPromptChallenges = await getUserAllCompletedPrompts(
    userProfile.id
  );

  const userIncompletePromptChallenges = await getUserIncompletePrompts(
    userProfile.id
  );

  // Derive experiences from user's completed prompt challenges since each prompt challenge is an experience
  const userExperiencesFromCompletedPrompts = (
    userCompletedPromptChallenges?.length
      ? userCompletedPromptChallenges
          .map((promptChallenge) => {
            return promptChallenge.Experience;
          })
          .filter(Boolean)
      : []
  ) as ExperienceModel[];

  // console.log(
  //   `***** userExperiencesFromCompletedPrompts`,
  //   JSON.stringify(userExperiencesFromCompletedPrompts, null, 2)
  // );

  return (
    <PromptProvider
      userSession={authUser}
      // userPrompts={userIncompletePromptChallenges}
      userPrompts={[]}
      userCompletedPrompts={userCompletedPromptChallenges}
    >
      <UserExperiencePostsProvider
        noServerSync
        experiences={userExperiencesFromCompletedPrompts}
        userProfile={userProfile}
        profileUserId={userProfile.id}
        profileUsername={userProfile.username || ''}
        isAuthUserOwnProfile={isAuthUserOwnProfile}
      >
        <ChallengePageViewSharedContent>
          <ViewPromptChallengeFormAuthenticated focusOnMount />
        </ChallengePageViewSharedContent>
        {/* <ExperienceCreateMenu /> */}
      </UserExperiencePostsProvider>
    </PromptProvider>
  );
}

async function ChallengePageViewPublic() {
  const waitlistCount = await getCachedUserWaitlistCount();
  return (
    // Don't need to pass any props to the PromptProvider since this is a public view
    <PromptProvider>
      <ChallengePageViewSharedContent>
        <ViewPromptChallengeFormPublic
          waitlistCount={waitlistCount}
          focusOnMount={false}
        />
      </ChallengePageViewSharedContent>
      <ExperienceCreateMenuPublic />
    </PromptProvider>
  );
}

export default async function ChallengePage(props: ChallengePageProps) {
  const userSession = await getUserFromSession();
  const username = userSession?.username ?? '';

  return (
    <React.Suspense
      fallback={
        <>
          <ChallengePageViewSharedContentHeroContainer className="relative bg-secondary">
            <div className="flex size-full flex-col items-center justify-start gap-8 py-4 md:py-8">
              <BlockSkeleton className="h-16 w-4/5" />
              <BlockSkeleton className="h-12 w-4/5" />
              <BlockSkeleton className="h-8 w-2/5" />
              <BlockSkeleton className="h-8 w-3/5" />
            </div>
          </ChallengePageViewSharedContentHeroContainer>
          <div className="relative mx-auto flex w-full flex-col gap-8 py-4 sm:max-w-xl sm:py-8">
            <div className="flex w-full flex-col gap-3">
              <BlockSkeleton className="h-20 w-full" />
              <div className="flex h-6 w-full justify-between gap-2">
                <BlockSkeleton className="h-full w-4/5" />
                <BlockSkeleton className="h-full w-2/5" />
              </div>
            </div>
            <div className="grid w-full grid-cols-4 gap-2">
              <BlockSkeleton className="size-32" />
              <BlockSkeleton className="size-32" />
              <BlockSkeleton className="size-32" />
              <BlockSkeleton className="size-32" />
            </div>
            <div className="flex h-8 w-full justify-between gap-2">
              <BlockSkeleton className="w-1/5" />
              <BlockSkeleton className="w-2/5" />
            </div>
            <BlockSkeleton className="h-10 w-full" />
          </div>
        </>
      }
    >
      {username && <ChallengePageViewAuthenticated username={username} />}
      {!username && <ChallengePageViewPublic />}
    </React.Suspense>
  );
}
