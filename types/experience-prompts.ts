import { z } from 'zod';

import type {
  Story,
  promptCollaboratorSchema,
  promptCollectionSchema,
  promptSchema,
} from '@/lib/db/schema';

import type { ExperienceModel } from './experiences';
import type { USER_PROFILE_MODEL } from './user';

/**
 * Schema for Prompt Collaborator Records
 *
 * @note Prompt collaborators are entries for users who have contributed to the prompt. Each prompt can have multiple collaborators. Each prompt collaboration is a type of experience.
 *
 */
export type PromptCollaboratorModel = z.infer<
  typeof promptCollaboratorSchema
> & {
  Prompt: ExperienceUserPromptModel;

  Collaborator: USER_PROFILE_MODEL;

  Experience: ExperienceModel;

  Story: PromptStoryModel;
};

/**
 * Schema for Prompt Collection Records
 */
export interface PromptStoryBaseModel
  extends z.infer<typeof promptCollectionSchema> {}

/**
 * Extension of Prompt Collection Model
 */
export interface PromptStoryModel extends PromptStoryBaseModel {
  Prompts: ExperienceUserPromptModel[];
  Experiences: ExperienceModel[];
  PromptCollaborators: PromptCollaboratorModel[];
}

/**
 * Story Series Model for Page View
 *
 * @note Accounts for metadata and opengraph assets
 */
export interface StorySeriesPageViewModel {
  found: boolean;

  // Permalinks
  permalinkFull: string;
  permalinkRelative: string;

  // Story Series Details
  story: PromptStoryModel | undefined;
  id: string | null;
  path: string | null | undefined;
  logo: string | null | undefined;
  banner: string | null | undefined;
  website: string | null | undefined;
  videoUrl: string | null | undefined;
  videoCaption: string | null | undefined;
  title: string;
  description: string | null | undefined;

  // Prompt details
  activePrompt: ExperienceUserPromptModel | undefined;

  // Author details
  activeAuthor: USER_PROFILE_MODEL | undefined;

  // Experience details
  activeExperience: ExperienceModel | undefined;
  completedExperience: ExperienceModel | undefined;

  // List of experiences, prompts, and collaborators
  experiences: ExperienceModel[];
  prompts: ExperienceUserPromptModel[];
  collaborators: USER_PROFILE_MODEL[];

  // Opengraph Assets
  opengraphAssets: unknown[];
}

/**
 * Schema for AI Generated Experience Prompts
 */
export const AIGeneratedExperienceSinglePromptSchema = z.object({
  id: z.string().optional().describe('ID of experience prompt.'),
  title: z.string().describe('Title of experience prompt.'),
  prompt: z.string().describe('Prompt to be displayed to the user.'),
  municipalities: z
    .array(z.string())
    .optional()
    .describe('Inferred municipalities of prompt.'),
  activities: z
    .array(z.string())
    .optional()
    .describe('Inferred activities of prompt from instructions or context'),
  interests: z
    .array(z.string())
    .optional()
    .describe('Inferred interests of prompt from instructions or context'),
});

export type AIGeneratedExperienceSinglePromptModel = z.infer<
  typeof AIGeneratedExperienceSinglePromptSchema
>;

// Alias for the model
export type AIGeneratedExperienceSinglePrompt =
  AIGeneratedExperienceSinglePromptModel;

export const AIGeneratedExperiencePromptsSchema = z.object({
  prompts: z.array(AIGeneratedExperienceSinglePromptSchema),
});

export type AIGeneratedExperiencePromptsModel = z.infer<
  typeof AIGeneratedExperiencePromptsSchema
>;

export type AIGeneratedExperiencePrompts =
  AIGeneratedExperiencePromptsModel['prompts'];

/**
 * Schema for AI Response to User's Reply to a AI Generated Prompt
 */
export const AIGeneratedResponseToUserReplySchema = z.object({
  personalizedReply: z
    .string()
    .describe(`Personalized response to user's replied to prompt`),
  userReply: z.string().describe('User reply to a generated prompt.'),
  prompt: z.string().optional().describe('Prompt to which user replied.'),
});

export type AIGeneratedResponseToUserReplyModel = z.infer<
  typeof AIGeneratedResponseToUserReplySchema
>;

export type AIGeneratedResponseToUserReply =
  AIGeneratedResponseToUserReplyModel;

/**
 * Schema for Db Experience Prompts Records.
 *
 * @note This is the schema for the records stored in the database.
 *
 * @note This schema is slightly different from the AI generated prompts schema but the AI generated prompts are 99.9% of the time the source of the records.
 */

export type ExperienceUserPromptModel = z.infer<typeof promptSchema> & {
  Author?: USER_PROFILE_MODEL;
  // Alias for the user who completed the prompt
  Collaborator?: USER_PROFILE_MODEL;

  experienceId?: string;
  Experience?: ExperienceModel;

  Experiences?: ExperienceModel[];

  Story?: Story | PromptStoryBaseModel | PromptStoryModel;
  storyId?: string;
};

export type ExperienceUserPromptsModel = ExperienceUserPromptModel[];

/**
 * A subset of the ExperienceUserPromptModel to be used in parallel with the AI generated prompts on the client side.
 *
 * @see use-generated-experience-prompts.tsx
 */
export type GeneratedExperienceUserPrompt = Omit<
  ExperienceUserPromptModel,
  | 'embeddingsId'
  | 'meta'
  | 'type'
  | 'viewCount'
  | 'private'
  | 'published'
  | 'archived'
>;

export type GeneratedExperienceUserPrompts = GeneratedExperienceUserPrompt[];

/**
 * Autocomplete suggestion schema and model for user input.
 */
export const AIAutocompleteSuggestionSchema = z.object({
  relevant: z
    .boolean()
    .describe(
      "Indicates if the suggestion is relevant. Set to true if the suggestion appropriately completes the user's input or context. Set to false if the input is nonsensical, requires assistance, or if the suggestion provides support, encouragement, or a guiding question.",
    ),
  operation: z
    .enum(['replace', 'append'])
    .default('append')
    .describe(
      'Specifies the action to take with the suggestion. Use "replace" to overwrite the user input, particularly when the user is seeking help or direction. Use "append" to add the suggestion to the end of the user’s input, maintaining the current context.',
    ),
  suggestion: z
    .string()
    .describe(
      'The text suggested to the user. If "replace," this should be a complete, contextually relevant response. If "append," this should seamlessly continue the user’s input based on the provided context.',
    ),
});

export type AIAutocompleteSuggestionModel = z.infer<
  typeof AIAutocompleteSuggestionSchema
>;

/**
 * Call to Action schema and model for user experience content, plus prompt challenges.
 */
export const AIExperienceCallToActionSuggestionSchema = z.object({
  type: z
    .enum(['discover', 'share', 'explore', 'learn'])
    .default('discover')
    .describe(
      'The type of call to action. Use "discover", "explore" and "learn" to encourage users to explore new content or experiences based on relevant content being discussed, including their own interests or activities. Use "share" to prompt users to share their own experiences or content in response to the current conversation, including prompt challenge(s). No other types are currently supported so please use one of these four options.',
    ),
  nouns: z
    .array(z.string())
    .optional()
    .describe(
      'Nouns — person, place or thing — that describe the content or experiences users can explore or share. Use this to provide context for the call to action and help users understand what they can expect to discover or share.',
    ),
  cta: z
    .string()
    .describe(
      'The call to action text. Use this to prompt users to take a specific type of action, such as exploring new content, sharing their own experiences, or responding to a prompt challenge by sharing their own content.',
    ),
});

export type AIExperienceCallToActionSuggestionModel = z.infer<
  typeof AIExperienceCallToActionSuggestionSchema
>;

export const AIGeneratedExperienceCallToActionsSchema = z.object({
  ctas: z.array(AIExperienceCallToActionSuggestionSchema),
});

export type AIGeneratedExperienceCallToActionsModel = z.infer<
  typeof AIGeneratedExperienceCallToActionsSchema
>;
