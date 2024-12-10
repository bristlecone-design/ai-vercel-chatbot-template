'use client';

import * as React from 'react';
import { clearTagCache } from '@/actions/cache';
import { CACHE_KEY_PROMPTS } from '@/actions/cache-keys';
import { streamPersonalizedUserExperiencePromptsFrontend } from '@/actions/experience-prompts';
import { getCachedUserIncompletePrompts } from '@/actions/prompts';
import { readStreamableValue } from 'ai/rsc';
import { wrap } from 'popmotion';
import { useInterval } from 'react-use';

import { sleep } from '@/lib/utils';

import { useLocalStorage } from './use-local-storage';

import type {
  AIGeneratedExperiencePrompts,
  GeneratedExperienceUserPrompt,
  GeneratedExperienceUserPrompts,
} from '@/types/experience-prompts';

function getRandomPromptIndex(prompts: GeneratedExperienceUserPrompts) {
  return Math.floor(Math.random() * prompts.length);
}

function selectRandomPrompt(prompts: GeneratedExperienceUserPrompts) {
  const randomIndex = getRandomPromptIndex(prompts);
  return prompts[randomIndex];
}

/**
 * Generates personalized experience prompts for the user to engage with.
 *
 * Final Experience Prompts are records that are generated based on the user's context.
 *
 * @see experience-prompts.ts
 * @see https://sdk.vercel.ai/examples/next-app/basics/streaming-object-generation
 *
 * @param userContext
 * @param numOfPrompts
 * @returns Generated prompts and a function to generate them
 */

export type useGenerateExperiencePromptsProps = {
  context: string | undefined | null;
  userId?: string;
  userLocation?: string;
  userPrompts?: GeneratedExperienceUserPrompts;
  numOfPrompts?: number;
  onInitOnlyWithContext?: boolean;
  pauseInterval?: boolean;
  placeholderIntervalTime?: number;
};

export type useGenerateExperiencePromptsType = {
  fetchingData: boolean;
  paginationEnabled: boolean;
  isPromptSelectionOpen: boolean;
  context: useGenerateExperiencePromptsProps['context'];
  currentUserPrompt: GeneratedExperienceUserPrompt | undefined;
  currentUserPromptSet: GeneratedExperienceUserPrompts;
  userPrompts: GeneratedExperienceUserPrompts;
  userPromptSets: Array<GeneratedExperienceUserPrompts>;
  generatedPrompts: AIGeneratedExperiencePrompts;

  handleSelectingUserPrompt: (
    prompt: string | GeneratedExperienceUserPrompt
  ) => void;
  handleSelectingRandomUserPrompt: (
    currentPrompt?: string
  ) => Promise<GeneratedExperienceUserPrompt | undefined>;
  handleFetchingUserPrompts: (uid?: string) => Promise<void>;
  handleGeneratingPrompts: (ctx?: string, num?: number) => Promise<void>;
  handleGeneratingFreshPrompts: (ctx?: string, num?: number) => Promise<void>;
  handleManualPause: (pause: boolean) => void;
  handlePaginatingPrompts: (newDirection: number) => void;
  handleTogglingPromptSelectionView: (nextState?: boolean) => void;
};

export function useGenerateExperiencePrompts(
  props: useGenerateExperiencePromptsProps
): useGenerateExperiencePromptsType {
  const {
    userId,
    userLocation: userLocationProp,
    userPrompts: userPromptsProp = [],
    context: contextProp = '',
    numOfPrompts = 20,
    onInitOnlyWithContext = true,
    placeholderIntervalTime = 6500,
    pauseInterval = false,
  } = props || {};

  // State
  const [isReady, setIsReady] = React.useState<boolean>(false);

  const [isManualPaused, setIsManualPaused] = React.useState<boolean>(false);
  // console.log(`**** isManualPaused`, isManualPaused);

  const [context, setContext] = useLocalStorage<
    useGenerateExperiencePromptsProps['context']
  >('create-experience-challenge-ctx', contextProp);

  // Generated prompts
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [generatedPromptsLocation, setGeneratedPromptsLocation] =
    useLocalStorage<string | undefined>(
      'create-experience-challenge-prompts-location',
      userLocationProp
    );

  const [generatedPrompts, setGeneratedPrompts] =
    useLocalStorage<AIGeneratedExperiencePrompts>(
      'create-experience-challenge-prompts',
      []
    );

  const [fetching, setFetching] = React.useState<boolean>(false);
  const [userPrompts, setUserPrompts] =
    useLocalStorage<GeneratedExperienceUserPrompts>(
      'create-experience-challenge-user-prompts',
      userPromptsProp
    );

  const [currentPrompt, setCurrentPrompt] = useLocalStorage<
    GeneratedExperienceUserPrompt | undefined
  >('create-experience-challenge-prompt', undefined);

  // Prompt Challenge
  const [[promptSelectionPage, promptSelectionDirection], setPage] =
    React.useState([0, 0]);

  const [isPromptSelectionOpen, setIsPromptSelectionOpen] =
    React.useState(false);

  // Flags (for convenience)
  const hasUserPrompts = userPrompts && userPrompts.length > 0;

  //-- Handlers

  const handlePaginatingPrompts = (newDirection: number) => {
    setPage([promptSelectionPage + newDirection, newDirection]);
  };

  const handleTogglingPromptSelectionView = (nextState?: boolean) => {
    if (nextState !== undefined) {
      setIsPromptSelectionOpen(nextState);
    } else {
      setIsPromptSelectionOpen(!isPromptSelectionOpen);
    }
  };

  // Retrieve the user's generated Db record prompts from the cache
  const fetchUserPrompts = async (
    uid = userId,
    location = generatedPromptsLocation
  ) => {
    if (!uid || fetching) return;

    setFetching(true);

    const prompts = await getCachedUserIncompletePrompts(uid, location);

    if (prompts && prompts.length) {
      // If prompts are found, set them as the user prompts at the top/beginning
      setUserPrompts([...prompts, ...userPrompts]);
    } else {
      // If no prompts are found, generate new ones
      await generatePrompts();
    }

    setFetching(false);
  };

  // Generate AI personalized prompts for the user using the context
  const generatePrompts = async (
    ctx = context,
    num = numOfPrompts,
    location = generatedPromptsLocation
  ) => {
    if (ctx === null || !ctx) {
      return;
    }

    const existingPrompts = userPrompts.length
      ? userPrompts.map((p) => p.prompt)
      : [];

    const { generated, records: dbRecords } =
      await streamPersonalizedUserExperiencePromptsFrontend(ctx, {
        numOfPrompts: num,
        excludePrompts: existingPrompts,
        geolocation: {
          city: location,
        },
      });

    setGenerating(true);
    // Read any AI generated prompts
    // @note the generated prompts are received in accumulative chunks so it's fine to update the state directly as an overwrite
    if (generated) {
      for await (const partialObject of readStreamableValue(generated)) {
        if (partialObject) {
          setGeneratedPrompts(partialObject.prompts);
        }
      }
    }

    // Read the corresponding Db generated prompt records
    // @note we prepend any existing user generated prompts since the db records are received in one go
    if (dbRecords) {
      for await (const partialObject of readStreamableValue(dbRecords)) {
        if (partialObject) {
          setUserPrompts([...userPrompts, ...partialObject]);
        }
      }
      // Set the current prompt to a random one from the generated prompts if not already set
      if (!currentPrompt && userPrompts) {
        const randomPrompt = selectRandomPrompt(userPrompts);
        if (randomPrompt) setCurrentPrompt(randomPrompt);
      }
    }

    setGenerating(false);
  };

  const generateFreshPrompts = async (ctx = context, num = numOfPrompts) => {
    // First, clear the cache tags
    if (ctx) clearTagCache(ctx);
    clearTagCache(CACHE_KEY_PROMPTS);

    // Then, generate new prompts
    await generatePrompts(ctx, num);
  };

  const handleSelectingUserPrompt = (
    prompt: string | GeneratedExperienceUserPrompt
  ) => {
    if (typeof prompt === 'string') {
      const selectedPrompt = userPrompts.find((p) => p.prompt === prompt);
      if (selectedPrompt) {
        setCurrentPrompt(selectedPrompt);
      }
    } else {
      setCurrentPrompt(prompt);
    }
  };

  const handleSelectingRandomUserPrompt = async (
    prompt?: string
  ): Promise<GeneratedExperienceUserPrompt | undefined> => {
    if (!userPrompts || userPrompts.length === 0) {
      if (fetching) return;
      await fetchUserPrompts(); // Retreive user prompts if not available
      await sleep(1000); // Still a little
      return handleSelectingRandomUserPrompt(prompt); // Then try again
    }

    const randomPrompt = selectRandomPrompt(userPrompts);

    // If current prompt is specified and it's different from the selected prompt, we're good
    if (prompt && randomPrompt) {
      if (randomPrompt.prompt !== prompt) {
        handleSelectingUserPrompt(randomPrompt);
        return randomPrompt;
      } else {
        // Otherwise, we'll try again
        return handleSelectingRandomUserPrompt(prompt);
      }
    }

    handleSelectingUserPrompt(randomPrompt);
    return randomPrompt;
  };

  const handleManualPause = (pause: boolean) => {
    setIsManualPaused(pause);
  };

  // Initialize readiness
  React.useEffect(() => {
    if (!isReady && contextProp && userLocationProp && userId) {
      // console.log(
      //   `**** Setting things to Ready with userId ${userId} and context`,
      //   contextProp
      // );
      setIsReady(true);
      setContext(contextProp);
      setGeneratedPromptsLocation(userLocationProp);
    }
  }, [isReady, contextProp, userLocationProp, userId]);
  // console.log(`**** userLocationProp passed to useGenerateExperiencePrompts`, {
  //   userLocationProp,
  // });

  // Fetch prompts on ready if not already fetched
  React.useEffect(() => {
    if (fetching) return;

    if (isReady && !hasUserPrompts && !fetching) {
      // console.log(`**** Fetching user prompts on ready for userId: ${userId}`);
      fetchUserPrompts(userId, generatedPromptsLocation);
    }
  }, [
    isReady,
    context,
    contextProp,
    userId,
    hasUserPrompts,
    generatedPromptsLocation,
    pauseInterval,
    fetching,
  ]);

  // Fetch prompts on location change
  // Only triggers if previously fetched as well
  React.useEffect(() => {
    if (fetching || generating) return;

    if (
      isReady &&
      hasUserPrompts &&
      userLocationProp &&
      userLocationProp !== generatedPromptsLocation
    ) {
      // console.log(
      //   `**** Fetching user prompts on location change for userId: ${userId}`,
      //   {
      //     existing: generatedPromptsLocation,
      //     new: userLocationProp,
      //   }
      // );
      setGeneratedPromptsLocation(userLocationProp);
      fetchUserPrompts(userId, generatedPromptsLocation);
    }
  }, [
    fetching,
    generating,
    hasUserPrompts,
    userLocationProp,
    generatedPromptsLocation,
  ]);

  // For testing, useTimeout to change the location after 15-seconds to Sparks
  // React.useEffect(() => {
  //   setTimeout(() => {
  //     console.log(`**** Changing location to Sparks`);
  //     setGeneratedPromptsLocation('Sparks');
  //   }, 15000);
  // }, []);

  // Cycle through prompts for general display and select the next one
  useInterval(
    () => {
      handleSelectingRandomUserPrompt(currentPrompt?.prompt);
    },
    // Only cycle through prompts if we have generated prompts
    isReady && context && hasUserPrompts && !pauseInterval && !isManualPaused
      ? placeholderIntervalTime
      : null
  );
  // console.log(`**** currentPrompt in useGenerateExperiencePrompts`, {
  //   currentPrompt,
  //   userPrompts,
  //   generatedPrompts,
  //   pauseInterval,
  // });

  // Prompt sets based on pagination
  const userPromptGroupedSets = React.useMemo(() => {
    const groupedPrompts = [];
    for (let i = 0; i < userPrompts.length; i += 15) {
      groupedPrompts.push(userPrompts.slice(i, i + 15));
    }
    return groupedPrompts;
  }, [userPrompts]);
  const userPromptGroupedSetsCount = userPromptGroupedSets.length;

  const hasMultiplePromptPages = userPromptGroupedSetsCount > 1;

  const promptsIndex = wrap(0, userPromptGroupedSetsCount, promptSelectionPage);

  const currentPromptSet = userPromptGroupedSets[promptsIndex];

  return {
    context,
    userPrompts,
    userPromptSets: userPromptGroupedSets,
    currentUserPromptSet: currentPromptSet,
    currentUserPrompt: currentPrompt,
    generatedPrompts,
    fetchingData: fetching,
    paginationEnabled: hasMultiplePromptPages,
    isPromptSelectionOpen,
    // Select and refreshing prompts
    handleSelectingUserPrompt,
    handleSelectingRandomUserPrompt,
    handleFetchingUserPrompts: fetchUserPrompts,
    // Generate AI prompts w/context
    handleGeneratingPrompts: generatePrompts,
    handleGeneratingFreshPrompts: generateFreshPrompts,
    handleManualPause,
    // Prompt Challenge
    handlePaginatingPrompts,
    handleTogglingPromptSelectionView,
  };
}
