'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { IconCheck, IconCopy } from '@/components/ui/icons';
import { ReactMarkdownExtended } from '@/components/content/md/markdown';
import { SharedInfoTooltip } from '@/components/tooltip';
import { UserAvatar } from '@/components/user-avatar';

import { SingleExperienceEngagementToast } from '../experiences/posts/experience-toasts';
import {
  createPromptChallengePermalink,
  createUserCompletedPromptChallengePermalink,
} from '../experiences/utils/experience-prompt-utils';

import type {
  GeneratedExperienceUserPrompt,
  GeneratedExperienceUserPrompts,
} from '@/types/experience-prompts';

export function PreviewPrompt({
  prompt,
  children,
  className,
  noAnimation,
  previewIsActivePrompt,
  previewIsCompletedPrompt,
}: {
  prompt: GeneratedExperienceUserPrompt;
  children?: React.ReactNode;
  noAnimation?: boolean;
  className?: string;
  previewIsActivePrompt?: boolean;
  previewIsCompletedPrompt?: boolean;
}) {
  return (
    <div className={cn('flex w-full grow items-center py-2', className)}>
      <motion.div
        initial={noAnimation ? false : { scale: 0.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.325 }}
        className={cn(
          'flex w-full flex-col gap-3 p-4',
          'items-center justify-center text-center',
          'ring-tertiary/80 rounded-lg p-4 ring-4 ring-opacity-50'
        )}
      >
        <div className="flex flex-col gap-0.5">
          <h3 className="flex flex-col-reverse items-center justify-center gap-1 text-sm brightness-85 sm:flex-row sm:gap-2 sm:text-base">
            <span className="hidden sm:inline-block">{prompt.title}</span>

            {previewIsActivePrompt && <Badge variant="outline">Active</Badge>}
            {previewIsCompletedPrompt && (
              <Badge variant="outline">Completed</Badge>
            )}
          </h3>
          <p className="text-base font-semibold sm:text-lg sm:font-medium">
            {prompt.prompt}
          </p>
        </div>
        <div>{children}</div>
      </motion.div>
    </div>
  );
}

export type ViewAndSelectSinglePromptProps = {
  item: GeneratedExperienceUserPrompt;
  noOnHoverEnd?: boolean;
  noAnimation?: boolean;
  delay?: number;
  className?: string;
  selected?: boolean;
  enableTab?: boolean;
  handleOnSelectingPrompt: (prompt: GeneratedExperienceUserPrompt) => void;
  handleOnHoverPreview: (
    prompt: GeneratedExperienceUserPrompt | undefined
  ) => void;
};

export function ViewAndSelectSinglePrompt({
  item,
  delay = 0,
  className,
  selected,
  noOnHoverEnd = false,
  noAnimation = false,
  enableTab = false,
  handleOnSelectingPrompt,
  handleOnHoverPreview,
}: ViewAndSelectSinglePromptProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <SharedInfoTooltip
      asChild
      align="start"
      side="top"
      title={item.title}
      content={item.prompt}
    >
      <motion.div
        ref={ref}
        tabIndex={enableTab ? 0 : -1}
        initial={noAnimation ? false : { scale: 0.1, opacity: 0 }}
        animate={{
          scale: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
          opacity: 1,
        }}
        transition={{ type: 'spring', duration: 0.725, delay: 0.03 * delay }}
        onHoverStart={(e) => {
          ref.current?.focus();
          handleOnHoverPreview(item);
        }}
        onHoverEnd={
          !noOnHoverEnd ? () => handleOnHoverPreview(undefined) : undefined
        }
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleOnSelectingPrompt(item);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            e.preventDefault();
            handleOnSelectingPrompt(item);
          }
        }}
        className={cn(
          'inline-flex w-full items-center justify-center whitespace-nowrap',
          'hover:ring-tertiary text-base font-medium text-foreground/80 hover:ring-2 lg:text-lg',
          'rounded-2xl border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'cursor-pointer',
          'px-4 py-2',
          {
            'bg-tertiary text-tertiary-foreground': selected,
          },
          className
        )}
      >
        <span className="truncate">{item.prompt}</span>
      </motion.div>
    </SharedInfoTooltip>
  );
}

export type ViewAndSelectPromptsProps = {
  prompts: GeneratedExperienceUserPrompts;
  className?: string;
  noAnimation?: boolean;
  itemClassName?: string;
  promptsClassName?: string;
  noShowPreview?: boolean;
  currentPrompt?: GeneratedExperienceUserPrompt | null;
  previewPrompt?: GeneratedExperienceUserPrompt | null;
  completedPrompt?: GeneratedExperienceUserPrompt | null;
  handleOnSelectingPrompt: (prompt: GeneratedExperienceUserPrompt) => void;
};

export function ViewAndSelectPrompts({
  prompts,
  className,
  itemClassName,
  promptsClassName,
  currentPrompt,
  previewPrompt: previewPromptProp,
  completedPrompt: completedPromptProp,
  noAnimation = false,
  noShowPreview = false,
  handleOnSelectingPrompt,
}: ViewAndSelectPromptsProps) {
  const [previewPrompt, setPreviewPrompt] = React.useState<
    GeneratedExperienceUserPrompt | undefined | null
  >(previewPromptProp);

  const previewPromptInviteLink = previewPrompt
    ? createPromptChallengePermalink(previewPrompt.id)
    : '';

  const {
    isCopied: isPromptInvitePermalinkCopied,
    copyToClipboard: copyPromptInvitePermalinkToClipboard,
  } = useCopyToClipboard({ timeout: 2500 });

  // console.log(`**** previewPrompt`, previewPrompt);

  // useKey(
  //   'ArrowRight',
  //   (e) => {
  //     console.log(`**** ArrowRight invoked`);
  //     e.preventDefault(); // Prevent default arrow key behavior
  //     const tabEvent = new KeyboardEvent('keyup', {
  //       key: 'Tab',
  //       keyCode: 9,
  //       which: 9,
  //       bubbles: true,
  //       cancelable: true,
  //     });
  //     document.dispatchEvent(tabEvent);
  //   },
  //   {},
  //   [previewPrompt]
  // );

  const handleOnHoverPreview = (
    prompt: GeneratedExperienceUserPrompt | undefined
  ) => {
    setPreviewPrompt(prompt || previewPromptProp || currentPrompt);
  };

  const handleCopyingInvitePromptPermalink = (
    permalink = previewPromptInviteLink
  ) => {
    if (isPromptInvitePermalinkCopied || !permalink) {
      return;
    }

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptInvitePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCheck />,
      `Prompt Invite Link Copied ${previewPrompt ? `(${previewPrompt.title})` : ''}`.trim(),
      fullPermalink
    );
  };

  // Update preview prompt when current prompt changes
  React.useEffect(() => {
    if (previewPrompt && previewPrompt.prompt !== currentPrompt?.prompt) {
      setPreviewPrompt(previewPromptProp);
    }
  }, [previewPromptProp]);

  const isPreviewPromptCompletedPrompt =
    completedPromptProp?.prompt === previewPrompt?.prompt;

  const isPreviewPromptActivePrompt =
    previewPrompt?.prompt === currentPrompt?.prompt &&
    !isPreviewPromptCompletedPrompt;

  return (
    <div
      className={cn(
        'relative flex max-h-full w-full grow flex-col items-start justify-start gap-8',
        className
      )}
    >
      <div
        className={cn(
          'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 lg:gap-4',
          promptsClassName
        )}
      >
        {prompts.map((item, index) => {
          const isSelected =
            item.prompt === currentPrompt?.prompt ||
            item.prompt === previewPrompt?.prompt;

          return (
            <ViewAndSelectSinglePrompt
              key={item.id}
              enableTab
              item={item}
              delay={index}
              selected={isSelected}
              noAnimation={noAnimation}
              className={itemClassName}
              handleOnSelectingPrompt={handleOnSelectingPrompt}
              handleOnHoverPreview={handleOnHoverPreview}
            />
          );
        })}
      </div>
      {previewPrompt && !noShowPreview && (
        <PreviewPrompt
          noAnimation={noAnimation}
          previewIsActivePrompt={isPreviewPromptActivePrompt}
          previewIsCompletedPrompt={isPreviewPromptCompletedPrompt}
          prompt={previewPrompt}
        >
          {previewPromptInviteLink && (
            <div className="flex w-full max-w-4xl flex-col gap-6">
              <div className="flex items-center justify-center gap-2">
                <Link
                  href={previewPromptInviteLink}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyingInvitePromptPermalink();
                  }}
                  className="group flex h-[unset] items-center gap-1.5 rounded-full p-1 text-sm no-underline underline-offset-4 transition-colors hover:underline hover:underline-offset-2 sm:text-base"
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
                  Challenge link
                </Link>
              </div>
            </div>
          )}
        </PreviewPrompt>
      )}
    </div>
  );
}

export type ViewCompletedPromptsProps = {
  prompts: GeneratedExperienceUserPrompt[];
  className?: string;
  itemClassName?: string;
  promptsClassName?: string;
  noShowPreview?: boolean;
  noAnimation?: boolean;
};

export function ViewCompletedPrompts({
  prompts,
  className,
  itemClassName,
  promptsClassName,
  noShowPreview,
  noAnimation,
}: ViewCompletedPromptsProps) {
  const [previewCompletedPrompt, setPreviewCompletedPrompt] = React.useState<
    GeneratedExperienceUserPrompt | undefined
  >(prompts[0]);

  const promptInviteLink = previewCompletedPrompt
    ? createPromptChallengePermalink(previewCompletedPrompt.id)
    : '';

  // Prompt permalinks are unique based on the promptId and experienceId
  const promptUserCompletionLink = previewCompletedPrompt?.experienceId
    ? createUserCompletedPromptChallengePermalink(
        previewCompletedPrompt.experienceId
      )
    : '';

  const {
    isCopied: isPromptInvitePermalinkCopied,
    copyToClipboard: copyPromptInvitePermalinkToClipboard,
  } = useCopyToClipboard({ timeout: 2500 });

  const {
    isCopied: isPromptUserCompletePermalinkCopied,
    copyToClipboard: copyPromptUserCompletePermalinkToClipboard,
  } = useCopyToClipboard({ timeout: 2500 });

  const handleOnHoverPreview = (
    prompt: GeneratedExperienceUserPrompt | undefined
  ) => {
    setPreviewCompletedPrompt(prompt);
  };

  const handleOnSelectingPrompt = (prompt: GeneratedExperienceUserPrompt) => {
    setPreviewCompletedPrompt(prompt);
  };

  const handleCopyingInvitePromptPermalink = (permalink = promptInviteLink) => {
    if (isPromptInvitePermalinkCopied || !permalink) {
      return;
    }

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptInvitePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCheck />,
      `Prompt Invite Link Copied ${previewCompletedPrompt ? `(${previewCompletedPrompt.title})` : ''}`.trim(),
      fullPermalink
    );
  };

  const handleCopyingUserCompletePromptPermalink = (
    permalink = promptUserCompletionLink
  ) => {
    if (isPromptUserCompletePermalinkCopied || !permalink) {
      return;
    }

    const fullPermalink = `${window.location.origin}${permalink}`;
    copyPromptUserCompletePermalinkToClipboard(fullPermalink);
    SingleExperienceEngagementToast(
      <IconCheck />,
      `Your Prompt Completion Link Copied ${previewCompletedPrompt ? `(${previewCompletedPrompt.title})` : ''}`.trim(),
      fullPermalink
    );
  };

  const completedPromptCollaborator = previewCompletedPrompt?.Collaborator;
  const completedPromptCollaboratorAvatar =
    completedPromptCollaborator?.avatar ||
    completedPromptCollaborator?.image ||
    '';
  const completedPromptCollabrotorUsername =
    completedPromptCollaborator?.username;

  return (
    <div
      className={cn(
        'relative flex max-h-full w-full grow flex-col items-start justify-start gap-8',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto grid w-auto grid-cols-1 gap-2 lg:gap-4',
          {
            'sm:grid-cols-2 lg:grid-cols-2': prompts.length > 1,
          },
          promptsClassName
        )}
      >
        {prompts.map((item, index) => {
          const isSelected = item.prompt === previewCompletedPrompt?.prompt;
          return (
            <ViewAndSelectSinglePrompt
              key={item.id}
              noOnHoverEnd
              item={item}
              delay={index}
              selected={isSelected}
              noAnimation={noAnimation}
              className={itemClassName}
              handleOnSelectingPrompt={handleOnSelectingPrompt}
              handleOnHoverPreview={handleOnHoverPreview}
            />
          );
        })}
      </div>
      {previewCompletedPrompt && !noShowPreview && (
        <PreviewPrompt
          previewIsCompletedPrompt
          noAnimation={noAnimation}
          prompt={previewCompletedPrompt}
        >
          {previewCompletedPrompt.content && (
            <div className="flex w-full max-w-4xl flex-col gap-6">
              <ReactMarkdownExtended className="rounded-2xl bg-background px-3 py-2 text-lg">
                {previewCompletedPrompt.content}
              </ReactMarkdownExtended>
              <div
                className={cn(
                  'grid w-full grid-rows-2 items-center justify-center gap-4'
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  {completedPromptCollaboratorAvatar && (
                    <UserAvatar src={completedPromptCollaboratorAvatar} />
                  )}
                  {completedPromptCollabrotorUsername && (
                    <span className="text-lg font-semibold">
                      @{completedPromptCollabrotorUsername}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
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
                      Prompt Link
                    </span>
                  </Link>
                  <Link
                    href={promptUserCompletionLink}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyingUserCompletePromptPermalink();
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
                      {isPromptUserCompletePermalinkCopied && (
                        <IconCheck className="size-4" />
                      )}
                      {!isPromptUserCompletePermalinkCopied && (
                        <IconCopy className="size-4 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-125" />
                      )}
                    </span>
                    <span className="brightness-85 group-hover:brightness-100">
                      My Completion Link
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </PreviewPrompt>
      )}
    </div>
  );
}
