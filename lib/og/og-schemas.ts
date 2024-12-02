import { z } from 'zod';

export const ogImageSchema = z.object({
  variant: z.enum(['default', 'experience', 'place']).default('default'),
  heading: z.string().default('Discover, Experience and Share'),
  type: z.string().default('✨ nv.guide'),
  mode: z.enum(['light', 'dark']).default('dark'),
  stations: z.string().default('430'),
  orientation: z.enum(['landscape', 'portrait']).default('landscape'),
  imgPath: z.string().optional().default(''),
});
