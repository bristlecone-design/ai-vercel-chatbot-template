import type { GeoBase } from '@/types/geo';

export type PersonalizedUserExperienceSuggestionsOpts = {
  numOfSuggestions?: number;
  numOfExistingSuggestions?: number;
  geolocation?: GeoBase;
  instructions?: string;
  interests?: Array<string>;
  additionalContext?: string;
  excludeSuggestions?: string[];
  completedSuggestions?: string[];
  handleOnFinish?: (object: any) => void;
};

export type StreamPersonalizedUserExperienceSuggestionsOpts =
  PersonalizedUserExperienceSuggestionsOpts & {
    fullStream?: boolean;
  };
