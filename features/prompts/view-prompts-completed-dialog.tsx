'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUserPrompts } from '@/state/prompt-provider';
import type { DialogProps } from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';

import { cn, sleep } from '@/lib/utils';
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
import { IconArrowLeft, IconClose } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';

import { ViewCompletedPrompts } from '../prompts/view-and-select-prompts';

import type { GeneratedExperienceUserPrompt } from '@/types/experience-prompts';

/**
 * View Prompts Completion Dialog (Drawer)
 *
 * Used for viewing all the prompts that the user has completed.
 */

export interface ViewPromptsCompletedDialogProps extends DialogProps {
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

export function ViewPromptsCompletedDialog({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dismissable = true,
  closeThreshold = 0.1,
  noFocusOnOpen = false,
  noShowPrompt = false,
  noMinimizeOnOutsideClick = true,
  titleClassName,
  title: titleProp = 'Completed Prompt Challenges',
  contentProps,
  className,
  children,
  open,
  openPromptSelection,
  handleOnClose,
  handleOnSelection,
  handleOnSuccess,
  ...props
}: ViewPromptsCompletedDialogProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const router = useRouter();
  const {
    isPromptSelectionOpen,
    currentUserPromptChallengeSet: currentPrompts,
    // userPromptChallengeContext,
    fetchingPrompts,
    currentUserPrompt,
    userSelectedPrompt,
    userPromptChallenges = [],
    promptPaginationEnabled,
    userCompletedPrompts,
    userPromptChallengeAcceptance: promptChallengeAccepted,
    handleTogglingPromptSelectionView,
    handleSelectingRandomPromptChallenge,
    handleTogglingPromptChallengeAcceptance,
    handleSelectingPromptChallenge,
    handlePaginatingPromptChallenges: paginatePrompts,
  } = useUserPrompts();

  // States
  const [isOpen, setIsOpen] = React.useState(open);

  // Search
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [items, setItems] =
    React.useState<GeneratedExperienceUserPrompt[]>(userCompletedPrompts);

  const [searchValue, setSearchValue] = React.useState('');
  const debounced = useDebouncedCallback(async (value) => {
    // console.log(`**** debounced invoked`, { value });
    // Dynamically load fuse.js
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(userCompletedPrompts, {
      keys: ['prompt', 'title', 'content', 'location'],
      threshold: 0.45,
      distance: 100,
      includeScore: true,
    });

    const results = fuse.search(value).map((result) => result.item);
    // console.log(`Search results`, { results });
    setItems(results);
  }, 250);

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

  const handleClearingSearch = () => {
    setSearchValue('');
    setItems(userCompletedPrompts);
    searchInputRef.current?.focus();
  };

  const hasSinglePrompt = userCompletedPrompts.length === 1;

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
          'max-h-[100svh] min-h-[70svh] bg-background/95 backdrop-blur-lg sm:max-h-[98svh] sm:min-h-[98svh]'
        )}
      >
        <div className="flex min-w-full max-w-4xl grow flex-col justify-start gap-4 overflow-y-auto">
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

            <DrawerDescription
              className={cn(
                'mx-auto w-full max-w-[98%] text-center text-xl font-normal text-foreground/90 sm:max-w-full'
              )}
            >
              <span className="sr-only">Your completed prompt challenges.</span>
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
                      setItems(userCompletedPrompts);
                    }

                    setSearchValue(value);
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 transform">
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
            </DrawerDescription>
          </DrawerHeader>

          <div className="mx-auto flex w-full shrink flex-col items-start justify-start gap-8 p-2 lg:max-w-7xl">
            <ViewCompletedPrompts
              key={items.length}
              noAnimation={searchValue.length > 0}
              noShowPreview={!items || !items.length}
              prompts={items}
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

        <DrawerFooter className="">
          <div className="flex w-full justify-between">
            <Button
              size="sm"
              flavor="ring"
              variant="outline"
              onClick={() => {
                handleClosePrimaryDrawer();
              }}
              className={cn(
                'group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75 hover:text-success-foreground'
              )}
            >
              <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
              Back
            </Button>

            {/* <div className="flex gap-3.5">
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
                    <IconLeft className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                    Prev <span className="hidden sm:inline-block">Prompts</span>
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
                    Next <span className="hidden sm:inline-block">Prompts</span>
                    <IconLeft className="size-3 rotate-180 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:brightness-125" />
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  handleSurpriseMePromptChallenge(userSelectedPrompt?.prompt);
                }}
                className={cn(
                  'group gap-1.5 rounded-xl border-4 py-4 transition-colors duration-75'
                )}
              >
                <IconDices className="size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:brightness-125" />
                <span className="hidden sm:inline-block">Surprise Me</span>
              </Button>
            </div> */}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
