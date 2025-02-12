import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { type LanguageModelV1, wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

import type {
  AIModelProviders,
  AllAIModels,
  AnthropicAIModels,
  GoogleAIModels,
  OpenAIModelSettings,
  OpenAIModels,
} from './model-types';

export const anthropicModel = (apiIdentifier: AnthropicAIModels) => {
  return wrapLanguageModel({
    model: anthropic(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const googleModel = (apiIdentifier: GoogleAIModels) => {
  return wrapLanguageModel({
    model: google(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const openaiModel = (
  apiIdentifier: OpenAIModels,
  settings?: OpenAIModelSettings,
) => {
  return wrapLanguageModel({
    model: openai(apiIdentifier, settings),
    middleware: customMiddleware,
  });
};

export const customModel = (
  apiIdentifier: AllAIModels,
  provider?: AIModelProviders,
): LanguageModelV1 => {
  if (provider === 'anthropic') {
    return anthropicModel(apiIdentifier satisfies AnthropicAIModels);
  }

  if (provider === 'google') {
    return googleModel(apiIdentifier satisfies GoogleAIModels);
  }

  // Default to OpenAI
  return openaiModel(apiIdentifier satisfies OpenAIModels);
};
