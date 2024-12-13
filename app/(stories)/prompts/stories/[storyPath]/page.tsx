import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import {
  getUniquePromptsFromList,
  sortPromptsByFeaturedThenPinned,
} from '@/features/experiences/utils/experience-prompt-utils';
import {
  ChallengePageViewSharedContentHeroContainer,
  ChallengeStoriesPageViewSharedContent,
} from '@/features/prompts/prompt-shared-containers';
import { ViewStoryPrompts } from '@/features/prompts/prompt-stories';

import { BlockSkeleton } from '@/components/ui/skeleton';

import { getPromptCollectionAndMetaByPath } from '@/app/(user)/profile/[userName]/_shared/profile-metadata-utils';

/**
 * No explicit revalidate value is set here, so the default value from the route segment config will be used. We can override this value here if we want to via @revalidateTag or @revalidatePath. @see actions/cache for helpers
 *
 * @note - This is a dynamic page that intercepts the single experience page. It fetches the experience data and user profile data and passes it to the SingleExperiencePost component.
 *
 * @note - Each data fetcher function caches the data in the cache for future use so we can revalidate at an atomic level as needed.
 *
 */

// Revalidate every x hours in seconds
// export const revalidate = 86400; // 24 hours

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

interface ChallengeSingleStoryPageProps {
  children: React.ReactNode;
  params: Promise<{ storyPath: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: ChallengeSingleStoryPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // const searchParams = await props.searchParams;
  const params = await props.params;
  const { storyPath } = params;

  const storyAndMeta = await getPromptCollectionAndMetaByPath(storyPath);

  const { permalinkFull, title, description, opengraphAssets } = storyAndMeta;

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  const promptOpenGraphImages = opengraphAssets.length
    ? (opengraphAssets as typeof previousImages)
    : previousImages;

  return {
    title,
    description,
    openGraph: {
      images: promptOpenGraphImages,
      title,
      description: description || undefined,
      url: permalinkFull,
      creators: ['@experiencenv'],
    },
    twitter: {
      images: promptOpenGraphImages,
      title,
      description: description || undefined,
      // creator: '@prompt',
    },
  };
}

async function PromptStoriesPageView({ storyPath }: { storyPath: string }) {
  const storyAndMeta = await getPromptCollectionAndMetaByPath(storyPath);

  const {
    id: storyId,
    found,
    story,
    logo,
    banner,
    permalinkFull,
    permalinkRelative,
    videoCaption,
    videoUrl,
    title,
    website,
    description,
    prompts,
  } = storyAndMeta;

  return (
    <ChallengeStoriesPageViewSharedContent
      noPromptTooltip={!found}
      noChildContainer={!found}
      logo={logo}
      website={website}
      videoUrl={videoUrl}
      videoCaption={videoCaption}
      storyPermalink={permalinkRelative}
      storySeriesTitlePermalink="/prompts/stories"
      title={!found ? 'But you got lost...' : title}
      description={description}
      heroClassName={
        !found
          ? 'h-full justify-start sm:justify-center pt-24 sm:pt-0'
          : undefined
      }
    >
      {prompts && (
        <ViewStoryPrompts
          storyPath={storyPath}
          prompts={sortPromptsByFeaturedThenPinned(
            getUniquePromptsFromList(prompts)
          )}
        />
      )}
    </ChallengeStoriesPageViewSharedContent>
  );
}

export default async function ChallengeSinglePromptPage(
  props: ChallengeSingleStoryPageProps
) {
  const params = await props.params;
  const { storyPath } = params;

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
      <PromptStoriesPageView storyPath={storyPath} />
    </React.Suspense>
  );
}
