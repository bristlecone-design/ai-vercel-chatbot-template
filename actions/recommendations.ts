'use server';

import {
  type SupplementaryRecsResponseType,
  type SupplementaryRecsType,
  supplementaryRecsSchema,
} from '@/schemas/recommendations/recommendations-schemas';
import { openai } from '@ai-sdk/openai';
import { generateObject, streamObject } from 'ai';
import type { z } from 'zod';

import { DEFAULT_CHAT_MODEL } from '@/constants/chat-defaults';

/**
 * Generate supplementary recommendations from the AI.
 *
 * Use Case: When a user is interacting with the AI and the AI needs to provide supplementary recommendations based on the user's input and context, e.g. prior responses, RAG sources, etc.
 *
 * @note - For streaming, use `streamRelevantRecommendationsFromPrompt`
 *
 */
export async function generateRelevantRecommendationsFromPrompt(
  system: string,
  prompt: string,
  model = DEFAULT_CHAT_MODEL,
  schema: z.Schema = supplementaryRecsSchema,
  maxTokens = 428,
): Promise<SupplementaryRecsResponseType> {
  try {
    const { object, finishReason } =
      await generateObject<SupplementaryRecsType>({
        model: openai(model),
        system,
        prompt,
        schema,
        maxTokens,
      });
    console.log(
      '**** generateRelevantRecommendationsFromPrompt finished',
      finishReason,
    );

    const recommendations = object?.recommendations || [];

    return {
      recommendations,
      parsed: 'success',
    };
  } catch (e) {
    console.error('error in generateRelevantRecommendationsFromPrompt', e);
    return {
      recommendations: [],
      parsed: 'error',
    };
  }
}

/**
 * Stream supplementary recommendations from the AI.
 *
 * Use Case: When a user is interacting with the AI and the AI needs to provide supplementary recommendations based on the user's input and context, e.g. prior responses, RAG sources, etc.
 *
 * @note - For generating, use `generateRelevantRecommendationsFromPrompt`
 *
 */
export async function streamRelevantRecommendationsFromPrompt(
  system: string,
  prompt: string,
  model = DEFAULT_CHAT_MODEL,
  schema: z.Schema = supplementaryRecsSchema,
  maxTokens = 512,
) {
  return streamObject({
    model: openai(model),
    system,
    prompt,
    schema,
    maxTokens,
  });
}
