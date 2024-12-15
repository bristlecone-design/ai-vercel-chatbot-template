import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { getPartialSingleUserExperienceForFrontend } from '@/actions/experiences-partial';
import { ExperienceCreateMenu } from '@/features/experiences/posts/experience-post-create-menu';
import { ViewUserProfileLazyPartialExperiences } from '@/features/experiences/posts/experience-posts';
import { UserExperiencePostsProvider } from '@/features/experiences/posts/experience-posts-provider';
import { createPromptCollectionStoryPermalink } from '@/features/experiences/utils/experience-prompt-utils';

import { Badge } from '@/components/ui/badge';

import { getUserCompletedSingleExperienceMetadataById } from '../../../_shared/profile-metadata-utils';
import type { ProfileSingleExperienceProps } from '../../../_shared/profile-page-types';
import { getAndVerifyUserProfileDataAccessByUsername } from '../../../_shared/shared-profile-data-retriever';
import { InterceptedExperienceDialog } from '../../@expModal/(.)experiences/[expId]/_components/InterceptedExperienceDialog';

import type { PartialExperienceModel } from '@/types/experiences';

/**
 * No explicit revalidate value is set here, so the default value from the route segment config will be used. We can override this value here if we want to via @revalidateTag or @revalidatePath. @see actions/cache for helpers
 *
 * @note - This is a dynamic page that intercepts the single experience page. It fetches the experience data and user profile data and passes it to the SingleExperiencePost component.
 *
 * @note - Each data fetcher function caches the data in the cache for future use so we can revalidate at an atomic level as needed.
 *
 */

// Revalidate every 24 hours in seconds
// export const revalidate = 86400;

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

// Control what happens when a dynamic segment is visited that was not generated with generateStaticParams.
// export const dynamicParams = true // true | false,

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
// Force static rendering and cache the data of a layout or page by forcing cookies(), headers() and useSearchParams() to return empty values.
// export const dynamic = 'force-static';

// https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering
// export const experimental_ppr = true;

export async function generateMetadata(
  props: ProfileSingleExperienceProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // const searchParams = await props.searchParams;
  const params = await props.params;
  const { userName, expId } = params;

  const profileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);

  // console.log('**** experience in generateMetadata', experience);

  const {
    // userProfile,
    // authUser,
    // isAuthenticated,
    // isAuthUserOwnProfile,
    // profileUserFirstName,
    // profileUserBio,
    // profileUserAvatar,
    isProfilePublic,
    // profileDisplayName,
    // profileUsername,
    // profileAbsoluteUrl,
    profileRelativeUrl,
  } = profileData;

  const experienceWithMeta = await getUserCompletedSingleExperienceMetadataById(
    expId,
    { isProfilePublic, profileRelativeUrl }
  );

  const {
    openGraphUrl: ogUrl,
    openGraphTitle: ogSiteTitle,
    openGraphDescription: ogDescription,
    openGraphImages: ogImages,
    openGraphVideos: ogVideos,
    openGraphCreators: ogCreators,
  } = experienceWithMeta;

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
    title: ogSiteTitle,
    description: ogDescription,
    openGraph: {
      url: ogUrl,
      title: ogSiteTitle || undefined,
      description: ogDescription,
      videos: promptOpenGraphVideos,
      images: promptOpenGraphImages,
      creators: ogCreators,
    },
    twitter: {
      images: promptOpenGraphImages,
      title: ogSiteTitle || undefined,
      description: ogDescription,
    },
  };
}

export default async function SingleExperienceDynamicPage(
  props: ProfileSingleExperienceProps
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { children } = props;

  // console.log(`**** props in dedicated single experience page`, {
  //   params,
  //   searchParams,
  //   children,
  // });
  const { expId, userName } = params;

  const {
    // authUser,
    userProfile,
    isAuthUserOwnProfile,
    profileDisplayName,
    profileUserFirstName,
    profileRelativeUrl,
    // isAuthenticated,
    // isInPrivateBeta,
    // isProfilePublic,
  } = await getAndVerifyUserProfileDataAccessByUsername(userName);
  // console.log(`**** userVerifiedProfileData`, userVerifiedProfileData);

  const experience = (await getPartialSingleUserExperienceForFrontend(expId, {
    story: true,
  })) as PartialExperienceModel;

  const {
    promptId,
    prompt: promptChallenge,
    Story,
    title: expTitle,
  } = experience;

  const isPromptChallenge = Boolean(promptId);

  const { path: storyPath, title: storyTitle } = Story || {};
  const isPartOfStorySeries = Boolean(storyPath);

  const storyPermalink = storyPath
    ? createPromptCollectionStoryPermalink(storyPath)
    : '';

  // const storyPromptPermalink =
  //   promptId && storyPath
  //     ? createSingleStoryPromptChallengePermalink(promptId, storyPath)
  //     : '';

  const storySeriesDescription = (
    <span className="flex flex-col-reverse items-center justify-center gap-2 sm:flex-row">
      {storyTitle} <Badge variant="outline">Story Series</Badge>
    </span>
  );

  const finalDescription = isPartOfStorySeries
    ? storySeriesDescription
    : isPromptChallenge
      ? 'Prompt Challenge'
      : undefined;

  return (
    <InterceptedExperienceDialog
      open
      dismissible
      noRouterBack
      direction="bottom"
      onCloseRoutePath={profileRelativeUrl}
      isPromptChallenge={isPromptChallenge}
      isStorySeries={isPartOfStorySeries}
      headerClassName={
        isPartOfStorySeries ? 'flex flex-col-reverse gap-4' : undefined
      }
      title={isPromptChallenge ? promptChallenge : expTitle}
      descriptionClassName={
        isPartOfStorySeries ? 'text-base md:text-xl' : undefined
      }
      description={
        finalDescription ? (
          isPartOfStorySeries && storyPermalink ? (
            <Link href={storyPermalink}>{finalDescription}</Link>
          ) : (
            finalDescription
          )
        ) : undefined
      }
      authorName={profileUserFirstName}
      footerCtaLabel={`Back to ${profileUserFirstName}'s Profile`}
      className="!animate-none bg-background/90"
    >
      <UserExperiencePostsProvider
        noServerSync
        partialExperiences={[experience]}
        experiences={
          [
            // ...mappedOtherUserExperiences,
            // ...mappedSingleUserExperience,
          ]
        }
        userProfile={userProfile}
        profileUserId={userProfile.id}
        profileUsername={userProfile.username || userName}
        profileUserDisplayName={profileDisplayName}
        // profileUserLastName={profileUserLastName}
        // profileUserFirstName={profileUserFirstName}
        isAuthUserOwnProfile={isAuthUserOwnProfile}
      >
        <ViewUserProfileLazyPartialExperiences
          noExpTitle
          noStoryTitle
          noPromptTitle
          experiences={[experience]}
        />
        <ExperienceCreateMenu />
      </UserExperiencePostsProvider>
    </InterceptedExperienceDialog>
  );
}
