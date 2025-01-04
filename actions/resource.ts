'use server';
import {
  findRelevantContent,
  generateEmbedding,
  generateEmbeddings,
  lookupEmbeddingByHash,
} from '@/lib/db/queries/embeddings';
import {
  deleteResource,
  insertResourceWithEmbeddings,
} from '@/lib/db/queries/resource';
import type {
  NewResourceParams,
  Resource,
} from '@/lib/db/schemas/schema-content-resources';
import { generateResourceContentHash } from '@/lib/embed-utils';

/**
 * Resource Content Plus Embed Actions
 */

export async function createSingleResourceEmbedding(
  ...args: Parameters<typeof generateEmbedding>
) {
  return generateEmbedding(...args);
}

export async function createResourceEmbeddings(
  ...args: Parameters<typeof generateEmbeddings>
) {
  return generateEmbeddings(...args);
}

export type CreateResourceContentOpts = {
  userId?: string | null; // User ID to use for resource
  reinsert?: boolean; // Reinsert resource if it already exists
};

/**
 * Create a new resource content with embeddings
 */
export async function createResourceContent(
  createInput = {} as NewResourceParams,
  opts = {} as CreateResourceContentOpts,
) {
  try {
    const { userId, reinsert } = opts;

    const createPayload = {
      ...createInput,
      userId: createInput.userId || userId,
    } as NewResourceParams;

    const { hash: contentHash, seed: contentSeed } =
      generateResourceContentHash(createPayload);

    const existingResource = await lookupEmbeddingByHash(contentHash);
    const { resourceId: existingResourceId } = existingResource || {};

    let insertedResource: Resource | null = null;
    let existingRresourceDeleted = false;

    // All good - insert away if no existing resource or reinsert flag is set
    if (reinsert || !existingResourceId) {
      const { resource } = await insertResourceWithEmbeddings({
        resource: createPayload,
      });

      insertedResource = resource as Resource;

      // If reinserting, delete the existing resource
      if (insertedResource && existingResourceId && reinsert) {
        const { deleted } = await deleteResource(existingResourceId);
        existingRresourceDeleted = deleted;
      }
    }

    const reinserted = Boolean(existingResourceId && reinsert);

    return {
      error: false,
      reinserted,
      resource: insertedResource || existingResource,
      existingRresourceDeleted,
      msg: reinserted ? 'Resource reinserted' : 'Resource inserted',
    };
  } catch (error) {
    const errMsg =
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'Error, please try again.';

    return {
      error: true,
      resource: null,
      existingResource: null,
      existingRresourceDeleted: false,
      msg: errMsg,
    };
  }
}

export async function retrieveRelevantContent(
  ...args: Parameters<typeof findRelevantContent>
) {
  return findRelevantContent(...args);
}
