// https://orm.drizzle.team/docs/zod
import { pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

/**
 * Entities
 */

// https://orm.drizzle.team/docs/column-types/pg#enum
export const entityEnum = pgEnum('entityType', [
  'place',
  'post',
  'guide',
  'discovery',
  'experience',
  'embedding',
  'content',
  'generic',
  'event',
  'research',
  'other',
]);

// E.g. entityTypeSchema.ENUM
export const entityTypeSchema = createSelectSchema(entityEnum);

export type EntityType = z.infer<typeof entityTypeSchema>;
