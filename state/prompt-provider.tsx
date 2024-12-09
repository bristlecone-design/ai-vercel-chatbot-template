'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { clearPathCache, clearTagCache } from '@/actions/cache';
import { CACHE_KEY_PROMPT, CACHE_KEY_PROMPTS } from '@/actions/cache-keys';
import { streamPersonalizedUserExperiencePromptsFrontend } from '@/actions/experience-prompts';
import {
  getCachedAnonymousUserPrompts,
  getCachedUserIncompletePrompts,
} from '@/actions/prompts';
import {
  createGeneratedCompletePromptCacheKey,
  createPromptCollectionStoryPermalink,
  getUniquePrompts,
} from '@/features/experiences/utils/experience-prompt-utils';
import { createContextForGeneratingExperiencePrompts } from '@/features/experiences/utils/experience-utils';
// import { getPhotosHiddenMetaCachedAction } from '@/photo/actions';

import { readStreamableValue } from 'ai/rsc';
import { wrap } from 'popmotion';
import { useInterval } from 'react-use';
import { toast } from 'sonner';

import { getBaseUrl } from '@/lib/getBaseUrl';
import { sleep } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import usePathnames from '@/hooks/use-pathnames';

import { useAppState } from './app-state';

import type {
  AIGeneratedExperiencePrompts,
  AIGeneratedExperienceSinglePromptModel,
  GeneratedExperienceUserPrompt,
  GeneratedExperienceUserPrompts,
} from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';
import type { AppUser } from '@/types/next-auth';

const DEFAULT_CONTEXT = 'Guest User to the Experience NV Platform';

/**
 * Prompt Provider
 *
 * This provider manages the state and logic for generating and managing user prompts. User prompts are generated based on the user's profile context and location. But can also be re-generated based on a new context or location as needed.
 */

function getRandomPromptIndex(prompts: GeneratedExperienceUserPrompts) {
  return Math.floor(Math.random() * prompts.length);
}

function selectRandomPrompt(prompts: GeneratedExperienceUserPrompts) {
  const randomIndex = getRandomPromptIndex(prompts);
  return prompts[randomIndex];
}

type GeneratedPromptsSet = {
  generated: AIGeneratedExperiencePrompts;
  dbRecords: GeneratedExperienceUserPrompts;
};

export interface PromptContext {
  // Flags
  isReady: boolean;
  fetchingPrompts: boolean;
  generatingPrompts: boolean;

  // Story details (for current prompt)
  storyId: string | null | undefined;
  storyPath: string | null | undefined;
  storyTitle: string | null | undefined;
  storyPermalinkRelative: string | null;
  storyPermalinkAbsolute: string | null;
  isStoryPrompt: boolean;

  // Prompts
  currentUserPrompt: GeneratedExperienceUserPrompt | undefined | null;
  userSelectedPrompt: GeneratedExperienceUserPrompt | undefined | null;
  userCompletedPrompts: GeneratedExperienceUserPrompts;
  userPromptChallenges: GeneratedExperienceUserPrompts; // All prompts
  currentUserPromptChallengeSet: GeneratedExperienceUserPrompts; // Current set
  userPromptsIndex: number; // Current prompt index
  userPromptGroupedSets: GeneratedExperienceUserPrompts[]; // All prompts grouped
  userPromptChallengeAcceptance: boolean;
  userPromptChallengeContext: string | undefined;

  // Prompt Selection and Completion Dialog
  isPromptSelectionOpen: boolean;
  isPromptCompletionDialogOpen: boolean;

  // Prompt view context
  isPromptSingleView: boolean;
  isPromptCompletionView: boolean;

  // Completion status
  isUserSelectedPromptCompleted: boolean;
  isUserSelectedPromptCompletedAuthUsers: boolean;

  // Prompts corresponding experience model
  experiencePrompt?: ExperienceModel | null;

  // Pagination
  promptPaginationEnabled: boolean;

  // Core Handlers
  handleClearingPromptIdCache: (promptId: string, clearUser?: boolean) => void;
  // Generate Experience Prompts
  handleInitializingPrompts: (uid?: string, location?: string) => void;

  handleTogglingPromptChallengeAcceptance: (nextState?: boolean) => void;
  handleTogglingCompletePromptView: (nextState?: boolean) => void;
  handleGeneratingExperiencePrompts: (
    ctx?: string,
    num?: number
  ) => Promise<GeneratedPromptsSet | undefined>;

  handleSelectingRandomPromptChallenge: (
    prompt?: string,
    routeToPrompt?: boolean | undefined
  ) => Promise<void>;

  handleSelectingPromptChallenge: (
    prompt: string | GeneratedExperienceUserPrompt
  ) => void;

  handlePausingPromptChallengeAutoChange: (nextState: boolean) => void;
  handlePaginatingPromptChallenges: (nextPage: number) => void;
  handleTogglingPromptSelectionView: (nextState?: boolean) => void;

  handleRemovingPromptChallenge: (
    prompt: GeneratedExperienceUserPrompt,
    completed?: boolean
  ) => void;

  handleOnSuccessfullyCreatedPromptChallenge: (
    prompt: GeneratedExperienceUserPrompt,
    pickNext?: boolean,
    routeToNext?: boolean,
    clearCache?: boolean
  ) => void;
}

export const DEFAULT_PROMPT_STATE: PromptContext = {
  // Flags
  isReady: false,
  fetchingPrompts: false,
  generatingPrompts: false,

  // Story details
  storyId: undefined,
  storyPath: undefined,
  storyTitle: undefined,
  storyPermalinkRelative: null,
  storyPermalinkAbsolute: null,
  isStoryPrompt: false,

  // Prompts
  currentUserPrompt: undefined,
  userSelectedPrompt: undefined,
  userPromptChallenges: [],
  userCompletedPrompts: [],
  userPromptChallengeContext: '',

  // Prompt Challenge
  userPromptChallengeAcceptance: false,

  // Prompt view context
  isPromptSingleView: false,
  isPromptCompletionView: false,

  // Pagination
  userPromptsIndex: 0,
  userPromptGroupedSets: [],
  currentUserPromptChallengeSet: [],
  promptPaginationEnabled: false,

  // Prompt Select and Completion Dialog
  isPromptSelectionOpen: false,
  isPromptCompletionDialogOpen: false,

  // Completion status
  isUserSelectedPromptCompleted: false,
  isUserSelectedPromptCompletedAuthUsers: false,

  // Single prompt's experience model
  experiencePrompt: undefined,

  // Core Handlers
  handleInitializingPrompts: () => {},
  handleClearingPromptIdCache: () => {},
  // Generate Experience Prompts
  handleTogglingPromptChallengeAcceptance: () => {},
  handleTogglingCompletePromptView: () => {},
  handleGeneratingExperiencePrompts: () =>
    Promise.resolve({} as GeneratedPromptsSet),
  handleSelectingRandomPromptChallenge: () => Promise.resolve(),
  handleSelectingPromptChallenge: () => {},
  handlePausingPromptChallengeAutoChange: () => {},
  handlePaginatingPromptChallenges: () => {},
  handleTogglingPromptSelectionView: () => {},
  handleRemovingPromptChallenge: () => {},
  handleOnSuccessfullyCreatedPromptChallenge: () => {},

  // Other required values as defined...
};

export const PromptContext =
  React.createContext<PromptContext>(DEFAULT_PROMPT_STATE);

export const DefaultCurrentPromptStateKey =
  'create-experience-challenge-prompt';

export const DefaultSingleCurrentPromptStateKey =
  'create-experience-challenge-single-prompt';

export const DefaultPromptChallengeAcceptedStateKey =
  'create-experience-challenge-prompt-accepted';

export const DefaultSinglePromptChallengeAcceptedStateKey =
  'create-experience-challenge-single-prompt-accepted';

export interface PromptProviderProps {
  onInitOnlyWithContext?: boolean;
  noInitForNonAuth?: boolean;
  noInitPromptsOnMount?: boolean;
  isSingleView?: boolean;
  isCompletionView?: boolean;
  experiencePrompt?: ExperienceModel | null;
  context?: PromptContext['userPromptChallengeContext'];
  userId?: string;
  userLocation?: string;
  userPrompts?: PromptContext['userPromptChallenges'];
  userCompletedPrompts?: PromptContext['userCompletedPrompts'];
  currentPrompt?: PromptContext['currentUserPrompt'];
  numOfPrompts?: number;
  numOfPromptsPerPage?: number;
  promptChallengeAccepted?: boolean;
  pauseInterval?: boolean;
  placeholderIntervalTime?: number;
  userSession?: AppUser;

  currentPromptStateKey?: string;
  promptChallengeAcceptedStateKey?: string;
  children: React.ReactNode;
}

export default function PromptProvider(props: PromptProviderProps) {
  const {
    // userId,
    // userLocation: userLocationProp,
    // Prompt view context
    isSingleView: isSingleViewProp = false,
    isCompletionView: isCompletionViewProp = false,

    // Flags and counters
    noInitPromptsOnMount: noInitPromptsOnMountProp = true,
    noInitForNonAuth: noInitForNonAuthProp = false,
    onInitOnlyWithContext: onInitOnlyWithContextProp = true,
    numOfPrompts: numOfPromptsProp = 20,
    numOfPromptsPerPage: numOfPromptsPerPageProp = 12,
    placeholderIntervalTime: placeholderIntervalTimeProp = 6500,
    pauseInterval: pauseIntervalProp = false,

    // Context for generating prompts
    context: contextProp = '',

    // Prompt's experience model
    experiencePrompt: experiencePromptProp,

    // User prompts
    currentPrompt: currentPromptProp,
    userPrompts: userPromptsProp = [],
    userCompletedPrompts: userCompletedPromptsProp = [],

    // Prompt Challenge
    promptChallengeAccepted: promptChallengeAcceptedProp = false,
    userSession: userSessionProp,

    // State keys
    currentPromptStateKey:
      currentPromptStateKeyProp = DefaultCurrentPromptStateKey,

    promptChallengeAcceptedStateKey:
      promptChallengeAcceptedStateKeyProp = DefaultPromptChallengeAcceptedStateKey,

    // Children
    children,
  } = props || {};

  try {
    const router = useRouter();
    const { currentPathname } = usePathnames();

    // App State Dependency
    const {
      userId,
      userProfile,
      // userProfileUsername,
      userLocation: userAppLocation,
      isAuthenticated,
    } = useAppState();
    const userPromptContext =
      userProfile && userAppLocation
        ? createContextForGeneratingExperiencePrompts(userProfile)
        : contextProp;

    // Provider State
    const [isMounted, setIsMounted] = React.useState<boolean>(false);

    const [isReady, setIsReady] = React.useState<boolean>(false);

    const [isManualPaused, setIsManualPaused] =
      React.useState<boolean>(pauseIntervalProp);
    // console.log(`**** isManualPaused`, isManualPaused);

    const [numOfPromptsPerPage, setNumOfPromptsPerPage] = React.useState(
      numOfPromptsPerPageProp
    );

    const [context, setContext] = useLocalStorage(
      'create-experience-challenge-ctx',
      userPromptContext
    );

    // Generated prompts
    const [generating, setGenerating] = React.useState<boolean>(false);

    const [generatedPromptsLocation, setGeneratedPromptsLocation] =
      useLocalStorage(
        'create-experience-challenge-prompts-location',
        userAppLocation
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

    const [completedPrompts, setCompletedPrompts] =
      React.useState<GeneratedExperienceUserPrompts>(userCompletedPromptsProp);

    const [currentPrompt, setCurrentPrompt] = useLocalStorage<
      GeneratedExperienceUserPrompt | undefined | null
    >(currentPromptStateKeyProp, currentPromptProp);

    // Prompt Challenge
    const [[promptSelectionPage, promptSelectionDirection], setPage] =
      React.useState([0, 0]);

    const [isPromptSelectionOpen, setIsPromptSelectionOpen] =
      React.useState(false);

    const [isPromptCompletionDialogOpen, setIsPromptCompletionDialogOpen] =
      React.useState(false);

    const [promptChallengeAccepted, setPromptChallengeAccepted] =
      useLocalStorage(
        promptChallengeAcceptedStateKeyProp,
        promptChallengeAcceptedProp
      );

    // Flags (for convenience)
    const hasUserPrompts = userPrompts && userPrompts.length > 0;
    const hasUserCompletedPrompts =
      completedPrompts && completedPrompts.length > 0;

    //--------- Handlers

    const handlePaginatingPrompts = (newDirection: number) => {
      setPage([promptSelectionPage + newDirection, newDirection]);
    };

    const handleTogglingCompletePromptView = (nextState?: boolean) => {
      if (nextState !== undefined) {
        setIsPromptCompletionDialogOpen(nextState);
      } else {
        setIsPromptCompletionDialogOpen(!isPromptCompletionDialogOpen);
      }
    };

    const handleTogglingPromptSelectionView = (nextState?: boolean) => {
      if (nextState !== undefined) {
        setIsPromptSelectionOpen(nextState);
      } else {
        setIsPromptSelectionOpen(!isPromptSelectionOpen);
      }
    };

    // Retrieve the user's generated Db record prompts from the cache
    const fetchAuthUserPrompts = async (
      uid = userId,
      location = generatedPromptsLocation
    ) => {
      if (!uid || fetching || generating) return;

      setFetching(true);

      toast.info(
        `Fetching existing user prompts${location ? ` based on ${location}` : ''}...`
      );

      const incompletePrompts = (await getCachedUserIncompletePrompts(
        uid,
        location
      )) as unknown as GeneratedExperienceUserPrompts;
      // console.log("***** incompletePrompts for auth user", {
      //   incompletePrompts,
      //   uid,
      //   location,
      // });

      if (incompletePrompts?.length) {
        toast.info(
          `Retrieved ${incompletePrompts.length} personalized user prompts!`
        );
        // If prompts are found, set them as the user prompts at the top/beginning
        setUserPrompts(
          getUniquePrompts([
            ...incompletePrompts,
            ...userPrompts,
          ] as GeneratedExperienceUserPrompts)
        );
      } else {
        toast.info(`No existing user prompts found, let's generate some.`);
        // If no prompts are found, generate new ones
        const generateResults = await generateFreshPrompts(
          `Generate prompts for user based on ${location}`,
          undefined,
          location
        );

        // Prefetch the generated prompts by id
        if (generateResults) {
          const { dbRecords: newUserPrompts } = generateResults;
          if (newUserPrompts?.length) {
            setUserPrompts(
              getUniquePrompts([...newUserPrompts, ...userPrompts])
            );

            const promptIds = newUserPrompts.map((p) => p.id);

            for (const id of promptIds) {
              router.prefetch(`/prompts/${id}`);
            }
          }
        }
      }

      setFetching(false);

      return;
    };

    const fetchNonAuthUserPrompts = async (
      location = generatedPromptsLocation,
      ctx = context
    ) => {
      if (fetching || generating) return;

      setFetching(true);

      toast.info('Fetching user prompts for platform guest...');

      const prompts = await getCachedAnonymousUserPrompts(location);

      if (prompts?.length) {
        toast.info(`Retrieved ${prompts.length} personalized guest prompts!`);
        setUserPrompts(getUniquePrompts([...prompts, ...userPrompts]));
      } else {
        toast.info(`No platform guest prompts found, let's generate some.`);
        const generateResults = await generatePrompts(ctx, undefined, location);

        // Prefetch the generated prompts by id
        if (generateResults) {
          const { dbRecords } = generateResults;
          if (dbRecords?.length) {
            const promptIds = dbRecords.map((p) => p.id);
            // console.log(`**** Prefetching prompts by id`, promptIds);
            for (const id of promptIds) {
              router.prefetch(`/prompts/${id}`);
            }
          }
        }
      }

      setFetching(false);

      return;
    };

    // Generate AI personalized prompts for the user using the context
    const generatePrompts = async (
      ctx = context,
      num = numOfPromptsProp,
      location = generatedPromptsLocation
    ): Promise<GeneratedPromptsSet | undefined> => {
      if (ctx === null || !ctx) {
        return;
      }

      toast.info(`Queuing to generate ${num} new prompts...`);
      const completedPrompts = userPrompts.map((p) => p.prompt);
      const existingPrompts = userPrompts.length
        ? userPrompts.map((p) => p.prompt)
        : [];
      const excludePrompts = [...existingPrompts];

      const { generated, records: dbRecords } =
        await streamPersonalizedUserExperiencePromptsFrontend(ctx, {
          numOfPrompts: num,
          excludePrompts,
          completedPrompts,
          geolocation: {
            city: location,
          },
        });

      let generatedSet = [] as AIGeneratedExperiencePrompts;
      let generatedDbRecords = [] as GeneratedExperienceUserPrompts;

      setGenerating(true);
      // Read any AI generated prompts
      // @note the generated prompts are received in accumulative chunks so it's fine to update the state directly as an overwrite
      if (generated) {
        for await (const partialObject of readStreamableValue(generated)) {
          // console.log(`**** partialObject`, partialObject);
          if (partialObject.prompts?.length) {
            generatedSet = getUniquePrompts([
              ...generatedPrompts,
              ...partialObject.prompts.filter(
                (p: AIGeneratedExperienceSinglePromptModel) => p?.prompt
              ),
            ]);

            if (generatedSet.length) {
              setGeneratedPrompts(generatedSet);
            }
          }
        }
      }

      // Read the corresponding Db generated prompt records
      // @note we prepend any existing user generated prompts since the db records are received in one go
      if (dbRecords) {
        // console.log(`**** looping through generated db records`);
        for await (const partialObject of readStreamableValue(dbRecords)) {
          if (partialObject) {
            generatedDbRecords = getUniquePrompts([
              ...userPrompts,
              ...partialObject,
            ]);
            if (generatedDbRecords.length) {
              setUserPrompts(
                generatedDbRecords as GeneratedExperienceUserPrompts
              );
            }
          }
        }
        // Set the current prompt to a random one from the generated prompts if not already set
        if (!currentPrompt && generatedDbRecords.length) {
          const randomPrompt = selectRandomPrompt(generatedDbRecords);
          if (randomPrompt) setCurrentPrompt(randomPrompt);
        }
      }
      // console.log(`**** we're all done generating prompts`);

      setGenerating(false);

      toast.info(
        `Successfully generated ${generatedDbRecords.length} new prompts!`
      );

      return {
        generated: generatedSet,
        dbRecords: generatedDbRecords,
      } as GeneratedPromptsSet;
    };

    const generateFreshPrompts = async (
      ctx = context,
      num = numOfPromptsProp,
      location = generatedPromptsLocation
    ) => {
      // First, clear the cache tags
      if (ctx) clearTagCache(ctx);

      // Clear the cache for the generated prompts
      clearTagCache(CACHE_KEY_PROMPTS);

      // Clear the user cache for incomplete prompts
      if (userId) {
        const userIdCacheKey = createGeneratedCompletePromptCacheKey(
          userId,
          generatedPromptsLocation
        );
        clearTagCache(userIdCacheKey);
      }

      // Then, generate new prompts
      const results = await generatePrompts(ctx, num, location);

      return results;
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
        if (fetching || generating) return;
        if (isAuthenticated) {
          await fetchAuthUserPrompts(); // Retreive user prompts if not available
        } else {
          await fetchNonAuthUserPrompts();
        }
        await sleep(1000); // Still a little
        return handleSelectingRandomUserPrompt(prompt); // Then try again
      }

      const randomPrompt = selectRandomPrompt(userPrompts);

      // If current prompt is specified and it's different from the selected prompt, we're good
      if (prompt && randomPrompt) {
        if (randomPrompt.prompt !== prompt) {
          handleSelectingUserPrompt(randomPrompt);
          return randomPrompt;
        }

        // Otherwise, we'll try again
        return handleSelectingRandomUserPrompt(prompt);
      }

      handleSelectingUserPrompt(randomPrompt);
      return randomPrompt;
    };

    const handleManualPause = (pause: boolean) => {
      setIsManualPaused(pause);
    };

    const handlePausingPromptChallengeAutoChange = (nextState: boolean) => {
      handleManualPause(nextState);
    };

    const handleSelectingPromptChallenge = (
      ...args: Parameters<typeof handleSelectingUserPrompt>
    ) => {
      // console.log(`**** handleSelectingPromptChallenge invoked`, { args });
      handleSelectingUserPrompt(...args);
    };

    const handleSelectingRandomPromptChallenge = async (
      promptValue?: string,
      routeToPrompt: boolean | undefined = true
    ) => {
      const newlySelectedPrompt =
        await handleSelectingRandomUserPrompt(promptValue);

      if (routeToPrompt && newlySelectedPrompt) {
        router.push(`/prompts/${newlySelectedPrompt.id}`);
      }
    };

    const handleGeneratingExperiencePrompts = async (
      ctx = context,
      num?: number
    ) => {
      if (fetching || generating) return;
      return await generateFreshPrompts(ctx, num);
    };

    const handleTogglingPromptChallengeAcceptance = (nextState?: boolean) => {
      // User defined prompt challenge acceptance
      if (typeof nextState === 'boolean') {
        if (nextState && !fetching && !hasUserPrompts) {
          generateFreshPrompts();
        }
        setPromptChallengeAccepted(nextState);
        return;
      }

      // Toggle the prompt challenge acceptance
      const nextPromptChallengeAccepted = !promptChallengeAccepted;
      if (nextPromptChallengeAccepted && !fetching && !hasUserPrompts) {
        generateFreshPrompts();
      }

      setPromptChallengeAccepted(!promptChallengeAccepted);
      return;
    };

    const handleRemovingCompletedPromptChallenges = (
      completed = completedPrompts,
      existing = userPrompts
    ) => {
      if (!completed.length) return;
      if (!existing.length) return;

      const newPrompts = existing.filter(
        (p) => !completed.find((cp) => cp.prompt === p.prompt)
      );
      // console.log(`**** New prompts after removal`, newPrompts);
      setUserPrompts(getUniquePrompts(newPrompts));
    };

    const handleRemovingPromptChallenge = (
      prompt: GeneratedExperienceUserPrompt,
      completed = false
    ) => {
      const newPrompts = userPrompts.filter((p) => p.prompt !== prompt.prompt);
      setUserPrompts(newPrompts);

      if (completed) {
        setCompletedPrompts([...completedPrompts, prompt]);
      }
    };

    const handleClearingPromptIdCache = (
      promptId: string,
      clearUser?: boolean
    ) => {
      clearTagCache(`${promptId}-${CACHE_KEY_PROMPT}`);
      clearPathCache(`/prompts/${promptId}`);

      if (clearUser) {
        const cacheKey = createGeneratedCompletePromptCacheKey(
          userId,
          generatedPromptsLocation
        );
        clearTagCache(cacheKey);
      }
    };

    const handleOnSuccessfullyCreatedPromptChallenge = (
      prompt: GeneratedExperienceUserPrompt,
      pickNext = true,
      routeToNext = false,
      clearCache = true
    ) => {
      handleRemovingPromptChallenge(prompt, true);

      if (pickNext) {
        handleSelectingRandomPromptChallenge(prompt.prompt, routeToNext);
      }

      if (clearCache) {
        const { experienceId } = prompt;
        if (experienceId) {
          clearTagCache(experienceId);
        }

        if (prompt.id) {
          handleClearingPromptIdCache(prompt.id, true);
        }
      }
    };

    /**
     * Initialize prompts by fetching them based on the user's authentication status
     */
    const handleInitializingPrompts = async (
      uid = userId,
      location = generatedPromptsLocation,
      newCtx = ''
    ) => {
      // console.log('**** handleInitializingPrompts invoked', {
      //   uid,
      //   location,
      //   newCtx,
      //   userPromptContext,
      //   isAuthenticated,
      //   isReady,
      // });
      const contextToUse = newCtx || userPromptContext || DEFAULT_CONTEXT;

      if (!context) {
        // Update local context state if needed...
        if (contextToUse && context !== contextToUse) {
          setContext(contextToUse);
        }
      }

      if (isAuthenticated && uid) {
        toast.info(
          `Initializing user prompts${location ? ` based on ${location}` : ''}...`
        );
        await fetchAuthUserPrompts(uid, location);
      } else {
        toast.info(
          `Initializing platform guest prompts${location ? ` based on ${location}` : ''}...`
        );
        await fetchNonAuthUserPrompts(location, contextToUse);
      }

      if (!isReady) {
        setIsReady(true);
      }
    };

    // Cycle through prompts to showcase to the user
    useInterval(
      () => {
        // console.log(`**** Interval cycle for prompts`, {
        //   hasUserPrompts,
        //   promptChallengeAccepted,
        //   promptChallengeAcceptedProp,
        //   isManualPaused,
        //   placeholderIntervalTimeProp,
        // });
        handleSelectingRandomUserPrompt(currentPrompt?.prompt);
      },
      // Only cycle through prompts if we have generated prompts
      isReady &&
        // context &&
        hasUserPrompts &&
        !promptChallengeAccepted &&
        !isManualPaused
        ? placeholderIntervalTimeProp
        : null
    );

    // Step 0: Trigger things on mount
    React.useEffect(() => {
      if (!isMounted) {
        // console.log(`**** Step 0: Mounting prompt provider`);
        setIsMounted(true);
      }
    }, [isMounted]);

    /**
     * Step 1: Initialize readiness and fetch prompts
     * Dependent on authorized user: user profile context and geo location
     */
    React.useEffect(() => {
      if (fetching || generating) return;

      if (isMounted && !isReady && userAppLocation) {
        /**
         * Set the user's location if it's different from the generated prompts location
         */
        if (userAppLocation && generatedPromptsLocation !== userAppLocation) {
          setGeneratedPromptsLocation(userAppLocation);
        }

        /**
         * Don't initialize for non-auth users if the prop is set
         */
        if (noInitForNonAuthProp && !isAuthenticated && !isSingleViewProp) {
          // console.log('**** Step 1: No init for non-auth users');
          return;
        }

        /**
         * Only initialize with context prop if the prop is set
         */
        if (
          onInitOnlyWithContextProp &&
          !userPromptContext &&
          !isSingleViewProp
        ) {
          // console.log(
          //   '**** Step 1: No init for non-auth users with no context'
          // );
          return;
        }

        /**
         * Set the prompt challenge acceptance if it's different from the state prop
         */
        if (
          promptChallengeAcceptedProp &&
          promptChallengeAccepted !== promptChallengeAcceptedProp
        ) {
          setPromptChallengeAccepted(promptChallengeAcceptedProp);
        }

        /**
         * Set the current prompt if it's different from the state prop
         */
        if (
          currentPromptProp &&
          JSON.stringify(currentPromptProp) !== JSON.stringify(currentPrompt)
        ) {
          // console.log('**** Step 1: Setting current prompt', {
          //   currentPromptProp,
          //   currentPrompt,
          // });
          handleSelectingUserPrompt(currentPromptProp);
        }

        /**
         * BEGIN PROMPT INITIALIZATION STEPS IF FLAGS/CONDITIONS ARE MET
         */

        if (!noInitPromptsOnMountProp) {
          /**
           * Retrieve the user's prompts if they don't already have any and for the general challenges view
           */
          if (!hasUserPrompts && !isSingleViewProp && !isCompletionViewProp) {
            handleInitializingPrompts(userId, userAppLocation);
          }

          /**
           * Remove any completed prompts from the user prompts if they have any
           */
          if (hasUserCompletedPrompts && hasUserPrompts) {
            handleRemovingCompletedPromptChallenges();
          }
        }

        /**
         * Flag the provider as ready (initialized with prompts)
         */
        // console.log(`**** Step 1: Setting isReady to true`);
        setIsReady(true);
      }
    }, [
      isReady,
      isMounted,
      isAuthenticated,
      isSingleViewProp,
      isCompletionViewProp,
      fetching,
      generating,
      noInitPromptsOnMountProp,
      noInitForNonAuthProp,
      onInitOnlyWithContextProp,
      promptChallengeAcceptedProp,
      promptChallengeAccepted,
      userPromptContext,
      contextProp,
      context,
      completedPrompts,
      currentPromptProp,
      currentPrompt,
      hasUserCompletedPrompts,
      generatedPromptsLocation,
      userAppLocation,
      hasUserPrompts,
      userId,
    ]);

    /**
     * (Re)Fetch prompts on location change
     *
     * @note Only triggers if previously fetched as well
     * @note For auth and non-auth users
     */
    React.useEffect(() => {
      if (fetching || generating) return;

      if (!userId || !isReady || !userAppLocation || !hasUserPrompts) return;

      if (
        generatedPromptsLocation &&
        userAppLocation !== generatedPromptsLocation
      ) {
        // console.log(
        //   `**** Step X: Fetching user prompts in useEffect on location change for userId: ${userId}`,
        //   {
        //     existingLocation: generatedPromptsLocation,
        //     newLocation: userAppLocation,
        //   }
        // );
        setGeneratedPromptsLocation(userAppLocation);

        if (isAuthenticated) {
          fetchAuthUserPrompts(userId, generatedPromptsLocation);
        } else {
          fetchNonAuthUserPrompts(generatedPromptsLocation);
        }
      }
    }, [
      fetching,
      generating,
      hasUserPrompts,
      userAppLocation,
      generatedPromptsLocation,
      isAuthenticated,
      isReady,
      userId,
    ]);

    // Prompt sets based on pagination
    const userPromptGroupedSets = React.useMemo(() => {
      const groupedPrompts = [];
      for (let i = 0; i < userPrompts.length; i += numOfPromptsPerPage) {
        groupedPrompts.push(userPrompts.slice(i, i + numOfPromptsPerPage));
      }
      return groupedPrompts;
    }, [userPrompts, numOfPromptsPerPage]);

    const userPromptGroupedSetsCount = userPromptGroupedSets.length;

    const hasMultiplePromptPages = userPromptGroupedSetsCount > 1;

    const promptsIndex = wrap(
      0,
      userPromptGroupedSetsCount,
      promptSelectionPage
    );

    const currentPromptSet = userPromptGroupedSets[promptsIndex];

    const isCurrentPromptInCompletedList = completedPrompts.find(
      (p) => p.prompt === currentPrompt?.prompt
    );

    // Story details
    const { id: currentPromptId, Story } = currentPrompt || {};
    const { id: storyId, path: storyPath, title: storyTitle } = Story || {};

    const baseUrl = getBaseUrl();

    const storyPermalink = storyPath
      ? createPromptCollectionStoryPermalink(storyPath)
      : null;

    const storyFullPermalink = storyPermalink
      ? `${baseUrl}${storyPermalink}`
      : null;

    // Account for the user's selected prompt
    const derivedUserSelectedPrompt =
      (isSingleViewProp || isCompletionViewProp) && promptChallengeAccepted
        ? currentPrompt
        : promptChallengeAccepted &&
            currentPrompt &&
            !isCurrentPromptInCompletedList
          ? currentPrompt
          : undefined;

    const isDerivedUserSelectedPromptCompleted = Boolean(
      derivedUserSelectedPrompt &&
        (completedPrompts.find(
          (p) => p.prompt === derivedUserSelectedPrompt.prompt
        ) ||
          derivedUserSelectedPrompt.content)
    );

    // Does the user selected prompt completed and belong to the auth user?
    const isDerivedUserSelectedPromptCompletedAuthUser = Boolean(
      isDerivedUserSelectedPromptCompleted &&
        isAuthenticated &&
        derivedUserSelectedPrompt &&
        (derivedUserSelectedPrompt.Collaborator?.id === userId ||
          derivedUserSelectedPrompt.Author?.id === userId)
    );

    // Prepare the context value
    const providerProps: PromptContext = {
      // Flags
      isReady,
      fetchingPrompts: fetching,
      generatingPrompts: generating,

      // Story details
      storyId,
      storyPath,
      storyTitle,
      storyPermalinkRelative: storyPermalink,
      storyPermalinkAbsolute: storyFullPermalink,
      isStoryPrompt: Boolean(storyId),

      // Prompts
      currentUserPrompt: currentPrompt,
      userPromptChallenges: userPrompts, // All prompts
      userCompletedPrompts: completedPrompts, // Completed prompts
      userSelectedPrompt: derivedUserSelectedPrompt,
      userPromptChallengeContext: context, // Context for generating prompts

      // Prompt Challenge
      userPromptChallengeAcceptance: promptChallengeAccepted,

      // Prompt view context
      isPromptSingleView: isSingleViewProp,
      isPromptCompletionView: isCompletionViewProp,

      // Pagination
      userPromptsIndex: promptsIndex, // Current prompt index
      userPromptGroupedSets: userPromptGroupedSets, // All prompts grouped
      currentUserPromptChallengeSet: currentPromptSet,
      promptPaginationEnabled: hasMultiplePromptPages,

      // Prompt Selection and Completion Dialog
      isPromptCompletionDialogOpen,
      isPromptSelectionOpen,

      // Completion status
      isUserSelectedPromptCompleted: isDerivedUserSelectedPromptCompleted,
      isUserSelectedPromptCompletedAuthUsers:
        isDerivedUserSelectedPromptCompletedAuthUser,

      // Single prompt's experience model
      experiencePrompt:
        isSingleViewProp || isCompletionViewProp
          ? experiencePromptProp
          : undefined,

      // Core Handlers
      handleInitializingPrompts,
      handleClearingPromptIdCache,
      handleTogglingPromptSelectionView,
      handleTogglingCompletePromptView,
      handleTogglingPromptChallengeAcceptance,
      handleRemovingPromptChallenge,
      handleOnSuccessfullyCreatedPromptChallenge,
      handleGeneratingExperiencePrompts,
      handleSelectingRandomPromptChallenge,
      handleSelectingPromptChallenge,
      handlePausingPromptChallengeAutoChange,
      handlePaginatingPromptChallenges: handlePaginatingPrompts,
    };

    return (
      <PromptContext.Provider value={providerProps}>
        {children}
      </PromptContext.Provider>
    );
  } catch (error) {
    console.error('Prompt Provider error:', error);
    return children;
  }
}

export type UseUserPromptsProps = Pick<PromptContext, 'currentUserPrompt'>;

export const useUserPrompts = (props?: UseUserPromptsProps) => {
  const context = React.useContext(PromptContext);
  if (context === undefined) {
    throw new Error('useUserPrompts must be used within a PromptProvider');
  }

  const { currentUserPrompt: currentUserPromptProp } = props || {};

  React.useEffect(() => {
    if (currentUserPromptProp) {
      // console.log(
      //   `**** initializing with currentUserPromptProp in useUserPrompts hook`,
      //   currentUserPromptProp
      // );
      context.handleSelectingPromptChallenge(currentUserPromptProp);
    }
  }, [currentUserPromptProp]);

  return context;
};
