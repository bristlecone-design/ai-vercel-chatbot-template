import type { PersonalizedUserExperienceSuggestionsOpts } from './discovery-types';

export function createDiscoverySuggestionPrompt(
  input: string | undefined,
  numOfSuggestions = 4,
  numOfExistingSuggestions = 0,
  interests: PersonalizedUserExperienceSuggestionsOpts['interests'] = [],
  currentSuggestions: PersonalizedUserExperienceSuggestionsOpts['currentSuggestions'] = [],
  excludeSuggestions: PersonalizedUserExperienceSuggestionsOpts['excludeSuggestions'] = [],
  additionalContext: PersonalizedUserExperienceSuggestionsOpts['additionalContext'] = '',
) {
  let inputToUse = input
    ? `Create ${numOfSuggestions} suggestions using the following context: ${input}`
    : '';

  if (interests.length) {
    inputToUse += `\nInterests: ${interests.join(', ')}`;
  }

  if (currentSuggestions.length) {
    inputToUse += `\nCurrent suggestions: ${currentSuggestions.join(', ')}`;
  }

  if (excludeSuggestions.length) {
    inputToUse += `\nExclude suggestions: ${excludeSuggestions.join(', ')}`;
  }

  if (numOfExistingSuggestions) {
    inputToUse += `\nExisting suggestions count: ${numOfExistingSuggestions}`;
  }

  if (additionalContext) {
    inputToUse += `\nAdditional context: ${additionalContext}`;
  }

  return inputToUse;
}
