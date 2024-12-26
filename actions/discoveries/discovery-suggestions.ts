'use server';
import { AIGeneratedDiscoverySuggestionsSchema } from '@/types/discovery-suggestions';
import { openai } from '@ai-sdk/openai';
import type { Geo } from '@vercel/functions';
import { generateObject, streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import {
  getAndMapUserGeo,
  getLatLongFromUserGeo,
  getLocationFromUserGeo,
} from '../geo';
import { getSystemDiscoverySuggestionInstructions } from './discovery-instructions';
import type {
  PersonalizedUserExperienceSuggestionsOpts,
  StreamPersonalizedUserExperienceSuggestionsOpts,
} from './discovery-types';
import { createDiscoverySuggestionPrompt } from './discovery-utils';

/**
 * For generating AI objects:
 *
 * @see https://sdk.vercel.ai/examples/next-app/basics/streaming-object-generation
 *
 * @see https://sdk.vercel.ai/examples/next-app/basics/generating-object
 */

/**
 * Generate personalized user experience suggestions based on the user's input / context. Helps users discover new experiences, connections, and opportunities.
 */

async function mapUserGeo(payload: Geo | undefined) {
  let geo = payload;
  if (!geo) {
    // First, get geo if not provided
    console.warn('**** User Geo not provided, attempting to get it');
    geo = await getAndMapUserGeo();
    // console.log('User Fallback Geo to use:', geolocation);
  }
  if (!geo.city) {
    // console.warn(`**** User Geo provided but missing city: ${geo}`);
    const userGeoCity = await getLocationFromUserGeo();
    if (userGeoCity) {
      geo.city = userGeoCity;
    }
  }
  if (!geo.latitude || !geo.longitude) {
    // console.warn(
    //   `**** User Geo provided but missing latitude or longitude: ${geo}`,
    // );
    const latLong = await getLatLongFromUserGeo();
    if (latLong) {
      geo.latitude = latLong.latitude;
      geo.longitude = latLong.longitude;
    }
  }

  return geo;
}

/**
 * Generates an object with personalized user experience suggestions based on the user's input / context. Helps users discover new experiences, connections, and opportunities.
 */
export async function generatePersonalizedUserExperienceSuggestions(
  input: string | undefined,
  opts = {} as PersonalizedUserExperienceSuggestionsOpts,
) {
  'use server';

  const {
    numOfSuggestions = 6,
    geolocation,
    instructions,
    interests = [],
    excludePrompts = [],
    completedPrompts = [],
    handleOnFinish,
  } = opts || {};

  const { object, usage } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: getSystemDiscoverySuggestionInstructions(
      numOfSuggestions,
      geolocation,
    ),
    prompt: createDiscoverySuggestionPrompt(
      input,
      numOfSuggestions,
      interests,
      excludePrompts,
      completedPrompts,
    ),
    schema: AIGeneratedDiscoverySuggestionsSchema,
  });

  if (typeof handleOnFinish === 'function') {
    handleOnFinish(object);
  }

  return { usage, suggestions: object.suggestions };
}

export async function streamTextPersonalizedUserExperienceSuggestions(
  input: string | undefined,
  opts = {} as StreamPersonalizedUserExperienceSuggestionsOpts,
) {
  'use server';

  const {
    numOfSuggestions = 6,
    geolocation,
    instructions,
    interests = [],
    excludePrompts = [],
    completedPrompts = [],
    handleOnFinish,
  } = opts || {};

  const geo = await mapUserGeo(geolocation);

  const result = streamObject({
    model: openai('gpt-4o-mini'),
    system: getSystemDiscoverySuggestionInstructions(numOfSuggestions, geo),
    prompt: createDiscoverySuggestionPrompt(
      input,
      numOfSuggestions,
      interests,
      excludePrompts,
      completedPrompts,
    ),
    schema: AIGeneratedDiscoverySuggestionsSchema,
    onFinish: (object) => {
      // console.log(
      //   'Finished streaming personalized user experience suggestions',
      // );
      if (typeof handleOnFinish === 'function') {
        handleOnFinish(object);
      }
    },
  });

  return result.toTextStreamResponse();
}

/**
 * Streams an object with personalized user experience suggestions based on the user's input / context. Helps users discover new experiences, connections, and opportunities.
 */
export async function streamPartialPersonalizedUserExperienceSuggestions(
  input: string | undefined,
  opts = {} as StreamPersonalizedUserExperienceSuggestionsOpts,
) {
  'use server';

  // Partial stream (e.g. good for RSC functions)
  const partialStream = createStreamableValue();
  const finishedStream = createStreamableValue();

  (async () => {
    // const wrappedModel = wrapLanguageModel({
    //   model: openai('gpt-4o-mini'),
    //   middleware: cacheMiddleware,
    // });

    const {
      geolocation,
      numOfSuggestions,
      interests = [],
      excludePrompts = [],
      completedPrompts = [],
      additionalContext,
      handleOnFinish,
    } = opts;
    const geo = await mapUserGeo(geolocation);

    const { usage: streamUsage, partialObjectStream } = streamObject({
      model: openai('gpt-4o-mini'),
      system: getSystemDiscoverySuggestionInstructions(numOfSuggestions, geo),
      prompt: createDiscoverySuggestionPrompt(
        input,
        numOfSuggestions,
        interests,
        excludePrompts,
        completedPrompts,
        additionalContext,
      ),
      schema: AIGeneratedDiscoverySuggestionsSchema,
      onFinish: (object) => {
        // console.log(
        //   'Finished streaming personalized user experience suggestions',
        // );
        if (typeof handleOnFinish === 'function') {
          handleOnFinish(object);
        }

        finishedStream.done({ usage: streamUsage, suggestions: object });
      },
    });

    for await (const partialObject of partialObjectStream) {
      partialStream.update(partialObject);
    }

    partialStream.done();
  })();

  return {
    suggestions: partialStream.value,
  };
}
