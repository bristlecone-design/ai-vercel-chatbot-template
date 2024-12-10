import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { getCachedUserProfileExperiencesForFrontend } from '@/actions/experiences';
import {
  getCachedSinglePromptById,
  getCachedUserAllCompletedPrompts,
} from '@/actions/prompts';
import { getUserWaitlistCount } from '@/actions/user';
import { UserExperiencePostsProvider } from '@/features/experiences/posts/experience-posts-provider';
import {
  findPromptsExperience,
  mapPromptRecordToClientFriendlyVersion,
} from '@/features/experiences/utils/experience-prompt-utils';
import {
  mapExperiencesWithUserActions,
  sortExperiencesForUserProfilePage,
} from '@/features/experiences/utils/experience-utils';
import { ViewAllPromptChallenges } from '@/features/prompts/prompt-links';
import {
  ChallengePageViewSharedContent,
  ChallengePageViewSharedContentHeroContainer,
} from '@/features/prompts/prompt-shared-containers';
import {
  ViewPromptChallengeFormAuthenticated,
  ViewPromptChallengeFormPublic,
} from '@/features/prompts/view-prompt-challenge-form';
import PromptProvider, {
  DefaultSingleCurrentPromptStateKey,
  DefaultSinglePromptChallengeAcceptedStateKey,
} from '@/state/prompt-provider';

import { getUserFromSession } from '@/lib/session';
import { BlockSkeleton } from '@/components/ui/skeleton';

import { getPromptChallengeMetadataByPromptId } from '@/app/(user)/profile/[userName]/_shared/profile-metadata-utils';
import { getAndVerifyUserProfileDataAccessByUsername } from '@/app/(user)/profile/[userName]/_shared/shared-profile-data-retriever';

import type { ExperienceUserPromptModel } from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';

/**
 * No explicit revalidate value is set here, so the default value from the route segment config will be used. We can override this value here if we want to via @revalidateTag or @revalidatePath. @see actions/cache for helpers
 *
 * @note - This is a dynamic page that intercepts the single experience page. It fetches the experience data and user profile data and passes it to the SingleExperiencePost component.
 *
 * @note - Each data fetcher function caches the data in the cache for future use so we can revalidate at an atomic level as needed.
 *
 */

// Revalidate every x hours in seconds
// export const revalidate = 86400;

// Control what happens when a dynamic segment is visited that was not generated with generateStaticParams.
// export const dynamicParams = true // true | false,

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
// Force static rendering and cache the data of a layout or page by forcing cookies(), headers() and useSearchParams() to return empty values.
// export const dynamic = 'force-static';

/**
 * Partial Prerendering (PPR) enables you to combine static and dynamic components together in the same route.
 *
 * @see https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering
 */
// export const experimental_ppr = true;

interface ChallengeSinglePromptPageProps {
  children: React.ReactNode;
  params: Promise<{ promptId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: ChallengeSinglePromptPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { promptId } = params;

  const singlePromptAndMeta =
    await getPromptChallengeMetadataByPromptId(promptId);

  if (!singlePromptAndMeta.found) {
    // notFound();
  }

  const {
    title: promptTitle,
    description: promptDescription,
    openGraphUrl: promptUrl,
    authorFirstName: promptAuthorUsername,
    openGraphCreators,
    openGraphImages: ogImages,
    openGraphVideos: ogVideos,
  } = singlePromptAndMeta;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];
  const previousVideos = (await parent).openGraph?.videos || [];

  const promptOpenGraphImages = ogImages.length
    ? (ogImages as typeof previousImages)
    : previousImages;

  const promptOpenGraphVideos = ogVideos.length
    ? (ogVideos as typeof previousVideos)
    : previousVideos;

  return {
    title: promptTitle,
    description: promptDescription,
    openGraph: {
      title: promptTitle,
      url: promptUrl,
      description: promptDescription || undefined,
      images: promptOpenGraphImages,
      videos: promptOpenGraphVideos,
      creators: promptAuthorUsername ? [`@${promptAuthorUsername}`] : undefined,
    },
    twitter: {
      images: promptOpenGraphImages,
      title: promptTitle,
      description: promptDescription || undefined,
      // creator: '@prompt',
    },
  };
}

async function SingleChallengePageViewAuthenticated({
  promptId,
  username,
}: {
  promptId: string;
  username: string;
}) {
  const {
    found: promptFound,
    prompt,
    completedExperience,
  } = await getPromptChallengeMetadataByPromptId(promptId);

  // if (!singlePromptAndMeta.promptFound) {
  //   // notFound();
  // }

  const {
    // isAuthenticated,
    // isInPrivateBeta,
    // isProfilePublic,
    authUser,
    userProfile,
    isAuthUserOwnProfile,
  } = await getAndVerifyUserProfileDataAccessByUsername(username);

  const profileUserExperiences = await (isAuthUserOwnProfile && userProfile
    ? getCachedUserProfileExperiencesForFrontend(userProfile.id)
    : userProfile
      ? getCachedUserProfileExperiencesForFrontend(userProfile.id)
      : []);

  // Determine if the user has liked or bookmarked the experience and other derived properties
  const mappedProfileUserExperiences = sortExperiencesForUserProfilePage(
    (authUser?.id
      ? mapExperiencesWithUserActions(
          profileUserExperiences as ExperienceModel[],
          authUser.id
        )
      : profileUserExperiences) as ExperienceModel[]
  ) as ExperienceModel[];

  const mappedPrompt = prompt
    ? mapPromptRecordToClientFriendlyVersion(
        prompt as ExperienceUserPromptModel
      )
    : null;

  const userCompletedPromptChallenges = await getCachedUserAllCompletedPrompts(
    userProfile.id
  );

  const experiencePrompt = completedExperience
    ? completedExperience
    : mappedPrompt
      ? findPromptsExperience(
          mappedPrompt,
          mappedProfileUserExperiences,
          userProfile.id
        )
      : null;

  // const isPromptCompleted = userCompletedPromptChallenges?.some(
  //   (completedPrompt) => completedPrompt.id === promptId
  // );

  return (
    <PromptProvider
      isSingleView
      promptChallengeAccepted
      userSession={authUser}
      experiencePrompt={experiencePrompt}
      currentPrompt={mappedPrompt}
      currentPromptStateKey={DefaultSingleCurrentPromptStateKey}
      promptChallengeAcceptedStateKey={
        DefaultSinglePromptChallengeAcceptedStateKey
      }
      // userPrompts={userIncompletePromptChallenges}
      userCompletedPrompts={userCompletedPromptChallenges}
    >
      <UserExperiencePostsProvider
        experiences={mappedProfileUserExperiences}
        userProfile={userProfile}
        profileUserId={userProfile.id}
        profileUsername={userProfile.username || ''}
        isAuthUserOwnProfile={isAuthUserOwnProfile}
      >
        <ChallengePageViewSharedContent
          noPromptTicker={!promptFound}
          noPromptTooltip={!promptFound}
          noChildContainer={!promptFound}
          defaultPromptChallenge={mappedPrompt}
          title={!promptFound ? 'But you got lost...' : undefined}
          heroClassName={
            !promptFound
              ? 'h-full justify-start sm:justify-center pt-24 sm:pt-0'
              : undefined
          }
          caption={!promptFound && <ViewAllPromptChallenges />}
        >
          {promptFound && <ViewPromptChallengeFormAuthenticated focusOnMount />}
        </ChallengePageViewSharedContent>
      </UserExperiencePostsProvider>
    </PromptProvider>
  );
}

async function SingleChallengePageViewPublic({
  promptId,
}: {
  promptId: string;
}) {
  const singlePromptAndMeta =
    await getPromptChallengeMetadataByPromptId(promptId);

  const promptFound = singlePromptAndMeta.found;

  // if (!promptFound) {
  //   // notFound();
  // }

  const waitlistCount = await getUserWaitlistCount();

  const prompt = (await getCachedSinglePromptById(
    promptId
  )) as ExperienceUserPromptModel;

  const mappedPrompt = prompt
    ? mapPromptRecordToClientFriendlyVersion(prompt)
    : null;

  // Don't need to pass any props to the PromptProvider since this is a public view
  return (
    <PromptProvider
      key={`public-prompt-${promptId}`}
      isSingleView
      promptChallengeAccepted
      currentPrompt={mappedPrompt}
      currentPromptStateKey={DefaultSingleCurrentPromptStateKey}
      promptChallengeAcceptedStateKey={
        DefaultSinglePromptChallengeAcceptedStateKey
      }
    >
      <ChallengePageViewSharedContent
        noPromptTicker={!promptFound}
        noPromptTooltip={!promptFound}
        title={!promptFound ? 'But you hit a snag...' : undefined}
        heroClassName={
          !promptFound
            ? 'h-full justify-start sm:justify-center pt-24 sm:pt-0'
            : undefined
        }
        caption={!promptFound && <ViewAllPromptChallenges />}
      >
        {promptFound && (
          <ViewPromptChallengeFormPublic
            waitlistCount={waitlistCount}
            focusOnMount={false}
          />
        )}
      </ChallengePageViewSharedContent>
    </PromptProvider>
  );
}

export default async function ChallengeSinglePromptPage(
  props: ChallengeSinglePromptPageProps
) {
  const { promptId } = await props.params;

  const userSession = await getUserFromSession();
  const username = userSession?.username ?? '';

  return (
    <React.Suspense
      fallback={
        <ChallengePageViewSharedContentHeroContainer className="relative bg-secondary">
          <div className="flex size-full flex-col items-center justify-start gap-8 py-4 md:py-8">
            <BlockSkeleton className="h-16 w-4/5" />
            <BlockSkeleton className="h-12 w-4/5" />
            <BlockSkeleton className="h-8 w-2/5" />
            <BlockSkeleton className="h-8 w-3/5" />
          </div>
        </ChallengePageViewSharedContentHeroContainer>
      }
    >
      {username && (
        <SingleChallengePageViewAuthenticated
          username={username}
          promptId={promptId}
        />
      )}
      {!username && <SingleChallengePageViewPublic promptId={promptId} />}
    </React.Suspense>
  );
}
