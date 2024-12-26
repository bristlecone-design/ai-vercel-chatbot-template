'use client';

import { useEffect, useState } from 'react';
import { streamPartialPersonalizedUserExperienceSuggestions as generateUserSuggestions } from '@/actions/discoveries/discovery-suggestions';
import type { StreamPersonalizedUserExperienceSuggestionsOpts } from '@/actions/discoveries/discovery-types';
import { useAppState } from '@/state/app-state';
import { readStreamableValue } from 'ai/rsc';
import { motion } from 'framer-motion';
import { useIsMounted } from 'usehooks-ts';

import { cn } from '@/lib/utils';

import { Spinner } from '../spinner';
import { DiscoveryUserSuggestionSkeleton } from './discovery-suggestions-skeletons';

import type {
  AIGeneratedDiscoverySuggestions,
  AIGeneratedSingleDiscoverySuggestionModel,
} from '@/types/discovery-suggestions';

export type UseDiscoveryUserSuggestionsProps = {
  runOnMount?: boolean;
  initialRunPrompt?: string;
  initialValues?: AIGeneratedDiscoverySuggestions;
  generateOpts?: StreamPersonalizedUserExperienceSuggestionsOpts;
};

export type UseDiscoveryUserSuggestionsResponse = {
  generating: boolean;
  suggestions: AIGeneratedDiscoverySuggestions;
  generateSuggestions: (input?: string) => Promise<void>;
};

export function useDiscoveryUserSuggestions(
  props?: UseDiscoveryUserSuggestionsProps
): UseDiscoveryUserSuggestionsResponse {
  const {
    runOnMount,
    initialRunPrompt = '',
    initialValues,
    generateOpts,
  } = props || {};

  const [generating, setGenerating] = useState(false);

  const defaultValues = initialValues || [];
  const [suggestions, setSuggestions] =
    useState<AIGeneratedDiscoverySuggestions>(defaultValues);

  const handleGeneratingUserSuggestions = async (context?: string) => {
    if (generating) return;

    const {
      interests,
      geolocation,
      numOfSuggestions = 4,
      //   handleOnFinish,
    } = generateOpts || {};

    setGenerating(true);

    const { suggestions: generatedSuggestions } = await generateUserSuggestions(
      context,
      {
        numOfSuggestions,
        geolocation,
        interests,
      }
    );

    for await (const partialObject of readStreamableValue(
      generatedSuggestions
    )) {
      const partialGeneratedSuggestions = partialObject.suggestions || [];
      if (partialGeneratedSuggestions.length) {
        setSuggestions([...defaultValues, ...partialGeneratedSuggestions]);
      }
    }

    setGenerating(false);
  };

  useEffect(() => {
    if (runOnMount) {
      handleGeneratingUserSuggestions(initialRunPrompt);
    }
  }, [runOnMount]);

  return {
    generating,
    suggestions,
    generateSuggestions: handleGeneratingUserSuggestions,
  };
}

export type DiscoveryUserSuggestionsProps = {
  items?: AIGeneratedDiscoverySuggestions;
  itemClassName?: string;
  numOfSkeletons?: number;
  opts?: StreamPersonalizedUserExperienceSuggestionsOpts;
  onItemSelect: (item: AIGeneratedSingleDiscoverySuggestionModel) => void;
};

/**
 * Renders discovery suggestions to the user.
 *
 * @note Consumes items from the corresponding hook @useDiscoveryUserSuggestions
 *
 */
export function DiscoveryUserSuggestions({
  items,
  itemClassName,
  numOfSkeletons = 4,
  opts = {},
  onItemSelect,
}: DiscoveryUserSuggestionsProps) {
  const isMountedCheck = useIsMounted();
  const isMounted = isMountedCheck();

  const {
    isReady: isAppReady,
    userProfileBio,
    userProfileInterests,
    userProfileLocation,
    userProfileProfession,
  } = useAppState();

  const { generating, suggestions, generateSuggestions } =
    useDiscoveryUserSuggestions({
      runOnMount: true,
      initialValues: items,
      generateOpts: {
        ...(opts || {}),
        geolocation: {
          city: userProfileLocation,
          latitude: userProfileLocation,
          longitude: userProfileLocation,
        },
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
    <div className="relative grid w-full grid-cols-1 items-start gap-3 py-5 md:grid-cols-2">
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
              'flex cursor-pointer flex-col gap-2 rounded-lg border bg-muted/40 p-2.5',
              itemClassName
            )}
            onClick={() => onItemSelect(suggestion)}
          >
            <h3
              className={cn('text-sm font-semibold brightness-65', {
                'flex items-center gap-1': lastIsGenerating,
              })}
            >
              {suggestion.label}
              {lastIsGenerating && <Spinner className="" />}
            </h3>
            <p className={cn('truncate text-sm')}>{suggestion.title}</p>
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
              labelClassName={cn({
                'w-3/4': idx % 2 === 0, // For indexes that are even
                'w-1/2': idx % 2 !== 0, // For indexes that are odd
              })}
            />
          );
        })}
    </div>
  );
}
