import {
  municipalityListSchema,
  singleStateSchema,
} from '@/schemas/municipalities/municipalities-schemas';
import { z } from 'zod';

/**
 * Supplementary Recommendations for User Queries
 */
export const singleRecommendationSchema = z.object({
  title: z.string().describe('Concise AI actionable recommendation'),
  summary: z
    .string()
    .describe('Summary that completes the title and provides context'),
  prompt: z
    .string()
    .describe(
      'The actionable prompt should integrate the title and summary into a clear, single directive. For example, the title "Go Hiking" paired with the summary "on the best trails in Reno" forms the prompt "Go hiking on the best trails in Reno."',
    ),
});

export type SingleRecommendationType = z.infer<
  typeof singleRecommendationSchema
>;

export const singleRecommendationActivitySchema = z.array(
  z
    .string()
    .describe(
      'Activities related to user prompt and provided context, e.g. Hiking, Biking, Stargazing, Local Dining, etc.',
    ),
);

export type SingleRecommendationActivityType = z.infer<
  typeof singleRecommendationActivitySchema
>;

export const recommendationsListSchema = z
  .array(singleRecommendationSchema)
  .min(2)
  .max(2)
  .describe(
    `Generate engaging, concise recommendations related to the user's interests and context, such as local eateries or trails. Each recommendation includes a title, a summary, and an actionable prompt. The title should be engaging and succinct, capturing the recommendation's essence. The summary provides additional context, and the actionable prompt merges the title and summary into a direct action. For example, "Go Hiking" and "on the best trails in Reno" combine into "Go hiking on the best trails in Reno."`,
  );

export type RecommendationsListType = z.infer<typeof recommendationsListSchema>;

// Supplementary recommendations help users discover new activities, places, and establishments based on their interests and context.
export const supplementaryRecsSchema = z.object({
  recommendations: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Localized name of supplementary recommendation'),
        activities: singleRecommendationActivitySchema,
        items: recommendationsListSchema,
        municipalities: municipalityListSchema,
        state: singleStateSchema,
        // chargingStations: chargingStationListSchema,
        // places: placesAndEstablishmentListSchema,
      }),
    )
    .min(1) // At least 2 recommendations
    .max(2), // No more than 4 recommendations
});

export type SupplementaryRecsType = z.infer<typeof supplementaryRecsSchema>;

export type SupplementaryRecsResponseType = {
  parsed: 'success' | 'error' | 'no';
  recommendations: SupplementaryRecsType['recommendations'];
};
