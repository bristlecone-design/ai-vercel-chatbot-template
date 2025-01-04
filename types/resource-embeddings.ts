import { type NewEmbeddingParams, embeddingsSchema } from '@/lib/db/schema';
import {
  type NewResourceParams,
  type Resource,
  resourceSelectSchema,
} from '@/lib/db/schemas/schema-content-resources';
import type { Embeddings } from '@/lib/db/schemas/schema-embeddings';
import type { z } from 'zod';

export type NewResourceEmbeddingsParams = {
  resource: NewResourceParams;
  embedding?: NewEmbeddingParams;
};

/**
 * Resource Content Plus Embed Schema for Hashing Resource Content
 */
export const resourceContentHashSchema = embeddingsSchema
  .pick({
    content: true,
    userId: true,
  })
  .merge(
    resourceSelectSchema.pick({
      // title: true,
      // url: true,
      // note: true,
      // content: true,
      // userId: true,
    }),
  )
  .extend({
    title: resourceSelectSchema.shape.title.optional(),
    url: resourceSelectSchema.shape.url.optional(),
    note: resourceSelectSchema.shape.note.optional(),
  });

export type ResourceContentHashParams = z.infer<
  typeof resourceContentHashSchema
>;

/**
 * Embedding with Resource Record
 */
export type EmbeddingQueryWithResource = {
  content: Embeddings['content'];
  resource?: Resource | null;
  similarity: number;
  resourceId?: string;
};
