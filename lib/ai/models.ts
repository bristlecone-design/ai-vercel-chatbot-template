// Define your models here.

import type { AllAIModels } from './model-types';

export interface Model {
  id: AllAIModels;
  label: string;
  labelLong?: string;
  apiIdentifier: AllAIModels;
  description: string;
  active?: boolean;
}

export const models: Array<Model> = [
  {
    id: 'exp-nv-model',
    label: 'Personalized Model',
    labelLong: 'Personalized Discovery Model',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Your personalized Experience Nevada model',
    active: true,
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o Mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
    active: true,
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
    active: false,
  },
] as const;

export const DEFAULT_MODEL_NAME: AllAIModels = 'exp-nv-model';
