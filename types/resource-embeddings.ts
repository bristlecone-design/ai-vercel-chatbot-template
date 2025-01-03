import type { NewEmbeddingParams } from '@/lib/db/schema';
import type { NewResourceParams } from '@/lib/db/schemas/schema-content-resources';

export type NewResourceEmbeddingsParams = {
  resource: NewResourceParams;
  embedding?: NewEmbeddingParams;
};
