import { getErrorMessage } from '@/lib/errors';
import type { NewResourceEmbeddingsParams } from '@/types/resource-embeddings';
import { db } from '../connect';
import {
  type NewResourceParams,
  resource,
  resourceInsertSchema,
} from '../schemas/schema-content-resources';
import type { NewEmbeddingParams } from '../schemas/schema-embeddings';
import { generateEmbeddings, insertEmbeddings } from './embeddings';

export async function insertResource(input: NewResourceParams) {
  try {
    const resourceValues = resourceInsertSchema.parse(input);

    const [newResource] = await db
      .insert(resource)
      .values(resourceValues)
      .returning();

    return { data: newResource, error: false, msg: '' };
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('Error inserting resource:', e);
    return {
      error: true,
      data: null,
      msg: `Failed to insert resource: ${errMsg}`,
    };
  }
}

export async function insertResourceWithEmbeddings(
  props: NewResourceEmbeddingsParams,
) {
  const { resource: resourceInput } = props;

  const newResource = await insertResource(resourceInput);

  if (newResource.error || !newResource.data) {
    return newResource;
  }

  try {
    const { content, userId } = resourceInput;
    const { data } = newResource;
    const { id: resourceId } = data;

    const embeds = await generateEmbeddings(content);

    const embedsPayload = embeds.map((embedding) => ({
      resourceId: resourceId,
      content: embedding.content,
      embedding: embedding.embedding,
      model: embedding.model,
      usage: embedding.usage,
      userId,
      //   meta: input.meta,
    })) as any as NewEmbeddingParams[];

    const { data: newEmbedding, error: embeddingsError } =
      await insertEmbeddings(embedsPayload);

    return {
      resource: newResource.data,
      embedding: newEmbedding,
      error: embeddingsError,
      msg: '',
    };
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('Error inserting resource with embeddings:', e);
    return {
      error: true,
      resource: null,
      embedding: null,
      msg: `Failed to insert resource with embeddings: ${errMsg}`,
    };
  }
}
