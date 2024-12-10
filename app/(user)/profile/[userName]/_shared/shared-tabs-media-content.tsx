'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CACHE_KEY_PUBLIC_FEATURED_PHOTOS } from '@/actions/cache-keys';
import { CreateExperienceDialog } from '@/features/experiences/experience-create-dialog';
import { NUM_OF_ALLOWED_MEDIA_ATTACHMENTS } from '@/features/experiences/experience-post-constants';
import { useUserExperiencePosts } from '@/features/experiences/posts/experience-posts-provider';
import { useUserProfile } from '@/features/profile/user-profile-provider';
import { useUserProfileTabs } from '@/features/profile/user-profile-tabs-provider';
import { useAppState } from '@/state/app-state';

import { getRandomMediaAssets } from '@/lib/media/media-utils';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { IconMountainSnow } from '@/components/ui/icons';
import { UserJoinLink } from '@/components/link-join';

import {
  UserProfileTabCard,
  UserProfileTabContent,
  UserProfileTabContentHero,
  UserProfileTabContentHeroInnerWithCTA,
} from './shared-tabs-content';

import type { ExperienceModel } from '@/types/experiences';
import type { AppUser as AUTH_USER_MODEL } from '@/types/next-auth';
import type { PhotoBasicExifData } from '@/types/photo';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserProfileMediaTabContentProps = {
  authUser?: AUTH_USER_MODEL | undefined;
  userProfile?: USER_PROFILE_MODEL;
  usersCount?: number;
  experiences?: ExperienceModel[];
  mediaAssets?: PhotoBasicExifData[];
  authenticated?: boolean;
  isAuthUserOwnProfile?: boolean;
  enableCreatingExperience?: boolean;
  handleEnablingCreateAnExperience?: () => void;
  handleClosingCreateAnExperience?: () => void;
  handleSwitchingTabs?: (tab: string) => void;
};

export function UserProfileMediaTabContent({
  usersCount = 0,
  mediaAssets = [],
  handleEnablingCreateAnExperience: handleEnablingCreateAnExperienceProp,
  handleClosingCreateAnExperience: handleClosingCreateAnExperienceProp,
}: UserProfileMediaTabContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedMediaIds, setSelectedMediaIds] = useLocalStorage<string[]>(
    'selected-media-ids',
    []
  );

  const [numOfSelectableMedia, setNumOfSelectableMedia] =
    useLocalStorage<number>(
      'num-of-selectable-media',
      NUM_OF_ALLOWED_MEDIA_ATTACHMENTS
    );

  const {
    userSession: authUser,
    isAuthenticated,
    isInPrivateBeta,
  } = useAppState();

  const {
    // Profile Data
    userProfile,
    profileUserFirstName,
    isAuthUserOwnProfile,
    // profileUsername,
    profilePermalink,
    // profileUserDisplayName,
    // isProfilePublic,
  } = useUserProfile();

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
  // console.log(`**** UserProfileExperienceTabContent hook data::`, {
  //   authUser,
  //   userProfile,
  //   filteredExperiences,
  //   isAuthenticated,
  //   isAuthUserOwnProfile,
  //   isInPrivateBeta,
  //   isProfilePublic,
  //   profileUserDisplayName,
  //   profileUsername,
  // });

  const { handleSwitchingTabs } = useUserProfileTabs({
    activeTab: 'media',
  });

  const experiencesCount = filteredExperiences.length;
  const hasExperiences = Boolean(experiencesCount);

  const mediaAssetCount = mediaAssets.length;
  const hasMediaAssets = Boolean(mediaAssetCount);
  const selectedMediaCount = selectedMediaIds.length;
  const hasSelectedMedia = Boolean(selectedMediaCount);

  const existingMediaToAttach =
    enableCreatingExperience && hasSelectedMedia
      ? mediaAssets.filter((media) => selectedMediaIds.includes(media.id))
      : [];

  const maxNumOfSelectableMediaMet =
    numOfSelectableMedia === selectedMediaIds.length;

  const disableSelectingMedia = maxNumOfSelectableMediaMet || !hasMediaAssets;

  // console.log(`**** selectedMediaIds`, selectedMediaIds);
  // console.log(`**** numOfSelectableMedia`, numOfSelectableMedia);
  // console.log(`**** maxNumOfSelectableMediaMet`, maxNumOfSelectableMediaMet);
  // console.log(`**** existingMediaToAttach`, existingMediaToAttach);

  // Handlers
  const handleUnselectingAllMediaIds = () => {
    setSelectedMediaIds([]);
  };

  const handleSelectingMediaIds = (newMediaIds: string[]) => {
    const uniqueIds = Array.from(
      new Set([...selectedMediaIds, ...newMediaIds])
    );
    setSelectedMediaIds(uniqueIds);
  };

  const handleSelectingMediaId = (mediaId: string) => {
    // If the mediaId is already selected, unselect it; otherwise, select it
    const updatedMediaIds = selectedMediaIds.includes(mediaId)
      ? selectedMediaIds.filter((id) => id !== mediaId)
      : [...selectedMediaIds, mediaId];

    setSelectedMediaIds(updatedMediaIds);
  };

  const handleUnselectingMediaId = (mediaId: string) => {
    const updatedMediaIds = selectedMediaIds.filter((id) => id !== mediaId);
    setSelectedMediaIds(updatedMediaIds);
  };

  const handleEnablingCreateAnExperience = (mediaIds?: string[]) => {
    if (mediaIds) {
      handleSelectingMediaIds(mediaIds);
    }
    handleEnablingCreateExperience(true);
  };

  const handleClosingCreateAnExperience = async (
    clearSelectedMedia = false
  ) => {
    if (clearSelectedMedia) {
      setSelectedMediaIds([]);
    }
    handleDisablingCreateExperience(false);
  };

  const handleSuccessfulCreateAnExperience = async (
    newExperience: ExperienceModel
  ) => {
    // console.log(
    //   `***** handleSuccessfulCreateAnExperience invoked in media tab`,
    //   { newExperience, selectedMediaIds }
    // );

    // Clear the selected media ids if the new experience has media assets matching the selected media ids
    const { Media: mediaAssets } = newExperience;
    if (mediaAssets?.length && selectedMediaCount) {
      const mediaIds = mediaAssets.map((media) => media.id);
      const hasMatchingMediaIds = mediaIds.some((id) =>
        selectedMediaIds.includes(id)
      );
      if (hasMatchingMediaIds) {
        setSelectedMediaIds([]);
      }
    }

    // Handle the successful creation of the experience
    handleOnSuccessfullyCreatedExperience(newExperience, true, false);
  };

  // Collaborative CTA for non-authenticated users
  let collaborativeJoinCta =
    'Join Experience NV to share and discover creative content';

  if (profileUserFirstName) {
    collaborativeJoinCta += ` with ${profileUserFirstName}`;
    if (usersCount) {
      collaborativeJoinCta += ` and ${usersCount - 1} others.`;
    } else {
      collaborativeJoinCta += '.';
    }
  } else {
    collaborativeJoinCta += '.';
  }

  // Temp re-route to profilePermalink/experiences view
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (typeof handleSwitchingTabs === 'function') {
      handleSwitchingTabs('experiences');
      router.push(`${profilePermalink}/experiences`);
    }
  }, []);

  return (
    <>
      <UserProfileTabCard>
        <UserProfileTabContent
          className={cn({
            // 'bg-green-700/50': !hasMediaAssets,
            // 'hover:bg-green-700/80': !hasMediaAssets,
            // 'bg-background': hasMediaAssets,
            // 'hover:bg-accent-700/80': hasExperiences,
          })}
        >
          <UserProfileTabContentHero authenticated={isAuthenticated}>
            <div className="flex flex-col items-center justify-center gap-2">
              {/* Authenticated Users */}
              {isAuthenticated && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn('rounded-full p-1.5')}
                      >
                        <IconMountainSnow className="size-8" />
                      </Button>
                      <span className="">Media Content</span>
                    </>
                  }
                  description={
                    isAuthUserOwnProfile ? (
                      <>Manage and share your media assets.</>
                    ) : !isAuthUserOwnProfile && hasMediaAssets ? (
                      <>
                        {profileUserFirstName
                          ? `${profileUserFirstName}'s`
                          : `This user's`}{' '}
                        shared media assets.
                      </>
                    ) : (
                      !isAuthUserOwnProfile &&
                      !hasMediaAssets && (
                        <>
                          {profileUserFirstName
                            ? profileUserFirstName
                            : 'This user'}{' '}
                          hasn't shared any media assets.
                        </>
                      )
                    )
                  }
                />
              )}

              {/* Non-Authenticated Public */}
              {!isAuthenticated && (
                <UserProfileTabContentHeroInnerWithCTA
                  header={
                    <>
                      <Button
                        variant="ghost"
                        size="off"
                        className={cn('rounded-full p-1.5', {
                          'cursor-default': !isAuthenticated,
                          // 'hover:bg-accent': isAuthenticated,
                        })}
                        // onClick={
                        //   isAuthenticated
                        //     ? handleCreatingAnExperience
                        //     : undefined
                        // }
                      >
                        <IconMountainSnow className="size-8" />
                      </Button>
                      <span className="">Collaborative Content</span>
                    </>
                  }
                  description={collaborativeJoinCta}
                  cta={
                    <UserJoinLink
                      variant="default"
                      href="/register"
                      label="Sign Me Up!"
                      className="group gap-1 ring-offset-2 transition-none duration-75 hover:bg-amber-700 hover:text-foreground hover:ring-2 hover:ring-foreground"
                    />
                  }
                />
              )}
            </div>
          </UserProfileTabContentHero>

          <div className="w-full py-2">
            {/* Media Gallery: Owner */}
            {isAuthUserOwnProfile && authUser && (
              <OnboardingUploadNVImages
                key={`onboarding-upload-nv-images-${enableCreatingExperience}`}
                noScrollToTopBtn
                noUploadedHeadingText
                noSummaryBtnDialogExpand
                mediaContainerClassName="border-none p-0 rounded-lg"
                noMaxNumFiles={String(authUser?.id) === '111233296'}
                uploadedAssets={mediaAssets}
                selectedMediaIds={selectedMediaIds}
                authUser={authUser}
                userProfile={userProfile}
                disableSelectingMedia={disableSelectingMedia}
                featuredMediaCacheKey={
                  authUser?.id
                    ? `${authUser.id}-${CACHE_KEY_PUBLIC_FEATURED_PHOTOS}`
                    : ''
                }
                handleOnSelectingAsset={handleSelectingMediaId}
                handleOnUnselectAllAssets={handleUnselectingAllMediaIds}
                handleOnCreateWithSelectedAssets={
                  handleEnablingCreateAnExperience
                }
              />
            )}

            {/* Media Gallery: Public (Non-Owner) */}
            {!isAuthUserOwnProfile && hasMediaAssets && (
              <PreviewUploadedAssets
                enabledEdit={false}
                noShowEditFeatures={true}
                noUseDefaultColumns
                assets={
                  isAuthenticated
                    ? mediaAssets
                    : getRandomMediaAssets(mediaAssets)
                }
                // author={author}
                isAuthenticated={isAuthenticated}
                className={cn('w-full p-0 sm:grid-cols-2', {
                  'lg:grid-cols-3': true,
                })}
              />
            )}
          </div>
        </UserProfileTabContent>
      </UserProfileTabCard>

      {enableCreatingExperience && (
        <CreateExperienceDialog
          open={enableCreatingExperience}
          userProfile={userProfile}
          existingMediaToAttach={existingMediaToAttach}
          handleOnClose={handleClosingCreateAnExperience}
          handleOnSuccess={handleSuccessfulCreateAnExperience}
        />
      )}
    </>
  );
}
