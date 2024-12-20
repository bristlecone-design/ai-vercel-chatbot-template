import { string, z } from 'zod';

const discoverySuggestionTypeList = [
  'discover',
  'experience',
  'share',
  'learn',
  'other',
] as const;

export const discoverySuggestionType = z.enum(discoverySuggestionTypeList);

/**
 * Schema for AI Generated Experience Prompts
 */
export const AIGeneratedSingleDiscoverySuggestionSchema = z.object({
  id: z.string().optional().describe('ID of discovery suggestion.'),
  title: z.string().describe('Title of discovery suggestion.'),
  suggestion: z
    .string()
    .describe(
      'Succinct, relevant discovery suggestion that is call-to-action oriented.',
    ),
  type: string()
    .default('discover')
    .describe(
      `Classify the type of discovery suggestion. Can only be one of:  ${discoverySuggestionTypeList.join(', ')}`,
    ),
  municipalities: z
    .array(z.string())
    .optional()
    .describe('Inferred municipalities of suggestion.'),
  activities: z
    .array(z.string())
    .optional()
    .describe('Inferred activities of suggestion from instructions or context'),
  interests: z
    .array(z.string())
    .optional()
    .describe('Inferred interests of suggestion from instructions or context'),
});

export type AIGeneratedSingleDiscoverySuggestionModel = z.infer<
  typeof AIGeneratedSingleDiscoverySuggestionSchema
>;

export const AIGeneratedDiscoverySuggestionsSchema = z.object({
  suggestions: z
    .array(AIGeneratedSingleDiscoverySuggestionSchema)
    .min(2)
    .max(12),
});

export type AIGeneratedDiscoverySuggestionsModel = z.infer<
  typeof AIGeneratedDiscoverySuggestionsSchema
>;

export type AIGeneratedDiscoverySuggestions =
  AIGeneratedDiscoverySuggestionsModel['suggestions'];
