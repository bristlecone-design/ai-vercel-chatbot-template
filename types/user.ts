import type {
  followsSelectSchema,
  userInsertSchema,
  userProfileSchema,
  userSelectSchema,
} from '@/lib/db/schema';
import { z } from 'zod';

export const investorSchema = z.object({
  interested: z.boolean().optional(),
  confirmed: z.boolean().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
});

export interface INVESTOR_MODEL extends z.infer<typeof investorSchema> {}

export const partnerSchema = z.object({
  interested: z.boolean().optional(),
  confirmed: z.boolean().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
});

export interface PARTNER_MODEL extends z.infer<typeof partnerSchema> {}

export interface USER_INSERT_MODEL extends z.infer<typeof userInsertSchema> {}

export interface USER_SELECT_MODEL extends z.infer<typeof userSelectSchema> {}

export interface USER_MODEL extends z.infer<typeof userSelectSchema> {
  investor: INVESTOR_MODEL;
  partner: PARTNER_MODEL;

  message?: PARTNER_MODEL['message'];

  notes?: string;
  // User's dynamic profile path, e.g. /u/username
  path?: string;
}

export interface UserFollowingModel
  extends z.infer<typeof followsSelectSchema> {}

export interface USER_PROFILE_MODEL extends z.infer<typeof userProfileSchema> {
  Following?: UserFollowingModel[];
  FollowedBy?: UserFollowingModel[];
}
