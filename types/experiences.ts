import type { PlaceIconType } from '@/schemas/places/places-schemas';
import type { z } from 'zod';

import type {
  audioMediaSchema,
  bookmarkSchema,
  experienceLikesSchema,
  experiencesSchema,
  mediaSchema,
} from '@/lib/db/schema';
import type {
  AIExperienceCallToActionSuggestionModel,
  GeneratedExperienceUserPrompt,
  PromptStoryModel,
} from './experience-prompts';
import type { PhotoThumbnail } from './photo';
import type { USER_PROFILE_MODEL } from './user';

export type ExperienceBookmarkModel = z.infer<typeof bookmarkSchema>;

export type ExperienceLikesModel = z.infer<typeof experienceLikesSchema>;

export interface ExperienceAudioMediaModel
  extends z.infer<typeof audioMediaSchema> {}

export interface ExperienceMediaModel extends z.infer<typeof mediaSchema> {
  thumbnail?: PhotoThumbnail | PlaceIconType;
  user?: USER_PROFILE_MODEL;
}

export interface ExperiencePrompt extends GeneratedExperienceUserPrompt {}

export interface ExperienceModel
  extends Omit<z.infer<typeof experiencesSchema>, 'ctas'> {
  cachedAt?: Date;
  cachedAtTimestamp?: number;

  ctas?: AIExperienceCallToActionSuggestionModel[];

  Author?: USER_PROFILE_MODEL;

  Bookmarks?: ExperienceBookmarkModel[];
  bookmarked?: boolean; // User bookmarked the experience (derived from Bookmarks)

  Likes?: ExperienceLikesModel[];
  liked?: boolean; // User liked the experience (derived from Likes)

  AudioMedia?: ExperienceAudioMediaModel[];

  Media?: ExperienceMediaModel[];

  Prompt?: ExperiencePrompt;

  Story?: PromptStoryModel;
}

export interface PartialExperienceModel
  extends Pick<
    ExperienceModel,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'pinnedAt'
    | 'pinned'
    | 'removed'
    | 'public'
    | 'visibility'
    | 'blocked'
  > {
  // Add more properties as needed
  Author?: USER_PROFILE_MODEL;
  content?: ExperienceModel['content'];
  prompt?: ExperienceModel['prompt'];
  promptId?: ExperienceModel['promptId'];
  title?: ExperienceModel['title'];
  storyId?: ExperienceModel['storyId'];
  Story?: ExperienceModel['Story'];
  views?: ExperienceModel['views'];
}

export type ExperienceType = ExperienceModel['type'];

export type ExperienceSubType = ExperienceModel['subType'];