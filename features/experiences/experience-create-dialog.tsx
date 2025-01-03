'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { streamPersonalizedResponseToUserExperienceCreation } from '@/actions/experience-prompts';
import { useAppState } from '@/state/app-state';
import { useUserPrompts } from '@/state/prompt-provider';
import { readStreamableValue } from 'ai/rsc';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { cn, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DialogRootProps } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import {
  IconArrowLeft,
  IconCirclePlus,
  IconDices,
  IconHorizontalLink,
} from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { AnimatedSuccessCheck } from '@/components/animations/animated-success-check';
import { LinkCta } from '@/components/cta-link';
import { DialogDiscoverSplashScreen } from '@/components/discovery/dialog-discover-splash-screen';

import { ViewAndSelectPrompts } from '../prompts/view-and-select-prompts';
import {
  ExperienceCreateForm,
  type ExperienceCreateFormProps,
} from './experience-create-form';
import { NUM_OF_ALLOWED_MEDIA_ATTACHMENTS } from './experience-post-constants';
import {
  createUserProfileExperiencePermalink,
  getUserProfilePermalink,
} from './utils/experience-utils';

import type { ExperienceModel } from '@/types/experiences';
import type { USER_PROFILE_MODEL } from '@/types/user';

type SNAP_POINT_TYPE = number | string | null;
type SNAP_POINT_TYPES = Array<string | number>;

/**
 * Create Experience Dialog (Drawer)
 *
 * Example: https://codesandbox.io/p/devbox/drawer-with-scale-forked-73f8jw?file=%2Fapp%2Fmy-drawer.tsx%3A13%2C89-13%2C100
 */

export interface CreateExperienceDialogProps extends DialogRootProps {
  openPromptSelection?: boolean;
  noCloseBtn?: boolean;
  dismissable?: boolean;
  closeThreshold?: number;
  closeOnOutsideClick?: boolean;
  userProfile?: USER_PROFILE_MODEL;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  title?: string;
  prompt?: string;
  promptTitle?: string;
  promptChallengeAccepted?: boolean;
  enableDynamicPrompt?: boolean;
  noFocusOnOpen?: boolean;
  noShowPrompt?: boolean;
  requiresAuthentication?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  noShowCreateMenuOnClose?: boolean;
  noMinimizeOnOutsideClick?: boolean;
  snapPoints?: SNAP_POINT_TYPES;
  existingMediaToAttach?: ExperienceCreateFormProps['existingMediaToAttach'];
  numOfAllowedMedia?: ExperienceCreateFormProps['numOfAllowedMedia'];
  handleOnClose?: () => void;
  handleOnSuccess?: ExperienceCreateFormProps['handleOnSuccess'];
}

export function CreateExperienceDialog({
  noCloseBtn = false,
  enableDynamicPrompt = false,
  closeOnOutsideClick = false,
  dismissable = true,
  closeThreshold = 0.1,
  noFocusOnOpen = false,
  noShowPrompt = false,
  noShowCreateMenuOnClose = true,
  noMinimizeOnOutsideClick = true,
  requiresAuthentication = true,
  promptChallengeAccepted: promptChallengeAcceptedProp = false,
  titleClassName,
  snapPoints = [1, 2],
  userProfile,
  title: titleProp = 'Share an Experience',
  prompt: promptChallengeProp,
  promptTitle: promptChallengeTitleProp,
  contentProps,
  className,
  children,
  open,
  openPromptSelection,
  isAuthenticated: isAuthenticatedProp,
  existingMediaToAttach = [],
  numOfAllowedMedia = NUM_OF_ALLOWED_MEDIA_ATTACHMENTS,
  handleOnClose,
  handleOnSuccess,
  ...props
}: CreateExperienceDialogProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const router = useRouter();
  const { isAuthenticated, userFirstName } = useAppState();

  const isUserAuthenticated = isAuthenticatedProp || isAuthenticated;

  const {
    isPromptSelectionOpen,
    promptPaginationEnabled,
    currentUserPrompt,
    userSelectedPrompt,
    currentUserPromptChallengeSet: currentPrompts,
    userPromptChallenges = [],
    // userPromptChallengeContext,
    fetchingPrompts,
    userPromptChallengeAcceptance: promptChallengeAccepted,
    handleTogglingPromptSelectionView,
    handleSelectingRandomPromptChallenge,
    handleTogglingPromptChallengeAcceptance,
    handleSelectingPromptChallenge,
    handlePaginatingPromptChallenges: paginatePrompts,
  } = useUserPrompts();
  // console.log(`**** prompt data in experience create dialog`, {
  //   currentUserPrompt,
  //   userSelectedPrompt,
  //   currentPrompts,
  //   fetchingPrompts,
  //   promptChallengeAccepted,
  // });

  // States
  const [isOpen, setIsOpen] = React.useState(open);

  const [enableModalInteraction, setEnableModalInteraction] =
    React.useState(false);

  const [activeSnap, setActiveSnap] = React.useState<SNAP_POINT_TYPE>(1);

  const [isCreationPending, startTransition] = useTransition();

  const [creatingExperience, setCreatingExperience] = React.useState<boolean>();

  const [experienceCreated, setExperienceCreated] = React.useState(false);

  const [createdExperience, setCreatedExperience] =
    React.useState<ExperienceModel | null>(null);

  const [personalizedReply, setPersonalizedReply] = React.useState<string>('');

  const [isFormProcessing, setIsFormProcessing] = React.useState(false);

  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);
  const nestedDrawerCloseRef = React.useRef<HTMLButtonElement>(null);

  // Flags
  const profileUsername = userProfile?.username || '';

  const profilePermalink = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';

  const experiencePermalink = createdExperience
    ? createUserProfileExperiencePermalink(
        createdExperience.id,
        profilePermalink
      )
    : '';

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    // console.log(`handleOnOpenChange invoked in create experience dialog`, {
    //   nextState,
    // });
    setIsOpen(nextState);
    if (!nextState && typeof handleOnClose === 'function') {
      await sleep(350);
      handleOnClose();
    }
  };

  const handleOnEscapeKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOnOpenChange(false);
    }
  };

  const handleClosePrimaryDrawer = () => {
    // setIsOpen(false);
    handleOnOpenChange(false);
  };

  const hanldeToggleNestedDrawer = () => {
    setExperienceCreated((prev) => !prev);
  };

  const handleCloseNestedDrawer = () => {
    setExperienceCreated(false);
  };

  const handleClosingNestedAndPrimaryDrawer = async () => {
    handleCloseNestedDrawer();
    await sleep(500);

    handleClosePrimaryDrawer();
    await sleep(350);

    if (typeof handleOnClose === 'function') {
      await sleep(350);
      handleOnClose();
    }
  };

  const handleTogglingPromptSelectionDrawer = (nextState?: boolean) => {
    if (typeof nextState !== 'undefined') {
      handleTogglingPromptSelectionView(nextState);
      return;
    }

    handleTogglingPromptSelectionView();
  };

  const handleSelectingNewPromptChallenge = async (
    ...args: Parameters<typeof handleSelectingPromptChallenge>
  ) => {
    // Turn on the prompt challenge acceptance if it's not already on
    if (!promptChallengeAccepted) {
      handleTogglingPromptChallengeAcceptance(true);
    }
    handleSelectingPromptChallenge(...args);
    await sleep(350);
    handleTogglingPromptSelectionDrawer(false);
  };

  const handleSurpriseMePromptChallenge = async (
    prompt?: string,
    closeAfter = true
  ) => {
    // Turn on the prompt challenge acceptance if it's not already on
    if (!promptChallengeAccepted) {
      handleTogglingPromptChallengeAcceptance(true);
    }
    handleSelectingRandomPromptChallenge(prompt);
    if (closeAfter) {
      await sleep(500);
      handleTogglingPromptSelectionDrawer(false);
    }
  };

  const handleOpeningNestedPromptSelectionDrawer = () => {
    handleTogglingPromptSelectionView(true);
  };

  const handleClosingNestedPromptSelectionDrawer = () => {
    handleTogglingPromptSelectionView(false);
  };

  const handleMinimizingDrawerSnapPoint = (minSnap = snapPoints[0]) => {
    setActiveSnap(minSnap);
  };

  const handleMaximizingDrawerSnapPoint = (
    maxSnap = snapPoints[snapPoints.length - 1]
  ) => {
    setActiveSnap(maxSnap);
  };

  /**
   * Handle generating personalized reply to the user's prompt challenge response
   */
  const handleGeneratingPersonalizedReply = async (
    userResponse: string,
    expOrPromptTitle?: string
  ) => {
    // console.log('***** handleGeneratingPersonalizedReply invoked', {
    //   userResponse,
    //   expOrPromptTitle,
    // });

    if (!userResponse) {
      return;
    }

    const { reply } = await streamPersonalizedResponseToUserExperienceCreation(
      userResponse,
      expOrPromptTitle,
      userFirstName
    );

    // @see https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
    for await (const delta of readStreamableValue(reply)) {
      setPersonalizedReply(
        (currentGeneration) => `${currentGeneration}${delta}`
      );
    }
  };

  /**
   * Invoked when the user is ready to create the experience
   */
  const handleOnCreateExperience = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formContent = formData.get('content') as string;

      const isFormValid = formRef.current.reportValidity();
      const hasContent = Boolean(formContent);

      if (isFormValid && hasContent) {
        setIsFormProcessing(true);
        formRef.current.requestSubmit();
      } else {
        setIsFormProcessing(false);
        toast.error('Please fill out the required info');
      }
    }
  };

  /**
   * Invoked when the form begins creating the experience
   */
  const handleOnStartCreating = (content?: string, promptOrTitle?: string) => {
    // console.log('***** handleOnStartCreating invoked', {
    //   content,
    //   promptOrTitle,
    // });

    startTransition(() => {
      setCreatingExperience(true);
    });

    if (content) {
      handleGeneratingPersonalizedReply(content, promptOrTitle);
    }
  };

  /**
   * Invoked when the experience is successfully created
   */
  const handleOnSuccessfulExperienceCreate = (
    newExperience: ExperienceModel
  ) => {
    // Let's queue up the next prompt
    if (promptChallengeAccepted) {
      handleSelectingRandomPromptChallenge();
    }

    if (typeof handleOnSuccess === 'function') {
      handleOnSuccess(newExperience);
    }
  };

  /**
   * Invoked when the form submission completes, regardless of success or failure
   */
  const handleOnCreateExperienceComplete = (
    successState: boolean,
    completeData?: ExperienceModel
  ) => {
    // Re-enable the form
    setIsFormProcessing(false);

    if (successState) {
      // setIsOpen(false);
      setExperienceCreated(true);

      if (completeData) {
        setCreatedExperience(completeData as ExperienceModel);
      }

      nestedDrawerCloseRef.current?.focus();
    }

    startTransition(() => {
      setCreatingExperience(false);
    });
  };

  /**
   * Invoked when the user is ready to view the created experience
   */
  const handleViewingCreatedExperience = () => {
    if (createdExperience) {
      handleClosingNestedAndPrimaryDrawer();

      if (experiencePermalink) {
        const finalExperiencePermalink = `${window.location.origin}${experiencePermalink}`;
        router.push(finalExperiencePermalink);
      }
    }
  };

  // Focus on the close button when the experience is created
  React.useEffect(() => {
    if (experienceCreated && nestedDrawerCloseRef.current) {
      nestedDrawerCloseRef.current.focus();
    }
  }, [experienceCreated]);

  const displayPrompt = !noShowPrompt && prompt;

  if (requiresAuthentication && !isUserAuthenticated) {
    return (
      <DialogDiscoverSplashScreen
        noCloseBtn={false}
        lightOverlay={false}
        cb={handleClosePrimaryDrawer}
      />
    );
  }

  const title = promptChallengeAccepted ? 'Prompt Challenge' : titleProp;

  const showNestedDrawer =
    creatingExperience || experienceCreated || isFormProcessing;

  const disableForm =
    creatingExperience || isFormProcessing || experienceCreated;

  const userExperienceBeingCreated =
    (isFormProcessing || (Boolean(personalizedReply) && isCreationPending)) &&
    !experienceCreated;

  return (
    <Drawer
      {...props}
      modal={!enableModalInteraction}
      // modal={snap === 1}
      // handleOnly
      open={isOpen}
      shouldScaleBackground
      dismissible={dismissable}
      closeThreshold={closeThreshold}
      snapPoints={snapPoints}
      activeSnapPoint={isOpen ? activeSnap : 0}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
      setActiveSnapPoint={setActiveSnap}
      // onRelease={(e) => {
      //   console.log('onRelease invoked', e);
      // }}
    >
      <DrawerContent
        {...contentRestProps}
        onEscapeKeyDown={handleOnEscapeKeyDown}
        noCloseBtn={noCloseBtn || contentRestProps.noCloseBtn}
        onPointerDownOutside={(event) => {
          // console.log(`***** onPointerDownOutside invoked`, event);
          if (!noMinimizeOnOutsideClick) {
            handleMinimizingDrawerSnapPoint();
            event.preventDefault();
          } else {
            if (!enableModalInteraction) {
              handleClosePrimaryDrawer();
              event.stopPropagation();
            }
          }
        }}
        onClick={(event) => {
          if (!noMinimizeOnOutsideClick && activeSnap !== 1) {
            handleMaximizingDrawerSnapPoint();
          }
        }}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[3px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className={cn(
          'min-h-[80svh] bg-background/95 backdrop-blur-lg sm:max-h-[98svh] sm:min-h-[98svh]',
          {
            'cursor-pointer': activeSnap !== 1,
          }
        )}
      >
        <div className="min-w-full max-w-4xl overflow-y-auto">
          <DrawerHeader className={cn('mx-auto shrink pb-4 sm:pb-8 md:px-0')}>
            <DrawerTitle
              asChild
              className={cn(
                'flex items-center justify-center gap-2 truncate text-2xl font-semibold md:text-3xl lg:text-4xl',
                'pb-4 pt-8',
                // {
                //   'py-8': !promptChallengeAccepted,
                //   'pb-3 pt-8': promptChallengeAccepted,
                // },
                titleClassName
              )}
            >
              <motion.h2
                // key={title}
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                // exit={{ scale: 0.1, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.725, delay: 0.1 }}
              >
                {title}
                {promptChallengeAccepted && (
                  <Link
                    href="/prompts"
                    className="flex items-center gap-1.5 text-sm font-normal brightness-50 hover:underline hover:underline-offset-2"
                  >
                    <IconHorizontalLink className="size-3.5 -rotate-45" />
                    <span>More</span>
                  </Link>
                )}
              </motion.h2>
            </DrawerTitle>

            <DrawerDescription
              className={cn(
                'hidden sm:block',
                'text-center text-xl font-normal text-foreground/90',
                {
                  'text-foreground/90': promptChallengeAccepted,
                  'text-foreground/70': !promptChallengeAccepted,
                }
              )}
            >
              {promptChallengeAccepted &&
                userSelectedPrompt &&
                userSelectedPrompt.prompt}
              {!promptChallengeAccepted &&
                'Everyone has something neat to share and discover'}

              {promptChallengeAccepted && fetchingPrompts && (
                <BlockSkeleton className="h-10 w-full" />
              )}
            </DrawerDescription>
          </DrawerHeader>

          <div
            className={cn(
              'px-4 py-4 md:px-0',
              'mx-auto min-h-fit w-full max-w-4xl justify-center',
              // 'prose-h2:my-0 prose-p:my-0',
              {
                hidden: activeSnap !== 1,
              }
            )}
          >
            <div className={cn('mx-auto w-full max-w-xl')}>
              {isOpen && (
                <ExperienceCreateForm
                  hideSubmitButton
                  noPromptChallengeInfo
                  noPromptChallengeRefresh
                  noPromptChallengeViewAll
                  noPromptChallengeToggleSwitch
                  formRef={formRef}
                  inputTitleLabelClassName="hidden"
                  inputContentLabelClassName="hidden"
                  numOfAllowedMedia={numOfAllowedMedia}
                  existingMediaToAttach={existingMediaToAttach}
                  inputContentPlaceholder={currentUserPrompt?.prompt}
                  disabled={disableForm}
                  promptChallenge={userSelectedPrompt}
                  promptChallengeEnabled={promptChallengeAccepted}
                  handleOnComplete={handleOnCreateExperienceComplete}
                  handleOnSuccess={handleOnSuccessfulExperienceCreate}
                  handleOnStartCreating={handleOnStartCreating}
                  handleTogglingPromptChallengeAcceptance={
                    handleTogglingPromptChallengeAcceptance
                  }
                  handleSelectingNewRandomPrompt={
                    handleSelectingRandomPromptChallenge
                  }
                  handleViewingPromptChallenges={
                    handleTogglingPromptSelectionDrawer
                  }
                />
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="justify-between p-2 sm:p-4">
          <div className="flex flex-row-reverse items-center justify-between gap-4">
            <Button
              tabIndex={0}
              variant="outline"
              size="lg"
              className={cn(
                'group gap-2 rounded-xl border-4 border-border/40 py-5 transition-colors duration-75 hover:text-success-foreground focus:bg-tertiary focus:text-tertiary-foreground'
              )}
              onClick={handleOnCreateExperience}
              disabled={disableForm}
            >
              <IconCirclePlus className="size-5 transition-transform duration-300 group-hover:rotate-180 group-hover:brightness-125 group-focus:rotate-180 group-focus:brightness-125" />
              <span>Create</span>
            </Button>
            <Button
              size="default"
              variant="ghost"
              onClick={() => handleOnOpenChange(false)}
              className={cn(
                'group gap-1.5 rounded-xl border-4 border-background py-5 text-foreground/70 transition-colors duration-75'
              )}
            >
              <IconArrowLeft className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
              Back
            </Button>
          </div>
        </DrawerFooter>

        {/* View Prompt Challenges */}
        <DrawerNested
          nested
          open={isPromptSelectionOpen}
          onOpenChange={async (nextState) => {
            // console.log(`DrawerNested onOpenChange`, { nextState });
            if (!nextState) {
              handleClosingNestedPromptSelectionDrawer();
            }
          }}
        >
          <DrawerContent className="max-h-[99svh] min-h-[94svh] sm:max-h-[80svh] sm:min-h-[84svh]">
            <DrawerHeader className={cn('')}>
              <DrawerTitle
                asChild
                className={cn(
                  'flex items-center justify-center gap-2 truncate text-2xl font-semibold md:text-3xl lg:text-4xl',
                  'pb-3 pt-8',
                  titleClassName
                )}
              >
                <h3>Select a Challenge</h3>
              </DrawerTitle>

              <DrawerDescription
                className={cn(
                  'mx-auto max-w-[98%] text-center text-xl font-normal text-foreground/90 sm:max-w-full'
                )}
              >
                Choose a challenge to share your experience.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex w-full grow items-start justify-start overflow-y-auto p-2">
              <ViewAndSelectPrompts
                prompts={currentPrompts}
                currentPrompt={userSelectedPrompt}
                handleOnSelectingPrompt={handleSelectingNewPromptChallenge}
                // className="flex-col-reverse"
              />
            </div>

            <DrawerFooter className="">
              <div className="flex w-full justify-between">
                <Button
                  size="sm"
                  flavor="ring"
                  variant="outline"
                  onClick={() => {
                    handleClosingNestedPromptSelectionDrawer();
                  }}
                  className={cn(
                    'group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75 hover:text-success-foreground'
                  )}
                >
                  <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                  Back
                </Button>

                <div className="flex gap-3.5">
                  {promptPaginationEnabled && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          paginatePrompts(-1);
                        }}
                        className={cn(
                          'group gap-1.5 rounded-xl border-4 py-4 transition-colors duration-75'
                        )}
                      >
                        <IconArrowLeft className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                        Prev Prompts
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          paginatePrompts(1);
                        }}
                        className={cn(
                          'group gap-1.5 rounded-xl border-4 py-4 transition-colors duration-75'
                        )}
                      >
                        Next Prompts
                        <IconArrowLeft className="size-3 rotate-180 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:brightness-125" />
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      handleSurpriseMePromptChallenge(
                        userSelectedPrompt?.prompt
                      );
                    }}
                    className={cn(
                      'group gap-1.5 rounded-xl border-4 py-4 transition-colors duration-75'
                    )}
                  >
                    <IconDices className="size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:brightness-125" />
                    Surprise Me
                  </Button>
                </div>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </DrawerNested>

        {/* Successfully Created Experience Message */}
        <DrawerNested
          nested
          open={showNestedDrawer}
          onOpenChange={async (nextState) => {
            // console.log(`DrawerNested onOpenChange`, { nextState });
            if (!nextState) {
              handleClosingNestedAndPrimaryDrawer();
            }
          }}
        >
          <DrawerContent className="min-h-[80%]">
            <div className="mx-auto flex h-full min-h-full max-w-lg flex-col items-center justify-center gap-12 py-20">
              <div className="flex flex-col gap-4">
                <h3 className="text-center text-3xl font-medium">
                  {experienceCreated
                    ? 'Experience Created'
                    : creatingExperience || isFormProcessing
                      ? 'Creating Experience'
                      : ''}
                </h3>
                {/* Money: Experience Created! */}
                {experienceCreated && (
                  <AnimatedSuccessCheck className="mx-auto size-32 text-success-foreground lg:size-40" />
                )}

                {/* Show Animation Rotation */}
                {userExperienceBeingCreated && (
                  // <AnimatedRotation className="mx-auto size-32 text-primary-foreground lg:size-40" />
                  <div
                    className={cn(
                      'group/experience-post relative',
                      'grid grid-cols-12 gap-3',
                      'h-32 w-full max-w-2xl',
                      'mx-auto px-2 py-6 leading-none sm:py-4',
                      'hover:bg-accent/50 sm:bg-accent/30',
                      // 'border-b border-t border-border sm:rounded-lg sm:border'
                      'sm:rounded-lg sm:border'
                    )}
                  >
                    <BlockSkeleton className="absolute inset-0 size-full" />
                  </div>
                )}

                {/* Show Personalized Response to Experience Content */}
                {personalizedReply && (
                  <div className="mb-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 p-3.5 text-lg font-medium md:p-6 md:text-xl">
                    <div>{personalizedReply}</div>
                  </div>
                )}
              </div>
              {/* CTAs for Created Experience */}
              {experienceCreated && (
                <div className="flex gap-2">
                  {createdExperience && experiencePermalink && (
                    <LinkCta
                      href={experiencePermalink}
                      size="lg"
                      variant="outline"
                      className=""
                      onClick={() => {
                        handleViewingCreatedExperience();
                      }}
                    >
                      View
                    </LinkCta>
                  )}
                  <Button
                    size="lg"
                    flavor="ring"
                    variant="tertiary"
                    className=""
                    ref={nestedDrawerCloseRef}
                    onClick={() => {
                      handleClosingNestedAndPrimaryDrawer();
                    }}
                  >
                    Awesome!
                  </Button>
                </div>
              )}
            </div>
          </DrawerContent>
        </DrawerNested>
      </DrawerContent>
    </Drawer>
  );
}
