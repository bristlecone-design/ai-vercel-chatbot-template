import { z } from 'zod';

export const DraftingExperiencesSchema = z.object({
  introResponse: z
    .string()
    .describe(
      `The contextual intro response to generate for the user leading into the drafting experience. E.g. Here's a suggestion...`,
    ),
  suggestion: z
    .string()
    .describe(
      'The draft suggestion to generate for the user based on the experience context and or instructions. Generate in plain text or markdown, preferably markdown.',
    ),
  closingResponse: z
    .string()
    .optional()
    .describe(
      'The closing response to generate for the user after the drafting experience, e.g. call to action, next steps, etc.',
    ),
});

export type DraftingExperiencesType = z.infer<typeof DraftingExperiencesSchema>;
