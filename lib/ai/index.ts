import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import {
  type LanguageModelV1,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from 'ai';

import { customMiddleware } from './custom-middleware';

import type {
  AIModelProviders,
  AllAIModels,
  AnthropicAIModels,
  GoogleAIModels,
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

export const openaiModel = (apiIdentifier: OpenAIModels) => {
  return wrapLanguageModel({
    model: openai(apiIdentifier),
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
