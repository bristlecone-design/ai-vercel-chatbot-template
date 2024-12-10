import Link from 'next/link';
import { ViewUserProfileLazyPartialExperiences } from '@/features/experiences/posts/experience-posts';
import { UserExperiencePostsProvider } from '@/features/experiences/posts/experience-posts-provider';
import { createPromptCollectionStoryPermalink } from '@/features/experiences/utils/experience-prompt-utils';
import {
  mapExperiencesWithUserActions,
  sortExperiencesForUserProfilePage,
} from '@/features/experiences/utils/experience-utils';
import { Badge } from 'lucide-react';

import type { ProfileSingleExperienceProps } from '../../../../_shared/profile-page-types';
import { getAndVerifyUserProfileDataAccessByUsername } from '../../../../_shared/shared-profile-data-retriever';
import { InterceptedExperienceDialog } from './_components/InterceptedExperienceDialog';

import type { ExperienceModel } from '@/types/experiences';

/**
 * No explicit revalidate value is set here, so the default value from the route segment config will be used. We can override this value here if we want to via @revalidateTag or @revalidatePath. @see actions/cache for helpers
 *
 * @note - This is a dynamic page that intercepts the single experience page. It fetches the experience data and user profile data and passes it to the SingleExperiencePost component.
 *
 * @note - Each data fetcher function caches the data in the cache for future use so we can revalidate at an atomic level as needed.
 *
 */

// export const revalidate = 0;

export default async function SingleExperienceInterceptorDynamicPage(
  props: ProfileSingleExperienceProps
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { children } = props;

  // console.log(`**** props in single experience interceptor dynamic page`, {
  //   params,
  //   searchParams,
  //   children,
  // });
  const { expId, userName } = params;
  // Try to get the experience from the cache first, otherwise, fetch it directly
  const userVerifiedProfileData =
    await getAndVerifyUserProfileDataAccessByUsername(userName);
  // console.log(`**** userVerifiedProfileData`, userVerifiedProfileData);
  const {
    authUser,
    userProfile,
    profileDisplayName,
    profileUserFirstName,
    isAuthUserOwnProfile,
    // isAuthenticated,
    // isInPrivateBeta,
    // isProfilePublic,
    // profileUserLastName,
  } = userVerifiedProfileData;

  const experience = ((await getCachedSingleUserExperienceForFrontend(expId)) ||
    getSingleUserExperienceForFrontend(expId)) as ExperienceModel;
  // console.log(`**** experience returned for ${expId}:`, experience);

  const mappedProfileUserExperiences = sortExperiencesForUserProfilePage(
    authUser?.id
      ? mapExperiencesWithUserActions(
          [experience] as ExperienceModel[],
          authUser.id
        )
      : [experience]
  ) as ExperienceModel[];

  // console.log(`**** experience returned for ${expId}:`, experience);
  const { Prompt, Story, title: expTitle } = experience;

  const { id: promptId } = Prompt || {};
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
      isPromptChallenge={isPromptChallenge}
      isStorySeries={isPartOfStorySeries}
      headerClassName={
        isPartOfStorySeries ? 'flex flex-col-reverse gap-4' : undefined
      }
      title={isPromptChallenge ? Prompt!.prompt : expTitle}
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
      footerCtaLabel={`Back to ${profileUserFirstName}'s Experiences`}
      className="!animate-none"
    >
      <UserExperiencePostsProvider
        noServerSync
        experiences={mappedProfileUserExperiences}
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
      </UserExperiencePostsProvider>
    </InterceptedExperienceDialog>
  );
}
