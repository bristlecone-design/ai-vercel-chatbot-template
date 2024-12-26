import type { PersonalizedUserExperienceSuggestionsOpts } from './discovery-types';

export function createDiscoverySuggestionPrompt(
  input: string | undefined,
  numOfSuggestions = 4,
  interests: PersonalizedUserExperienceSuggestionsOpts['interests'] = [],
  excludePrompts: PersonalizedUserExperienceSuggestionsOpts['excludePrompts'] = [],
  completedPrompts: PersonalizedUserExperienceSuggestionsOpts['completedPrompts'] = [],
  additionalContext: PersonalizedUserExperienceSuggestionsOpts['additionalContext'] = '',
) {
  let inputToUse = input
    ? `Create ${numOfSuggestions} suggestions using the following context: ${input}`
    : '';

  if (interests.length) {
    inputToUse += `\nInterests: ${interests.join(', ')}`;
  }

  if (excludePrompts.length) {
    inputToUse += `\nExclude prompts: ${excludePrompts.join(', ')}`;
  }

  if (completedPrompts.length) {
    inputToUse += `\nUser has completed prompts: ${completedPrompts.join(', ')}`;
  }

  if (additionalContext) {
    inputToUse += `\nAdditional context: ${additionalContext}`;
  }

  return inputToUse;
}
