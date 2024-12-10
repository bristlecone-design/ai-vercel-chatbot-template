'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { useUserPrompts } from '@/state/prompt-provider';
import { motion } from 'framer-motion';

import { getUsersFirstNameFromName } from '@/lib/user/user-utils';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  IconCaravan,
  IconChallengePrompts,
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconProfileUserCircle,
  IconRefresh,
} from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';

import { ExperienceLocationInfo } from '../experiences/experience-location-info';
import { SingleExperienceEngagementToast } from '../experiences/posts/experience-toasts';
import {
  createPromptChallengePermalink,
  createUserCompletedPromptChallengePermalink,
} from '../experiences/utils/experience-prompt-utils';
import {
  createUserProfileExperienceTabPermalink,
  getUserProfilePermalink,
} from '../experiences/utils/experience-utils';
import { CompletedPromptResponse } from './completed-prompt-response';
import { ChallengePromptProseContainer } from './prompt-shared-containers';

import type { GeneratedExperienceUserPrompt } from '@/types/experience-prompts';

export function ViewPromptTickerItem({
  item,
  delay = 0,
  disabled = false,
  className,
  handleOnPauseToggle,
  handleOnSelectingPrompt,
}: {
  delay?: number;
  disabled?: boolean;
  className?: string;
  item: GeneratedExperienceUserPrompt;
  handleOnPauseToggle?: (nextState: boolean) => void;
  handleOnSelectingPrompt: (prompt: GeneratedExperienceUserPrompt) => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, translateY: 250 }}
      animate={{
        scale: 1,
        opacity: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
        translateY: 0,
      }}
      transition={{ type: 'spring', duration: 1, delay: 0.03 * delay }}
      onHoverStart={() => {
        if (disabled) return;
        handleOnPauseToggle?.(true);
      }}
      onHoverEnd={() => {
        if (disabled) return;
        handleOnPauseToggle?.(false);
      }}
      onClick={() => {
        if (disabled) return;
        handleOnSelectingPrompt(item);
      }}
      className={cn('', className)}
    >
      <span>{item.prompt}</span>
    </motion.div>
  );
}

export type ViewPromptTickerProps = {
  className?: string;
  disableSelection?: boolean;
  defaultPrompt?: GeneratedExperienceUserPrompt | null;
};

export function ViewPromptTicker({
  className,
  defaultPrompt,
  disableSelection = false,
}: ViewPromptTickerProps) {
  const router = useRouter();

  const [isReady, setIsReady] = React.useState(false);

  const {
    isCopied: isPromptInvitePermalinkCopied,
    copyToClipboard: copyPromptInvitePermalinkToClipboard,
  } = useCopyToClipboard({ timeout: 2500 });

  const [enableGallery, setEnableGallery] = React.useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0);

  const {
    userId,
    isAuthenticated,
    userAvatar,
    userFirstName,
    userDisplayName,
    userLocation,
    isPreciseLocation,
  } = useAppState();

  const {
    experiencePrompt,

    storyId,
    storyPath,
    storyTitle,
    storyPermalinkAbsolute,
    storyPermalinkRelative,

    isReady: arePromptsReady,
    fetchingPrompts,
    generatingPrompts,
    userPromptChallenges,
    userSelectedPrompt,
    currentUserPrompt,
    userCompletedPrompts,
    isPromptSelectionOpen,
    isPromptSingleView,
    isPromptCompletionView,
    isUserSelectedPromptCompleted,
    isUserSelectedPromptCompletedAuthUsers,
    userPromptChallengeAcceptance,
    handleInitializingPrompts,
    handleSelectingPromptChallenge,
    handleSelectingRandomPromptChallenge,
    handleGeneratingExperiencePrompts,
    handlePausingPromptChallengeAutoChange,
    handleTogglingPromptChallengeAcceptance,
    handleTogglingPromptSelectionView,
    handleTogglingCompletePromptView,
  } = useUserPrompts({
    currentUserPrompt: defaultPrompt,
  });
  // console.log(`**** props in ticker`, {
  //   // isReady,
  //   // isAuthenticated,
  //   // isPromptSingleView,
  //   // isPromptCompletionView,
  //   // isUserSelectedPromptCompleted,
  //   // isUserSelectedPromptCompletedAuthUsers,
  //   // userSelectedPrompt,
  //   // currentUserPrompt,
  //   // defaultPrompt,
  //   // experiencePrompt,
  //   // userSelectedPrompt,
  //   // currentUserPrompt,
  //   // userAvatar,
  //   // userFirstName,
  //   // userLocation,
  //   // isPreciseLocation,
  // });

  const currentActivePrompt = userSelectedPrompt || currentUserPrompt;
  const isPromptSelected = Boolean(userSelectedPrompt);
  const hasPromptChallenges = Boolean(userPromptChallenges?.length);
  const hasCompletedChallenges = Boolean(userCompletedPrompts?.length);

  const initializingPrompts =
    (!hasPromptChallenges || !arePromptsReady) &&
    (fetchingPrompts || generatingPrompts);

  const usersExperiencePrompt = experiencePrompt ? experiencePrompt : null;
  const hasUserExpMedia = Boolean(usersExperiencePrompt?.Media?.length);

  // Data for the user's prompt response and completed status
  const usersPromptResponse =
    isUserSelectedPromptCompleted && usersExperiencePrompt
      ? usersExperiencePrompt.content
      : '';

  const usersPromptExpMedia =
    isUserSelectedPromptCompleted && usersExperiencePrompt
      ? (usersExperiencePrompt.Media ?? [])
      : [];

  const usersPromptAvatar = isUserSelectedPromptCompleted
    ? (currentActivePrompt?.Collaborator?.avatar ??
      currentActivePrompt?.Author?.avatar ??
      '')
    : isAuthenticated
      ? userAvatar
      : '';

  const userPromptFirstName = getUsersFirstNameFromName(
    isUserSelectedPromptCompleted
      ? (currentActivePrompt?.Collaborator?.name ??
          currentActivePrompt?.Author?.name)
      : userDisplayName
  );

  const userPromptUsername =
    isUserSelectedPromptCompleted && currentActivePrompt
      ? (currentActivePrompt?.Collaborator?.username ??
        currentActivePrompt?.Author?.username)
      : '';

  const userPromptProfilePath = userPromptUsername
    ? getUserProfilePermalink(userPromptUsername)
    : '';

  const userPromptProfileExperiencePath = userPromptProfilePath
    ? createUserProfileExperienceTabPermalink(userPromptProfilePath)
    : '';

  const promptInviteLink = currentActivePrompt
    ? createPromptChallengePermalink(currentActivePrompt.id)
    : '';

  const promptCompletedPermalink =
    isUserSelectedPromptCompleted && experiencePrompt?.id
      ? createUserCompletedPromptChallengePermalink(experiencePrompt.id)
      : '';

  const handleOnSelectingPromptChallenge = (
    item: GeneratedExperienceUserPrompt
  ) => {
    handleTogglingPromptChallengeAcceptance(true);
    handleSelectingPromptChallenge(item);
  };

  const handleOnDeselectingPromptChallenge = () => {
    handleTogglingPromptChallengeAcceptance(false);
    handleSelectingRandomPromptChallenge();
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

  /**
   * Handle the user selecting a prompt challenge
   *
   */
  const handleOnItemSelection = (item: GeneratedExperienceUserPrompt) => {
    if (userSelectedPrompt?.id === item.id) {
      return;
    }

    handleOnSelectingPromptChallenge(item);
  };

  const handleCopyingInvitePromptPermalink = (permalink = promptInviteLink) => {
    if (isPromptInvitePermalinkCopied || !permalink) {
      return;
    }

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptInvitePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCheck />,
      `Prompt Invite Link Copied ${currentActivePrompt ? `(${currentActivePrompt.title})` : ''}`.trim(),
      fullPermalink
    );
  };

  const handleCopyingCompletedPromptPermalink = (
    permalink = promptCompletedPermalink
  ) => {
    if (isPromptInvitePermalinkCopied || !permalink) {
      return;
    }

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptInvitePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCheck />,
      `Completed Prompt Link Copied ${currentActivePrompt ? `(${currentActivePrompt.title})` : ''}`.trim(),
      fullPermalink
    );
  };

  const handleTakingPromptChallenge = (permalink = promptInviteLink) => {
    if (isPromptInvitePermalinkCopied || !permalink) {
      return;
    }

    router.push(permalink);

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptInvitePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCaravan />,
      `Routing to challenge ${currentActivePrompt ? `(${currentActivePrompt.title})` : ''}`.trim(),
      fullPermalink
    );
  };

  const handleSelectingMorePromptChallengesLink = (e: React.MouseEvent) => {
    // Prevent the default action and show the prompt selection view
    if (isAuthenticated) {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute('href');

      handleTogglingPromptSelectionView();
    }

    // Proceed to the link (e.g. challenges)
  };

  /**
   * Ready the component
   */
  React.useEffect(() => {
    if (!isReady) {
      setIsReady(true);
    }
  }, [isReady]);

  /**
   * Initialize the prompt challenges if not ready/required
   */
  React.useEffect(() => {
    if (
      !isReady ||
      initializingPrompts ||
      isPromptCompletionView ||
      isPromptSingleView
    ) {
      return;
    }

    if (isReady && !hasPromptChallenges && !arePromptsReady) {
      handleInitializingPrompts();
    }
  }, [
    isReady,
    initializingPrompts,
    arePromptsReady,
    hasPromptChallenges,
    isPromptSingleView,
    isPromptCompletionView,
  ]);

  /**
   * Convenience vars
   */

  const isSingleOrCompletionView = isPromptSingleView || isPromptCompletionView;

  const isBusy = fetchingPrompts || generatingPrompts;

  const disablePromptLink = isBusy || !currentActivePrompt;

  const disableShuffle = isBusy || !hasPromptChallenges;

  const disableViewAll = isBusy || !hasPromptChallenges;

  const disableCompletedButton =
    isBusy || !hasPromptChallenges || !hasCompletedChallenges;

  const disableTickerSelection =
    disableSelection ||
    userPromptChallengeAcceptance ||
    (isUserSelectedPromptCompleted && isSingleOrCompletionView);

  return (
    <ChallengePromptProseContainer className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-6">
        <div
          className={cn('flex flex-col gap-4', {
            'gap-8': isSingleOrCompletionView && isUserSelectedPromptCompleted,
            'flex-col-reverse':
              isSingleOrCompletionView && isUserSelectedPromptCompleted,
          })}
        >
          <div className="flex justify-center gap-2">
            {usersPromptAvatar && !userPromptProfileExperiencePath && (
              <UserAvatar src={usersPromptAvatar} className="" />
            )}
            {usersPromptAvatar && userPromptProfileExperiencePath && (
              <Link href={userPromptProfileExperiencePath}>
                <UserAvatar src={usersPromptAvatar} className="" />
              </Link>
            )}
            <h3 className="mt-0 text-center">{`${userPromptFirstName && !initializingPrompts ? userPromptFirstName : initializingPrompts ? 'Initializing' : 'Howdy Visitor'}...`}</h3>
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-1">
            <div
              className={cn(
                'relative mx-auto overflow-hidden',
                buttonVariants({
                  variant: 'default',
                }),
                {
                  'bg-foreground/90 text-background': isPromptSelected,
                  'ring-2 ring-ring ring-offset-4': isPromptSelected,
                  'w-full max-w-108': initializingPrompts,
                  'cursor-pointer': !disableTickerSelection,
                },
                'h-min whitespace-normal py-2'
              )}
            >
              {currentActivePrompt && (
                <ViewPromptTickerItem
                  key={currentActivePrompt.prompt}
                  item={currentActivePrompt}
                  disabled={disableTickerSelection}
                  handleOnPauseToggle={handlePausingPromptChallengeAutoChange}
                  handleOnSelectingPrompt={handleOnItemSelection}
                />
              )}
              {(initializingPrompts || !hasPromptChallenges) &&
                !currentActivePrompt && (
                  <BlockSkeleton className="h-8 w-full" />
                )}
            </div>
            {storyId && storyPermalinkRelative && (
              <p className="flex w-full flex-col items-center justify-center gap-1.5 text-sm font-medium leading-none sm:flex-row">
                <span className="hidden sm:inline-block">Filed under:</span>{' '}
                <Link href={storyPermalinkRelative}>
                  <Badge
                    variant="secondary"
                    className="bg-white/5 text-[inherit] hover:bg-white/10"
                  >
                    {storyTitle}
                  </Badge>
                </Link>{' '}
              </p>
            )}
          </div>
        </div>
        {isUserSelectedPromptCompleted && usersExperiencePrompt && (
          <CompletedPromptResponse expPrompt={usersExperiencePrompt} />
        )}
      </div>
      <div className="flex w-full flex-col-reverse items-start justify-between gap-4 sm:items-center sm:justify-around sm:gap-6">
        <div className="">
          <ExperienceLocationInfo
            userLocation={userLocation}
            isPreciseLocation={isPreciseLocation}
            className="text-foreground/60"
            locationClassName=""
          />
        </div>

        {isUserSelectedPromptCompleted && isSingleOrCompletionView && (
          <div className="grid w-full grow grid-cols-2 flex-col justify-center gap-3 sm:flex sm:flex-row">
            {isUserSelectedPromptCompleted && (
              <span className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm font-medium transition-colors">
                <span
                  className={cn(
                    buttonVariants({
                      size: 'off',
                      variant: 'default',
                      className: 'rounded-full p-1',
                    })
                  )}
                >
                  <IconCircleCheck className="group-hover:text-tertiary size-4 transition-transform duration-300 group-hover:scale-110 group-hover:brightness-125" />
                </span>
                <span className="brightness-85 group-hover:brightness-100">
                  <span className="sr-only">Prompt</span>
                  Completed
                </span>
              </span>
            )}

            {isPromptSingleView && !isUserSelectedPromptCompletedAuthUsers && (
              <Link
                href={promptInviteLink}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopyingInvitePromptPermalink();
                }}
                className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm font-medium no-underline transition-colors"
              >
                <span
                  className={cn(
                    buttonVariants({
                      size: 'off',
                      variant: 'default',
                      className: 'rounded-full p-1',
                    })
                  )}
                >
                  {isPromptInvitePermalinkCopied && (
                    <IconCheck className="size-4" />
                  )}
                  {!isPromptInvitePermalinkCopied && (
                    <IconCopy className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                  )}
                </span>
                <span className="brightness-85 group-hover:brightness-100">
                  Invite Link
                </span>
              </Link>
            )}

            {(isPromptSingleView || isPromptCompletionView) &&
              isUserSelectedPromptCompletedAuthUsers && (
                <Link
                  href={promptCompletedPermalink}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyingCompletedPromptPermalink();
                  }}
                  className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm font-medium no-underline transition-colors"
                >
                  <span
                    className={cn(
                      buttonVariants({
                        size: 'off',
                        variant: 'default',
                        className: 'rounded-full p-1',
                      })
                    )}
                  >
                    {isPromptInvitePermalinkCopied && (
                      <IconCheck className="size-4" />
                    )}
                    {!isPromptInvitePermalinkCopied && (
                      <IconCopy className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                    )}
                  </span>
                  <span className="brightness-85 group-hover:brightness-100">
                    Share Link
                  </span>
                </Link>
              )}

            {isPromptCompletionView &&
              !isUserSelectedPromptCompletedAuthUsers && (
                <Link
                  href={promptInviteLink}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTakingPromptChallenge();
                  }}
                  className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm font-medium no-underline transition-colors"
                >
                  <span
                    className={cn(
                      buttonVariants({
                        size: 'off',
                        variant: 'default',
                        className: 'rounded-full p-1',
                      })
                    )}
                  >
                    <IconCaravan className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                  </span>
                  <span className="brightness-85 group-hover:brightness-100">
                    Take Challenge
                  </span>
                </Link>
              )}

            <Link
              href="/prompts"
              className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm font-medium no-underline transition-colors"
              onClick={handleSelectingMorePromptChallengesLink}
            >
              <span
                className={cn(
                  buttonVariants({
                    size: 'off',
                    variant: 'default',
                    className: 'rounded-full p-1',
                  })
                )}
              >
                <IconChallengePrompts className="group-hover:text-tertiary size-4 transition-transform duration-300 group-hover:rotate-45 group-hover:brightness-125" />
              </span>
              <span className="brightness-85 group-hover:brightness-100">
                More Challenges
              </span>
            </Link>

            {isPromptCompletionView &&
              userPromptProfilePath &&
              !isUserSelectedPromptCompletedAuthUsers && (
                <Link
                  href={`${userPromptProfilePath}/experiences`}
                  className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm font-medium no-underline transition-colors"
                >
                  <span
                    className={cn(
                      buttonVariants({
                        size: 'off',
                        variant: 'default',
                        className: 'rounded-full p-1',
                      })
                    )}
                  >
                    <IconProfileUserCircle className="group-hover:text-tertiary size-4 transition-transform duration-300 group-hover:scale-110 group-hover:brightness-125" />
                  </span>
                  <span className="brightness-85 group-hover:brightness-100">
                    {userPromptFirstName}&apos;s Profile
                  </span>
                </Link>
              )}
          </div>
        )}

        {!isUserSelectedPromptCompleted && (
          <div className="grid grow grid-cols-2 gap-2.5 sm:flex sm:justify-center sm:gap-3">
            <Label
              className={cn('group flex items-center gap-1.5', {
                'cursor-default': disableShuffle,
                'cursor-pointer': !disableShuffle,
              })}
            >
              <Button
                size="off"
                variant="default"
                disabled={disableShuffle}
                className="group h-[unset] rounded-full p-1 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectingRandomPromptChallenge(
                    currentActivePrompt?.prompt,
                    isSingleOrCompletionView
                  );
                }}
              >
                <IconRefresh
                  className={cn('size-4 transition-transform duration-300', {
                    'group-hover:rotate-180 group-hover:brightness-125':
                      !disableShuffle,
                  })}
                />
                <span className="sr-only">Refresh prompt</span>
              </Button>
              <span
                className={cn('brightness-85', {
                  'group-hover:brightness-100': !disableShuffle,
                })}
              >
                Shuffle
              </span>
            </Label>

            <Link
              href="/prompts"
              onClick={
                !disableViewAll
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTogglingPromptSelectionView();
                    }
                  : undefined
              }
              className={cn(
                'group flex items-center gap-1.5 text-sm no-underline',
                {
                  'cursor-default': disableViewAll,
                  'cursor-pointer': !disableViewAll,
                }
              )}
            >
              <span
                className={cn(
                  buttonVariants({
                    size: 'off',
                    variant: 'default',
                    className:
                      'group h-[unset] rounded-full p-1 transition-colors',
                  })
                )}
              >
                <IconChallengePrompts className="group-hover:text-tertiary size-4 transition-transform duration-300 group-hover:rotate-45 group-hover:brightness-125" />
              </span>
              <span className="brightness-85 transition-colors group-hover:brightness-100">
                All Challenges
              </span>
            </Link>

            <Link
              href={promptInviteLink}
              onClick={
                !disablePromptLink
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyingInvitePromptPermalink();
                    }
                  : undefined
              }
              className={cn(
                'group flex items-center gap-1.5 text-sm no-underline',
                {
                  'cursor-default': disablePromptLink,
                }
              )}
            >
              <span
                className={cn(
                  buttonVariants({
                    size: 'off',
                    variant: 'default',
                    className:
                      'group h-[unset] rounded-full p-1 transition-colors',
                  })
                )}
              >
                {isPromptInvitePermalinkCopied && (
                  <IconCheck className="size-4" />
                )}
                {!isPromptInvitePermalinkCopied && (
                  <IconCopy className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                )}
              </span>
              <span className="brightness-85 transition-colors group-hover:brightness-100">
                Share Link
              </span>
            </Link>

            <Label
              className={cn('group flex items-center gap-1.5', {
                'cursor-default': disableCompletedButton,
                'cursor-pointer': !disableCompletedButton,
              })}
            >
              <Button
                size="off"
                variant="default"
                disabled={disableCompletedButton}
                className={cn(
                  'group h-[unset] rounded-full p-1 transition-colors'
                )}
                // disabled={formDisabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTogglingCompletePromptView();
                }}
              >
                <IconCircleCheck className="group-hover:text-tertiary size-4 transition-transform duration-300 group-hover:scale-110 group-hover:brightness-125" />
              </Button>
              <span className="brightness-85 group-hover:brightness-100">
                View Completed
              </span>
            </Label>
          </div>
        )}
      </div>
    </ChallengePromptProseContainer>
  );
}
