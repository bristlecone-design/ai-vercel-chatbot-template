'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserExperiencePosts } from '@/features/experiences/posts/experience-posts-provider';
import { ExperienceSearchDialog } from '@/features/experiences/posts/experience-search-dialog';
import { useUserProfile } from '@/features/profile/user-profile-provider';
import { PopoverWhatArePromptStories } from '@/features/prompts/prompt-shared-popovers';
import { useUserPrompts } from '@/state/prompt-provider';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconCaravan, IconSparkle } from '@/components/ui/icons';
import { UserJoinLink } from '@/components/link-join';

// import { useTransitionRouter } from 'next-view-transitions';

import {
  UserProfileTabCard,
  UserProfileTabContent,
  UserProfileTabContentHero,
  UserProfileTabContentHeroInnerWithCTA,
} from './shared-tabs-content';

import type {
  ExperienceModel,
  PartialExperienceModel,
} from '@/types/experiences';
import type { AppUser as AUTH_USER_MODEL } from '@/types/next-auth';
import type { PhotoBasicExifData } from '@/types/photo';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserProfileExperienceTabContentProps = {
  children?: React.ReactNode;
  authUser?: AUTH_USER_MODEL | undefined;
  userProfile?: USER_PROFILE_MODEL;
  usersCount?: number;
  experiences?: ExperienceModel[];
  partialExperiences?: PartialExperienceModel[];
  experiencesCount?: number;
  mediaAssets?: PhotoBasicExifData[];
  authenticated?: boolean;
  userOwnsProfile?: boolean;
  enableCreatingExperience?: boolean;
  handleEnablingCreateAnExperience?: () => void;
  handleClosingCreateAnExperience?: () => void;
  handleSwitchingTabs?: (tab: string) => void;
};

export function UserProfileExperienceTabContent({
  children,
  usersCount = 0,
  experiencesCount: experiencesCountProp = 0,
  partialExperiences: partialExperiencesProp = [],
  mediaAssets = [],
  handleEnablingCreateAnExperience,
  // handleClosingCreateAnExperience,
  handleSwitchingTabs,
}: UserProfileExperienceTabContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    // Profile Data
    // userProfile,
    // profileUsername,
    profileUserFirstName,
    // profilePermalink,
    // profileUserDisplayName,
    // isProfilePublic,

    // Auth User
    // authUser,
    isAuthenticated,
    isAuthUserOwnProfile,
    // isInPrivateBeta,
  } = useUserProfile();

  const { handleTogglingPromptChallengeAcceptance } = useUserPrompts();

  const {
    // Experience Posts
    filteredExperiences,
    // sourceExperiences,
    // removedExperiences,
    // updatedExperiences,
    // addedExperiences,
    // experiences,
    // countExperiences,
    // countFilteredExperiences,

    // Create Experience Flow
    createExperienceEnabled: enableCreatingExperience,
    handleEnablingCreateExperience,
  } = useUserExperiencePosts();

  const experiencesCount =
    experiencesCountProp > 0
      ? experiencesCountProp
      : filteredExperiences.length;

  const partialExperiencesCount = partialExperiencesProp.length;
  const hasPartialExperiences = Boolean(partialExperiencesCount);

  const hasExperiences = Boolean(experiencesCount);

  // const mediaAssetCount = mediaAssets.length;
  // const hasMediaAssets = Boolean(mediaAssetCount);

  // const { handleSwitchingTabs: handleUpdatingStorageTabs } = useUserProfileTabs(
  //   {
  //     activeTab: 'experiences',
  //   }
  // );

  // Experiences CTA for non-authenticated users
  let experiencesJoinCta: React.ReactNode =
    'Join Experience NV to share your experiences and collaborations';

  if (profileUserFirstName && hasExperiences) {
    experiencesJoinCta = (
      <span className="flex items-center gap-2">
        {profileUserFirstName}&apos;s shared{' '}
        <Badge variant="outline" className="rounded-full">
          {experiencesCount}
        </Badge>{' '}
        public gems
      </span>
    );
  }

  return (
    <>
      <UserProfileTabCard>
        <UserProfileTabContent
          className={cn({
            'bg-green-700/50': !hasExperiences,
            'hover:bg-green-700/80': !hasExperiences,
            'bg-background': hasExperiences,
            // 'hover:bg-accent-700/80': hasExperiences,
          })}
        >
          <UserProfileTabContentHero authenticated={isAuthenticated}>
            <div className="flex flex-col items-center justify-center gap-2">
              {/* Authenticated User: Owner of Profile */}
              {isAuthUserOwnProfile && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn('rounded-full p-1.5', {
                          'hover:bg-accent': isAuthenticated,
                          'cursor-default': !isAuthenticated,
                        })}
                        onClick={
                          isAuthenticated
                            ? () => handleEnablingCreateExperience()
                            : undefined
                        }
                      >
                        <IconCaravan className="size-8" />
                      </Button>
                      <span className="">Experiences and Contributions</span>
                    </>
                  }
                  descriptionAs="div"
                  descriptionClassName={
                    hasPartialExperiences
                      ? 'flex items-center justify-evenly gap-2 w-full'
                      : undefined
                  }
                  description={
                    hasExperiences ? (
                      <React.Fragment>
                        <p>
                          You&apos;ve shared{' '}
                          <Badge
                            as="span"
                            variant="default"
                            className="rounded-xl bg-primary/70"
                          >
                            {experiencesCount}
                          </Badge>{' '}
                          public gems.
                        </p>
                        {hasPartialExperiences && (
                          <ExperienceSearchDialog
                            items={partialExperiencesProp}
                            title={
                              profileUserFirstName
                                ? `Search ${isAuthUserOwnProfile ? 'Your' : `${profileUserFirstName}'s`} Experiences and Contributions`
                                : undefined
                            }
                          />
                        )}
                      </React.Fragment>
                    ) : (
                      <p className="text-center">
                        Once you&apos;re in the private beta, your experiences,{' '}
                        <Link href="/prompts/stories" className="link-primary">
                          story contributions
                        </Link>{' '}
                        and collaborations will be discoverable. In the
                        meantime:
                      </p>
                    )
                  }
                  cta={
                    hasExperiences ? null : (
                      <div className="flex flex-col gap-5 sm:gap-3.5">
                        <Button
                          variant="default"
                          onClick={() => {
                            router.push('/prompts/stories');
                            // handleTogglingPromptChallengeAcceptance(true);
                            // handleEnablingCreateExperience();
                          }}
                          className="group gap-1 ring-offset-2 transition-none duration-75 hover:bg-tertiary hover:text-foreground hover:ring-2 hover:ring-foreground"
                        >
                          <IconSparkle className="size-4 transition-transform group-hover:rotate-180" />
                          <span>Contribute to Story Series</span>
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            handleTogglingPromptChallengeAcceptance(false);
                            handleEnablingCreateExperience();
                          }}
                          className="group hidden gap-1 ring-offset-2 transition-none duration-75 hover:bg-amber-700 hover:text-foreground hover:ring-2 hover:ring-foreground"
                        >
                          <IconCaravan className="size-4 transition-transform group-hover:-translate-x-1" />
                          <span>Share an Experience</span>
                        </Button>
                        <PopoverWhatArePromptStories />
                      </div>
                    )
                  }
                />
              )}

              {/* For Authenticated Viewer of Profile (Non-Owner) */}
              {!isAuthUserOwnProfile && !hasExperiences && isAuthenticated && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn('rounded-full p-1.5', {
                          'hover:bg-accent': isAuthenticated,
                        })}
                      >
                        <IconCaravan className="size-8" />
                      </Button>
                      <span className="">Experiences and Contributions</span>
                    </>
                  }
                  description={
                    <>
                      {profileUserFirstName
                        ? profileUserFirstName
                        : 'This user'}{' '}
                      hasn&apos;t shared any public experiences or{' '}
                      <Link href="/prompts/stories" className="link-primary">
                        story contributions
                      </Link>
                      .
                    </>
                  }
                  // cta={
                  //   hasMediaAssets ? (
                  //     <Button
                  //       onClick={() => {
                  //         handleUpdatingStorageTabs('media');
                  //       }}
                  //       className="w-full max-w-fit gap-1.5"
                  //     >
                  //       {hasMediaAssets && profileUserFirstName
                  //         ? `View ${profileUserFirstName}'s Media`
                  //         : 'View Shared Media'}

                  //       {mediaAssetCount && (
                  //         <Badge variant="secondary" className="rounded-xl">
                  //           {mediaAssetCount}
                  //         </Badge>
                  //       )}
                  //     </Button>
                  //   ) : null
                  // }
                />
              )}

              {/* For Non-Authenticated Users */}
              {!isAuthenticated && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn('rounded-full p-1.5', {
                          'hover:bg-accent': isAuthenticated,
                          'cursor-default': !isAuthenticated,
                        })}
                      >
                        <IconCaravan className="size-8" />
                      </Button>
                      <span className="">Experiences and Contributions</span>
                    </>
                  }
                  descriptionAs="div"
                  descriptionClassName="flex items-center justify-evenly gap-2 w-full"
                  description={
                    <React.Fragment>
                      <p>{experiencesJoinCta}</p>
                      <ExperienceSearchDialog
                        items={partialExperiencesProp}
                        title={
                          profileUserFirstName
                            ? `Search ${isAuthUserOwnProfile ? 'Your' : `${profileUserFirstName}'s`} Experiences and Contributions`
                            : undefined
                        }
                      />
                    </React.Fragment>
                  }
                  cta={
                    <UserJoinLink
                      href="/register"
                      variant="default"
                      label="Share Your Experiences"
                      className="w-full max-w-fit"
                    />
                  }
                />
              )}
            </div>
          </UserProfileTabContentHero>

          {/* List of User Profile's Public Experiences */}
          {/* <ViewUserPostedExperiences
            noPrefetchProfile
            // prefetchSingleExperiences
            authUser={authUser}
            userProfile={userProfile}
            noCreateMenuOptions={!hasExperiences}
            // experiences={filteredExperiences}
            authUserOwnsProfile={isAuthUserOwnProfile}
            context={isAuthUserOwnProfile ? 'author' : 'viewer'}
            createAnExperienceDialogOpen={enableCreatingExperience}
            // handleOnCloseExperienceDialog={handleClosingCreateAnExperience}
          /> */}

          {/* Custom Children */}
          {/* Handy for server-side suspense loading */}
          {/* E.g. Render many user profile experiences */}
          {children}
        </UserProfileTabContent>
      </UserProfileTabCard>
    </>
  );
}
