import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { createSingleCompletedStoryPromptChallengePermalink } from '@/features/experiences/utils/experience-prompt-utils';
import {
  ChallengePageViewSharedContentHeroContainer,
  ChallengeStoriesPageViewSharedContent,
} from '@/features/prompts/prompt-shared-containers';
import { ViewSingleStoryPromptForm } from '@/features/prompts/prompt-stories';
import PromptProvider, {
  DefaultSingleCurrentPromptStateKey,
  DefaultSinglePromptChallengeAcceptedStateKey,
} from '@/state/prompt-provider';

import { getUserFromSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import { IconArrowLeft } from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { InfoAlert } from '@/components/alerts';

import {
  getPromptChallengeMetadataByPromptId,
  getPromptCollectionAndMetaByPath,
} from '@/app/(user)/profile/[userName]/_shared/profile-metadata-utils';

import type { ExperienceUserPromptModel } from '@/types/experience-prompts';
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
  params: Promise<{ storyPath: string; promptId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: ChallengeSingleStoryPromptPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { storyPath, promptId } = params;
  // console.log(
  //   'story path and promptId in generateMetadata',
  //   storyPath,
  //   promptId
  // );

  const storyAndMeta = await getPromptCollectionAndMetaByPath(storyPath);
  const promptAndMeta = await getPromptChallengeMetadataByPromptId(promptId);

  const {
    permalinkFull,
    title: storyTitle,
    description,
    opengraphAssets,
  } = storyAndMeta;

  const { question: promptQuestion } = promptAndMeta;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  const promptOpenGraphImages = opengraphAssets.length
    ? (opengraphAssets as typeof previousImages)
    : previousImages;

  const promptTitle = getCustomTitleTemplate(promptQuestion, storyTitle);

  return {
    title: promptTitle,
    description,
    openGraph: {
      images: promptOpenGraphImages,
      title: promptTitle,
      description: description || undefined,
      url: permalinkFull,
      creators: ['@experiencenv'],
    },
    twitter: {
      images: promptOpenGraphImages,
      title: promptTitle,
      description: description || undefined,
      // creator: '@prompt',
    },
  };
}

async function SinglePromptStoryPageView({
  storyPath,
  promptId,
}: {
  storyPath: string;
  promptId: string;
}) {
  const userSession = await getUserFromSession();
  const userSessionProfileId = userSession?.id;

  const storyAndMeta = await getPromptCollectionAndMetaByPath(
    storyPath,
    promptId,
    undefined,
    userSessionProfileId
  );

  const {
    id,
    found,
    story,
    logo,
    banner,
    videoUrl,
    permalinkRelative,
    permalinkFull,
    title,
    website,
    description,
    prompts,
    activeAuthor,
    activePrompt,
    completedExperience,
    experiences,
  } = storyAndMeta;

  const {
    id: _promptId,
    content: promptResponse,
    prompt: promptQuestion,
    promptCollectionId,
  } = (activePrompt || {}) as ExperienceUserPromptModel;

  const storyId = id || promptCollectionId;

  const userCompletedStoryExpId = completedExperience?.id;
  const isStoryPromptCompletedByUser = Boolean(completedExperience);

  const userCompletedStoryPermalink = userCompletedStoryExpId
    ? createSingleCompletedStoryPromptChallengePermalink(
        userCompletedStoryExpId,
        promptId,
        storyPath
      )
    : '';

  const promptFound = Boolean(activePrompt);

  return (
    <PromptProvider
      // key={`public-prompt-${promptId}`}
      isSingleView
      promptChallengeAccepted
      currentPrompt={activePrompt}
      currentPromptStateKey={DefaultSingleCurrentPromptStateKey}
      promptChallengeAcceptedStateKey={
        DefaultSinglePromptChallengeAcceptedStateKey
      }
    >
      <ChallengeStoriesPageViewSharedContent
        noDescription
        noPromptTooltip={!promptFound}
        noChildContainer={!promptFound}
        logo={promptFound && logo ? logo : undefined}
        website={website}
        videoUrl={videoUrl}
        prompt={promptQuestion}
        storyPermalink={permalinkRelative}
        storySeriesTitlePermalink="/prompts/stories"
        title={promptFound ? title : 'But you got lost...'}
        titleClassName="brightness-80 hover:brightness-100"
        heroTitleClassName={cn({
          'prose-h2:text-lg prose-h2:lg:text-2xl': promptFound,
        })}
        innerContentClassName="gap-6"
        childrenClassName={cn({
          'flex flex-col gap-3': isStoryPromptCompletedByUser,
        })}
        description={description}
        heroClassName={
          !promptFound
            ? 'h-full justify-start sm:justify-center pt-24 sm:pt-0'
            : undefined
        }
      >
        {isStoryPromptCompletedByUser && userCompletedStoryPermalink && (
          <InfoAlert
            className="bg-secondary"
            title="Heads up!"
            description={
              <span className="flex items-center leading-none">
                <Link
                  href={userCompletedStoryPermalink}
                  className="flex gap-0.5"
                >
                  You have already contributed to this story{' '}
                  <IconArrowLeft className="rotate-180" />
                </Link>
              </span>
            }
            descriptionClassName="text-base"
            titleClassName="font-medium"
          />
        )}
        {activePrompt && storyId && (
          <ViewSingleStoryPromptForm
            storyId={storyId}
            storyPath={storyPath}
            prompt={activePrompt}
          />
        )}
      </ChallengeStoriesPageViewSharedContent>
    </PromptProvider>
  );
}

export default async function ChallengeSinglePromptPage(
  props: ChallengeSingleStoryPromptPageProps
) {
  const { params } = props;
  const { storyPath, promptId } = await params;

  return (
    <React.Suspense
      fallback={
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
      }
    >
      <SinglePromptStoryPageView promptId={promptId} storyPath={storyPath} />
    </React.Suspense>
  );
}
