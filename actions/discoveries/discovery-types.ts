import type { Geo } from '@vercel/functions';

export type PersonalizedUserExperienceSuggestionsOpts = {
  numOfSuggestions?: number;
  geolocation?: Geo;
  instructions?: string;
  interests?: Array<string>;
  excludePrompts?: string[];
  completedPrompts?: string[];
};

export type StreamPersonalizedUserExperienceSuggestionsOpts =
  PersonalizedUserExperienceSuggestionsOpts & {
    fullStream?: boolean;
    handleOnFinish?: (object: any) => void;
  };
