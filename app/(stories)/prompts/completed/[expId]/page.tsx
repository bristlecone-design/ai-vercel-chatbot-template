import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { getCachedMediaByExperienceId } from '@/actions/media/get-core-media';
import { getCachedPromptCollaboratorByExpId } from '@/actions/prompts';
import { ExperienceCreateMenuPublic } from '@/features/experiences/posts/experience-post-create-menu-public';
import {
  mapPromptCollaboratorToPrompt,
  mapPromptModelToExperienceModel,
} from '@/features/experiences/utils/experience-prompt-utils';
import { ViewAllPromptChallenges } from '@/features/prompts/prompt-links';
import {
  ChallengePageViewSharedContent,
  ChallengePageViewSharedContentHeroContainer,
} from '@/features/prompts/prompt-shared-containers';
import { ViewCompletedPromptMisc } from '@/features/prompts/view-completed-prompt-misc';
import PromptProvider, {
  DefaultSingleCurrentPromptStateKey,
  DefaultSinglePromptChallengeAcceptedStateKey,
} from '@/state/prompt-provider';

import { getUserFromSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import { BlockSkeleton } from '@/components/ui/skeleton';

import { getUserCompletedPromptMetadataByExpId } from '@/app/(user)/profile/[userName]/_shared/profile-metadata-utils';
import { getAndVerifyUserProfileDataAccessByUsername } from '@/app/(user)/profile/[userName]/_shared/shared-profile-data-retriever';

import type { GeneratedExperienceUserPrompt } from '@/types/experience-prompts';
import type { ExperienceMediaModel } from '@/types/experiences';

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

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

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

interface SingleCompletedPromptPageProps {
  children: React.ReactNode;
  params: Promise<{ expId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: SingleCompletedPromptPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { expId } = params;

  const promptMetadata = await getUserCompletedPromptMetadataByExpId(expId);

  const {
    id: promptId,
    title: promptTitle,
    description: promptDescription,
    authorUsername: promptAuthorUsername,
    url: promptUrl,
    opengraphAssets,
  } = promptMetadata;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  const promptOpenGraphImages = opengraphAssets.length
    ? opengraphAssets
    : previousImages;

  return {
    title: promptTitle,
    description: promptDescription,
    openGraph: {
      images: promptOpenGraphImages,
      title: promptTitle,
      description: promptDescription || undefined,
      url: promptUrl,
      creators: promptAuthorUsername ? [`@${promptAuthorUsername}`] : undefined,
    },
    twitter: {
      images: promptOpenGraphImages,
      title: promptTitle,
      description: promptDescription || undefined,
    },
  };
}

async function getRequestedCompletionPrompt(expId: string) {
  const userCompletedPromptCollaboration =
    await getCachedPromptCollaboratorByExpId(expId);

  if (!userCompletedPromptCollaboration) {
    console.warn(`No user completed prompt found for expId: ${expId}`);
    return null;
  }

  // If the user has completed the prompt challenge, but the experience media is missing from the payload, then fetch the media
  if (
    userCompletedPromptCollaboration.Experience &&
    !userCompletedPromptCollaboration.Experience.Media
  ) {
    const expMedia = await getCachedMediaByExperienceId(
      userCompletedPromptCollaboration.Experience.id
    );
    if (expMedia) {
      userCompletedPromptCollaboration.Experience.Media =
        expMedia as unknown as ExperienceMediaModel[];
    }
  }

  return mapPromptCollaboratorToPrompt(userCompletedPromptCollaboration);
}

async function SingleCompletedhallengePageViewAuthenticated({
  expId,
  username,
}: {
  expId: string;
  username: string;
}) {
  const {
    userProfile,
    authUser,
    isAuthUserOwnProfile,
    isAuthenticated,
    isInPrivateBeta,
    isProfilePublic,
  } = await getAndVerifyUserProfileDataAccessByUsername(username);

  // Get the user's completed prompt challenge by expId
  const userCompletedPromptModel = await getRequestedCompletionPrompt(expId);
  // console.log(
  //   `***** userCompletedPrompt`,
  //   JSON.stringify(userCompletedPromptModel, null, 2)
  // );

  const promptFound = Boolean(userCompletedPromptModel);
  if (!promptFound) {
    console.warn(
      `No user completed prompt found for expId ${expId} - show 404.`
    );
    // notFound();
  }

  const promptExperience = userCompletedPromptModel?.Experience
    ? mapPromptModelToExperienceModel(userCompletedPromptModel)
    : undefined;

  const userCompletedPrompts = (
    promptFound ? [userCompletedPromptModel] : []
  ) as GeneratedExperienceUserPrompt[];

  return (
    <PromptProvider
      isCompletionView
      promptChallengeAccepted
      experiencePrompt={promptExperience}
      userSession={authUser}
      currentPrompt={userCompletedPromptModel}
      currentPromptStateKey={DefaultSingleCurrentPromptStateKey}
      promptChallengeAcceptedStateKey={
        DefaultSinglePromptChallengeAcceptedStateKey
      }
      // userPrompts={userIncompletePromptChallenges}
      userPrompts={[]}
      userCompletedPrompts={userCompletedPrompts}
    >
      <ChallengePageViewSharedContent
        noAspectRatio
        noChildContainer={!promptFound}
        noPromptTicker={!promptFound}
        noPromptTooltip={!promptFound}
        defaultPromptChallenge={userCompletedPromptModel}
        title={!promptFound ? 'But you got lost...' : undefined}
        caption={!promptFound && <ViewAllPromptChallenges />}
        heroClassName={cn({
          'h-full': true,
          'justify-start sm:justify-center pt-24 sm:pt-0': !promptFound,
        })}
      >
        {promptFound && <ViewCompletedPromptMisc />}
      </ChallengePageViewSharedContent>
    </PromptProvider>
  );
}

async function SingleCompletedChallengePageViewPublic({
  expId,
}: {
  expId: string;
}) {
  // const waitlistCount = await getCachedWaitlistCount();

  // Get the user's completed prompt challenge by expId
  const userCompletedPromptModel = await getRequestedCompletionPrompt(expId);
  // console.log(
  //   `***** userCompletedPromptModel for non-authenticated user`,
  //   JSON.stringify(userCompletedPromptModel, null, 2)
  // );

  const promptFound = Boolean(userCompletedPromptModel);
  if (!promptFound) {
    console.warn(
      `No user completed prompt found for expId ${expId} - show 404.`
    );
    // notFound();
  }

  const { Experience: promptExperience } = userCompletedPromptModel || {};

  const userCompletedPrompts = (
    promptFound ? [userCompletedPromptModel] : []
  ) as GeneratedExperienceUserPrompt[];

  return (
    // Don't need to pass any props to the PromptProvider since this is a public view
    <PromptProvider
      isCompletionView
      promptChallengeAccepted
      experiencePrompt={promptExperience}
      // userSession={authUser}
      currentPrompt={userCompletedPromptModel}
      currentPromptStateKey={DefaultSingleCurrentPromptStateKey}
      promptChallengeAcceptedStateKey={
        DefaultSinglePromptChallengeAcceptedStateKey
      }
      // userPrompts={userIncompletePromptChallenges}
      userCompletedPrompts={userCompletedPrompts}
    >
      <ChallengePageViewSharedContent
        noAspectRatio
        noChildContainer={!promptFound}
        noPromptTicker={!promptFound}
        noPromptTooltip={!promptFound}
        defaultPromptChallenge={userCompletedPromptModel}
        title={!promptFound ? 'But you got lost...' : undefined}
        caption={!promptFound && <ViewAllPromptChallenges />}
        heroClassName={cn({
          'h-full': true,
          'justify-start sm:justify-center pt-24 sm:pt-0': !promptFound,
        })}
      >
        {promptFound && <ViewCompletedPromptMisc />}
      </ChallengePageViewSharedContent>
      <ExperienceCreateMenuPublic />
    </PromptProvider>
  );
}

export default async function SingleCompletedPromptPage(
  props: SingleCompletedPromptPageProps
) {
  const { expId } = await props.params;

  const userSession = await getUserFromSession();
  const username = userSession?.username ?? '';

  return (
    <React.Suspense
      fallback={
        <ChallengePageViewSharedContentHeroContainer
          noAspectRatio
          className="relative bg-secondary"
        >
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
        <SingleCompletedhallengePageViewAuthenticated
          username={username}
          expId={expId}
        />
      )}
      {!username && <SingleCompletedChallengePageViewPublic expId={expId} />}
    </React.Suspense>
  );
}
