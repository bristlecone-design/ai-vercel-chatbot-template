import { MapLocationSchema } from '@/schemas/maps/map-schemas';
import { z } from 'zod';

import type { CategoryType } from '@/types/categories';

// import { ExperienceType } from '@/types/experience';
// import { ACCEPTED_IMAGE_TYPES } from '@/lib/images';

export const ExperienceStaffPickSchema = z.object({
  picked: z.boolean().optional(),
  pickDate: z.number().optional(),
  label: z.string().optional(),
});

export type ExperienceStaffPickType = z.infer<typeof ExperienceStaffPickSchema>;

export const mediaFormSchema = z.object({
  name: z.string().optional(),
  // file: z
  //   .instanceof(File)
  //   .optional()
  //   .refine((file) => {
  //     if (!file) {
  //       return false;
  //     }

  //     const isValid = ACCEPTED_MEDIA_TYPES.includes(file.type);
  //     `${ACCEPTED_MEDIA_TYPES.join(',')} files are accepted.`;

  //     return isValid;
  //   }),
  type: z.string().optional(),
  dimensions: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  storagePath: z.string().optional(),
  ogStoragePath: z.string().optional(),
  sixtyFour: z.string().optional(),
});

export const experienceFormSchema = z.object({
  type: z.enum(['discover', 'experience']).default('discover').optional(),
  destinations: z.array(MapLocationSchema),
  title: z.string().optional(),
  name: z.string().min(3, 'Specify a name for this experience'),
  // Array of optional media file uploads
  media: mediaFormSchema,
  // images: z.array(z.string().optional()).optional(),
  // Vibes can represent a mood, a feeling, or a theme, including a primary chat prompt for a record
  vibes: z.string().optional(),
  // messages can be used to generate a response from the AI assistant based on an experience's vibes field or general search input. Message can be either a string or an object with a text property
  messages: z.array(z.any().optional()).optional(),
  // Whether or not this experience is publicly listed
  public: z.boolean().default(false).optional(),
});

export const experienceSingleCollaboratorSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
});

export const experienceCollaboratorsSchema = z.array(
  experienceSingleCollaboratorSchema,
);

export type EXPERIENCE_SINGLE_COLLABORATOR_PROPS = z.infer<
  typeof experienceSingleCollaboratorSchema
>;

export type EXPERIENCE_COLLABORATORS_PROPS = z.infer<
  typeof experienceCollaboratorsSchema
>;

export type USER_EXPERIENCE_PROPS = z.infer<typeof experienceFormSchema>;

export type NEW_USER_EXPERIENCE_PROPS = USER_EXPERIENCE_PROPS & {
  createdAt?: number;
  updatedAt?: number;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  collaborators?: EXPERIENCE_COLLABORATORS_PROPS;
  categories?: CategoryType[];
  // messages?: USER_EXPERIENCE_MESSAGES;
  sharePath?: string;
  path: string;
  id: string;
};

export type USER_EXPERIENCE_RECORD = USER_EXPERIENCE_PROPS & {
  views?: number;
  createdAt: number;
  updatedAt?: number;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  staffPick?: ExperienceStaffPickType;
  collaborators?: EXPERIENCE_COLLABORATORS_PROPS;
  categories?: CategoryType[];
  // messages?: USER_EXPERIENCE_MESSAGES;
  sharePath?: string;
  path: string;
  id: string;
};
