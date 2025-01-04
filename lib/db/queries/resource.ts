import { generateResourceContentHash } from '@/lib/embed-utils';
import { getErrorMessage } from '@/lib/errors';
import type { NewResourceEmbeddingsParams } from '@/types/resource-embeddings';
import { eq } from 'drizzle-orm';
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
    return {
      error: true,
      embedding: null,
      resource: newResource,
      msg: newResource.msg,
    };
  }

  try {
    const { content, userId } = resourceInput;
    const { data } = newResource;
    const { id: resourceId } = data;

    const { hash: resourceHash, seed: resourceContentSeed } =
      generateResourceContentHash(props.resource as any);

    const embeds = await generateEmbeddings(resourceContentSeed);

    const embedsPayload = embeds.map((embedding) => ({
      resourceId: resourceId,
      content: content,
      contentHash: resourceHash,
      contentSeed: resourceContentSeed,
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

export async function deleteResource(id: string) {
  try {
    const deletedResource = await db
      .delete(resource)
      .where(eq(resource.id, id))
      .returning();

    return { data: deletedResource[0], deleted: true, error: false, msg: '' };
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('Error deleting resource:', e);
    return {
      error: true,
      data: null,
      deleted: false,
      msg: `Failed to delete resource: ${errMsg}`,
    };
  }
}
