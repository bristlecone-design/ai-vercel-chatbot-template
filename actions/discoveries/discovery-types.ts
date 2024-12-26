import type { Geo } from '@vercel/functions';

export type PersonalizedUserExperienceSuggestionsOpts = {
  numOfSuggestions?: number;
  geolocation?: Geo;
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
