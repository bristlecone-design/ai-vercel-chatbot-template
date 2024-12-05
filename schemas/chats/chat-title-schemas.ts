import { z } from 'zod';

export const chatTitleSchema = z.object({
  title: z.string(),
});

export type ChatTitleType = z.infer<typeof chatTitleSchema>;
