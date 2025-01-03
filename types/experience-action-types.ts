import type { Experience } from '@/lib/db/schema';

export type ExperienceIncludeOpts = {
  author?: boolean;
  media?: boolean;
  audioMedia?: boolean;
  story?: boolean;
  prompts?: boolean;
  mediaThumbnail?: boolean;
  bookmarks?: boolean;
  likes?: boolean;
};

export type PartialExperienceIncludeOpts = ExperienceIncludeOpts & {};

export type PartialExperienceModelOpts = {
  visibility: Experience['visibility'];
  numToTake: number | undefined;
  random: boolean;
};
