'use server';

import { openai } from '@ai-sdk/openai';

import type { Geo } from '@vercel/functions';
import { generateObject, streamObject, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';

import { getUserFromSession } from '@/lib/session';

import { clearTagCache } from './cache';
import {
  CACHE_KEY_PROMPTS,
  CACHE_KEY_USER_EXPERIENCE,
  CACHE_KEY_USER_EXPERIENCES,
} from './cache-keys';

import {
  getAndMapUserGeo,
  getLatLongFromUserGeo,
  getLocationFromUserGeo,
} from './geo';
import {
  getAdditionalAnonymousPrompts,
  getAdditionalUserPrompts,
  getPromptsByValues,
  saveMultiplePrompts,
} from './prompts';

import { mapPromptRecordToClientFriendlyVersion } from '@/features/experiences/utils/experience-prompt-utils';
import type { PromptInsert } from '@/lib/db/schema';
import {
  AIAutocompleteSuggestionSchema,
  AIGeneratedExperienceCallToActionsSchema,
  AIGeneratedExperiencePromptsSchema,
  type ExperienceUserPromptModel,
  type GeneratedExperienceUserPrompt,
} from '@/types/experience-prompts';
import { AIGeneratedExperienceSingleTranslationSchema } from '@/types/experience-translations';
import { updateExperienceCTAs } from './experiences-updates';

/**
 * For generating AI objects:
 *
 * @see https://sdk.vercel.ai/examples/next-app/basics/streaming-object-generation
 *
 * @see https://sdk.vercel.ai/examples/next-app/basics/generating-object
 */

function appendGeoAndTimeToContext(context: string, geo: Geo) {
  return `${context}\n
    User's Geo Location and Time:
      ${geo.city ? `- ${geo.city}${geo.latitude && geo.longitude ? ` (${geo.latitude}, ${geo.longitude})` : ''}.` : ''}
      - Current date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}. 
    `;
}

function getSystemInstructions(numOfPrompts = 3, geo: Geo = {}) {
  const baseInstructions = `
  Task: Generate ${numOfPrompts} unique, personalized prompts based on the user's experiences and expertise in Nevada. Use the provided context to guide prompt creation.
  
  Guidelines:
  - Conciseness: Each prompt should be 8-18 words.
  - Personalization: Tailor prompts to the user’s experiences, profession, interests, location, or future plans in Nevada.
  - Engagement: Ensure prompts are open-ended, encouraging exploration, knowledge sharing, and connections. Spotlight outdoor recreation, economic and workforce development, social impact, collaborations, local events, and meaningful community ties as outlined below.
  - Diversity: Incorporate the user's current location into some prompts, but also cover broader areas of Nevada. Include diverse topics, themes and activities.
  - Creativity: Include unique, thought-provoking, or humorous prompts to spark curiosity.
  - Language: If the user's context and relevant info is in non-English, consider prompts in that language.
  - Completed Prompts: Exclude any prompts the user has already completed or are specified to be excluded.
  - If the user's location is known, always include a general prompt in the overall set that can be applied to a wide range of users and experiences, e.g. "What's going on in {city/town/Nevada} today that you're {excited about/looking forward to}?"

  Example Prompts:
  
  - What's going on {today/this week} in {city/town/Nevada} that you're excited about?
  - What's your most memorable {city/town/Nevada} experience?
  - Describe {city/town} without naming it.
  - Best spots for {outdoor adventure/interests/sports} in {city/town/Nevada}?
  - What hidden gems should visitors explore in {city/town/Nevada}?
  - Where are some good places to collaborate with others in {city/town/Nevada}?
  - How do Nevada's outdoor spaces inspire you?
  - As a {profession}, how do you see Nevada’s future evolving?
  - What recent collaborations have impacted you or your community in {city/town/Nevada}?
  - What {companies/organizations} in Nevada are leading the way in {industry/sector}?
  - Which local {businesses/startups} in {city/town} should get more recognition?
  - What {employment/entrepreneurial/innovative} opportunities in Nevada excite you the most?
  - What initiatives or policies are you most proud of implementing as a public servant in {city/town}?
  - What are the best ways to support local businesses in {city/town}?
  - Share a unique tradition or event in {city/town/Nevada}.
  - What are some unique ways to experience Nevada’s night skies?
  - What collaborations could enhance Nevada's {tourism/community engagement/economic development} efforts?
  - Best spots for {sunrise/sunset/scenic} photography in {city/town/Nevada}?
  - What are some good resources or partnerships for {startups/continued education/upskilling} in {city/town}?
  - What's your favorite local hike or outdoor activity in {city/town/Nevada}?
  - Best rural drives for a weekend getaway in Nevada?
  - What are some unique ways to give back to the community in {city/town/Nevada}?
  - Share a story of a meaningful connection you made in {city/town/Nevada}.
  - Best {skate shop/wood-fire pizza/ice cream/noodles/trivia night/karaoke} in {city/town/Nevada}?
  - Best places to {dance/salsa/roller skate/cycle/rock climb/other activity} in {city/town/Nevada}?
  - Share a {local event/festival/cultural experience} in {city/town/Nevada} you love.
  - What border communities along Nevada offer unique {experiences/interests opportunities}?
  - What {establishments/venues} in {city/town/Nevada} do you wish were still around?
  - Remarkable wildlife encounters in {city/town/Nevada}?
  - Best spots for an evening {walk/bike ride} in {city/town/Nevada}?
  - Great places to volunteer or get involved in {city/town/Nevada}?
  - etc.

  Considerations:

  - Highlight hidden gems, local traditions, culture, environmental connections, and current events.

  - Focus on outdoor adventure, small and local business innovation, community building, rural and urban life, continued education, training, curiosity, discovery, and sustainable practices.

  - Draw from the user’s profession, interests and other context to suggest relevant collaborations or social impact opportunities in Nevada.

  Keywords: Consider using these keywords to guide prompt creation: outdoor recreation, night skies, sports, border communities, economic development, entrepreneurship, nightlife, birding, biking, social impact, tourism, partnerships, wildlife, parks, volunteering, public infrastructure, public transportation, philanthropy, photography, videography, local governance, architecture, historical places, revitalization, public-private partnerships.
  `;

  return appendGeoAndTimeToContext(baseInstructions, geo);
}

export async function generatePersonalizedUserExperiencePrompts(
  input: string,
  numOfPrompts = 5,
  geolocation?: Geo,
) {
  'use server';

  const { object: prompts } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: getSystemInstructions(numOfPrompts, geolocation),
    prompt: input,
    schema: AIGeneratedExperiencePromptsSchema,
  });

  return { prompts };
}

type StreamPersonalizedUserExperiencePromptOpts = {
  numOfPrompts: number;
  geolocation?: Geo;
  instructions?: string;
  excludePrompts?: string[];
  completedPrompts?: string[];
};

export async function streamPersonalizedUserExperiencePromptsFrontend(
  input: string,
  opts = {} as StreamPersonalizedUserExperiencePromptOpts,
) {
  'use server';
  const {
    numOfPrompts = 12,
    geolocation,
    instructions,
    excludePrompts = [],
    completedPrompts = [],
  } = opts || {};
  // console.log(`**** streamPersonalizedUserExperiencePrompts invoked`, opts);

  // console.log(
  //   `**** Generating ${numOfPrompts} personalized user experience prompts based on the context: ${input}`
  // );

  const genStream = createStreamableValue();
  const recordsStream = createStreamableValue();
  // console.log(
  //   `**** Creating ${numOfPrompts} personalized user experience prompts based on the context: ${input}`
  // );

  let geo = geolocation;
  (async () => {
    // First, get geo if not provided
    if (!geo) {
      console.warn('**** User Geo not provided, attempting to get it');
      geo = await getAndMapUserGeo();
      // console.log('User Fallback Geo to use:', geolocation);
    }
    if (!geo.city) {
      console.warn(`**** User Geo provided but missing city: ${geo}`);
      const userGeoCity = await getLocationFromUserGeo();
      if (userGeoCity) {
        geo.city = userGeoCity;
      }
    }
    if (!geo.latitude || !geo.longitude) {
      console.warn(
        `**** User Geo provided but missing latitude or longitude: ${geo}`,
      );
      const latLong = await getLatLongFromUserGeo();
      if (latLong) {
        geo.latitude = latLong.latitude;
        geo.longitude = latLong.longitude;
      }
    }
    // console.log(`***** final geo to use`, JSON.stringify(geo, null, 2));

    const systemInstructions = instructions
      ? appendGeoAndTimeToContext(instructions, geo)
      : getSystemInstructions(numOfPrompts, geo);
    // console.log(`**** systemInstructions`, systemInstructions);

    let inputToUse = input
      ? `As instructed, create ${numOfPrompts} prompts leveraging the following context: ${input}`
      : '';

    if (excludePrompts.length) {
      inputToUse += `\nExclude prompts: ${excludePrompts.join(', ')}`;
    }

    if (completedPrompts.length) {
      inputToUse += `\nUser has completed prompts: ${completedPrompts.join(', ')}`;
    }

    // console.log('Input to use:', inputToUse);

    const { partialObjectStream, toTextStreamResponse } = await streamObject({
      model: openai('gpt-4o-mini'),
      system: systemInstructions,
      prompt: inputToUse,
      schema: AIGeneratedExperiencePromptsSchema,
      async onFinish({ object }) {
        // console.log('Finished generating prompts:', object);
        if (object) {
          const userSession = await getUserFromSession();
          const userId = userSession?.id;
          const geoLocation = geo?.city || '';

          const createPayload: PromptInsert[] = object.prompts.map((prompt) => {
            return {
              prompt: prompt.prompt,
              title: prompt.title,
              model: 'gpt-4o-mini',
              location: geoLocation ? geoLocation : undefined,
              activities: prompt.activities ? prompt.activities : undefined,
              interests: prompt.interests ? prompt.interests : undefined,
              meta: {
                input: inputToUse,
                system: systemInstructions,
                geo: JSON.stringify(geo),
                // municipalities: prompt.municipalities,
                // activities: prompt.activities,
              },
              authorId: userId || undefined,
            };
          });

          if (createPayload.length) {
            // console.log(
            //   `**** Saving ${createPayload.length} prompts to the database`
            // );
            const cacheKeysToClear = [
              geo?.city ? `${geo.city}-${CACHE_KEY_PROMPTS}` : null,
              userSession
                ? `${userSession.id}-${CACHE_KEY_PROMPTS}`
                : `public-${CACHE_KEY_PROMPTS}`,
            ].filter(Boolean) as string[];

            const response = await saveMultiplePrompts(
              createPayload,
              cacheKeysToClear,
            );

            if (response.length) {
              // console.log(
              //   `**** Saved ${response.length} prompts to the database`,
              //   response
              // );
              // Check if we need to retrieve more prompts from the database
              // Note - this can happen if the user has saved prompts in the past which are not created in this batch due to upsert conditions by design.
              let promptsToReturn = response;

              const numSavedPrompts = response.length;
              if (numSavedPrompts && numSavedPrompts < numOfPrompts) {
                const promptsToExclude = response.map((r) => r.id);
                const numPromptsToGet = numOfPrompts - numSavedPrompts;
                // console.log(
                //   `**** Retrieving additional prompts for user: ${userId} from the database after saving ${numSavedPrompts} newly generated prompts`,
                //   {
                //     promptsToExclude,
                //     numPromptsToGet,
                //   }
                // );
                const additionalPrompts = await (userId
                  ? getAdditionalUserPrompts(
                      userId,
                      promptsToExclude,
                      numPromptsToGet,
                    )
                  : getAdditionalAnonymousPrompts(
                      promptsToExclude,
                      numPromptsToGet,
                    ));

                if (additionalPrompts) {
                  // console.log(
                  //   `**** Retrieved ${additionalPrompts.length} additional prompts for user: ${userId} from the database`
                  // );
                  promptsToReturn = promptsToReturn.concat(additionalPrompts);
                }
              }

              const scrubbedPrompts = promptsToReturn.map((r) => {
                return mapPromptRecordToClientFriendlyVersion(
                  r as ExperienceUserPromptModel,
                );
              });

              recordsStream.done(scrubbedPrompts);
              // stream.done(response);
            } else {
              console.warn('**** No prompts saved to the database');
              // This likely is because all generated prompts already exist in the database (upsert conditions)
              // So, let's try to retreive them from the db by prompt value
              const promptValues = object.prompts.map((p) => p.prompt);
              const existingPrompts = await getPromptsByValues(promptValues);

              if (existingPrompts) {
                console.warn(
                  `**** Found ${existingPrompts.length} prompts in the database by prompt values: ${promptValues}`,
                );
                const scrubbedPrompts = existingPrompts.map((r) => {
                  return mapPromptRecordToClientFriendlyVersion(
                    r as ExperienceUserPromptModel,
                  );
                });
                recordsStream.done(scrubbedPrompts);
              } else {
                console.warn(
                  `**** No prompts found in the database by prompt values: ${promptValues}`,
                );
                recordsStream.done([]);
              }
            }
          } else {
            console.warn(`**** No prompts to save to the database
              - createPayload: ${createPayload}`);
            recordsStream.done([]);
          }
        }
      },
    });

    for await (const partialObject of partialObjectStream) {
      genStream.update(partialObject);
    }

    genStream.done();
  })();

  return { generated: genStream.value, records: recordsStream.value };
}

/**
 * Get cached prompts for @streamPersonalizedUserExperiencePrompts
 */
export async function streamCachedPersonalizedUserExperiencePrompts(
  ...args: Parameters<typeof streamPersonalizedUserExperiencePromptsFrontend>
) {
  // 'use cache';
  // https://nextjs.org/docs/canary/app/api-reference/functions/// cacheLife
  // cacheLife('minutes');

  return streamPersonalizedUserExperiencePromptsFrontend(...args);
}

type PersonalizedUserExperiencePromptApiOpts =
  StreamPersonalizedUserExperiencePromptOpts & {
    userId?: string; // optional user ID to attach generated prompts to
  };

/**
 * Generate and stream personalized user experience prompts. For usage in the backend via a API route, e.g. on-demand prompt generation for different locations, users, etc.
 *
 * @note Use the `streamCachedPersonalizedUserExperiencePromptsFrontend` for front-end generation usage.
 */
export async function streamPersonalizedUserExperiencePromptsAPI(
  input: string,
  opts = {} as PersonalizedUserExperiencePromptApiOpts,
) {
  'use server';
  const {
    userId,
    numOfPrompts = 12,
    geolocation,
    instructions,
    excludePrompts = [],
    completedPrompts = [],
  } = opts || {};

  let geo = geolocation;

  // First, get geo if not provided
  if (!geo) {
    console.warn('**** User Geo not provided, attempting to get it');
    geo = await getAndMapUserGeo();
    // console.log('User Fallback Geo to use:', geolocation);
  }
  if (!geo.city) {
    console.warn(`**** User Geo provided but missing city: ${geo}`);
    const userGeoCity = await getLocationFromUserGeo();
    if (userGeoCity) {
      geo.city = userGeoCity;
    }
  }
  if (!geo.latitude || !geo.longitude) {
    console.warn(
      `**** User Geo provided but missing latitude or longitude: ${geo}`,
    );
    const latLong = await getLatLongFromUserGeo();
    if (latLong) {
      geo.latitude = latLong.latitude;
      geo.longitude = latLong.longitude;
    }
  }
  // console.log(`***** final geo to use`, JSON.stringify(geo, null, 2));

  const systemInstructions = instructions
    ? appendGeoAndTimeToContext(instructions, geo)
    : getSystemInstructions(numOfPrompts, geo);
  // console.log(`**** systemInstructions`, systemInstructions);

  let inputToUse = input
    ? `As instructed, create ${numOfPrompts} prompts leveraging the following context: ${input}`
    : '';

  if (excludePrompts.length) {
    inputToUse += `\nExclude prompts: ${excludePrompts.join(', ')}`;
  }

  if (completedPrompts.length) {
    inputToUse += `\nUser has completed prompts: ${completedPrompts.join(', ')}`;
  }

  const result = await streamObject({
    model: openai('gpt-4o-mini'),
    system: systemInstructions,
    prompt: inputToUse,
    schema: AIGeneratedExperiencePromptsSchema,
    async onFinish({ object }) {
      // console.log('Finished generating prompts from API backend:', object);
      if (object) {
        const geoLocation = geo?.city || '';

        const createPayload: PromptInsert[] = object.prompts.map((prompt) => {
          return {
            prompt: prompt.prompt,
            title: prompt.title,
            model: 'gpt-4o-mini',
            location: geoLocation ? geoLocation : undefined,
            activities: prompt.activities ? prompt.activities : undefined,
            interests: prompt.interests ? prompt.interests : undefined,
            Author: userId ? { connect: { id: userId } } : undefined,
            // authorId: userId || undefined,
            meta: {
              input: inputToUse,
              system: systemInstructions,
              geo: JSON.stringify(geo),
              // municipalities: prompt.municipalities,
              // activities: prompt.activities,
            },
          };
        });

        if (createPayload.length) {
          const response = await saveMultiplePrompts(createPayload);
          if (response.length) {
            // Check if we need to retrieve more prompts from the database
            // Note - this can happen if the user has saved prompts in the past which are not created in this batch due to upsert conditions by design.
            // let promptsToReturn = response;
            // const scrubbedPrompts = promptsToReturn.map((r) => {
            //   return mapPromptRecordToClientFriendlyVersion(
            //     r as ExperienceUserPromptModel
            //   );
            // });
          } else {
            console.warn('**** No new prompts saved to the database');
            // This likely is because all generated prompts already exist in the database (upsert conditions)
            // So, let's try to retreive them from the db by prompt value
          }
        } else {
          console.warn(`**** No prompts to save to the database
              - createPayload: ${createPayload}`);
        }
      }
    },
  });

  return result.toTextStreamResponse();
}

/**
 * Generate and personalized user experience prompts. For usage in the backend via a API route, e.g. on-demand prompt generation for different locations, users, etc.
 *
 * @note Same as `streamPersonalizedUserExperiencePromptsAPI` but doesn't stream the response.
 */
export async function generatePersonalizedUserExperiencePromptsAPI(
  input: string,
  opts = {} as PersonalizedUserExperiencePromptApiOpts,
) {
  'use server';
  const {
    userId,
    numOfPrompts = 12,
    geolocation,
    instructions,
    excludePrompts = [],
    completedPrompts = [],
  } = opts || {};

  let geo = geolocation;

  // First, get geo if not provided
  if (!geo) {
    console.warn('**** User Geo not provided, attempting to get it');
    geo = await getAndMapUserGeo();
    // console.log('User Fallback Geo to use:', geolocation);
  }
  if (!geo.city) {
    console.warn(`**** User Geo provided but missing city: ${geo}`);
    const userGeoCity = await getLocationFromUserGeo();
    if (userGeoCity) {
      geo.city = userGeoCity;
    }
  }
  if (!geo.latitude || !geo.longitude) {
    console.warn(
      `**** User Geo provided but missing latitude or longitude: ${geo}`,
    );
    const latLong = await getLatLongFromUserGeo();
    if (latLong) {
      geo.latitude = latLong.latitude;
      geo.longitude = latLong.longitude;
    }
  }
  // console.log(`***** final geo to use`, JSON.stringify(geo, null, 2));

  const systemInstructions = instructions
    ? appendGeoAndTimeToContext(instructions, geo)
    : getSystemInstructions(numOfPrompts, geo);
  // console.log(`**** systemInstructions`, systemInstructions);

  let inputToUse = input
    ? `As instructed, create ${numOfPrompts} prompts leveraging the following context: ${input}`
    : '';

  if (excludePrompts.length) {
    inputToUse += `\nExclude prompts: ${excludePrompts.join(', ')}`;
  }

  if (completedPrompts.length) {
    inputToUse += `\nUser has completed prompts: ${completedPrompts.join(', ')}`;
  }

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    system: systemInstructions,
    prompt: inputToUse,
    schema: AIGeneratedExperiencePromptsSchema,
  });

  let generatedPrompts: GeneratedExperienceUserPrompt[] | undefined;

  if (result.object) {
    const { object } = result;
    const geoLocation = geo?.city || '';

    const createPayload: PromptInsert[] = object.prompts.map((prompt) => {
      return {
        prompt: prompt.prompt,
        title: prompt.title,
        model: 'gpt-4o-mini',
        location: geoLocation ? geoLocation : undefined,
        activities: prompt.activities ? prompt.activities : undefined,
        interests: prompt.interests ? prompt.interests : undefined,
        Author: userId ? { connect: { id: userId } } : undefined,
        // authorId: userId || undefined,
        meta: {
          input: inputToUse,
          system: systemInstructions,
          geo: JSON.stringify(geo),
          // municipalities: prompt.municipalities,
          // activities: prompt.activities,
        },
      };
    });

    if (createPayload.length) {
      const response = await saveMultiplePrompts(createPayload);
      if (response.length) {
        generatedPrompts = response.map((r) => {
          return mapPromptRecordToClientFriendlyVersion(
            r as ExperienceUserPromptModel,
          );
        });
      } else {
        console.warn('**** No new prompts saved to the database');
        // This likely is because all generated prompts already exist in the database (upsert conditions)
        // So, let's try to retreive them from the db by prompt value
      }
    } else {
      console.warn(`**** No prompts to save to the database
              - createPayload: ${createPayload}`);
    }
  }

  return generatedPrompts;
}

/**
 * Same as `streamPersonalizedUserExperiencePrompts` but for the front-end with a hook, @see https://vercel.com/blog/vercel-ai-sdk-3-3-3OnRtxG6a0rwvcJVu3qADv#useobject-hook
 *
 */
export async function streamForFEPersonalizedUserExperiencePrompts(
  input: string,
  numOfPrompts = 3,
  geolocation?: Geo,
) {
  'use server';

  const result = await streamObject({
    model: openai('gpt-4o-mini'),
    system: getSystemInstructions(numOfPrompts, geolocation),
    prompt: input,
    schema: AIGeneratedExperiencePromptsSchema,
    onFinish({ object }) {
      // console.log('Finished generating prompts for F/E:', object);
      // you could save the expense to a database here
    },
  });

  return result.toTextStreamResponse();
}

/**
 * Stream a personalized response to a user's prompt reply
 *
 * @see https://vercel.com/blog/vercel-ai-sdk-3-3-3OnRtxG6a0rwvcJVu3qADv#useobject-hook
 *
 */
export async function streamPersonalizedResponseToUserPromptReply(
  userReply: string,
  prompt: string,
  userName?: string | null,
) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = await streamText({
      model: openai('gpt-4o-mini'),
      system: `Create a personalized response to a user's prompt reply. Context: The user is replying to a prompt motivated by the user's experiences and expertise in Nevada, including interests, collaborations and partnerships. Keep the response limited to 12-18 words, affirmative, with light humor if warranted and engaging. The response may be in plain text or markdown. E.g. That's a great {insight/experience/idea/etc}, {userName}!`,
      prompt: `User's reply: ${userReply} \nPrompt: ${prompt} \nUser's name: ${userName || ''}`,
      // schema: AIGeneratedResponseToUserReplySchema,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { reply: stream.value };
}

/**
 * Stream a personalized response to a user's experience creation
 *
 * @see https://vercel.com/blog/vercel-ai-sdk-3-3-3OnRtxG6a0rwvcJVu3qADv#useobject-hook
 *
 */
export async function streamPersonalizedResponseToUserExperienceCreation(
  expContent: string,
  expTitle?: string,
  userName?: string | null,
) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const basePrompt = `User's content: ${expContent}`;
    const expTitlePrompt = expTitle ? `Experience Title: ${expTitle}` : '';
    const userNamePrompt = userName ? `User's name: ${userName}` : '';

    // String it all together then replace/trim any empty newlines with spaces
    const finalPrompt =
      `${basePrompt}\n${expTitlePrompt}\n${userNamePrompt}`.replace(
        /\n\s*\n/g,
        '\n',
      );

    const { textStream } = await streamText({
      model: openai('gpt-4-turbo'),
      system: `Create a personalized response to a user's experience. Context: The user is sharing a personal post motived by their experiences and expertise in Nevada, including interests, collaborations and partnerships. Keep the response limited to 12-18 words, affirmative, with light humor if warranted and engaging. The response may be in plain text or markdown. E.g. That's a great {insight/experience/idea/etc}, {userName}!`,
      prompt: finalPrompt,
      // schema: AIGeneratedResponseToUserReplySchema,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { reply: stream.value };
}

/**
 * Stream a suggested auto-complete response to a user's in-progress text input for a prompt or replly or other context
 *
 * @see https://vercel.com/blog/vercel-ai-sdk-3-3-3OnRtxG6a0rwvcJVu3qADv#useobject-hook
 *
 */
export async function streamSuggestionAutoCompleteForUserTextInput(
  textInput: string,
  context?: string,
  maxLength = 100,
) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    if (!textInput) {
      console.warn('**** No text input provided for auto-complete suggestion');
      stream.done();
      return;
    }

    const finalContext = context || ``;
    let finalPrompt = `User's input: ${textInput}`;

    if (finalContext) {
      finalPrompt += `\nContext: ${finalContext}`;
    }

    const { partialObjectStream } = await streamObject({
      model: openai('gpt-4o-mini'),
      system: `
      Auto-Complete Suggestion Instructions:

      Objective: Provide a relevant auto-complete suggestion that completes the user's current thought or sentence.

      Guidelines:

      Length: The suggestion should be concise, fitting within the maximum character limit (${maxLength}), including the input text.

      Context: Incorporate any available user context to ensure the suggestion is relevant.

      Helpfulness: If the input is short or indicates a request for help, keep the suggestion brief and assistive.

      Clarification: If the input is nonsensical, gently steer the user back to the context.

      Completion: If the sentence is nearly complete, suggest only the necessary words to finish the idea.

      Examples:

      Input: "The best place to visit in Nevada is"
      Suggestion: "Red Rock Canyon for hiking and scenic views."
      
      Input: "I need help with"
      Suggestion: "finding the best local coffee shop in Reno."

      Input: "I'm not sure what to write about"
      Suggestion: "What's your favorite memory from Nevada?"

      Limitations: If the suggestion would exceed the character limit, truncate it to fit or omit it entirely if truncation isn't possible.


      Broader Context: User is working within the "Experience Nevada" platform, emphasizing shared experiences and discoveries in Nevada.`,
      prompt: finalPrompt,
      schema: AIAutocompleteSuggestionSchema,
      onFinish({ object }) {
        console.log('Finished generating suggestion:', object);
        // you could save the expense to a database here
      },
    });

    for await (const delta of partialObjectStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { suggestion: stream.value };
}

type StreamCallToActionsForUserExperienceOpts = {
  numOfCtas?: number;
  promptId?: string;
  expId?: string;
  profileUserId?: string;
  ctx?: string; // Additional context
};

/**
 * Stream a suggested call-to-action for a user's experience content
 *
 * @see https://vercel.com/blog/vercel-ai-sdk-3-3-3OnRtxG6a0rwvcJVu3qADv#useobject-hook
 *
 * @see https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-object
 *
 */
export async function streamCallToActionsForUserExperience(
  content: string,
  prompt?: string | null,
  opts = {} as StreamCallToActionsForUserExperienceOpts,
) {
  'use server';

  const {
    numOfCtas = 5,
    expId,
    ctx: additionalCtx,
    profileUserId,
  } = opts || {};
  // console.log(`**** streamCallToActionsForUserExperience invoked`, {
  //   content,
  //   prompt,
  //   opts,
  // });

  const stream = createStreamableValue();

  (async () => {
    if (!content) {
      console.warn(
        '**** No content input provided for CTA generated suggestions',
      );
      stream.done();
      return;
    }

    const promptPrefix = prompt ? `Prompt user's responding to: ${prompt}` : '';

    let finalPrompt = promptPrefix
      ? `${promptPrefix}\nContent: ${content}`
      : content;

    if (additionalCtx) {
      finalPrompt += `\nAdditional Context: ${additionalCtx}`;
    }

    const { partialObjectStream } = await streamObject({
      model: openai('gpt-4o-mini'),
      system: `
      Call to Action Instructions:

      Objective: Create ${numOfCtas} unique, engaging, and personalized call-to-action suggestions based on the user content's nouns or proper nouns. CTAs can either encourage learning, sharing, or exploring with others on the platform about the relevant content and experiences in Nevada. Use the predefined CTA types in the schema to guide and label the suggestions accordingly.

      Guidelines:

      Length: The suggestion should be concise, between 4-10 words, and engaging.

      Context: Incorporate any available user context to ensure the suggestion is relevant.

      Examples:

      Input: "Make sure to visit Great Basin National Park. I'd also recommend exploring communities and areas like Tonopah, Massacre Rim, Black Rock Desert, Lamoille Canyon and the Ruby Mountains, Pyramid Lake, and Boundary Peak, which straddles both California and Nevada — each offers an incredible experience, especially if you're after breathtaking dark skies!"

      Suggestion(s): 
        - "Share your Nevada adventures with us!"
        - "Learn more about Tonopah's history."
        - "Explore the Ruby Mountains!"
        - "Where is Pyramid Lake located?"
        - "Learn more about Nevada's dark skies!"
      `,
      prompt: finalPrompt,
      schema: AIGeneratedExperienceCallToActionsSchema,
      schemaDescription: `Generate call-to-action suggestions based on the user's content and prompt. If applicable, return the generated CTAs.`,
      async onFinish({ object }) {
        // console.log('Finished generating experience CTAs:', { object, opts });
        // you could save the expense to a database here
        if (object && expId) {
          const updatedExperience = await updateExperienceCTAs(
            expId,
            object.ctas,
          );
          // console.log(
          //   '**** updatedExperience in streamCallToActionsForUserExperience onFinish',
          //   JSON.stringify(updatedExperience, null, 2)
          // );

          if (updatedExperience) {
            clearTagCache(expId);
            const expIdCacheKey = `${expId}-${CACHE_KEY_USER_EXPERIENCE}`;
            clearTagCache(expIdCacheKey);

            if (profileUserId) {
              const profileUserIdCacheKey = `${profileUserId}-${CACHE_KEY_USER_EXPERIENCES}`;
              clearTagCache(profileUserIdCacheKey);
            }
          }
        }
      },
    });

    for await (const delta of partialObjectStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { object: stream.value };
}

/**
 * Generate English translated text from a user's input
 */
export const generateTranslatedTextFromEnglish = async (
  sourceText: string,
  targetLanguage: string,
) => {
  const finalPrompt = `If applicable, translate the following text from English to ${targetLanguage} language: ${sourceText}`;

  const { object: translation } = await generateObject({
    model: openai('gpt-4o-mini'),
    prompt: finalPrompt,
    schema: AIGeneratedExperienceSingleTranslationSchema,
    schemaDescription:
      'Generate translated text from a user input based on source text and target language. If not applicable, return the original text.',
  });

  return { translation };
};
