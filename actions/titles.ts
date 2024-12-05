'use server';

import {
  type ChatTitleType,
  chatTitleSchema,
} from '@/schemas/chats/chat-title-schemas';
import { openai } from '@ai-sdk/openai';
import { generateObject, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import type { z } from 'zod';

import { AI_SPECIALTY } from './ai/instructions/ai-core-instructions';

import type { StreamCreateExperienceTitleOpts } from '@/types/titles';

import { CHATGPT_4_OMNI } from '@/constants/chat-defaults';

/**
 * Generate a conversation title based on a prompt and optionall, additional context
 *
 * @note - This is helpful for giving a conversation a concise, helpful title
 *
 */
export async function generateChatTitleFromPrompt(
  prompt: string,
  context = '',
  instructions = `${AI_SPECIALTY}\nCreate a clear and concise chat conversation title based on the prompt, and optionally, any provided context.`,
  model = CHATGPT_4_OMNI,
  schema: z.Schema = chatTitleSchema,
  maxTokens = 32,
) {
  const system = context
    ? `${instructions}\nContext: ${context}`
    : instructions;

  const { object, finishReason } = await generateObject({
    model: openai(model),
    system,
    prompt,
    schema,
    maxTokens,
  });
  console.log('**** generateChatTitleFromPrompt finished', finishReason);

  const title = (object as ChatTitleType).title;
  return title;
}

export async function streamCreateExperienceTitle(
  context = '',
  opts = {} as StreamCreateExperienceTitleOpts,
) {
  'use server';

  const generalStream = createStreamableValue();

  const {
    name: userName,
    location,
    interests,
    storySeries,
    storySeriesDescription,
    storySeriesPrompt,
    currentTime,
  } = opts || ({} as StreamCreateExperienceTitleOpts);

  let completedText = '';

  (async () => {
    const basePrompt = `Context: ${context};`;
    const userContext = `User's name: ${userName || 'Unknown'}; User's location: ${location || 'Unknown'}; User's interests: ${interests || 'Unknown'}; Story series: ${storySeries || 'Unknown'}; Story series description: ${storySeriesDescription || 'Unknown'}; Story series prompt: ${storySeriesPrompt || 'Unknown'}; Current time: ${currentTime || new Date().getTime()};`;

    const finalPrompt = `${basePrompt}\n${userContext}`;

    const { textStream } = streamText({
      model: openai('gpt-4o'),

      system: `Generate and offer a contextual title for a  user's Experience Nevada post. The title should be captivating and relevant to the any provided context, e.g. partial draft post, story series title and or description, user location and or interests, etc. Limit the characters to no more than 64. Exclude 'Title:', 'Subject:', 'Topic:', etc. just provide the title.
      `,

      prompt: finalPrompt,

      onFinish: (result) => {
        completedText = result.text;
        generalStream.done();
      },
    });

    for await (const delta of textStream) {
      generalStream.update(delta);
    }
  })();

  return {
    complete: completedText,
    stream: generalStream.value,
  } as const;
}
