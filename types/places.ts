import type { placesSchema } from '@/lib/db/schema';
import type { z } from 'zod';

export interface PLACE_MODEL extends z.infer<typeof placesSchema> {}
