import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import {
  ChallengePageViewSharedContentHeroContainer,
  ChallengeStoriesPageViewSharedContent,
} from '@/features/prompts/prompt-shared-containers';
import { ViewStorySeries } from '@/features/prompts/prompt-story-series';

import { BlockSkeleton } from '@/components/ui/skeleton';

import { getAllFeaturedStorySeries } from '@/app/(user)/profile/[userName]/_shared/profile-metadata-utils';

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

interface AllStorySeriesPageProps {
  children: React.ReactNode;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: AllStorySeriesPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // const searchParams = await props.searchParams;
  const storiesAndMeta = await getAllFeaturedStorySeries();

  const { title, description, permalinkFull, opengraphAssets } = storiesAndMeta;

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

async function AllStorySeriesPageView() {
  const storiesAndMeta = await getAllFeaturedStorySeries();

  const {
    found,
    title,
    description,
    stories,
    permalinkRelative,
    opengraphAssets,
  } = storiesAndMeta;

  return (
    <ChallengeStoriesPageViewSharedContent
      noPromptTooltip
      noChildContainer={!found}
      storyPermalink={permalinkRelative}
      storySeriesTitle="Howdy"
      title={!found ? 'But you got lost...' : title}
      description={description}
      heroClassName={
        !found
          ? 'h-full justify-start sm:justify-center pt-24 sm:pt-0'
          : undefined
      }
    >
      {stories && <ViewStorySeries stories={stories} />}
    </ChallengeStoriesPageViewSharedContent>
  );
}

export default async function ChallengeSinglePromptPage(
  props: AllStorySeriesPageProps
) {
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
      <AllStorySeriesPageView />
    </React.Suspense>
  );
}
