'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearPathCache, clearTagCache } from '@/actions/cache';
import { useAppState } from '@/state/app-state';
import { AlertDialogAction } from '@radix-ui/react-alert-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { md5 } from 'js-md5';
// import { useTransitionRouter } from 'next-view-transitions';
import { toast } from 'sonner';
import { useIntersectionObserver } from 'usehooks-ts';

import { timeAgo } from '@/lib/datesAndTimes';
import {
  toggleExperienceRemovedStatus,
  togglesUsersExperienceBookmarkStatus,
  togglesUsersExperienceLikeStatus,
} from '@/lib/db/queries/experience-toggles';
import {
  getCachedSingleUserExperienceForFrontend,
  updateExperiencePinStatus,
} from '@/lib/db/queries/experiences';
import { scrollToElement } from '@/lib/dom';
import { sortRawMediaForGallery } from '@/lib/media/media-utils';
import { cn, sleep } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconArrowLeft,
  IconBookmark,
  IconCaravan,
  IconCheck,
  IconCopy,
  IconEdit,
  IconEllipsisVertical,
  IconEyeOpen,
  IconHeart,
  IconHorizontalLink,
  IconMapPinned,
  IconPin,
  IconPlay,
  IconSparkle,
  IconTrash,
} from '@/components/ui/icons';
import { ReactMarkdownExtended } from '@/components/content/md/markdown';
import { SimpleTextToSpeech } from '@/components/gen-ui/speech/gen-ui-text-to-speech';
import { Prose } from '@/components/prose';
import { SharedInfoTooltip } from '@/components/tooltip';
import { UserAvatar } from '@/components/user-avatar';

import { UserProfileExperiencesSkeleton } from '@/app/(user)/profile/[userName]/_shared/profile-skeletons';

import { useUserProfile } from '../../profile/user-profile-provider';
import { CompletedExperienceResponseCtas } from '../../prompts/completed-prompt-ctas';
import { CreateExperienceDialog } from '../experience-create-dialog';
import {
  createRelevantExperiencePermalinks,
  createUserProfileExperienceTabPermalink,
  getUserProfilePermalink,
  mapSingleExperienceWithUserActions,
} from '../utils/experience-utils';
import { ExperienceMedia } from './experience-media';
import { EditSingleExperiencePost } from './experience-post-editor';
import { ExperiencePostMediaGallery } from './experience-post-gallery-dialog';
import { ExperiencePostMapDrawer } from './experience-post-map-drawer';
import { SingleExperienceViewCount } from './experience-post-meta';
import { useUserExperiencePosts } from './experience-posts-provider';
import { SingleExperienceEngagementToast } from './experience-toasts';

import type {
  ExperienceMediaModel,
  ExperienceModel,
  PartialExperienceModel,
} from '@/types/experiences';
import type { AppUser as AUTH_USER_MODEL } from '@/types/next-auth';
import type { USER_PROFILE_MODEL } from '@/types/user';

export function AlertConfirmDeleteExperience({
  open = true,
  title = 'Confirm Deleting Experience',
  message = 'Are you sure you want to delete this experience? This action cannot be undone.',
  handleOnClose,
  handleOnDelete,
}: {
  open?: boolean;
  title?: string;
  message?: string;
  handleOnClose: (nextState: boolean) => void;
  handleOnDelete: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(open);

  const handleOnOpenChange = (nextState: boolean) => {
    setIsOpen(nextState);
    if (nextState === false && typeof handleOnClose === 'function') {
      handleOnClose(nextState);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <IconTrash className="size-5 text-destructive-foreground" />
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleOnDelete}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type ExperiencePostContext = 'author' | 'viewer';

export type ViewUserPostedExperiencesMode = 'single' | 'all';

export type ViewUserPostedExperiencesProps = {
  noPromptTitle?: boolean;
  noPrefetchProfile?: boolean;
  prefetchSingleExperiences?: boolean;
  authUser?: AUTH_USER_MODEL;
  userProfile?: USER_PROFILE_MODEL;
  context?: ExperiencePostContext;
  experiences?: ExperienceModel[];
  authUserOwnsProfile?: boolean;
  createAnExperienceDialogOpen?: boolean;
  noCreateMenuOptions?: boolean;
  mode?: ViewUserPostedExperiencesMode;
  experienceId?: string;
  className?: string;
  handleOnCloseExperienceDialog?: () => void;
};

export function ViewUserPostedExperiences({
  noPromptTitle: noPromptTitleProp = false,
  prefetchSingleExperiences: prefetchSingleExperiencesProp = false,
  noPrefetchProfile: noPrefetchProfileProp = false,
  createAnExperienceDialogOpen: createAnExperienceDialogOpenProp = false,
  experiences: experiencesProp,
  noCreateMenuOptions,
  experienceId,
  mode = 'all',
  className,
  handleOnCloseExperienceDialog: handleOnCloseExperienceDialogProp,
}: ViewUserPostedExperiencesProps) {
  const router = useRouter();

  const [isMounted, setIsMounted] = React.useState(false);

  const {
    // Auth User
    userSession: authUser,
    isAuthenticated,

    // User Profile
    // userProfile,
    // userId: profileUserId,
    // userFirstName: profileUserFirstName,
  } = useAppState();

  const {
    userProfile,
    profileExperiencesPermalink,
    profileUserFirstName,
    isAuthUserOwnProfile,
  } = useUserProfile();

  const {
    // experiences,
    filteredExperiences,
    // addedExperiences,
    // updatedExperiences,
    // removedExperiences,

    // Create Experience Dialog
    createExperienceEnabled: createAnExperienceDialogOpen,

    // Handlers
    handleSortingExperiences,
    handleEnablingCreateExperience,
    handleDisablingCreateExperience,
    handleOnSuccessfullyCreatedExperience,
    handleUpdatingExperience,
    handleRemovingExperience,
  } = useUserExperiencePosts({
    experiences: experiencesProp,
  });
  // console.log(`***** Various experience lists from ViewUserPostedExperiences`, {
  //   isAuthUserOwnProfile,
  //   isAuthenticated,
  //   experiences,
  //   createAnExperienceDialogOpen,
  //   filteredExperiences,
  //   addedExperiences,
  //   updatedExperiences,
  //   removedExperiences,
  // });

  const isSingleMode = mode === 'single';
  const showSingleExperience = isSingleMode && Boolean(experienceId);
  const singleExperience = showSingleExperience
    ? filteredExperiences.find((exp) => exp.id === experienceId)
    : null;

  const filteredExperiencesToRender = showSingleExperience
    ? filteredExperiences.filter((exp) => exp.id !== experienceId)
    : filteredExperiences;

  const hasExperiences = Boolean(filteredExperiencesToRender.length);
  // console.log('**** showSingleExperience', {
  //   showSingleExperience,
  //   singleExperience,
  //   experienceId,
  //   hasExperiences,
  //   filteredExperiencesToRender,
  // });

  const [showGeoMap, setShowGeoMap] = React.useState<{
    display: boolean;
    experience: ExperienceModel | null;
  }>({ display: false, experience: null });
  // console.log(`**** showGeoMap`, showGeoMap);

  const handleOpeningMediaGeoMap = (experience: ExperienceModel) => {
    setShowGeoMap({ display: true, experience });
  };

  const handleClosingMediaGeoMap = () => {
    setShowGeoMap({ display: false, experience: null });
  };

  const handleCreatingAnExperience = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    handleEnablingCreateExperience(true);
  };

  const handleClosingCreateAnExperienceDialog = (
    nextState = false,
    refreshView = false
  ) => {
    if (refreshView) {
      router.refresh();
    }

    handleDisablingCreateExperience(nextState);
    if (typeof handleOnCloseExperienceDialogProp === 'function') {
      handleOnCloseExperienceDialogProp();
    }
  };

  const handleOnSuccessCreatingExperience = (
    newExperience: ExperienceModel,
    clearCache = true
  ) => {
    // console.log(`***** handleOnSuccessCreatingExperience invoked`, {
    //   newExperience,
    //   pathname,
    // });

    // Update the provider, cache but don't close the dialog
    handleOnSuccessfullyCreatedExperience(newExperience, clearCache, false);
  };

  const handleUpdatingExperienceById = (
    updatedExperience: ExperienceModel,
    setNewDate = false,
    clearAndRefresh = false
  ) => {
    // console.log(`**** handleUpdatingExperienceById`, {
    //   updatedExperience,
    //   clearAndRefresh,
    // });
    handleUpdatingExperience(updatedExperience, setNewDate, clearAndRefresh);
  };

  const handleRemovingExperienceById = (
    removedExperience: ExperienceModel,
    clearAndRefresh = false
  ) => {
    // console.log(`**** handleRemovingExperienceById`, {
    //   removedExperience,
    //   clearAndRefresh,
    // });
    handleRemovingExperience(removedExperience, clearAndRefresh);

    // Redirect if the user is on the single experience page
    if (isSingleMode && experienceId === removedExperience.id) {
      router.push(profileExperiencesPermalink);
    }
  };

  // Track the mounted state
  React.useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return () => {
        setIsMounted(false);
      };
    }
  }, []);

  // Open the create an experience dialog if the prop changes to true
  React.useEffect(() => {
    if (
      createAnExperienceDialogOpenProp === true &&
      createAnExperienceDialogOpen === false
    ) {
      handleEnablingCreateExperience(createAnExperienceDialogOpenProp);
    }
  }, [createAnExperienceDialogOpen, createAnExperienceDialogOpenProp]);

  return (
    <>
      {(hasExperiences || showSingleExperience) && (
        <div
          className={cn(
            'relative flex w-full flex-col gap-4 rounded-lg md:overflow-y-scroll',
            {
              'py-2 pb-20': hasExperiences,
              'gap-6': showSingleExperience,
            },
            className
          )}
        >
          {/* Show Single Experience (if requested) */}
          {showSingleExperience && singleExperience && (
            <div className="flex flex-col gap-8">
              <SingleExperiencePost
                isSingleView={isSingleMode}
                noPromptTitle={noPromptTitleProp}
                noPrefetchProfile={noPrefetchProfileProp}
                prefetchSingleExperience={prefetchSingleExperiencesProp}
                authUser={authUser}
                userProfile={userProfile}
                experience={singleExperience}
                context={isAuthUserOwnProfile ? 'author' : 'viewer'}
                handleUpdatingExperience={handleUpdatingExperienceById}
                handleRemovingExperience={handleRemovingExperienceById}
                handleOpeningMediaGeoMap={handleOpeningMediaGeoMap}
              />
              {hasExperiences && (
                <h3 className="text-center text-xl font-semibold text-foreground/85 sm:text-left md:text-2xl">
                  Other experiences by {profileUserFirstName}
                </h3>
              )}
              {!hasExperiences && (
                <h3 className="text-left text-base font-semibold text-foreground/85">
                  <Link
                    href={profileExperiencesPermalink}
                    className="flex items-center gap-0.5"
                  >
                    <IconArrowLeft /> More experiences by {profileUserFirstName}
                  </Link>
                </h3>
              )}
            </div>
          )}

          {/* Render relevant experiences */}
          {handleSortingExperiences(filteredExperiencesToRender).map(
            (experience) => {
              // if (experience.removed) {
              //   return null;
              // }
              // Skip the single experience (that's already been rendered above)
              if (showSingleExperience && experience.id === experienceId) {
                return null;
              }
              const createdAtTime = new Date(experience.createdAt).getTime();
              return (
                <SingleExperiencePost
                  key={`${experience.id}-${experience.removed}-${createdAtTime}`}
                  truncateContent
                  authUser={authUser}
                  userProfile={userProfile}
                  experience={experience}
                  noPromptTitle={noPromptTitleProp}
                  noPrefetchProfile={noPrefetchProfileProp}
                  prefetchSingleExperience={prefetchSingleExperiencesProp}
                  context={isAuthUserOwnProfile ? 'author' : 'viewer'}
                  handleUpdatingExperience={handleUpdatingExperienceById}
                  handleRemovingExperience={handleRemovingExperienceById}
                  handleOpeningMediaGeoMap={handleOpeningMediaGeoMap}
                />
              );
            }
          )}
        </div>
      )}
      {/* {!noCreateMenuOptions && isAuthenticated && (
        <ExperienceCreateHoverMenu
          handleCreatingAnExperience={handleCreatingAnExperience}
        />
      )} */}
      {createAnExperienceDialogOpen && (
        <CreateExperienceDialog
          open={createAnExperienceDialogOpen}
          userProfile={userProfile}
          handleOnClose={() =>
            handleClosingCreateAnExperienceDialog(false, true)
          }
          handleOnSuccess={handleOnSuccessCreatingExperience}
        />
      )}

      {showGeoMap.display && showGeoMap.experience && (
        <ExperiencePostMapDrawer
          open
          handleOnClose={handleClosingMediaGeoMap}
          isAuthenticated={isAuthenticated}
          experience={showGeoMap.experience}
        />
      )}
    </>
  );
}

export type SingleExperiencePostProps = {
  truncateContent?: boolean;
  truncateContentLength?: number;
  noStoryTitle?: boolean;
  noPromptTitle?: boolean;
  noExpTitle?: boolean;
  noCallToActions?: boolean;
  noPrefetchProfile?: boolean;
  noUIControls?: boolean;
  isEditing?: boolean;
  isNonProfileView?: boolean;
  isSingleView?: boolean;
  prefetchSingleExperience?: boolean;
  authUser?: AUTH_USER_MODEL;
  userProfile?: USER_PROFILE_MODEL;
  experience: ExperienceModel;
  context: ExperiencePostContext;
  enableGallery?: boolean;
  selectedMediaIndex?: number;
  className?: string;
  mediaSingleClassName?: string;
  promptChallengeLabel?: string;
  promptStoryChallengeLabel?: string;
  titleLink?: string;
  storyLink?: string;
  promptTitleLink?: string;
  redirectPathOnDelete?: string;
  handleUpdatingExperience?: (
    updatedExperience: ExperienceModel,
    setNewDate?: boolean,
    clearAndRefresh?: boolean
  ) => void;
  handleRemovingExperience?: (
    removedExperience: ExperienceModel,
    clearAndRefresh?: boolean
  ) => void;
  handleOpeningMediaGeoMap?: (experience: ExperienceModel) => void;
};

export function SingleExperiencePost({
  noPrefetchProfile = false,
  prefetchSingleExperience = false,
  truncateContent = false,
  truncateContentLength = 525,
  noStoryTitle = false,
  noPromptTitle = false,
  noExpTitle = false,
  noCallToActions = false,
  noUIControls = false,
  isEditing: isEditingProp = false,
  isNonProfileView: isNonProfileViewProp = false,
  isSingleView: isSingleViewProp = false,
  experience,
  userProfile,
  className,
  context = 'viewer',
  selectedMediaIndex: selectedMediaIndexProp = 0,
  enableGallery: enableGalleryProp = false,
  mediaSingleClassName,
  promptChallengeLabel = 'Take Prompt Challenge',
  promptStoryChallengeLabel = 'Contribute to Story Series',
  titleLink: titleLinkProp,
  storyLink: storyLinkProp,
  promptTitleLink: promptTitleLinkProp,
  redirectPathOnDelete: redirectPathOnDeleteProp,
  handleUpdatingExperience,
  handleRemovingExperience,
  handleOpeningMediaGeoMap,
}: SingleExperiencePostProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { userId, isAuthenticated } = useAppState();

  // const [experience, setExperience] = React.useState(experienceProp);

  const {
    id: expId,
    createdAt,
    updatedAt,
    title: titleProp,
    content: contentProp,
    richContent: richContentProp,
    authorId,
    removed: isRemovedProp,
    views: expViews = 0,
    // latitude,
    // longitude,
    bookmarked: bookmarkedProp,
    pinned: pinnedProp,
    liked: likedProp,
    // Array of Likes, Bookmarks, Media
    Likes = [],
    Bookmarks = [],
    Media: mediaAssets = [],
    Prompt,
    promptId,
    Story,
  } = experience;

  const { Author } = experience;

  const authorAvatar = Author?.avatar || '';
  const authorUserName = Author?.username || '';
  const authorName = Author?.name || '';
  const expAuthorId = authorId || Author?.id || '';

  const { id: promptIdFallback, prompt } = Prompt || {};

  const { id: storyId, path: storyPath, title: storyTitle } = Story || {};

  const expPromptId = promptId || promptIdFallback;

  const profileId = userProfile?.id || '';
  const profileUsername = userProfile?.username || '';

  const profilePermalink = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';

  const experiencePermalinks = createRelevantExperiencePermalinks(
    experience,
    profilePermalink
  );
  const {
    experiencePermalink,
    experienceStoryPermalink,
    experiencePromptPermalink,
    promptPermalink,
    storyPermalink,
    storyPromptPermalink,
  } = experiencePermalinks;

  const isTiedToStory = Boolean(storyPath);
  const isPromptExperience = Boolean(expPromptId);

  // Prompt permalinks are unique based on the promptId and experienceId
  const promptCompletedPermalink =
    experienceStoryPermalink ||
    experiencePromptPermalink ||
    experiencePermalink;

  // Permalink for a user to directly respond to a prompt
  const promptInvitePermalink = storyPromptPermalink || promptPermalink;

  // Overall completed experience permalink
  const completedExperiencePermalink =
    promptCompletedPermalink || experiencePermalink;

  const profileExperienceViewPermalink = profilePermalink
    ? createUserProfileExperienceTabPermalink(profilePermalink)
    : '';

  const isUserOnProfilePage = profilePermalink.includes(profileUsername);
  const isUserOnSingleExperiencePage = pathname.includes(experiencePermalink);
  const isUserOnExperiencePermalink = pathname.includes(
    completedExperiencePermalink
  );
  const linkBackToProfile = profilePermalink && !isUserOnProfilePage;

  const { isCopied: isExpContentCopied, copyToClipboard: copyExpContent } =
    useCopyToClipboard({ timeout: 2000 });

  const { isCopied: isPermalinkCopied, copyToClipboard: copyPermalink } =
    useCopyToClipboard({ timeout: 2000 });

  const [enableGallery, setEnableGallery] = React.useState(enableGalleryProp);
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(
    selectedMediaIndexProp
  );

  const mediaAssetGeoCoordinates = mediaAssets.filter((media) =>
    Boolean(media?.latitude && media?.longitude)
  );
  const mediaHasGeoCoordinates = Boolean(mediaAssetGeoCoordinates.length);
  // console.log(`***** mediaAssetGeoCoordinates`, mediaAssetGeoCoordinates);
  // console.log(`***** mediaHasGeoCoordinates`, mediaHasGeoCoordinates);

  const [isLiked, setIsLiked] = React.useState(likedProp);
  const [isBookmarked, setIsBookmarked] = React.useState(bookmarkedProp);
  const [isPinned, setIsPinned] = React.useState(Boolean(pinnedProp));

  const [isEditing, setIsEditing] = React.useState(isEditingProp);

  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRemoved, setIsRemoved] = React.useState(false);

  const [listenToTTS, setListenToTTS] = React.useState(false);

  const sortedMediaAssets = sortRawMediaForGallery<ExperienceMediaModel[]>(
    mediaAssets,
    true
  );

  const hasMediaAssets = Boolean(sortedMediaAssets.length);

  // Text-to-Speech
  const ttsTriggerBtnId = `tts-trigger-btn-${expId}`;

  const ttsAuthorName = authorName;
  const ttsStoryIntro = isTiedToStory
    ? `Part of the "${storyTitle}" Story Series.`
    : '';

  let ttsContent =
    isTiedToStory && !isPromptExperience
      ? `${ttsStoryIntro}\n\n${contentProp}`
      : isTiedToStory && isPromptExperience
        ? `${prompt}\n\n${ttsStoryIntro}\n\n${contentProp}`
        : isPromptExperience
          ? `${prompt}\n\n${contentProp}`
          : contentProp;

  // Prepend the titleProp if it exists
  if (titleProp) {
    if (!isPromptExperience) {
      ttsContent = `${titleProp}\n\n${ttsContent}`;
    }
  }

  if (ttsAuthorName) {
    ttsContent = `${ttsContent}\n\nBy ${ttsAuthorName} via Experience Nevada`;
  } else {
    ttsContent = `${ttsContent}\n\nvia Experience Nevada`;
  }

  const ttsContentHash = md5(ttsContent);

  // Handlers
  const onHandleNotAuthenticated = () => {
    toast('You must be signed in to engage with an experience.');
  };

  // View Experience Permalink
  const onViewExperiencePermalink = () => {
    if (!profileUsername) return;
    // console.log(`View Experience Permalink invoked`, { profileUsername });
    const postLink = completedExperiencePermalink;
    // const postPermalink = `${window.location.origin}${postLink}`;
    router.push(postLink, {
      scroll: false,
    });
  };

  const onViewCompletedPromptExperiencePermalink = () => {
    if (!profileUsername) return;
    // console.log(`View Experience Permalink invoked`, { profileUsername });
    const postLink = promptCompletedPermalink;
    const postPermalink = `${window.location.origin}${postLink}`;
    router.push(postPermalink, {
      scroll: false,
    });
  };

  // Copy Experience Content
  const onCopyExperienceContent = () => {
    if (isExpContentCopied) return;

    let postContent = ttsContent;

    if (profilePermalink) {
      const fullProfilePermalink = `${window.location.origin}${profileExperienceViewPermalink}`;

      postContent = `${postContent}\n\n${fullProfilePermalink}`;
    }

    const expLink = promptCompletedPermalink || experiencePermalink;

    if (expLink) {
      const expPermalink = `${window.location.origin}${expLink}`;
      postContent = `${postContent}\n${expPermalink}`;
    }

    SingleExperienceEngagementToast(
      <IconCopy className="size-4" />,
      'Experience content copied to clipboard',
      postContent
    );
    copyExpContent(postContent);
  };

  // Copy Experience Post Permalink
  const onCopyExperiencePermalink = () => {
    if (isPermalinkCopied) return;
    const promptLink = promptCompletedPermalink || experiencePermalink;

    const postPermalink = `${window.location.origin}${promptLink}`;
    SingleExperienceEngagementToast(
      <IconHorizontalLink className="size-4" />,
      'Experience permalink copied to clipboard',
      postPermalink
    );
    copyPermalink(postPermalink);
  };

  // Copy Prompt Experience Post Permalink
  const onCopyPromptExperiencePermalink = () => {
    if (isPermalinkCopied || !profileUsername) return;
    const postLink = promptCompletedPermalink;
    const postPermalink = `${window.location.origin}${postLink}`;
    SingleExperienceEngagementToast(
      <IconHorizontalLink className="size-4" />,
      'Prompt link copied to clipboard',
      postPermalink
    );
    copyPermalink(postPermalink);
  };

  // Media Gallery
  const onHandleOpeningMediaGallery = (index = 0) => {
    setEnableGallery(true);
    setSelectedMediaIndex(index);
  };

  const onHandleClosingMediaGallery = () => {
    setEnableGallery(false);
    setSelectedMediaIndex(0);
  };

  // Geo Map handlers
  const onHandleShowingMediaGeoMap = () => {
    if (!mediaHasGeoCoordinates) {
      toast.error(`Sorry, but this experience's media has no geo-coordinates.`);
      return;
    }

    if (typeof handleOpeningMediaGeoMap === 'function') {
      handleOpeningMediaGeoMap(experience);
    }
  };

  // Core handlers
  const onHandleUpdatingExperience = (
    updatedExperience: ExperienceModel,
    setNewDate = false,
    clearAndRefresh = false
  ) => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    if (updatedExperience) {
      // Update the local state
      // setExperience(updatedExperience);

      // Clear the cache and refresh the experience
      if (clearAndRefresh) {
        const { id: expId, promptId, storyId } = updatedExperience;
        clearTagCache(expId);
        if (promptId) clearTagCache(promptId);
        if (storyId) clearTagCache(storyId);

        // Refresh the page
        router.refresh();
      }

      // Update the parent state (if provided)
      if (typeof handleUpdatingExperience === 'function') {
        handleUpdatingExperience(
          { ...updatedExperience },
          setNewDate,
          clearAndRefresh
        );
      }
    }
  };

  const onHandleRemovingExperience = (
    removedExperience: ExperienceModel,
    clearAndRefresh = true
  ) => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    if (typeof handleRemovingExperience === 'function') {
      handleRemovingExperience(removedExperience, clearAndRefresh);
    } else {
      // Fallback to ensure the cache is cleared
      if (clearAndRefresh) {
        const { id: expId, promptId, storyId } = removedExperience;
        clearTagCache(expId);
        if (promptId) clearTagCache(promptId);
        if (storyId) clearTagCache(storyId);

        // Refresh the page
        router.refresh();
      }

      // Redirect to specific path if provided
      if (redirectPathOnDeleteProp) {
        router.push(redirectPathOnDeleteProp);
        return;
      }

      // Redirect to the profile page if the user is on the single experience page
      if (isNonProfileViewProp) {
        if (isUserOnSingleExperiencePage && profileExperienceViewPermalink) {
          router.push(profileExperienceViewPermalink);
        } else if (isTiedToStory && storyPermalink) {
          router.push(storyPermalink);
        }
      }
    }
  };

  const handleListeningToTTS = (nextState?: boolean) => {
    // Scroll to the TTS trigger button
    const ttsTriggerBtn = document.getElementById(ttsTriggerBtnId);

    if (ttsTriggerBtn) {
      scrollToElement(ttsTriggerBtn, 'center', 'smooth');
    }

    // Set the specific state
    if (typeof nextState === 'boolean') {
      setListenToTTS(nextState);
      return;
    }

    // Otherwise toggle the state
    setListenToTTS((prev) => !prev);
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    const nextIsLiked = !isLiked;

    // Optimistic UI update
    setIsLiked(nextIsLiked);
    SingleExperienceEngagementToast(
      nextIsLiked ? (
        <IconHeart className="size-4 fill-destructive stroke-destructive" />
      ) : (
        <IconHeart className="size-4" />
      ),
      `Experience ${isLiked ? 'unliked' : 'liked'}`,
      contentProp
    );

    // Optimistic Parent state update
    const optimisticStateUpdate = {
      ...experience,
      liked: nextIsLiked,
      // Likes: nextLikes,
    };

    // Update but don't clear the cache (yet)
    onHandleUpdatingExperience(optimisticStateUpdate, true, false);

    const actionResponse = await togglesUsersExperienceLikeStatus(
      nextIsLiked,
      userId,
      expId
    );

    // Handle the response
    if (actionResponse.error) {
      toast(`Error updating experience like status: ${actionResponse.msg}`);
      // Revert the like status
      setIsLiked(!nextIsLiked);
    } else if (!actionResponse.error && actionResponse.record) {
      // toast(`Experience ${isLiked ? 'unliked' : 'liked'}`);
      const { record: likeRecord } = actionResponse;

      const nextLikes = nextIsLiked
        ? [...Likes, likeRecord]
        : Likes.filter((like) => like.id !== likeRecord.id);

      // Parent state update
      // Clear the cache and refresh the experience
      onHandleUpdatingExperience(
        {
          ...optimisticStateUpdate,
          liked: nextIsLiked,
          Likes: nextLikes,
        },
        false, // Do not set a new date
        true // Clear and refresh the cache
      );
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    const nextIsBookmarked = !isBookmarked;

    // Optimistic UI update
    setIsBookmarked(nextIsBookmarked);
    SingleExperienceEngagementToast(
      nextIsBookmarked ? (
        <IconBookmark className="size-4 fill-foreground" />
      ) : (
        <IconBookmark className="size-4" />
      ),
      `Experience ${isBookmarked ? 'unbookmarked' : 'bookmarked'}`,
      contentProp
    );

    const optimisticStateUpdate = {
      ...experience,
      bookmarked: nextIsBookmarked,
      // Bookmarks: nextBookmarks,
    };

    // Update but don't clear the cache (yet)
    onHandleUpdatingExperience(optimisticStateUpdate, true, false);

    // Update the experience in the database
    const actionResponse = await togglesUsersExperienceBookmarkStatus(
      nextIsBookmarked,
      userId,
      expId
    );

    // Handle the response
    if (actionResponse.error) {
      toast(`Error updating experience bookmark status: ${actionResponse.msg}`);
      // Reset the like status
      setIsLiked(!nextIsBookmarked);
    } else if (!actionResponse.error && actionResponse.record) {
      // toast(`Experience ${nextIsBookmarked ? 'unbookmarked' : 'bookmarked'}`);
      const { record: bookmarkRecord } = actionResponse;

      const nextBookmarks = nextIsBookmarked
        ? [...Bookmarks, bookmarkRecord]
        : Bookmarks.filter((bm) => bm.id !== bookmarkRecord.id);

      // Parent state update
      // Clear the cache and refresh the experience
      onHandleUpdatingExperience(
        {
          ...optimisticStateUpdate,
          bookmarked: nextIsBookmarked,
          Bookmarks: nextBookmarks,
        },
        false, // Do not set a new date
        true // Clear and refresh the cache
      );
    }
  };

  const handleTogglePin = async () => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    const nextIsPinned = !isPinned;
    setIsPinned(nextIsPinned);
    SingleExperienceEngagementToast(
      nextIsPinned ? (
        <IconPin className="size-4 fill-foreground" />
      ) : (
        <IconPin className="size-4" />
      ),
      `Experience ${isPinned ? 'unpinned' : 'pinned'}`,
      contentProp
    );

    // Optimistic Parent state update
    const optimisticStateUpdate = {
      ...experience,
      updatedAt: new Date(),
      pinned: nextIsPinned,
      pinnedAt: nextIsPinned ? new Date() : null,
    };
    // console.log(`**** optimisticStateUpdate for pin`, {
    //   optimisticStateUpdate,
    //   nextIsPinned,
    //   expId,
    // });
    // Update but don't clear the cache (yet)
    onHandleUpdatingExperience(optimisticStateUpdate, true, false);

    // Update the experience in the database
    const updateActionResponse = await updateExperiencePinStatus(
      expId,
      nextIsPinned
    );

    // Handle the response
    if (typeof updateActionResponse === 'string') {
      toast(`Error updating experience pin status: ${updateActionResponse}`);
      // Reset the pin status
      setIsPinned(!nextIsPinned);
    } else {
      // toast(`Experience ${isPinned ? 'unpinned' : 'pinned'}`);
      // Parent state update
      // Clear the cache and refresh the experience
      onHandleUpdatingExperience(
        {
          ...optimisticStateUpdate,
          ...updateActionResponse,
        } as ExperienceModel,
        false, // Do not set a new date
        true // Clear and refresh the cache
      );
    }
  };

  const handleDeletingExperience = async () => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    setIsDeleting(true);

    // Optimistic UI update
    const nextIsRemoved = true;
    setIsRemoved(nextIsRemoved);
    await sleep(275);
    onHandleRemovingExperience(
      {
        ...experience,
        removed: true,
      },
      false // Do not clear and refresh...yet
    );

    const t = SingleExperienceEngagementToast(
      <IconTrash className="size-4" />,
      'Deleting experience',
      contentProp
    );

    setIsDeleting(false);
    setConfirmDelete(false);

    toast.dismiss(t);
    SingleExperienceEngagementToast(
      <IconTrash className="size-4 fill-destructive stroke-destructive" />,
      'Experience deleted',
      contentProp
    );

    // Update the experience in the database
    const { toggled: expToggled, msg: errMsg } =
      await toggleExperienceRemovedStatus(expId, nextIsRemoved);
    // console.log("**** removal toggled on server?", { expToggled, expId });

    // Handle the response
    if (!expToggled) {
      toast(`Error removing experience: ${errMsg}`);
      // Reset the removal status
      setIsRemoved(!nextIsRemoved);
      onHandleRemovingExperience(
        {
          ...experience,
          removed: false,
        },
        true
      );
    } else {
      // toast(`Experience ${nextIsRemoved ? 're-added' : 'removed'}`);
      // Update parent state on successful removal in db
      onHandleRemovingExperience(
        {
          ...experience,
          removed: true,
        },
        true // Clear and refresh cache
      );
    }
  };

  const handleCancellingConfirmDelete = (nextState = false) => {
    setConfirmDelete(nextState);
  };

  // Prefetch the experience permalink if we're only showing a truncated version
  React.useEffect(() => {
    if (
      !isUserOnSingleExperiencePage &&
      promptCompletedPermalink &&
      truncateContent
    ) {
      router.prefetch(promptCompletedPermalink);
    }
  }, [promptCompletedPermalink, truncateContent, isUserOnSingleExperiencePage]);

  const isDisabled = isDeleting;
  const expIsRemoved = isRemovedProp || isRemoved;
  // const animationKey = `${experience.id}-${expIsRemoved}`;
  const enableAuthorActions = context === 'author';

  const contentToUse = richContentProp || contentProp || '';
  const contentToDisplay = truncateContent
    ? contentProp.length > truncateContentLength
      ? `${contentProp.slice(0, truncateContentLength)} — [Read more](${promptCompletedPermalink})...`
      : contentToUse
    : contentToUse;

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={experience.id}
          layout
          // initial={{ scale: 0.8, opacity: 0 }}
          animate={
            expIsRemoved ? { scale: 0.1, opacity: 0 } : { scale: 1, opacity: 1 }
          }
          // exit={{
          //   scale: 0.1,
          //   translateX: -1200,
          //   transitionDelay: '5s',
          //   // opacity: 0,
          //   // transform: 'rotate(180deg) translateX(200%)',
          // }}
          transition={{ type: 'spring', duration: 0.725 }}
          className={cn(
            'group/experience-post relative',
            'grid grid-cols-12 gap-3',
            'px-4 py-2 leading-none sm:py-4',
            'sm:bg-accent/30',
            // 'border-b border-t border-border sm:rounded-lg sm:border'
            'sm:rounded-lg sm:border',
            // 'last:border-b-0',
            className
          )}
        >
          <div className="col-span-12 flex flex-col gap-3">
            <div className="flex gap-2">
              <div>
                {linkBackToProfile && (
                  <Link href={profileExperienceViewPermalink}>
                    <UserAvatar
                      src={authorAvatar}
                      className="opacity-65 transition-opacity duration-150 group-hover/experience-post:opacity-100"
                      containerClassName="size-8 md:size-9"
                    />
                  </Link>
                )}
                {!linkBackToProfile && (
                  <UserAvatar
                    src={authorAvatar}
                    className="opacity-65 transition-opacity duration-150 group-hover/experience-post:opacity-100"
                    containerClassName="size-8 md:size-9"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                {authorUserName && !linkBackToProfile && (
                  <span className="font-medium brightness-90">
                    {authorUserName}
                  </span>
                )}
                {authorUserName && linkBackToProfile && (
                  <Link
                    href={profileExperienceViewPermalink}
                    className="no-underline"
                  >
                    <span className="cursor-pointer font-medium brightness-90">
                      {authorUserName}
                    </span>
                  </Link>
                )}
                {createdAt && (
                  <span className="text-[smaller] brightness-50">
                    {timeAgo(createdAt)}
                  </span>
                )}
                {isEditing && (
                  <Badge variant="secondary" className="bg-orange-600">
                    <span className="text-xs font-normal">Editing</span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="relative z-10 flex max-w-full flex-col flex-wrap gap-3 leading-normal brightness-90 transition-all duration-150 group-hover/experience-post:brightness-100 md:gap-3">
              <Prose className="lg:prose-lg">
                {storyTitle && !noStoryTitle && (
                  <h2
                    className={cn(
                      'not-prose mb-1 flex items-center gap-2 text-base font-semibold text-muted-foreground sm:text-base',
                      {
                        'hover:text-foreground': Boolean(storyPermalink),
                      }
                    )}
                  >
                    {!storyPermalink && <span>{storyTitle}</span>}
                    {storyPermalink && (
                      <Link href={storyPermalink} className="no-underline">
                        <span className="">{storyTitle}</span>
                      </Link>
                    )}
                    <Badge
                      variant="outline"
                      className="hidden whitespace-nowrap sm:block"
                    >
                      Story Series
                    </Badge>
                  </h2>
                )}
                {titleProp && !prompt && !noExpTitle && (
                  <h3
                    className={cn(
                      'text-xl font-medium',
                      'transition-all duration-150',
                      {
                        'sm:text-2xl sm:font-bold sm:leading-normal lg:text-3xl xl:text-4xl xl:leading-normal':
                          isSingleViewProp || isNonProfileViewProp,

                        'sm:text-2xl sm:font-bold sm:leading-normal':
                          isUserOnProfilePage && !isSingleViewProp,
                      }
                    )}
                  >
                    {(!experiencePermalink || isUserOnSingleExperiencePage) &&
                      titleProp}
                    {experiencePermalink && !isUserOnSingleExperiencePage && (
                      <Link
                        href={experiencePermalink}
                        className="font-[inherit] text-[inherit] no-underline hover:no-underline hover:brightness-150"
                      >
                        {titleProp}
                      </Link>
                    )}
                  </h3>
                )}
                {prompt && !noPromptTitle && (
                  <h3
                    className={cn(
                      'text-xl font-medium',
                      'transition-all duration-150',
                      {
                        'sm:text-2xl sm:font-bold sm:leading-normal lg:text-3xl xl:text-4xl xl:leading-normal':
                          isSingleViewProp || isNonProfileViewProp,

                        'sm:text-2xl sm:font-bold sm:leading-normal':
                          isUserOnProfilePage && !isSingleViewProp,
                      }
                    )}
                  >
                    {promptCompletedPermalink && (
                      <Link
                        href={promptCompletedPermalink}
                        className="no-underline hover:no-underline hover:brightness-150"
                      >
                        {prompt}
                      </Link>
                    )}
                    {!promptCompletedPermalink && prompt}
                  </h3>
                )}
              </Prose>
              <div className="experience-content">
                {!isEditing && (
                  <ReactMarkdownExtended
                    className="text-foreground/90"
                    // linkClassName="text-link-prose"
                  >
                    {contentToDisplay}
                  </ReactMarkdownExtended>
                )}
                {isEditing && richContentProp && contentProp && (
                  <EditSingleExperiencePost
                    key={`edit-single-ex-post-${expId}`}
                    autoFocus
                    expId={expId}
                    disabled={isDisabled}
                    rawContent={contentProp}
                    richContent={richContentProp}
                    handleCancelEdit={() => setIsEditing(false)}
                    handleCloseEdit={() => setIsEditing(false)}
                    handleOnUpdateContent={(rawText, mdText) => {
                      if (rawText && mdText) {
                        const updatedExperience = {
                          ...experience,
                          content: rawText,
                          richContent: mdText,
                        };

                        onHandleUpdatingExperience(
                          updatedExperience,
                          true,
                          true
                        );
                      }
                    }}
                  />
                )}
              </div>
            </div>
            {hasMediaAssets && !expIsRemoved && (
              <div className="flex h-full py-2">
                <ExperienceMedia
                  videoAutoPlay
                  showIndividualMapIcon
                  mediaGalleryOpened={enableGallery}
                  // media={[...mediaAssets, ...mediaAssets, ...mediaAssets]}
                  media={sortedMediaAssets}
                  mediaSingleClassName={mediaSingleClassName}
                  onClickSingleMediaGallery={onHandleOpeningMediaGallery}
                />
              </div>
            )}
            {!noUIControls && (
              <div className="flex flex-col items-start justify-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 sm:grow">
                  <Button
                    variant="ghost"
                    size="off"
                    disabled={isDisabled}
                    className="group/post-icon rounded-full p-2 hover:bg-accent/80"
                    onClick={handleToggleLike}
                  >
                    <IconHeart
                      className={cn(
                        'size-5 sm:size-5',
                        'brightness-75 transition-colors duration-150 hover:cursor-pointer hover:brightness-100',
                        {
                          'fill-destructive': isLiked,
                          'stroke-destructive': isLiked,
                        }
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="off"
                    disabled={isDisabled}
                    className="group/post-icon rounded-full p-2 hover:bg-accent/80"
                    onClick={handleToggleBookmark}
                  >
                    <IconBookmark
                      className={cn(
                        'size-5 sm:size-5',
                        'brightness-75 transition-colors duration-150 hover:cursor-pointer group-hover/post-icon:brightness-100',
                        {
                          'fill-foreground': isBookmarked,
                        }
                      )}
                    />
                  </Button>

                  {mediaHasGeoCoordinates && (
                    <Button
                      variant="ghost"
                      size="off"
                      disabled={isDisabled}
                      className="group/post-icon rounded-full p-2 hover:bg-accent/80"
                      onClick={onHandleShowingMediaGeoMap}
                    >
                      <IconMapPinned
                        className={cn(
                          'size-5 sm:size-5',
                          'brightness-75 transition-colors duration-150 hover:cursor-pointer group-hover/post-icon:brightness-100'
                        )}
                      />
                    </Button>
                  )}

                  {/* Copy Content */}
                  <Button
                    variant="ghost"
                    size="off"
                    disabled={isDisabled}
                    className="group/post-icon rounded-full p-2 hover:bg-accent/80"
                    onClick={onCopyExperienceContent}
                  >
                    {isExpContentCopied && (
                      <IconCheck className="size-5 text-success-foreground sm:size-5" />
                    )}
                    {!isExpContentCopied && (
                      <IconCopy
                        className={cn(
                          'size-5 sm:size-5',
                          'brightness-75 transition duration-150 hover:cursor-pointer group-hover/post-icon:scale-105 group-hover/post-icon:brightness-100'
                        )}
                      />
                    )}
                  </Button>

                  {/* Play Content Audio */}
                  {ttsContent && (
                    <SimpleTextToSpeech
                      key={ttsContentHash}
                      expId={expId}
                      expAuthorId={expAuthorId}
                      open={listenToTTS}
                      text={ttsContent}
                      triggerbtnId={ttsTriggerBtnId}
                      handleOnOpenChange={handleListeningToTTS}
                    />
                  )}

                  <SingleExperienceViewCount
                    expId={expId}
                    viewCount={expViews}
                    triggerClassName="ml-auto"
                  />
                </div>

                {(isPromptExperience || isTiedToStory) && (
                  <div className="relative flex items-center gap-1.5">
                    <Link
                      href={promptInvitePermalink || storyPermalink}
                      className={cn(
                        buttonVariants({
                          variant: 'secondary',
                          size: 'sm',
                          className:
                            'group relative h-[unset] gap-1 rounded-2xl text-sm ring-offset-2 transition-none duration-75 hover:text-foreground hover:ring-2 hover:ring-foreground',
                        }),
                        {
                          'bg-amber-700/70 px-2 py-1 hover:bg-amber-700':
                            !isTiedToStory,
                          'bg-tertiary/90 px-2 py-1 hover:bg-tertiary':
                            isTiedToStory,
                        }
                      )}
                      // onClick={(e) => {
                      //   e.preventDefault();
                      //   e.stopPropagation();
                      //   onViewPromptInvitePermalink();
                      // }}
                    >
                      <IconSparkle className="size-3.5 transition-transform group-hover:rotate-180" />

                      <span>
                        {isTiedToStory
                          ? promptStoryChallengeLabel
                          : promptChallengeLabel}
                      </span>
                    </Link>
                    <span
                      className={cn(
                        'absolute -top-0.5 left-1 inline-flex size-1.5 animate-ping-slow rounded-full opacity-75 sm:left-[unset] sm:right-1',
                        {
                          'bg-amber-500': !isTiedToStory,
                          'bg-tertiary': isTiedToStory,
                        }
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {!noCallToActions && (
              <CompletedExperienceResponseCtas
                experience={experience}
                className="gap-2"
                itemProps={{
                  itemVariant: 'secondary',
                  itemSize: 'tiny',
                  className:
                    'sm:max-w-full py-2 px-3 sm:py-1 leading-none sm:px-3 text-foreground/70 font-normal hover:text-foreground/90',
                  noCustomStyles: true,
                }}
              />
            )}
          </div>
          {!noUIControls && (
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1.5 sm:right-2 sm:top-2">
              {(context === 'author' || isPinned) && (
                <SharedInfoTooltip title="Pinned Experience" content="" asChild>
                  <Button
                    // disabled
                    variant="ghost"
                    size="off"
                    className={cn(
                      'rounded-full p-1.5 leading-none text-foreground/20',
                      {
                        'cursor-default': isDisabled || context === 'viewer',
                      }
                    )}
                    onClick={context === 'author' ? handleTogglePin : undefined}
                    disabled={isDisabled || context === 'viewer'}
                  >
                    <IconPin
                      className={cn('fill size-5', {
                        'fill-foreground': isPinned,
                      })}
                    />
                  </Button>
                </SharedInfoTooltip>
              )}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="off"
                    disabled={isDisabled}
                    className="rounded-full p-1.5 leading-none text-foreground/70 hover:text-foreground/100"
                  >
                    <IconEllipsisVertical className="size-5" />
                    <span className="sr-only">Options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  // side="top"
                  className="flex w-44 flex-col gap-0.5 md:w-56"
                >
                  <DropdownMenuGroup>
                    {enableAuthorActions && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            handleTogglePin();
                          }}
                          className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                        >
                          <span>
                            {isPinned ? 'Unpin from' : 'Pin to'} Profile
                          </span>
                          <IconPin
                            className={cn('size-4', {
                              'fill-foreground': !isPinned,
                            })}
                          />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleListeningToTTS();
                        }}
                        className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                      >
                        <span>
                          Listen to <span className="sr-only">TTS</span> Audio
                        </span>
                        <IconPlay className={cn('size-4')} />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>

                    {/* For Everyone */}
                    {/* Take Prompt Challenge */}
                    {promptInvitePermalink && (
                      <DropdownMenuItem
                        asChild
                        // onClick={(e) => {
                        //   e.preventDefault();
                        //   e.stopPropagation();
                        //   onViewPromptInvitePermalink();
                        // }}
                        // disabled={isUserOnSingleExperiencePage}
                        className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                      >
                        <Link href={promptInvitePermalink || storyPermalink}>
                          <span>
                            {isTiedToStory
                              ? 'Contribute to Story Series'
                              : 'Take Challenge'}
                          </span>
                          <IconSparkle className="" />
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {/* Prompt Challenge Experiences */}
                    {promptCompletedPermalink && (
                      <>
                        {!isTiedToStory && (
                          <DropdownMenuItem
                            asChild
                            onClick={() => {
                              onViewCompletedPromptExperiencePermalink();
                            }}
                            // disabled={isUserOnSingleExperiencePage}
                            className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                          >
                            <Link href={promptCompletedPermalink}>
                              <span>View Prompt</span>
                              <IconCaravan className="" />
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            onCopyExperiencePermalink();
                          }}
                          className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                        >
                          <span>Copy Permalink</span>
                          {!isPermalinkCopied && (
                            <IconHorizontalLink
                              className={cn('size-4 -rotate-45')}
                            />
                          )}
                          {isPermalinkCopied && (
                            <IconCheck className={cn('size-4')} />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            onViewExperiencePermalink();
                          }}
                          disabled={isUserOnExperiencePermalink}
                          className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                        >
                          <span>View Permalink</span>
                          {!isPermalinkCopied && (
                            <IconEyeOpen className={cn('size-4')} />
                          )}
                          {isPermalinkCopied && (
                            <IconCheck className={cn('size-4')} />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Regular Experiences */}
                    {!promptCompletedPermalink && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            onViewExperiencePermalink();
                          }}
                          disabled={isUserOnSingleExperiencePage}
                          className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                        >
                          <span>View Experience</span>
                          <IconCaravan className="" />
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            onCopyExperiencePermalink();
                          }}
                          className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                        >
                          <span>Copy Permalink</span>
                          {!isPermalinkCopied && (
                            <IconHorizontalLink
                              className={cn('size-4 -rotate-45')}
                            />
                          )}
                          {isPermalinkCopied && (
                            <IconCheck className={cn('size-4')} />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {enableAuthorActions && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setIsEditing(true);
                          }}
                          className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-secondary focus:text-secondary-foreground"
                        >
                          <span>Edit Text</span>
                          <IconEdit className="size-4" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {enableAuthorActions && (
                      <DropdownMenuItem
                        onClick={() => {
                          setConfirmDelete(true);
                        }}
                        className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-destructive focus:text-destructive-foreground"
                      >
                        <span>Delete</span>
                        <IconTrash className="size-4" />
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {confirmDelete && !expIsRemoved && (
        <AlertConfirmDeleteExperience
          handleOnClose={handleCancellingConfirmDelete}
          handleOnDelete={handleDeletingExperience}
        />
      )}
      {enableGallery && hasMediaAssets && !expIsRemoved && (
        <ExperiencePostMediaGallery
          open
          noShowContent
          selectedIndex={selectedMediaIndex}
          handleOnClose={onHandleClosingMediaGallery}
          experience={experience}
          media={sortedMediaAssets}
        />
      )}
    </>
  );
}

export type LazyExperiencePostProps = {
  partialExperience: PartialExperienceModel;
  intersectingThreshold?: number;
  truncateContent?: boolean;
  truncateContentLength?: number;
  noExpTitle?: boolean;
  noPromptTitle?: boolean;
  noStoryTitle?: boolean;

  // Handlers
  handleUpdatingExperience?: (
    updatedExperience: ExperienceModel,
    setNewDate?: boolean,
    clearAndRefresh?: boolean
  ) => void;
  handleRemovingExperience?: (
    removedExperience: ExperienceModel,
    clearAndRefresh?: boolean
  ) => void;
  handleOpeningMediaGeoMap?: (experience: ExperienceModel) => void;
};

/**
 * Lazy loaded experience post
 *
 * @note This component is used to lazy load experience posts
 * @note Adjust the `intersectingThreshold` to control when the post is loaded
 */
export function LazyExperiencePost({
  partialExperience,
  intersectingThreshold = 0.25,
  truncateContent = false,
  truncateContentLength = 525,
  noExpTitle = false,
  noPromptTitle = false,
  noStoryTitle = false,

  handleOpeningMediaGeoMap,
  // handleRemovingExperience: handleRemovingExperienceProp,
  // handleUpdatingExperience: handleUpdatingExperienceProp,
  ...rest
}: LazyExperiencePostProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { userSession, userId: authUserId } = useAppState();
  const { userProfile, isAuthUserOwnProfile } = useUserProfile();

  const {
    handleUpdatingExperience: handleUpdatingExperienceProvider,
    handleRemovingExperience: handleRemovingExperienceProvider,
    handleInitializingSingleExperience:
      handleInitializingSingleExperienceProvider,
  } = useUserExperiencePosts();

  if (!partialExperience) return null;
  if (!partialExperience.id) return null;
  if (partialExperience.blocked) return null;

  const { id: expId } = partialExperience;

  const [isMounted, setIsMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const [experience, setExperience] = React.useState<ExperienceModel | null>(
    null
  );

  const { isIntersecting, ref: intersectionRef } = useIntersectionObserver({
    threshold: intersectingThreshold,
  });

  // Handlers
  const handleUpdatingExperienceById = (
    updatedExperience: ExperienceModel,
    setNewDate = false,
    clearAndRefresh = false
  ) => {
    // console.log(`**** handleUpdatingExperienceById`, {
    //   updatedExperience,
    //   clearAndRefresh,
    // });
    // Update local state
    setExperience(updatedExperience);

    if (clearAndRefresh) {
      clearTagCache(expId);
      clearPathCache(pathname);
      router.refresh();
    }

    // Update provider and cache
    if (typeof handleUpdatingExperienceProvider === 'function') {
      handleUpdatingExperienceProvider(
        updatedExperience,
        setNewDate,
        clearAndRefresh
      );
    }
  };

  const handleRemovingExperienceById = (
    removedExperience: ExperienceModel,
    clearAndRefresh = false
  ) => {
    // console.log(`**** handleRemovingExperienceById`, {
    //   removedExperience,
    //   clearAndRefresh,
    // });
    // Update local state
    setExperience(removedExperience);

    // Update provider and cache
    if (typeof handleRemovingExperienceProvider === 'function') {
      handleRemovingExperienceProvider(removedExperience, clearAndRefresh);
    }
  };

  // Fetch the experience
  React.useEffect(() => {
    const fetchExperience = async () => {
      setIsLoading(true);

      const fullExperience =
        await getCachedSingleUserExperienceForFrontend(expId);

      if (fullExperience) {
        const mappedFullExperience = authUserId
          ? mapSingleExperienceWithUserActions(fullExperience, authUserId)
          : fullExperience;

        setExperience(mappedFullExperience);
        setIsLoaded(true);
        // await sleep(20000);
        setIsLoading(false);

        // Add the experience to the provider
        handleInitializingSingleExperienceProvider(mappedFullExperience);
      } else {
        setIsLoading(false);
        toast.error(`Error loading experience: ${expId}`);
      }
    };

    if (!expId) return;

    if (!isMounted) {
      setIsMounted(true);
    }

    if (isMounted && isIntersecting && !isLoaded && !isLoading) {
      fetchExperience();
    }
  }, [expId, isMounted, isLoaded, isLoading, isIntersecting]);

  return (
    <div
      ref={intersectionRef}
      className={cn('relative min-h-60 w-full', {
        hidden: experience?.removed,
      })}
    >
      {isLoading && (
        <UserProfileExperiencesSkeleton
          fullSkeletonWidth
          numOfAdditionalSkeletons={2}
          expCount={1}
          className="px-0"
        />
      )}
      {isLoaded && experience && (
        <SingleExperiencePost
          // noPromptTitle={noPromptTitleProp}
          // noPrefetchProfile={noPrefetchProfileProp}
          // prefetchSingleExperience={prefetchSingleExperiencesProp}
          truncateContent={truncateContent}
          truncateContentLength={truncateContentLength}
          noExpTitle={noExpTitle}
          noPromptTitle={noPromptTitle}
          noStoryTitle={noStoryTitle}
          authUser={userSession}
          userProfile={userProfile}
          experience={experience}
          context={isAuthUserOwnProfile ? 'author' : 'viewer'}
          handleUpdatingExperience={handleUpdatingExperienceById}
          handleRemovingExperience={handleRemovingExperienceById}
          handleOpeningMediaGeoMap={handleOpeningMediaGeoMap}
        />
      )}
    </div>
  );
}

export type ViewUserProfileLazyPartialExperiencesProps = {
  noExpTitle?: LazyExperiencePostProps['noExpTitle'];
  noPromptTitle?: LazyExperiencePostProps['noPromptTitle'];
  noStoryTitle?: LazyExperiencePostProps['noStoryTitle'];
  truncateContent?: LazyExperiencePostProps['truncateContent'];
  truncateContentLength?: LazyExperiencePostProps['truncateContentLength'];

  experiences: PartialExperienceModel[];
  className?: string;
  handleOnCloseExperienceDialog?: () => void;
};

/**
 * Alternate experience posts view that lazy loads each post
 */
export function ViewUserProfileLazyPartialExperiences({
  experiences,
  noExpTitle = false,
  noPromptTitle = false,
  noStoryTitle = false,
  truncateContent = false,
  truncateContentLength = 525,
  className,
  handleOnCloseExperienceDialog: handleOnCloseExperienceDialogProp,
  ...rest
}: ViewUserProfileLazyPartialExperiencesProps) {
  const router = useRouter();

  const { isAuthenticated } = useAppState();
  const { userProfile } = useUserProfile();

  const [showGeoMap, setShowGeoMap] = React.useState<{
    display: boolean;
    experience: ExperienceModel | null;
  }>({ display: false, experience: null });
  // console.log(`**** showGeoMap`, showGeoMap);

  const {
    // experiences,
    // filteredExperiences,
    // addedExperiences,
    // updatedExperiences,
    // removedExperiences,

    // Create Experience Dialog
    createExperienceEnabled: createAnExperienceDialogOpen,

    // Handlers
    // handleSortingExperiences,
    // handleEnablingCreateExperience,
    handleDisablingCreateExperience,
    handleOnSuccessfullyCreatedExperience,
  } = useUserExperiencePosts();

  const handleOpeningMediaGeoMap = (experience: ExperienceModel) => {
    setShowGeoMap({ display: true, experience });
  };

  const handleClosingMediaGeoMap = () => {
    setShowGeoMap({ display: false, experience: null });
  };

  const handleOnSuccessCreatingExperience = (
    newExperience: ExperienceModel,
    clearCache = true
  ) => {
    // Update the provider, cache but don't close the dialog
    handleOnSuccessfullyCreatedExperience(newExperience, clearCache, false);
  };

  const handleClosingCreateAnExperienceDialog = (
    nextState = false,
    refreshView = false
  ) => {
    if (refreshView) {
      router.refresh();
    }

    handleDisablingCreateExperience(nextState);
    if (typeof handleOnCloseExperienceDialogProp === 'function') {
      handleOnCloseExperienceDialogProp();
    }
  };

  return (
    <React.Fragment>
      <div
        className={cn(
          'relative flex w-full flex-col gap-4 rounded-lg py-2 pb-20 md:overflow-y-scroll',
          className
        )}
      >
        {experiences.map((experience, index) => {
          if (experience.blocked) return null;
          if (experience.removed) return null;
          // const expDate = experience.updatedAt;
          // const expDateTime = new Date(expDate).getTime();
          return (
            <LazyExperiencePost
              key={`view-lazy-load-exp-${experience.id}`}
              noExpTitle={noExpTitle}
              noPromptTitle={noPromptTitle}
              noStoryTitle={noStoryTitle}
              partialExperience={experience}
              intersectingThreshold={index <= 1 ? 0 : undefined}
              truncateContent={truncateContent}
              truncateContentLength={truncateContentLength}
              handleOpeningMediaGeoMap={handleOpeningMediaGeoMap}
              // handleRemovingExperience={handleRemovingExperienceById}
              // handleUpdatingExperience={handleUpdatingExperienceById}
            />
          );
        })}
      </div>

      {/* Create an Experience Dialog/Drawer */}
      {createAnExperienceDialogOpen && (
        <CreateExperienceDialog
          open={createAnExperienceDialogOpen}
          userProfile={userProfile}
          handleOnClose={() =>
            handleClosingCreateAnExperienceDialog(false, true)
          }
          handleOnSuccess={handleOnSuccessCreatingExperience}
        />
      )}

      {/* Show User a Map of an Experience's Media */}
      {showGeoMap.display && showGeoMap.experience && (
        <ExperiencePostMapDrawer
          open
          handleOnClose={handleClosingMediaGeoMap}
          isAuthenticated={isAuthenticated}
          experience={showGeoMap.experience}
        />
      )}
    </React.Fragment>
  );
}
