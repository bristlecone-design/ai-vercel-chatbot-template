'use client';

import * as React from 'react';
import { streamCreateExperienceTitle } from '@/actions/titles';
import { useAppState } from '@/state/app-state';
import { readStreamableValue } from 'ai/rsc';
import { useDebouncedCallback } from 'use-debounce';

import type { StreamCreateExperienceTitleOpts } from '@/types/titles';

type GeneratedExperienceTitleHookProps = StreamCreateExperienceTitleOpts & {
  context?: string | null;
  isReady?: boolean; // If parent component is ready
  autoGenerateOnMount?: boolean;
};

/**
 * Hook to generate a relevant experience title for the user
 *
 */
export function useGeneratedExperienceTitle(
  props?: Partial<GeneratedExperienceTitleHookProps>
) {
  const {
    name: nameProp,
    context: contextProp,
    isReady: isParentComponentReadyProp = false,
    autoGenerateOnMount = false,
    storySeries: storySeriesProp,
    storySeriesDescription: storySeriesDescriptionProp,
    storySeriesPrompt: storySeriesPromptProp,
  } = props || {};

  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const [generated, setGenerated] = React.useState<boolean>(false);
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [suggestedTitle, setSuggestedTitle] = React.useState<string>('');

  const {
    isReady: isAppReady,
    userLocation: userAppLocation,
    userProfile,
    userFirstName,
  } = useAppState();

  const { interests } = userProfile || {};

  const userName = nameProp || userFirstName || 'Unknown';
  const userInterests = interests || '';
  // const userProfession = profession || '';
  const userLocation = userAppLocation || '';

  const isHookReady = isMounted && isAppReady;

  /**
   * Handle generating relevant experience title
   */
  const handleGeneratingTitle = React.useCallback(
    async (
      opts = {} as GeneratedExperienceTitleHookProps & {
        replace?: boolean;
      }
    ) => {
      const { context: newContext, name = userName } = opts;
      const context = newContext || contextProp || '';

      if (!name) return;
      if (!isAppReady) return;
      if (!context) return;
      if (generating) return;

      const {
        replace = false,
        location = userLocation,
        interests = userInterests,
        // profession = userProfession,
        storySeries = storySeriesProp,
        storySeriesDescription = storySeriesDescriptionProp,
        storySeriesPrompt = storySeriesPromptProp,
        currentTime = new Date().getTime(),
      } = opts;

      setGenerating(true);

      const { stream: streamedSuggestedTitle } =
        await streamCreateExperienceTitle(context, {
          name,
          location,
          interests,
          storySeries,
          storySeriesDescription,
          storySeriesPrompt,
          currentTime,
        });

      if (replace) {
        setSuggestedTitle('');
      }

      // @see https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
      for await (const delta of readStreamableValue(streamedSuggestedTitle)) {
        setSuggestedTitle(
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
      // userProfession,
      storySeriesProp,
      storySeriesDescriptionProp,
      storySeriesPromptProp,
      contextProp,
      isAppReady,
      generating,
    ]
  );

  const handleDebouncedGeneratingTitle = useDebouncedCallback(
    async (...args: Parameters<typeof handleGeneratingTitle>) => {
      handleGeneratingTitle(...args);
    },
    250,
    {
      leading: true,
      trailing: false,
    }
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate on mount if ready and autoGenerateOnMount is true
  React.useEffect(() => {
    if (generating) return;
    if (generated) return;

    if (isHookReady && isParentComponentReadyProp && autoGenerateOnMount) {
      handleGeneratingTitle();
    }
  }, [
    generated,
    generating,
    autoGenerateOnMount,
    isParentComponentReadyProp,
    isHookReady,
    handleGeneratingTitle,
  ]);

  return {
    ready: isHookReady,
    generated,
    generating,
    suggestedTitle,
    handleGeneratingTitle: handleDebouncedGeneratingTitle,
  };
}
