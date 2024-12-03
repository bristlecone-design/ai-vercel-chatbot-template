import { z } from 'zod';

export const CategorySchema = z.string();

export type CategoryType = z.infer<typeof CategorySchema>;
