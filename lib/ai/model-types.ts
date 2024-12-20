import type { anthropic } from '@ai-sdk/anthropic';
import type { google } from '@ai-sdk/google';
import type { openai } from '@ai-sdk/openai';

export type AIModelProviders = 'anthropic' | 'openai' | 'google';

export type ExpNVAIModels = 'exp-nv-model';

export type AnthropicAIModels = Parameters<typeof anthropic>[0];

export type OpenAIModels = Parameters<typeof openai>[0];

export type GoogleAIModels = Parameters<typeof google>[0];

export type AllAIModels =
  | ExpNVAIModels
  | AnthropicAIModels
  | GoogleAIModels
  | OpenAIModels;
