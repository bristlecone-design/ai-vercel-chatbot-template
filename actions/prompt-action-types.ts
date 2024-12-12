export type PromptIncludeOpts = {
  user?: boolean;
  collaborator?: boolean;
  media?: boolean;
  story?: boolean;
  experience?: boolean;
  experiences?: boolean;
  experiencePrompts?: boolean;
  prompt?: boolean;
};

export type PromptStoryIncludeOpts = {
  prompts?: boolean;
  experiences?: boolean;
  collaborators?: boolean;
};
