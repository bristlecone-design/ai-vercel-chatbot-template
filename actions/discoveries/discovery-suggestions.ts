'use server';
import { cacheMiddleware } from '@/lib/ai/cache-middleware';
import { AIGeneratedDiscoverySuggestionsSchema } from '@/types/discovery-suggestions';
import { openai } from '@ai-sdk/openai';
import type { Geo } from '@vercel/functions';
import {
  generateObject,
  streamObject,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from 'ai';
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
    numOfExistingSuggestions,
    geolocation,
    instructions,
    interests = [],
    currentSuggestions = [],
    excludeSuggestions = [],
    completedSuggestions = [],
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
      numOfExistingSuggestions,
      interests,
      currentSuggestions,
      excludeSuggestions,
      // completedSuggestions,
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
    numOfExistingSuggestions,
    geolocation,
    instructions,
    interests = [],
    excludeSuggestions = [],
    completedSuggestions = [],
    handleOnFinish,
  } = opts || {};

  const geo = await mapUserGeo(geolocation);

  const result = streamObject({
    model: openai('gpt-4o-mini'),
    system: getSystemDiscoverySuggestionInstructions(numOfSuggestions, geo),
    prompt: createDiscoverySuggestionPrompt(
      input,
      numOfSuggestions,
      numOfExistingSuggestions,
      interests,
      excludeSuggestions,
      // completedSuggestions,
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
    const {
      useCache = true,
      geolocation,
      numOfSuggestions,
      numOfExistingSuggestions,
      interests = [],
      currentSuggestions = [],
      excludeSuggestions = [],
      additionalContext,
      model = 'gpt-4o-mini',
      handleOnFinish,
    } = opts;

    const llmModel = useCache
      ? wrapLanguageModel({
          model: openai(model),
          middleware: cacheMiddleware,
        })
      : openai(model);

    const geo = await mapUserGeo(geolocation);

    const { usage: streamUsage, partialObjectStream } = streamObject({
      model: llmModel,
      system: getSystemDiscoverySuggestionInstructions(numOfSuggestions, geo),
      prompt: createDiscoverySuggestionPrompt(
        input,
        numOfSuggestions,
        numOfExistingSuggestions,
        interests,
        currentSuggestions,
        excludeSuggestions,
        additionalContext,
      ),
      schema: AIGeneratedDiscoverySuggestionsSchema,
      onFinish: (object) => {
        // console.log(
        //   'Finished streaming personalized user experience suggestions',
        //   JSON.stringify(object, null, 2),
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
