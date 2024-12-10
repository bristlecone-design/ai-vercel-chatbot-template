import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { UserExperiencePostsProvider } from '@/features/experiences/posts/experience-posts-provider';
import { mapSingleExperienceWithUserActions } from '@/features/experiences/utils/experience-utils';
import {
  ChallengePageViewSharedContentHeroContainer,
  ChallengeStoriesPageViewSharedContent,
} from '@/features/prompts/prompt-shared-containers';
import { ViewSingleCompletedStoryPrompt } from '@/features/prompts/prompt-stories';

import { getUserFromSession } from '@/lib/session';
import { IconArrowLeft } from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';

import { getCompletedStoryPromptChallengeMetadata } from '@/app/(user)/profile/[userName]/_shared/profile-metadata-utils';
import { getAndVerifyUserProfileDataAccessByUsername } from '@/app/(user)/profile/[userName]/_shared/shared-profile-data-retriever';

import { getCustomTitleTemplate } from '@/config/site-meta';

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

interface ChallengeSingleStoryPromptPageProps {
  children: React.ReactNode;
  params: Promise<{ storyPath: string; promptId: string; expId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: ChallengeSingleStoryPromptPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { storyPath, promptId, expId } = params;
  // console.log(
  //   'COMPLETED story path with promptId and expId in generateMetadata',
  //   storyPath,
  //   promptId,
  //   expId
  // );
  const userSession = await getUserFromSession();
  const userSessionProfileId = userSession?.id;

  const completedStoryPromptAndMeta =
    await getCompletedStoryPromptChallengeMetadata(
      storyPath,
      promptId,
      expId,
      userSessionProfileId
    );

  const {
    description,
    openGraphImages,
    openGraphVideos,
    storyTitle,
    title: promptTitle,
    question: promptQuestion,
    completedPromptPermalinkFull,
  } = completedStoryPromptAndMeta;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];
  const previousVideos = (await parent).openGraph?.videos || [];

  const promptOpenGraphImages = openGraphImages.length
    ? (openGraphImages as typeof previousImages)
    : previousImages;

  const promptOpenGraphVideos = openGraphVideos.length
    ? (openGraphVideos as typeof previousVideos)
    : previousVideos;

  const pageTitle = getCustomTitleTemplate(promptQuestion, storyTitle);

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description: description || undefined,
      url: completedPromptPermalinkFull,
      images: promptOpenGraphImages,
      videos: promptOpenGraphVideos,
      creators: ['@experiencenv'],
    },
    twitter: {
      title: pageTitle,
      description: description || undefined,
      images: promptOpenGraphImages,
      // creator: '@prompt',
    },
  };
}

async function SinglePromptStoryPageView({
  storyPath,
  promptId,
  expId,
}: {
  storyPath: string;
  promptId: string;
  expId: string;
}) {
  const userSession = await getUserFromSession();
  const userSessionProfileId = userSession?.id;

  const completedStoryPromptAndMeta =
    await getCompletedStoryPromptChallengeMetadata(
      storyPath,
      promptId,
      expId,
      userSessionProfileId
    );

  const {
    found,
    story,
    prompt,
    found: promptFound,
    question: promptQuestion,
    storyPermalinkFull,
    storyPermalinkRelative,
    promptPermalinkRelative,
    // collaborators,
    experience: completedExperience,
    experiences: allCompletedExperiences,
    author: completedExperienceAuthor,
  } = completedStoryPromptAndMeta;

  if (!completedStoryPromptAndMeta || !found || !completedExperienceAuthor) {
    return null;
  }

  const {
    id: storyId,
    logo: storyLogo,
    banner: storyBanner,
    title: storyTitle,
    description: storyDescription,
    website: storyWebsite,
    videoUrl: storyVideoUrl,
  } = story || {};

  const { username: authorUsername } = completedExperienceAuthor;

  const userVerifiedProfileData =
    await getAndVerifyUserProfileDataAccessByUsername(authorUsername!);

  const {
    userProfile,
    isProfilePublic,
    isAuthUserOwnProfile: isAuthUserExpOwner,
    isAuthenticated,
    // isInPrivateBeta,
    // profileUserFirstName,
    // profileDisplayName,
    // profileUserLastName,
    // authUser,
  } = userVerifiedProfileData;

  // console.log('**** Completed story collaborators and author', {
  //   completedExperience,
  //   storyPermalinkRelative,
  //   completedExperienceAuthor,
  // });
  // If authenticated, map the user's actions on the experience
  const mappedCompletedExperience =
    userSessionProfileId && completedExperience
      ? mapSingleExperienceWithUserActions(
          completedExperience,
          userSessionProfileId
        )
      : completedExperience;

  return (
    // <PromptProvider
    //   // key={`public-prompt-${promptId}`}
    //   isSingleView
    //   promptChallengeAccepted
    //   currentPrompt={prompt}
    //   currentPromptStateKey={DefaultSingleCurrentPromptStateKey}
    //   promptChallengeAcceptedStateKey={
    //     DefaultSinglePromptChallengeAcceptedStateKey
    //   }
    // >
    // </PromptProvider>
    <UserExperiencePostsProvider
      noServerSync
      userProfile={userProfile}
      isProfilePublic={isProfilePublic}
      isAuthUserOwnProfile={isAuthUserExpOwner}
      experiences={allCompletedExperiences}
    >
      <ChallengeStoriesPageViewSharedContent
        noDescription
        noPromptTooltip={!promptFound}
        noChildContainer={!promptFound}
        author={completedExperienceAuthor}
        logo={promptFound && storyLogo ? storyLogo : undefined}
        website={storyWebsite}
        videoUrl={storyVideoUrl}
        prompt={promptQuestion}
        promptPermalink={promptPermalinkRelative}
        storyPermalink={storyPermalinkRelative}
        storySeriesTitlePermalink="/prompts/stories"
        title={!promptFound ? 'But you got lost...' : storyTitle}
        titleClassName="brightness-80 hover:brightness-100"
        heroTitleClassName="prose-h2:text-lg prose-h2:lg:text-2xl"
        innerContentClassName="gap-6"
        childrenClassName=""
        description={storyDescription}
        heroClassName={
          !promptFound
            ? 'h-full justify-start sm:justify-center pt-24 sm:pt-0'
            : undefined
        }
      >
        {/* Found */}
        {mappedCompletedExperience && story && (
          <ViewSingleCompletedStoryPrompt
            story={story}
            prompt={prompt}
            experience={mappedCompletedExperience}
            expAuthor={completedExperienceAuthor}
            isAuthUserExpOwner={isAuthUserExpOwner}
            storyLink={storyPermalinkRelative}
            promptTitleLink={promptPermalinkRelative}
          />
        )}

        {/* Not Found */}
        {!mappedCompletedExperience && storyPermalinkRelative && (
          <InfoAlert
            className="bg-secondary"
            title="Oh no! 😭"
            description={
              <span className="flex items-center">
                <Link
                  href={storyPermalinkRelative}
                  className="flex items-center gap-0.5"
                >
                  The story contribution you&apos;re looking for is not here!
                  Check out the main story page instead{' '}
                  <IconArrowLeft className="rotate-180 sm:size-5" />
                </Link>
              </span>
            }
            descriptionClassName="text-base"
            titleClassName="font-medium"
          />
        )}
      </ChallengeStoriesPageViewSharedContent>
    </UserExperiencePostsProvider>
  );
}

export default async function ChallengeSinglePromptPage(
  props: ChallengeSingleStoryPromptPageProps
) {
  const params = await props.params;
  const { storyPath, promptId, expId } = params;

  return (
    <React.Suspense
      fallback={
        <div className={'flex size-full flex-col gap-4'}>
          <ChallengePageViewSharedContentHeroContainer className="relative bg-secondary from-[#042554] via-[#041E42] to-[#042554]">
            <div className="flex size-full flex-col items-center justify-start gap-8 py-4 md:py-8">
              <BlockSkeleton className="h-16 w-4/5" />
              <BlockSkeleton className="h-12 w-3/5" />
              <BlockSkeleton className="h-12 w-4/5" />
              <div className="flex w-full flex-col items-center justify-center gap-2">
                <BlockSkeleton className="h-6 w-4/5" />
                <BlockSkeleton className="h-6 w-4/5" />
                <BlockSkeleton className="h-6 w-4/5" />
                <BlockSkeleton className="h-6 w-4/5" />
              </div>
            </div>
          </ChallengePageViewSharedContentHeroContainer>
          <div className="relative mx-auto flex w-full flex-col gap-2 rounded-lg border bg-muted/20 px-4 py-4 sm:max-w-4xl sm:py-8">
            <BlockSkeleton className="h-6 w-full" />
            <BlockSkeleton className="h-6 w-4/5" />
            <BlockSkeleton className="h-6 w-full" />
            <BlockSkeleton className="h-6 w-4/5" />
            <BlockSkeleton className="h-6 w-full" />
            <BlockSkeleton className="h-6 w-full" />
          </div>
        </div>
      }
    >
      <SinglePromptStoryPageView
        expId={expId}
        promptId={promptId}
        storyPath={storyPath}
      />
    </React.Suspense>
  );
}
