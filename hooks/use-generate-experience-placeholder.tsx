'use client';

import * as React from 'react';
import { streamCreateExperiencePlaceholder } from '@/actions/placeholders';
import { useAppState } from '@/state/app-state';
import { readStreamableValue } from 'ai/rsc';

import type { StreamCreateExperiencePlaceholderOpts } from '@/types/placeholders';

type GeneratedExperiencePlaceholderHookProps =
  StreamCreateExperiencePlaceholderOpts & {
    name?: string | null;
    isReady?: boolean; // If parent component is ready
    autoGenerateOnMount?: boolean;
  };

/**
 * Hook to generate a personalized experience placeholder for the user
 *
 */
export function useGeneratedExperiencePlaceholder(
  props?: Partial<GeneratedExperiencePlaceholderHookProps>
) {
  const {
    name: nameProp,
    isReady: isParentComponentReadyProp = false,
    autoGenerateOnMount = false,
    storySeries: storySeriesProp,
    storySeriesDescription: storySeriesDescriptionProp,
    storySeriesPrompt: storySeriesPromptProp,
  } = props || {};

  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const [generated, setGenerated] = React.useState<boolean>(false);
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [placeholder, setPersonalizedPlaceholder] = React.useState<string>('');

  const {
    isReady: isAppReady,
    userLocation: userAppLocation,
    userProfile,
    userFirstName,
  } = useAppState();

  const { interests, profession } = userProfile || {};

  const userName = nameProp || userFirstName || 'Unknown';
  const userInterests = interests || '';
  const userProfession = profession || '';
  const userLocation = userAppLocation || '';

  const isHookReady = isMounted && isAppReady;

  /**
   * Handle generating personalized experience placeholder
   */
  const handleGeneratingPlaceholder = React.useCallback(
    async (
      opts = {} as GeneratedExperiencePlaceholderHookProps & {
        replace?: boolean;
      }
    ) => {
      const { name = userName } = opts;

      if (!name) return;
      if (!isAppReady) return;
      if (generating) return;

      const {
        replace = false,
        location = userLocation,
        interests = userInterests,
        profession = userProfession,
        storySeries = storySeriesProp,
        storySeriesDescription = storySeriesDescriptionProp,
        storySeriesPrompt = storySeriesPromptProp,
      } = opts;

      setGenerating(true);

      const { stream: streamedPlaceholder } =
        await streamCreateExperiencePlaceholder(name, {
          location,
          interests,
          profession,
          storySeries,
          storySeriesDescription,
          storySeriesPrompt,
        });

      if (replace) {
        setPersonalizedPlaceholder('');
      }

      // @see https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
      for await (const delta of readStreamableValue(streamedPlaceholder)) {
        setPersonalizedPlaceholder(
          (currentGeneration) => `${currentGeneration}${delta}`
        );
      }

      setGenerating(false);
      setGenerated(true);
    },
    [
      userName,
      userInterests,
      userLocation,
      userProfession,
      storySeriesProp,
      storySeriesDescriptionProp,
      storySeriesPromptProp,
      isAppReady,
      generating,
    ]
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate on mount if ready and autoGenerateOnMount is true
  React.useEffect(() => {
    if (generating) return;
    if (generated) return;

    if (isHookReady && isParentComponentReadyProp && autoGenerateOnMount) {
      handleGeneratingPlaceholder();
    }
  }, [
    generated,
    generating,
    autoGenerateOnMount,
    isParentComponentReadyProp,
    isHookReady,
    handleGeneratingPlaceholder,
  ]);

  return {
    ready: isHookReady,
    generated,
    generating,
    placeholder,
    handleGeneratingPlaceholder,
  };
}
