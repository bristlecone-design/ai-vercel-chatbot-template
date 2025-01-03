import {
  type DiscoverySuggestionEnum,
  discoverySuggestionEnumSchema,
  discoverySuggestionInsertSchema as discoverySuggestionSchema,
} from '@/lib/db/schema';
import { string, z } from 'zod';

// Values of the enum
export const discoverySuggestionTypeList = Object.keys(
  discoverySuggestionEnumSchema.Enum,
) as DiscoverySuggestionEnum[];

const dsShape = discoverySuggestionSchema.shape;

/**
 * Schema for AI Generated Experience Prompts
 */
export const AIGeneratedSingleDiscoverySuggestionSchema =
  discoverySuggestionSchema
    .omit({
      userId: true,
      meta: true,
      public: true,
    })
    .extend({
      id: dsShape.id.describe('User/developer defined ID'),
      genId: dsShape.genId.describe(
        'Random unique ID of discovery suggestion.',
      ),
      title: dsShape.title.describe('Classification of suggestion.'),
      action: dsShape.action.describe(
        'Action of corresponding title suggestion.',
      ),
      suggestion: dsShape.suggestion.describe(
        'Succinct relevant complete suggestion; it combines the title and action for a more detailed, call-to-action suggestion.',
      ),
      type: string()
        .default('discover')
        .describe(
          `Classify the type of discovery suggestion. Can only be one of: ${discoverySuggestionTypeList.join(
            ', ',
          )}`,
        ),

      municipalities: dsShape.municipalities.describe(
        'Inferred municipalities of suggestion.',
      ),

      activities: dsShape.activities.describe(
        'Inferred activities of suggestion from instructions or context',
      ),

      interests: dsShape.interests.describe(
        'Inferred interests of suggestion from instructions or context',
      ),
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
