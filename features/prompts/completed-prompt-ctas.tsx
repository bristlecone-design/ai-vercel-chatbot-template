'use client';

import React, { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { streamCallToActionsForUserExperience } from '@/actions/experience-prompts';
import {
  createPromptChallengePermalink,
  createPromptCollectionStoryPermalink,
  createSingleStoryPromptChallengePermalink,
} from '@/features/experiences/utils/experience-prompt-utils';
import {
  createUserProfileExperiencePermalink,
  getUserProfilePermalink,
} from '@/features/experiences/utils/experience-utils';
import { useAppState } from '@/state/app-state';
import { readStreamableValue } from 'ai/rsc';
import { motion } from 'framer-motion';
import { useMountedState } from 'react-use';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { SharedInfoTooltip } from '@/components/tooltip';

import { DialogPromptNotOnBetaSplashScreen } from './prompt-discover-not-on-beta-splash-screen';

import type { AIExperienceCallToActionSuggestionModel } from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';

export type CompletedBaseExperienceCtaItemProps = {
  item: AIExperienceCallToActionSuggestionModel;
  itemVariant?: ButtonProps['variant'];
  itemSize?: ButtonProps['size'];
  authorId?: string | null;
  authorUsername?: string | null;
  storyPath?: string;
  delay?: number;
  disabled?: boolean;
  className?: string;
  noCustomStyles?: boolean;
  handleOnClick?: (item: AIExperienceCallToActionSuggestionModel) => void;
  handleOnTogglingSplash?: () => void;
};

export type CompletedExperienceCtaItemProps =
  CompletedBaseExperienceCtaItemProps & {
    expId: string;
    noRouteToExperience?: boolean;
  };

export function CompletedExperienceCtaItem({
  item,
  itemVariant = 'plain',
  itemSize = 'off',
  delay = 0,
  disabled = false,
  noCustomStyles = false,
  noRouteToExperience = false,
  className,
  storyPath,
  authorUsername,
  authorId,
  expId,
  handleOnClick: handleOnClickProp,
  handleOnTogglingSplash: handleOnTogglingSplashProp,
}: CompletedExperienceCtaItemProps) {
  const router = useRouter();
  const { type, cta } = item;

  const isShareType = type === 'share';

  const authorProfilePermalink = authorUsername
    ? getUserProfilePermalink(authorUsername)
    : '';

  const experiencePermalink = createUserProfileExperiencePermalink(
    expId,
    authorProfilePermalink
  );

  const experienceStoryPermalink = storyPath
    ? createPromptCollectionStoryPermalink(storyPath)
    : '';

  const experiencePermalinkToUse =
    experienceStoryPermalink || experiencePermalink;

  const { isAuthenticated, isInPrivateBeta, userId } = useAppState();

  const isAuthUserOwnerOfExp = isAuthenticated && userId === authorId;

  const allowEngagementWithShare =
    isShareType && !noRouteToExperience && !isAuthUserOwnerOfExp;

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    if (isAuthenticated) {
      if (isShareType) {
        if (allowEngagementWithShare) {
          // Route to prompt challenge if CTA type is 'share' (their own response)
          if (experiencePermalinkToUse) {
            router.push(experiencePermalinkToUse);
            toast.info('Taking you to the prompt challenge...', {
              duration: 1500,
            });
          }

          return;
        }
      } else if (!isShareType) {
        // console.log(
        //   `**** Handle other CTA types ****`,
        //   promptId,
        //   cta,
        //   isInPrivateBeta,
        //   type
        // );
        if (isInPrivateBeta) {
          // TODO: Allow discovery engagement for other CTA types in private beta
          router.push('/discover');
        } else {
          if (typeof handleOnTogglingSplashProp === 'function') {
            handleOnTogglingSplashProp();
          }
          // TODO - Handle not in private beta, e.g. dialog or modal message
          toast.info(
            'This feature is currently on available to our private-beta users'
          );
        }
      }
    } else {
      // TODO - Handle this case further (not authenticated)
      if (allowEngagementWithShare) {
        // Route to prompt challenge if CTA type is 'share' (their own response)
        if (experiencePermalinkToUse) {
          router.push(experiencePermalinkToUse);
          toast.info('Taking you to the prompt challenge...', {
            duration: 1500,
          });
        }
      } else {
        router.push('/discover');
        toast.info('Please sign in to engage with this prompt...', {
          duration: 4500,
        });
      }
    }

    // Handle custom onClick event
    if (typeof handleOnClickProp === 'function') {
      handleOnClickProp(item);
    }
  };

  // Prefetch prompt challenge URL if CTA type is 'share'
  React.useEffect(() => {
    if (isShareType && allowEngagementWithShare && !noRouteToExperience) {
      if (experiencePermalinkToUse) {
        router.prefetch(experiencePermalinkToUse);
      }
    }
  }, []);

  if (!allowEngagementWithShare && isShareType) {
    return null;
  }

  return (
    <SharedInfoTooltip
      // asChild
      title=""
      content={cta}
      triggerClassName=""
    >
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
        }}
        transition={{ type: 'spring', duration: 1, delay: 0.03 * delay }}
        className={cn(
          buttonVariants({
            variant: itemVariant,
            size: itemSize,
            className: cn(
              'block w-full max-w-fit truncate rounded-2xl px-2.5 text-sm font-medium sm:text-base',
              {
                'block border-2 border-transparent bg-green-950/30 text-foreground/75 ring-0 ring-ring ring-offset-0 ring-offset-green-950/5 hover:bg-green-950/70 hover:text-foreground/90 focus-visible:ring-0':
                  !noCustomStyles,
                'h-[unset] py-1.5 leading-none': noCustomStyles,
              },
              className
            ),
          })
        )}
        onClick={handleOnClick}
      >
        <span className="leading-none">{cta}</span>
      </motion.span>
    </SharedInfoTooltip>
  );
}

function CompletedPromptCtaSkeletonItems({
  itemProps,
  numOfCtaGenerationPlaceholders,
}: {
  itemProps: Partial<CompletedPromptCtaItemProps>;
  numOfCtaGenerationPlaceholders: number[];
}) {
  return (
    <Fragment>
      {numOfCtaGenerationPlaceholders.map((index) => (
        <motion.span
          key={`cta-placeholder-${index}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
          }}
          transition={{
            type: 'spring',
            duration: 1,
            delay: 0.03 * index,
          }}
          className={cn(
            buttonVariants({
              variant: itemProps.itemVariant,
              size: itemProps.itemSize,
              className: cn(
                'block w-full max-w-fit rounded-2xl px-2.5',
                itemProps.className
              ),
            })
          )}
        >
          <BlockSkeleton className="w-full" />
        </motion.span>
      ))}
    </Fragment>
  );
}

export type CompletedPromptCtaItemProps =
  CompletedBaseExperienceCtaItemProps & {
    promptId: string;
    noRouteToPromptChallenge?: boolean;
  };

export function CompletedPromptCtaItem({
  item,
  itemVariant = 'plain',
  itemSize = 'off',
  delay = 0,
  disabled = false,
  noCustomStyles = false,
  noRouteToPromptChallenge = false,
  className,
  storyPath,
  authorId,
  promptId,
  handleOnClick: handleOnClickProp,
  handleOnTogglingSplash: handleOnTogglingSplashProp,
}: CompletedPromptCtaItemProps) {
  const router = useRouter();
  const { type, cta } = item;

  const isShareType = type === 'share';

  const promptChallengeUrl = createPromptChallengePermalink(promptId);

  const storyPromptChallengeUrl = storyPath
    ? createSingleStoryPromptChallengePermalink(promptId, storyPath)
    : null;

  const challengeUrlToUse = storyPromptChallengeUrl || promptChallengeUrl;

  const { isAuthenticated, isInPrivateBeta, userId } = useAppState();

  const isAuthUserOwnerOfPrompt = isAuthenticated && userId === authorId;

  const allowEngagementWithShare =
    isShareType && !noRouteToPromptChallenge && !isAuthUserOwnerOfPrompt;

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    if (isAuthenticated) {
      if (allowEngagementWithShare) {
        // Route to prompt challenge if CTA type is 'share' (their own response)
        if (challengeUrlToUse) {
          router.push(challengeUrlToUse);
          toast.info('Taking you to the prompt challenge...', {
            duration: 1500,
          });
        }
      } else if (!isShareType) {
        // console.log(
        //   `**** Handle other CTA types ****`,
        //   promptId,
        //   cta,
        //   isInPrivateBeta,
        //   type
        // );
        if (isInPrivateBeta) {
          // TODO: Allow discovery engagement for other CTA types in private beta
          router.push('/discover');
        } else {
          if (typeof handleOnTogglingSplashProp === 'function') {
            handleOnTogglingSplashProp();
          }
          // TODO - Handle not in private beta, e.g. dialog or modal message
        }
      }
    } else {
      // TODO - Handle this case further (not authenticated)
      if (allowEngagementWithShare) {
        // Route to prompt challenge if CTA type is 'share' (their own response)
        if (challengeUrlToUse) {
          router.push(challengeUrlToUse);
          toast.info('Taking you to the prompt challenge...', {
            duration: 1500,
          });
        }
      } else {
        router.push('/discover');
        toast.info('Please sign in to engage with this prompt...', {
          duration: 4500,
        });
      }
    }

    // Handle custom onClick event
    if (typeof handleOnClickProp === 'function') {
      handleOnClickProp(item);
    }
  };

  // Prefetch prompt challenge URL if CTA type is 'share'
  React.useEffect(() => {
    if (isShareType && !noRouteToPromptChallenge) {
      if (challengeUrlToUse) {
        router.prefetch(challengeUrlToUse);
      }
    }
  }, []);

  return (
    <SharedInfoTooltip
      // asChild
      title=""
      content={cta}
      triggerClassName=""
    >
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
        }}
        transition={{ type: 'spring', duration: 1, delay: 0.03 * delay }}
        className={cn(
          buttonVariants({
            variant: itemVariant,
            size: itemSize,
            className: cn(
              'block w-full max-w-fit truncate rounded-2xl px-2.5 text-sm font-medium sm:text-base',
              {
                'block border-2 border-transparent bg-green-950/30 text-foreground/75 ring-0 ring-ring ring-offset-0 ring-offset-green-950/5 hover:bg-green-950/70 hover:text-foreground/90 focus-visible:ring-0':
                  !noCustomStyles,
                'h-[unset] py-1.5 leading-none': noCustomStyles,
              },
              className
            ),
          })
        )}
        onClick={handleOnClick}
      >
        <span className="leading-none">{cta}</span>
      </motion.span>
    </SharedInfoTooltip>
  );
}

export type CompletedExperienceResponseCtasProps = {
  className?: string;
  experience: ExperienceModel;
  //   ctas?: AIExperienceCallToActionSuggestionModel[];
  numOfCtas?: number;
  generationAttemptCount?: number; // Number of times we've attempted to generate CTAs
  noAutoGenerateCtas?: boolean; // Disable auto generation of CTAs
  itemProps?: Partial<CompletedPromptCtaItemProps>;
};

export function CompletedExperienceResponseCtas({
  //   ctas: ctasProp = [],
  experience,
  className,
  numOfCtas: numOfCtasProp = 5,
  noAutoGenerateCtas = false,
  generationAttemptCount = 1,
  itemProps = {} as CompletedPromptCtaItemProps,
}: CompletedExperienceResponseCtasProps) {
  const { isAuthenticated, isInPrivateBeta, userId } = useAppState();

  const [showNotOnBetaSplash, setShowNotOnBetaSplash] = React.useState(false);

  const {
    id: expId,
    promptId,
    authorId,
    Author: author,
    title: expTitle,
    content: expContent,
    prompt: expPromptQuestion,
    Story: expStory,
    ctas: ctasProp = [],
  } = experience;

  const { username: authorUsername } = author || {};

  const { path: storyPath } = expStory || {};

  const isAuthUserOwnerOfPrompt = isAuthenticated && userId === authorId;

  const [generationCount, setGenerationCount] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);

  const [ctas, setCtas] =
    React.useState<AIExperienceCallToActionSuggestionModel[]>(ctasProp);

  const isMounted = useMountedState()();

  React.useEffect(() => {
    if (
      isMounted &&
      (promptId || expTitle) &&
      !generating &&
      !noAutoGenerateCtas &&
      (!ctas || !ctas.length) &&
      generationCount < generationAttemptCount
    ) {
      const generateCtas = async () => {
        // Generate CTAs
        setGenerating(true);

        const { object } = await streamCallToActionsForUserExperience(
          expContent,
          expPromptQuestion || expTitle,
          {
            expId,
            numOfCtas: numOfCtasProp,
          }
        );

        // @see https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
        for await (const partialObject of readStreamableValue(object)) {
          if (partialObject?.ctas) {
            setCtas(partialObject.ctas);
          }
        }

        setGenerating(false);
        setGenerationCount((count) => count + 1);
      };

      generateCtas();
    }
  }, [
    isMounted,
    generating,
    generationCount,
    generationAttemptCount,
    noAutoGenerateCtas,
    expPromptQuestion,
    expContent,
    expTitle,
    promptId,
    expId,
    ctas,
  ]);

  // Convenience vars
  const numOfGeneratedCtas = ctas?.length || 0;
  const numOfExpectedCtas = numOfCtasProp;
  const numOfCtaGenerationPlaceholders = Array.from(
    { length: numOfExpectedCtas - numOfGeneratedCtas },
    (_, index) => index
  );

  // We need a prompt ID to show CTAs
  if (!promptId && !expTitle) {
    return null;
  }

  // Nothing to show if we don't have any CTAs and we're not generating
  if ((!ctas || !ctas.length) && !generating && !noAutoGenerateCtas) {
    return null;
  }

  return (
    <Fragment>
      <div
        className={cn(
          'grid w-full max-w-full grid-cols-1 flex-wrap gap-2 md:grid-cols-2 lg:grid-cols-3',
          className
        )}
      >
        {ctas?.length &&
          ctas.map((cta, index) => {
            // Skip 'share' CTAs if user is the owner of the prompt
            // Doesn't make sense to respond to their own response
            if (cta.type === 'share' && isAuthUserOwnerOfPrompt) {
              // return null;
            }

            return promptId ? (
              <CompletedPromptCtaItem
                key={`${cta.cta}-${cta.type}-${index}`}
                delay={index}
                item={cta}
                promptId={promptId}
                storyPath={storyPath}
                authorId={authorId}
                itemVariant={itemProps.itemVariant}
                itemSize={itemProps.itemSize}
                noCustomStyles={itemProps.noCustomStyles}
                className={itemProps.className}
                disabled={generating}
                handleOnTogglingSplash={() => setShowNotOnBetaSplash(true)}
              />
            ) : expTitle ? (
              <CompletedExperienceCtaItem
                key={`${cta.cta}-${cta.type}-${index}`}
                delay={index}
                item={cta}
                expId={expId}
                storyPath={storyPath}
                authorId={authorId}
                authorUsername={authorUsername}
                itemVariant={itemProps.itemVariant}
                itemSize={itemProps.itemSize}
                noCustomStyles={itemProps.noCustomStyles}
                className={itemProps.className}
                disabled={generating}
                handleOnTogglingSplash={() => setShowNotOnBetaSplash(true)}
              />
            ) : null;
          })}
        {generating && numOfCtaGenerationPlaceholders.length > 0 && (
          <CompletedPromptCtaSkeletonItems
            itemProps={itemProps}
            numOfCtaGenerationPlaceholders={numOfCtaGenerationPlaceholders}
          />
        )}
      </div>

      {showNotOnBetaSplash && (
        <DialogPromptNotOnBetaSplashScreen
          openOnMount
          handleOnClose={() => setShowNotOnBetaSplash(false)}
        />
      )}
    </Fragment>
  );
}
