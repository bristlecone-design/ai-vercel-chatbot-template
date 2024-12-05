import { generativeImageAssetSchema } from '@/schemas/images/images-schemas';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { z } from 'zod';

import { DEFAULT_CHAT_MODEL } from '@/constants/chat-defaults';

/**
 * Generate image assets from a prompt and system context
 *
 * Use Case: If we have context from the user interacting with the AI and we need to generate image assets based on that context, e.g. image URLs are referenced in the context and we need to generate a list of relevant image urls to display to the user.
 *
 */
export async function generateRelevantImageAssetsFromPrompt(
  context: string | undefined,
  prompt?: string,
  instructions?: string,
  model = DEFAULT_CHAT_MODEL,
  schema: z.Schema = generativeImageAssetSchema,
  maxTokens = 768,
) {
  const systemInstructions = context
    ? `Generate image assets based on the context and prompt. ${instructions ? instructions : ''}\n\n${context}`.trim()
    : `No asset context provided, don't generate image assets.`;

  const promptInstructions =
    prompt ||
    'What are the relevant image assets based on the context and prompt?';

  return generateObject({
    model: openai(model),
    system: systemInstructions,
    prompt: promptInstructions,
    schema,
    maxTokens,
  });
}
