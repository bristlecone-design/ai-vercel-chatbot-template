'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CreateExperienceDialog } from '@/features/experiences/experience-create-dialog';
import { useUserExperiencePosts } from '@/features/experiences/posts/experience-posts-provider';
import { useUserProfile } from '@/features/profile/user-profile-provider';
import { useUserProfileTabs } from '@/features/profile/user-profile-tabs-provider';
import { PopoverWhatArePromptStories } from '@/features/prompts/prompt-shared-popovers';
import { useUserPrompts } from '@/state/prompt-provider';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  IconCaravan,
  IconProfilePen,
  IconSparkle,
  IconTentTree,
} from '@/components/ui/icons';
import { UserJoinLink } from '@/components/link-join';

import type { USER_PROFILE_PUBLIC_TABS } from './shared-tab-types';
// import { useTransitionRouter } from 'next-view-transitions';

import {
  UserProfileTabCard,
  UserProfileTabContent,
  UserProfileTabContentHero,
  UserProfileTabContentHeroInnerWithCTA,
} from './shared-tabs-content';

import type { ExperienceModel } from '@/types/experiences';
import type { PhotoBasicExifData } from '@/types/photo';

export type UserProfileDiscoveriesTabContentProps = {
  usersCount?: number;
  mediaAssets?: PhotoBasicExifData[];
  enableCreatingExperience?: boolean;
  handleEnablingCreateAnExperience?: () => void;
  handleClosingCreateAnExperience?: () => void;
};

export function UserProfileDiscoveriesTabContent({
  usersCount = 0,
  mediaAssets = [],
  handleEnablingCreateAnExperience: handleEnablingCreateAnExperienceProp,
  handleClosingCreateAnExperience: handleClosingCreateAnExperienceProp,
}: UserProfileDiscoveriesTabContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    // Profile Data
    userProfile,
    // profileUsername,
    profileUserFirstName,
    profilePermalink,
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
    // experiences,
    filteredExperiences,

    // Create Experience Flow
    createExperienceEnabled: enableCreatingExperience,
    handleEnablingCreateExperience,
    handleDisablingCreateExperience,
    handleOnSuccessfullyCreatedExperience,
  } = useUserExperiencePosts();

  const { handleSwitchingTabs } = useUserProfileTabs({
    activeTab: 'discoveries',
  });

  // Flags and Counts
  const experiencesCount = filteredExperiences.length;
  const hasExperiences = Boolean(experiencesCount);

  const mediaAssetCount = mediaAssets.length;
  const hasMediaAssets = Boolean(mediaAssetCount);

  // Handlers
  const handleSwitchingTabViews = (
    tabView: USER_PROFILE_PUBLIC_TABS = 'experiences'
  ) => {
    router.push(`${profilePermalink}/${tabView}`);
  };

  const handleClosingCreateAnExperience = async () => {
    handleDisablingCreateExperience(false);
  };

  const handleSuccessfulCreateAnExperience = async (
    newExperience: ExperienceModel
  ) => {
    // console.log(
    //   `***** handleSuccessfulCreateAnExperience invoked in media tab`,
    //   { newExperience, selectedMediaIds }
    // );

    // Handle the successful creation of the experience
    handleOnSuccessfullyCreatedExperience(newExperience, true, false);
  };

  // Join CTA for non-authenticated users
  let discoveriesJoinCta =
    'Join Experience NV to share and discover experiences and challenges';

  if (profileUserFirstName) {
    discoveriesJoinCta += ` with ${profileUserFirstName}`;
    if (usersCount) {
      discoveriesJoinCta += ` and ${usersCount - 1} others.`;
    } else {
      discoveriesJoinCta += '.';
    }
  } else {
    discoveriesJoinCta += '.';
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
              {/* Authenticated Owner of User Profile */}
              {isAuthUserOwnProfile && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn(
                          'cursor-default rounded-full p-1.5 hover:bg-transparent'
                        )}
                      >
                        <IconTentTree className="size-8" />
                      </Button>
                      <span className="">Chill Fellow Explorer!</span>
                    </>
                  }
                  description={
                    <>
                      Once you&apos;re in the private beta, you'll be able to
                      discover Nevada experiences shared by others. In the
                      meantime:
                    </>
                  }
                  cta={
                    <div className="flex flex-col items-center justify-center gap-2 sm:gap-3.5">
                      <div className="flex flex-col gap-3.5 sm:flex-row sm:gap-2">
                        <Link
                          href="/prompts/stories"
                          className={cn(
                            buttonVariants({
                              variant: 'secondary',
                              className:
                                'hover:bg-tertiary group gap-1 ring-offset-2 transition-none duration-75 hover:text-foreground hover:ring-2 hover:ring-foreground',
                            })
                          )}
                        >
                          <IconSparkle className="size-4 transition-transform group-hover:rotate-180" />
                          <span>Contribute to Story Series</span>
                        </Link>
                        <Link
                          href="/profile/edit"
                          className={cn(
                            buttonVariants({
                              variant: 'secondary',
                              className:
                                'hover:bg-tertiary group gap-1 ring-offset-2 transition-none duration-75 hover:text-foreground hover:ring-2 hover:ring-foreground',
                            })
                          )}
                        >
                          <IconProfilePen className="size-4 transition-transform group-hover:scale-110" />
                          <span>Update Your Profile</span>
                        </Link>
                      </div>
                      <Button
                        variant="secondary"
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
                  }
                />
              )}

              {/* Authenticated Viewer of User Profile */}
              {!isAuthUserOwnProfile && isAuthenticated && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn(
                          'cursor-default rounded-full p-1.5 hover:bg-transparent'
                        )}
                      >
                        <IconTentTree className="size-8" />
                      </Button>
                      <span className="">Discover Nevada</span>
                    </>
                  }
                  description={
                    <>
                      {profileUserFirstName
                        ? `${profileUserFirstName}'s`
                        : 'This user'}{' '}
                      not yet in the private beta for sharing discoveries.
                    </>
                  }
                  cta={
                    hasExperiences ? (
                      <Button
                        onClick={() => {
                          handleSwitchingTabViews('experiences');
                        }}
                        className="w-full max-w-fit gap-1.5"
                      >
                        {profileUserFirstName
                          ? `View ${profileUserFirstName}'s Experiences`
                          : 'View Shared Experiences'}

                        {hasExperiences && (
                          <Badge variant="secondary" className="rounded-xl">
                            {experiencesCount}
                          </Badge>
                        )}
                      </Button>
                    ) : hasMediaAssets ? (
                      <Button
                        onClick={() => {
                          handleSwitchingTabViews('media');
                        }}
                        className="w-full max-w-fit gap-1.5"
                      >
                        {profileUserFirstName
                          ? `View ${profileUserFirstName}'s Media`
                          : 'View Shared Media'}

                        {mediaAssetCount && (
                          <Badge variant="secondary" className="rounded-xl">
                            {mediaAssetCount}
                          </Badge>
                        )}
                      </Button>
                    ) : null
                  }
                />
              )}

              {/* Non-Authenticated Users */}
              {!isAuthenticated && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn(
                          'cursor-default rounded-full p-1.5 hover:bg-transparent'
                        )}
                      >
                        <IconTentTree className="size-8" />
                      </Button>
                      <span className="">Adventures Await</span>
                    </>
                  }
                  description={discoveriesJoinCta}
                  cta={
                    <div className="flex flex-col items-center justify-center gap-5 sm:gap-3.5">
                      <div className="flex flex-col gap-2.5 sm:flex-row">
                        <UserJoinLink
                          variant="default"
                          href="/register"
                          label="Sign Me Up!"
                          icon={
                            <IconCaravan className="size-4 transition-transform group-hover:-translate-x-1" />
                          }
                          className="group gap-1 ring-offset-2 transition-none duration-75 hover:bg-amber-700 hover:text-foreground hover:ring-2 hover:ring-foreground"
                        />
                        <UserJoinLink
                          noRedirect
                          variant="default"
                          href="/prompts/stories"
                          label="Story Series"
                          className="group gap-1 ring-offset-2 transition-none duration-75 hover:bg-amber-700 hover:text-foreground hover:ring-2 hover:ring-foreground"
                          icon={
                            <IconSparkle className="size-4 transition-transform group-hover:rotate-180" />
                          }
                        />
                      </div>
                      <PopoverWhatArePromptStories />
                    </div>
                  }
                />
              )}
            </div>
          </UserProfileTabContentHero>
        </UserProfileTabContent>
      </UserProfileTabCard>

      {enableCreatingExperience && (
        <CreateExperienceDialog
          open={enableCreatingExperience}
          userProfile={userProfile}
          handleOnClose={handleClosingCreateAnExperience}
          handleOnSuccess={handleSuccessfulCreateAnExperience}
        />
      )}
    </>
  );
}
