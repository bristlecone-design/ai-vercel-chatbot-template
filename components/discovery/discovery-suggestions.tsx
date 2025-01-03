'use client';

import { useEffect, useState } from 'react';
import { streamPartialPersonalizedUserExperienceSuggestions as generateUserSuggestions } from '@/actions/discoveries/discovery-suggestions';
import type { StreamPersonalizedUserExperienceSuggestionsOpts } from '@/actions/discoveries/discovery-types';
import { useAppState } from '@/state/app-state';
import { readStreamableValue } from 'ai/rsc';
import { motion } from 'framer-motion';
import { useIsMounted, useLocalStorage } from 'usehooks-ts';

import { getErrorMessage } from '@/lib/errors';
import { uppercaseFirstLetter } from '@/lib/strings';
import { cn } from '@/lib/utils';

import { Spinner } from '../spinner';
import { Button } from '../ui/button';
import { IconAI } from '../ui/icons';
import { DiscoveryUserSuggestionSkeleton } from './discovery-suggestions-skeletons';

import type {
  AIGeneratedDiscoverySuggestions,
  AIGeneratedSingleDiscoverySuggestionModel,
} from '@/types/discovery-suggestions';
import type { GeoBase } from '@/types/geo';

function generateTimestampContext(
  ctx?: string,
  fallbackCtx = 'New suggestions'
) {
  const timeSinceEpoch = new Date().getTime();
  return `${ctx || fallbackCtx} ${timeSinceEpoch}`;
}

export type UseDiscoveryUserSuggestionsProps = {
  runOnMount?: boolean;
  runOnParentReady?: boolean;
  initialContext?: string;
  initialValues?: AIGeneratedDiscoverySuggestions;
  generateOpts?: StreamPersonalizedUserExperienceSuggestionsOpts;
};

export type UseDiscoveryUserSuggestionsResponse = {
  generating: boolean;
  generationCount: number;
  suggestions: AIGeneratedDiscoverySuggestions;
  generateSuggestions: (
    input?: string,
    useCachedSuggestions?: boolean,
    numToGenerate?: number
  ) => Promise<boolean>;
  // Same as generateSuggestions but increments the generation count to kick the cache
  generateFreshSuggestions: (
    input?: string,
    useCachedSuggestions?: boolean,
    numToGenerate?: number
  ) => Promise<void>;
};

export function useDiscoveryUserSuggestions(
  props?: UseDiscoveryUserSuggestionsProps
): UseDiscoveryUserSuggestionsResponse {
  const {
    runOnMount,
    runOnParentReady,
    initialContext = '',
    initialValues,
    generateOpts,
  } = props || {};

  const {
    interests,
    geolocation,
    numOfSuggestions: numOfSuggestionsProp = 4,
    //   handleOnFinish,
  } = generateOpts || {};

  const isHookMountedCheck = useIsMounted();
  const isHookMounted = isHookMountedCheck();

  const [initialized, setInitialized] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useLocalStorage<number>(
    'genCount',
    0
  );

  const defaultValues = initialValues || [];

  const [suggestions, setSuggestions] =
    useState<AIGeneratedDiscoverySuggestions>(defaultValues);

  const [priorSuggestions, setPriorSuggestions] = useLocalStorage<string[]>(
    'priorSuggestions',
    []
  );

  const [excludedSuggestions, setExcludedSuggestions] = useState<string[]>([]);

  const handleGeneratingUserSuggestions = async (
    context?: string,
    useCachedSuggestions = true,
    numToGenerateArg?: number
  ) => {
    try {
      if (generating) return true;
      // if (!initialized) return false;

      setGenerating(true);

      const numToGenerate = numToGenerateArg || numOfSuggestionsProp;

      // const generateFreshSuggestions = !useCachedSuggestions;
      // const currentSuggestions = suggestions.map((s) => s.suggestion);
      // const newExcludedSuggestions = generateFreshSuggestions
      //   ? suggestions.map((s) => s.suggestion)
      //   : [];

      const { suggestions: generatedSuggestions } =
        await generateUserSuggestions(context, {
          numOfSuggestions: numToGenerate,
          useCache: useCachedSuggestions,
          // numOfExistingSuggestions: generationCount,
          currentSuggestions: priorSuggestions,
          // excludeSuggestions: excludedSuggestions,
          geolocation,
          interests,
        });

      // Update the suggestions state with the new suggestions
      for await (const partialObject of readStreamableValue(
        generatedSuggestions
      )) {
        const partialGeneratedSuggestions = partialObject.suggestions || [];
        if (partialGeneratedSuggestions.length) {
          const validSuggestions: AIGeneratedSingleDiscoverySuggestionModel[] =
            partialGeneratedSuggestions.filter(
              (s: AIGeneratedSingleDiscoverySuggestionModel) => {
                // Check if the suggestion has the min. required properties
                const isValid = s.genId && s.title;
                return isValid;
              }
            );

          if (validSuggestions.length) {
            setSuggestions((prev) => {
              const uniqueSuggestions = validSuggestions.filter(
                (s, si) =>
                  validSuggestions.findIndex((s2) => s.title === s2.title) ===
                  si
              );
              return uniqueSuggestions;
            });
          }
        }
      }

      setGenerating(false);
      setGenerationCount((prev) => prev + 1);

      // Track the prior suggestions
      // Start over if we've generated more than 3 times
      // if (!generateFreshSuggestions && generationCount > 3) {
      //   setPriorSuggestions(currentSuggestions);
      // } else {
      //   setPriorSuggestions((prev) => {
      //     const uniqueSet = new Set([...prev, ...currentSuggestions]);
      //     return Array.from(uniqueSet);
      //   });
      // }

      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      console.error('Error generating user suggestions:', errMsg);
      setGenerating(false);
      return false;
    }
  };

  // Handle regeneration of suggestions
  const handleRegenerateFreshSuggestions = async (
    ...args: Parameters<typeof handleGeneratingUserSuggestions>
  ) => {
    const ctx = args[0];
    const numToGenerate = args[2] || numOfSuggestionsProp;
    // setGenerationCount((prev) => prev + 1);
    await handleGeneratingUserSuggestions(ctx, false, numToGenerate);
  };

  // Initialize the hook if requested
  useEffect(() => {
    const initialize = async () => {
      const generatedResponse =
        await handleGeneratingUserSuggestions(initialContext);
      setInitialized(generatedResponse);
    };

    if (isHookMounted && !initialized) {
      if (runOnMount || runOnParentReady) {
        initialize();
      }
    }
  }, [
    isHookMounted,
    initialized,
    initialContext,
    runOnMount,
    runOnParentReady,
  ]);

  return {
    generating,
    suggestions,
    generationCount,
    generateSuggestions: handleGeneratingUserSuggestions,
    generateFreshSuggestions: handleRegenerateFreshSuggestions,
  };
}

export type DiscoveryUserSuggestionsProps = {
  items?: AIGeneratedDiscoverySuggestions;
  itemClassName?: string;
  numOfSkeletons?: number;
  enableGenerateMore?: boolean;
  initContext?: string;
  className?: string;
  opts?: StreamPersonalizedUserExperienceSuggestionsOpts;
  onItemSelect: (item: AIGeneratedSingleDiscoverySuggestionModel) => void;
};

/**
 * Renders relevant discovery suggestions to the user.
 *
 * @note Consumes items from the corresponding hook @useDiscoveryUserSuggestions
 *
 */
export function DiscoveryUserSuggestions({
  items,
  itemClassName,
  numOfSkeletons = 4,
  enableGenerateMore = false,
  initContext: initContextProp = '',
  className,
  opts = {},
  onItemSelect,
}: DiscoveryUserSuggestionsProps) {
  const isMountedCheck = useIsMounted();
  const isMounted = isMountedCheck();

  const [discoveryContext, setDiscoveryContext] = useLocalStorage(
    'discoveryCtx',
    initContextProp
  );

  const {
    isReady: isAppReady,
    isProfileReady,
    userProfileBio,
    userProfileInterests,
    userProfileProfession,
    userProfileLocation,
    userLocation,
    userLatitude,
    userLongitude,
  } = useAppState();

  const discoveryGeo = {
    city: userLocation || userProfileLocation,
    latitude: userLatitude,
    longitude: userLongitude,
  } as GeoBase;

  const isParentReady = isAppReady && isMounted && isProfileReady;

  const { generating, suggestions, generateFreshSuggestions } =
    useDiscoveryUserSuggestions({
      runOnParentReady: isParentReady,
      initialContext: discoveryContext,
      initialValues: items,
      generateOpts: {
        ...(opts || {}),
        geolocation: discoveryGeo,
        interests: opts?.interests || userProfileInterests,
        additionalContext: userProfileBio + userProfileProfession,
      },
    });

  // Skeletons to load based on the num of suggestions generated and the number of skeletons requested to show.
  const skeletonsToLoad =
    generating && numOfSkeletons
      ? Math.max(numOfSkeletons - suggestions.length, 0)
      : 0;

  return (
    <div
      className={cn(
        'relative flex w-full flex-col gap-2 transition-transform duration-200',
        className
      )}
    >
      {enableGenerateMore && (
        <Button
          size="off"
          variant="ghost"
          type="button"
          disabled={generating}
          className={cn(
            'group',
            'gap-1.5 self-end text-sm font-normal text-foreground/50 hover:bg-transparent hover:text-foreground/70',
            {
              'text-foreground/20': generating,
            }
          )}
          onClick={() => {
            const newContext = generateTimestampContext('Fresh suggestions');
            setDiscoveryContext(newContext);
            generateFreshSuggestions(newContext);
          }}
        >
          {!generating && (
            <IconAI
              className={cn(
                'transition-transform duration-300 group-hover:rotate-180',
                {
                  'animate-spin': generating,
                }
              )}
            />
          )}
          {generating && <Spinner />}
          <span className="sr-only">Generate</span>
          <span className="">
            {generating ? 'Generating' : 'More Suggestions'}
          </span>
        </Button>
      )}
      <div className="relative grid w-full grid-cols-1 items-start gap-3 md:grid-cols-2">
        {suggestions.map((suggestion, si) => {
          const lastGenerated = si === suggestions.length - 1;
          const lastIsGenerating = generating && lastGenerated;
          return (
            <motion.div
              initial={{ opacity: 0.25, scale: 0.9, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              // exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ delay: 0.05 * si }}
              key={`suggested-action-${suggestion.genId}`}
              className={cn(
                'relative isolate overflow-hidden',
                'flex cursor-pointer flex-col gap-2 p-2.5',
                'rounded-lg border border-rose-50/5 bg-muted/20 backdrop-blur-md hover:bg-muted/40 hover:backdrop-blur-lg',
                `before:absolute before:inset-0 before:-translate-x-full before:border-b before:border-t before:border-rose-100/10 before:hover:animate-[shimmer_2s_infinite]`,
                itemClassName
              )}
              onClick={() => onItemSelect(suggestion)}
            >
              <h3
                className={cn('text-sm font-semibold brightness-65', {
                  'flex items-center gap-1': lastIsGenerating,
                })}
              >
                {suggestion.title}
                {lastIsGenerating && <Spinner className="" />}
              </h3>
              <p className={cn('truncate text-sm')}>
                {uppercaseFirstLetter(suggestion.action)}
              </p>
            </motion.div>
          );
        })}
        {isMounted &&
          isAppReady &&
          Boolean(skeletonsToLoad) &&
          [...Array(skeletonsToLoad)].map((_, idx) => {
            return (
              <DiscoveryUserSuggestionSkeleton
                key={`recommendation-skeleton-${idx}`}
                titleClassName={cn({
                  'w-4/5': idx % 2 === 0, // For indexes that are even
                  'w-3/4': idx % 2 !== 0, // For indexes that are odd
                })}
                actionClassName={cn({
                  'w-3/4': idx % 2 === 0, // For indexes that are even
                  'w-1/2': idx % 2 !== 0, // For indexes that are odd
                })}
              />
            );
          })}
      </div>
    </div>
  );
}
