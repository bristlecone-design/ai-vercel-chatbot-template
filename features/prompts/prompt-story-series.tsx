'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { md5 } from 'js-md5';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LinkCta } from '@/components/cta-link';

import { ChallengePromptProseContainer } from './prompt-shared-containers';

import type { StorySeriesPageViewModel } from '@/types/experience-prompts';

export function StorySeriesItem({
  item,
  delay = 0,
  disabled = false,
  className,
  handleOnSelectingPrompt,
}: {
  delay?: number;
  disabled?: boolean;
  className?: string;
  item: StorySeriesPageViewModel;
  handleOnSelectingPrompt?: (story: StorySeriesPageViewModel) => void;
}) {
  const router = useRouter();

  const {
    id: storyId,
    path: storyPath,
    title: storyTitle,
    description: storyDescription,
    permalinkRelative,
  } = item;

  if (!storyId || !storyPath || !storyTitle || !storyDescription) {
    return null;
  }

  React.useEffect(() => {
    if (permalinkRelative) {
      router.prefetch(permalinkRelative);
    }
  }, [permalinkRelative]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, translateY: 250 }}
      animate={{
        scale: 1,
        opacity: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
        translateY: 0,
      }}
      transition={{ type: 'spring', duration: 1, delay: 0.03 * delay }}
      onClick={() => {
        if (disabled) return;
        if (typeof handleOnSelectingPrompt === 'function') {
          handleOnSelectingPrompt(item);
        }
      }}
      className={cn('', className)}
    >
      <LinkCta
        noShowIcon
        href={permalinkRelative}
        size="off"
        variant="secondary"
        textClassName="flex flex-col gap-4 items-start"
        className={cn(
          'group/prompt-stories-item relative',
          'flex flex-col gap-4',
          'h-full items-start justify-start whitespace-normal rounded-2xl border-2 border-transparent',
          // 'brightness-75 hover:brightness-90',
          'px-4 py-2 lg:px-6 lg:py-4',
          // 'text-base font-normal leading-snug lg:text-2xl',
          'bg-secondary/50 bg-gradient-to-b hover:border-secondary hover:from-amber-700 hover:to-amber-700/75'
        )}
      >
        <span className="text-base font-bold leading-normal brightness-80 group-hover/prompt-stories-item:brightness-100 md:text-xl md:leading-normal lg:text-3xl lg:leading-normal">
          {storyTitle}
        </span>
        {storyDescription && (
          <span className="text-base brightness-80 lg:text-lg">
            {storyDescription}
          </span>
        )}
        <div className="flex w-full justify-end">
          <Badge
            variant="secondary"
            className="w-full justify-center py-2 sm:w-fit sm:justify-center md:text-sm lg:text-base"
          >
            Contribute to Series
          </Badge>
        </div>
      </LinkCta>
    </motion.div>
  );
}

export type ViewStorySeriesProps = {
  className?: string;
  promptsClassName?: string;
  stories: StorySeriesPageViewModel[];
};

export function ViewStorySeries({
  className,
  promptsClassName,
  stories: storiesProp,
}: ViewStorySeriesProps) {
  const numOfCurrentStoryItems = storiesProp.length;

  return (
    <ChallengePromptProseContainer
      className={cn('flex flex-col gap-6 sm:gap-8', className)}
    >
      <div
        className={cn(
          'grid grid-cols-1 gap-4 md:grid-cols-1',
          promptsClassName
        )}
      >
        {storiesProp.map((story, index) => {
          const { id: storyId, title: storyTitle } = story;
          if (!storyId) {
            return null;
          }

          const baseKey = `story-${storyId}-${storyTitle}-${index}`;
          const hashedKey = md5(baseKey);

          return (
            <StorySeriesItem
              key={hashedKey}
              item={story}
              delay={index}
              // className={cn(
              //   'group/prompt-stories-item',
              //   'h-full items-center justify-start whitespace-normal rounded-2xl border-2 border-transparent px-4 py-2',
              //   'brightness-75 hover:brightness-90',
              //   'text-base font-normal leading-snug lg:text-xl lg:font-normal',
              //   'bg-secondary/50 bg-gradient-to-b hover:border-secondary hover:from-amber-700 hover:to-amber-700/75'
              // )}
            />
          );
        })}
      </div>
    </ChallengePromptProseContainer>
  );
}
