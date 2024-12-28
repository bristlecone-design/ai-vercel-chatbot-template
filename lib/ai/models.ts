// Define your models here.

import type { AllAIModels } from './model-types';

export interface Model {
  id: string;
  label: string;
  labelLong?: string;
  apiIdentifier: AllAIModels;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'Personalized Model',
    labelLong: 'Personalized Discovery Model',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Your personalized Experience Nevada model',
  },
  {
    id: 'gpt-4o-mini',
    label: 'gpt-4o-mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
] as const;

export const DEFAULT_MODEL_NAME: AllAIModels = 'gpt-4o-mini';
