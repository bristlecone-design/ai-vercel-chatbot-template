'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUserPrompts } from '@/state/prompt-provider';
import type { DialogProps } from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';

import { cn, sleep } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft, IconClose, IconDices } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';

import { createPromptChallengePermalink } from '../experiences/utils/experience-prompt-utils';
import { ViewAndSelectPrompts } from '../prompts/view-and-select-prompts';

import type { GeneratedExperienceUserPrompt } from '@/types/experience-prompts';

/**
 * View Prompts Selection Dialog (Drawer)
 *
 * Used for viewing all available prompts and selecting a prompt to create an experience.
 */

export interface ViewPromptsSelectionDialogProps extends DialogProps {
  openPromptSelection?: boolean;
  noCloseBtn?: boolean;
  dismissable?: boolean;
  closeThreshold?: number;
  closeOnOutsideClick?: boolean;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  title?: string;
  noFocusOnOpen?: boolean;
  noShowPrompt?: boolean;
  className?: string;
  noMinimizeOnOutsideClick?: boolean;
  handleOnClose?: () => void;
  handleOnSelection?: (prompt?: GeneratedExperienceUserPrompt) => void;
  handleOnSuccess?: GeneratedExperienceUserPrompt;
}

export function ViewPromptsSelectionDialog({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dismissable = true,
  closeThreshold = 0.1,
  noFocusOnOpen = false,
  noShowPrompt = false,
  noMinimizeOnOutsideClick = true,
  titleClassName,
  title: titleProp = 'Select a Challenge',
  contentProps,
  className,
  children,
  open,
  openPromptSelection,
  handleOnClose,
  handleOnSelection,
  handleOnSuccess,
  ...props
}: ViewPromptsSelectionDialogProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const router = useRouter();
  const {
    isPromptSingleView,
    isPromptCompletionView,
    isPromptSelectionOpen,
    // userPromptChallengeContext,
    fetchingPrompts,
    currentUserPrompt,
    userSelectedPrompt,
    userCompletedPrompts,
    promptPaginationEnabled,
    userPromptChallenges = [], // All prompts
    userPromptGroupedSets, // Grouped prompts
    userPromptsIndex, // Current index of prompts
    currentUserPromptChallengeSet: currentPrompts, // Current prompt set
    userPromptChallengeAcceptance: promptChallengeAccepted,
    handleTogglingPromptSelectionView,
    handleSelectingRandomPromptChallenge,
    handleTogglingPromptChallengeAcceptance,
    handleSelectingPromptChallenge,
    handlePaginatingPromptChallenges: paginatePrompts,
  } = useUserPrompts();
  // console.log('currentPrompts', {
  //   currentPrompts,
  //   userPromptsIndex,
  //   userPromptGroupedSets,
  //   userPromptChallenges,
  // });

  const currentUserCompletedPrompt =
    userSelectedPrompt && userCompletedPrompts.length
      ? userCompletedPrompts.find(
          (prompt) => prompt.id === userSelectedPrompt.id
        )
      : null;

  // States
  const [isMounted, setIsMounted] = React.useState(false);

  const [isOpen, setIsOpen] = React.useState(open);

  // Search
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = React.useState(userPromptsIndex);
  const [items, setItems] =
    React.useState<GeneratedExperienceUserPrompt[]>(currentPrompts);

  const [searchValue, setSearchValue] = React.useState('');
  const debounced = useDebouncedCallback(async (value) => {
    // console.log(`**** debounced invoked`, { value });
    // Dynamically load fuse.js
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(userPromptChallenges, {
      keys: ['prompt', 'title', 'content', 'location'],
      threshold: 0.45,
      distance: 100,
      includeScore: true,
    });

    const results = fuse.search(value).map((result) => result.item);
    // console.log(`Search results`, { results });
    setItems(results);
  }, 250);

  const hasSearchResults = Boolean(searchValue.length && items.length);
  const hasSinglePrompt = currentPrompts.length === 1;
  const numOfCurrentPromptItems = items.length;

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    // console.log(`handleOnOpenChange invoked in create experience dialog`, {
    //   nextState,
    // });
    setIsOpen(nextState);
    if (!nextState) {
      await sleep(350);

      handleTogglingPromptSelectionView(false);

      if (typeof handleOnClose === 'function') {
        handleOnClose();
      }
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

  const handleSelectingNewPromptChallenge = async (
    ...args: Parameters<typeof handleSelectingPromptChallenge>
  ) => {
    const [newPrompt] = args;
    // Account for re-routing to the single prompt view
    if (isPromptSingleView || isPromptCompletionView) {
      if (newPrompt && typeof newPrompt !== 'string' && userSelectedPrompt) {
        if (newPrompt.id !== userSelectedPrompt.id) {
          const newPromptPermalink = createPromptChallengePermalink(
            newPrompt.id
          );
          router.push(newPromptPermalink);
        }
      }
    }

    if (typeof handleOnSelection === 'function') {
      // await sleep(500);
      handleOnSelection();
    }

    // Turn on the prompt challenge acceptance if it's not already on
    if (!promptChallengeAccepted) {
      handleTogglingPromptChallengeAcceptance(true);
    }
    handleSelectingPromptChallenge(...args);
    await sleep(350);
    handleClosePrimaryDrawer();
  };

  const handleSurpriseMePromptChallenge = async (
    prompt?: string,
    closeAfter = true
  ) => {
    if (typeof handleOnSelection === 'function') {
      // await sleep(500);
      handleOnSelection();
    }

    // Turn on the prompt challenge acceptance if it's not already on
    if (!promptChallengeAccepted) {
      handleTogglingPromptChallengeAcceptance(true);
    }
    handleSelectingRandomPromptChallenge(prompt);
    if (closeAfter) {
      await sleep(500);
      handleClosePrimaryDrawer();
    }
  };

  const handleClearingSearch = () => {
    setSearchValue('');
    setItems(currentPrompts);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  React.useEffect(() => {
    // Paginate prompts if the user isn't searching
    if (!hasSearchResults && userPromptsIndex !== currentPage) {
      setCurrentPage(userPromptsIndex);
      setItems(currentPrompts);
    }
  }, [hasSearchResults, userPromptsIndex, currentPage]);

  React.useEffect(() => {
    if (isMounted) {
      searchInputRef.current?.focus();
    }
  }, [isMounted]);

  React.useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [isMounted]);

  const isCurrentUserPromptInSearchList = items.some(
    (item) => item.id === userSelectedPrompt?.id
  );

  return (
    <Drawer
      {...props}
      modal
      // modal={snap === 1}
      // handleOnly
      open={isOpen}
      shouldScaleBackground
      dismissible={dismissable}
      closeThreshold={closeThreshold}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
      // onRelease={(e) => {
      //   console.log('onRelease invoked', e);
      // }}
    >
      <DrawerContent
        {...contentRestProps}
        // autoFocus={false}
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
          'min-h-[70svh max-h-[100svh] bg-background/95 backdrop-blur-lg sm:max-h-[98svh] sm:min-h-[98svh]'
        )}
      >
        <div className="flex min-w-full max-w-4xl grow flex-col justify-start overflow-y-auto">
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
                <h3>{titleProp}</h3>
              </motion.h2>
            </DrawerTitle>

            <div className="flex flex-col gap-4">
              <DrawerDescription
                className={cn(
                  'mx-auto max-w-[98%] text-center text-xl font-normal text-foreground/90 sm:max-w-full'
                )}
              >
                Choose a challenge to share your experience.
              </DrawerDescription>
              <div
                className={cn('relative w-full', {
                  invisible: hasSinglePrompt,
                })}
              >
                <Input
                  ref={searchInputRef}
                  name="search"
                  disabled={hasSinglePrompt}
                  placeholder="Search for a prompt challenge"
                  className={cn(
                    'h-[unset] rounded-xl border-none px-4 py-2 text-lg leading-none placeholder:text-lg'
                  )}
                  // defaultValue={''}
                  value={searchValue}
                  onChange={(e) => {
                    const { value } = e.currentTarget;

                    if (value) {
                      debounced(value);
                    } else {
                      setItems(currentPrompts);
                    }

                    setSearchValue(value);
                  }}
                />
                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center">
                  {Boolean(searchValue.length) && (
                    <Badge variant="outline">{numOfCurrentPromptItems}</Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!searchValue}
                    className="size-8 rounded-full"
                    onClick={() => {
                      handleClearingSearch();
                    }}
                  >
                    <IconClose className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DrawerHeader>

          <div className="mx-auto flex w-full shrink flex-col items-start justify-start gap-8 p-2 lg:max-w-7xl">
            <ViewAndSelectPrompts
              key={searchValue.length}
              noAnimation={hasSearchResults}
              noShowPreview={!items || !items.length}
              prompts={items}
              currentPrompt={userSelectedPrompt}
              previewPrompt={
                isCurrentUserPromptInSearchList
                  ? userSelectedPrompt
                  : hasSearchResults
                    ? items[0]
                    : userSelectedPrompt
              }
              completedPrompt={currentUserCompletedPrompt}
              handleOnSelectingPrompt={handleSelectingNewPromptChallenge}
              // className="flex-col-reverse"
            />
            {searchValue.length > 0 && !items.length && (
              <div className="flex w-full flex-col items-center justify-center gap-4">
                <h3 className="text-center text-xl font-semibold">
                  No prompt challenges found.
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    handleClearingSearch();
                  }}
                >
                  Start Over?
                </Button>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="py-1 sm:py-2">
          <div className="flex w-full items-center justify-between">
            <Button
              size="off"
              flavor="ring"
              variant="outline"
              onClick={() => {
                handleClosePrimaryDrawer();
              }}
              className={cn(
                'hover:text-success-foreground group gap-0 rounded-lg border-4 border-border/40 px-1.5 transition-colors duration-75'
              )}
            >
              <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
              Back
            </Button>

            <div className="flex gap-3.5">
              {hasSearchResults && (
                <Button
                  size="off"
                  variant="secondary"
                  onClick={() => {
                    handleClearingSearch();
                  }}
                  className={cn(
                    'group gap-1.5 rounded-lg border-4 px-1.5 transition-colors duration-75'
                  )}
                >
                  Clear Search
                </Button>
              )}
              {promptPaginationEnabled && !hasSearchResults && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="off"
                    variant="secondary"
                    onClick={() => {
                      paginatePrompts(-1);
                    }}
                    className={cn(
                      'group gap-1.5 rounded-lg border-4 px-1.5 transition-colors duration-75'
                    )}
                  >
                    <IconArrowLeft className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                    Prev <span className="hidden sm:inline-block">Prompts</span>
                  </Button>
                  <Button
                    size="off"
                    variant="secondary"
                    onClick={() => {
                      paginatePrompts(1);
                    }}
                    className={cn(
                      'group gap-1.5 rounded-lg border-4 px-1.5 transition-colors duration-75'
                    )}
                  >
                    Next <span className="hidden sm:inline-block">Prompts</span>
                    <IconArrowLeft className="size-3 rotate-180 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:brightness-125" />
                  </Button>
                </div>
              )}
              <Button
                size="off"
                variant="default"
                onClick={() => {
                  handleSurpriseMePromptChallenge(userSelectedPrompt?.prompt);
                }}
                className={cn(
                  'group gap-1.5 rounded-lg border-4 px-1.5 transition-colors duration-75'
                )}
              >
                <IconDices className="size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:brightness-125" />
                <span className="hidden sm:inline-block">Surprise Me</span>
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
