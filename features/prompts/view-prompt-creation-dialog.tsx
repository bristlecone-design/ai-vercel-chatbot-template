'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DialogProps } from '@radix-ui/react-dialog';

import { cn, sleep } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconSparkle,
} from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { SuccessAnimated } from '@/components/content/common/shared-components';

import { SingleExperiencePost } from '../experiences/posts/experience-posts';
import { SingleExperienceEngagementToast } from '../experiences/posts/experience-toasts';
import {
  createPromptChallengePermalink,
  createSingleCompletedStoryPromptChallengePermalink,
  createSingleStoryPromptChallengePermalink,
  createUserCompletedPromptChallengePermalink,
} from '../experiences/utils/experience-prompt-utils';

import type { ExperienceModel } from '@/types/experiences';

/**
 * Show a dialog to the user when they have successfully completed a prompt challenge.
 *
 * @note Prompt challenges are a variant of experiences.
 */

export interface ViewPromptChallengeCreationDialogProps extends DialogProps {
  noCloseBtn?: boolean;
  dismissable?: boolean;
  storyId?: string;
  storyPath?: string;
  created?: boolean;
  closeOnOutsideClick?: boolean;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  title?: string;
  completedTitle?: string;
  completedTitleClassName?: string;
  className?: string;
  personalizedReply?: string;
  noMinimizeOnOutsideClick?: boolean;
  completedExperience?: ExperienceModel | null;
  handleOnClose?: (completedPrompt: ExperienceModel) => void;
}

export function ViewPromptChallengeCreationDialog({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dismissable = true,
  noMinimizeOnOutsideClick = true,
  created: promptChallengeCompletedProp = false,
  titleClassName,
  title: titleProp = 'Saving Your Challenge...',
  completedTitleClassName,
  completedTitle: completedTitleProp = 'Prompt Challenge Completed',
  storyId: storyIdProp,
  storyPath: storyPathProp,
  personalizedReply,
  contentProps,
  className,
  children,
  open,
  completedExperience: completedExperienceProp,
  handleOnClose,
  ...props
}: ViewPromptChallengeCreationDialogProps) {
  // console.log('**** ViewPromptChallengeCreationDialogProps', {
  //   open,
  //   promptChallengeCompletedProp,
  //   completedExperienceProp,
  //   handleOnClose,
  // });
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const router = useRouter();

  // Prompt Model
  const {
    id: expId,
    Prompt: promptRecord,
    content: userResponse,
    storyId: expStoryId,
    Story: storyRecord,
  } = completedExperienceProp || {};

  const {
    id: promptId,
    promptCollectionId,
    prompt: generatedPrompt,
  } = promptRecord || {};

  const storyId = storyIdProp || expStoryId || promptCollectionId;
  const storyPath = storyPathProp || storyRecord?.path || '';

  const isConnectedToStory = storyId && storyPath;

  const promptInviteLink = isConnectedToStory
    ? createSingleStoryPromptChallengePermalink(promptId, storyPath)
    : createPromptChallengePermalink(promptId);

  // Prompt permalinks are unique based on the promptId and experienceId
  const completedPromptPermalink = isConnectedToStory
    ? createSingleCompletedStoryPromptChallengePermalink(
        expId,
        promptId,
        storyPath
      )
    : promptId
      ? createUserCompletedPromptChallengePermalink(expId)
      : '';

  // Other States
  const [isPrimaryDrawerOpen, setIsPrimaryDrawerOpen] = React.useState(open);

  const [isSecondaryDrawerOpen, setIsSecondaryDrawerOpen] = React.useState(
    promptChallengeCompletedProp
  );

  const {
    isCopied: isPromptInvitePermalinkCopied,
    copyToClipboard: copyPromptInvitePermalinkToClipboard,
  } = useCopyToClipboard({ timeout: 2500 });

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    // console.log(`handleOnOpenChange invoked in create experience dialog`, {
    //   nextState,
    // });
    setIsPrimaryDrawerOpen(nextState);

    if (!nextState) {
      await sleep(350);

      if (completedExperienceProp && typeof handleOnClose === 'function') {
        handleOnClose(completedExperienceProp);
      }
    }
  };

  const handleOnEscapeKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOnOpenChange(false);
    }
  };

  const handleClosePrimaryDrawer = () => {
    // setIsPrimaryDrawerOpen(false);
    handleOnOpenChange(false);
  };

  const handleCloseNestedDrawer = () => {
    setIsSecondaryDrawerOpen(false);
  };

  const handleClosingNestedAndPrimaryDrawer = async () => {
    handleCloseNestedDrawer();
    await sleep(500);

    handleClosePrimaryDrawer();
  };

  const handleCopyingInvitePromptPermalink = (permalink = promptInviteLink) => {
    if (isPromptInvitePermalinkCopied || !permalink) {
      return;
    }

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptInvitePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCheck />,
      'Prompt Invite Link Copied',
      fullPermalink
    );
  };

  // Prefetch relevant prompt link if it exists
  React.useEffect(() => {
    if (completedPromptPermalink) {
      router.prefetch(completedPromptPermalink);
    } else if (promptInviteLink) {
      router.prefetch(promptInviteLink);
    }
  }, [completedPromptPermalink, promptInviteLink]);

  // Titles and other copy
  const primaryDrawerTitle = promptChallengeCompletedProp
    ? completedTitleProp
    : titleProp;

  return (
    <Drawer
      {...props}
      modal
      open={isPrimaryDrawerOpen}
      shouldScaleBackground
      dismissible={dismissable}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
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
            event.preventDefault();
          } else {
            handleClosePrimaryDrawer();
            event.stopPropagation();
          }
        }}
        onClick={(event) => {
          // console.log(`***** onClick invoked`, event);
        }}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[3px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className={cn(
          'max-h-[98svh] min-h-[98svh] bg-background/95 backdrop-blur-lg'
        )}
      >
        <div className="flex min-w-full max-w-4xl grow flex-col justify-start overflow-y-auto lg:max-w-6xl">
          <DrawerHeader className={cn('mx-auto shrink pb-4 sm:pb-8 md:px-0')}>
            <DrawerTitle
              asChild
              className={cn(
                'pb-4 pt-8'
                // {
                //   'py-8': !promptChallengeAccepted,
                //   'pb-3 pt-8': promptChallengeAccepted,
                // },
              )}
            >
              <SuccessAnimated
                className={cn(
                  'size-32 transition-all duration-200 sm:size-36',
                  {
                    invisible: !promptChallengeCompletedProp,
                  }
                )}
              />
            </DrawerTitle>

            <DrawerDescription
              className={cn(
                'flex items-center justify-center gap-2 truncate text-2xl font-semibold text-foreground md:text-3xl lg:text-4xl',
                titleClassName,
                completedTitleClassName
              )}
            >
              {primaryDrawerTitle}
            </DrawerDescription>
          </DrawerHeader>

          <div className="mx-auto flex w-full grow flex-col items-center justify-start gap-8 p-8 lg:max-w-7xl">
            {completedExperienceProp && (
              <SingleExperiencePost
                noUIControls
                noCallToActions
                context="author"
                experience={completedExperienceProp}
                className=""
              />
            )}

            {!completedExperienceProp && personalizedReply && (
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

            {personalizedReply && (
              <div className="mb-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 p-3.5 text-lg font-medium md:p-6 md:text-xl">
                <div>{personalizedReply}</div>
                {completedPromptPermalink && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Link
                      href={promptInviteLink}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyingInvitePromptPermalink();
                      }}
                      className={cn(
                        buttonVariants({
                          variant: 'secondary',
                          size: 'sm',
                          className:
                            'group w-full gap-1.5 rounded-xl border-4 bg-background py-2 text-base transition-colors duration-75',
                        })
                      )}
                    >
                      {isPromptInvitePermalinkCopied && (
                        <IconCheck className="size-4" />
                      )}
                      {!isPromptInvitePermalinkCopied && (
                        <IconCopy className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                      )}
                      Copy {isConnectedToStory ? 'Story' : 'Challenge'} Link
                    </Link>

                    <Link
                      href={completedPromptPermalink}
                      className={cn(
                        buttonVariants({
                          variant: 'default',
                          size: 'sm',
                          className:
                            'group w-full gap-1.5 rounded-xl border-4 py-2 text-base transition-colors duration-75',
                        })
                      )}
                    >
                      <IconSparkle className="size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:brightness-125" />
                      View Completed {isConnectedToStory ? 'Story' : 'Prompt'}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {completedExperienceProp && (
            <DrawerFooter className="">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  size="sm"
                  flavor="ring"
                  variant="outline"
                  onClick={() => {
                    handleClosePrimaryDrawer();
                  }}
                  className={cn(
                    'hover:text-success-foreground group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75'
                  )}
                >
                  <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                  Back
                </Button>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  {completedPromptPermalink && !personalizedReply && (
                    <Link
                      href={promptInviteLink}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyingInvitePromptPermalink();
                      }}
                      className={cn(
                        buttonVariants({
                          variant: 'secondary',
                          size: 'sm',
                          className:
                            'group w-full gap-1.5 rounded-xl border-4 py-4 transition-colors duration-75',
                        })
                      )}
                    >
                      {isPromptInvitePermalinkCopied && (
                        <IconCheck className="size-4" />
                      )}
                      {!isPromptInvitePermalinkCopied && (
                        <IconCopy className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                      )}
                      Copy {isConnectedToStory ? 'Story' : 'Challenge'} Link
                    </Link>
                  )}
                  {!personalizedReply && (
                    <Link
                      href={completedPromptPermalink}
                      className={cn(
                        buttonVariants({
                          variant: 'default',
                          size: 'sm',
                          className:
                            'group w-full gap-1.5 rounded-xl border-4 py-4 transition-colors duration-75',
                        })
                      )}
                    >
                      <IconSparkle className="size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:brightness-125" />
                      View Completed {isConnectedToStory ? 'Story' : 'Prompt'}
                    </Link>
                  )}
                </div>
              </div>
            </DrawerFooter>
          )}
        </div>

        {/* Primary Drawer */}
      </DrawerContent>
    </Drawer>
  );
}
