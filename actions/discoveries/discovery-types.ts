import type { GeoBase } from '@/types/geo';

export type PersonalizedUserExperienceSuggestionsOpts = {
  numOfSuggestions?: number;
  geolocation?: GeoBase;
  instructions?: string;
  interests?: Array<string>;
  additionalContext?: string;
  excludePrompts?: string[];
  completedPrompts?: string[];
  handleOnFinish?: (object: any) => void;
};

export type StreamPersonalizedUserExperienceSuggestionsOpts =
  PersonalizedUserExperienceSuggestionsOpts & {
    fullStream?: boolean;
  };
