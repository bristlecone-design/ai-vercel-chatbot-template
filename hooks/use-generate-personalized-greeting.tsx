'use client';

import * as React from 'react';
import { streamSimpleGettingStartedGreeting } from '@/actions/greetings';
import { readStreamableValue } from 'ai/rsc';

type PersonalizedUserGreetingHookProps = {
  name: string | null;
  autoGenerateOnMount?: boolean;
};

type PersonalizedUserGreetingHookResponse = {
  generated: boolean;
  generating: boolean;
  personalizedReply: string;
  handleGeneratingPersonalizedGreeting: () => void;
};

/**
 * Hook to generate personalized user greeting
 */
export function usePersonalizedUserGreeting({
  name: nameProp,
  autoGenerateOnMount = false,
}: PersonalizedUserGreetingHookProps) {
  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const [generated, setGenerated] = React.useState<boolean>(false);
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [personalizedReply, setPersonalizedReply] = React.useState<string>('');

  /**
   * Handle generating personalized greeting to user and getting started
   */
  const handleGeneratingPersonalizedGreeting = React.useCallback(
    async (name = nameProp, userLocation = '') => {
      if (!name) return;
      if (generating) return;

      setGenerating(true);

      const { reply } = await streamSimpleGettingStartedGreeting(name, {
        userLocation,
        userCurrentTime: new Date().toTimeString(),
      });

      // @see https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
      for await (const delta of readStreamableValue(reply)) {
        setPersonalizedReply(
          (currentGeneration) => `${currentGeneration}${delta}`
        );
      }

      setGenerating(false);
      setGenerated(true);
    },
    [nameProp, generating]
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    ready: isMounted,
    generated,
    generating,
    personalizedReply,
    handleGeneratingPersonalizedGreeting,
  };
}
