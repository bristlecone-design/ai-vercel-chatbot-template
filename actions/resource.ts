'use server';

import { db } from '@/lib/db/connect';
import {
  findRelevantContent,
  generateEmbedding,
  generateEmbeddings,
} from '@/lib/db/queries/embeddings';

/**
 * Resource Content Plus Embed Actions
 */

export async function createSingleEmbedding(
  ...args: Parameters<typeof generateEmbedding>
) {
  return generateEmbedding(...args);
}

export async function createEmbeddings(
  ...args: Parameters<typeof generateEmbeddings>
) {
  return generateEmbeddings(...args);
}

export async function createResourceContent(
  ...args: Parameters<typeof findRelevantContent>
) {
  try {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();

    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      })),
    );

    return 'Resource successfully created and embedded.';
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
}

export async function retrieveRelevantContent(
  ...args: Parameters<typeof findRelevantContent>
) {
  return findRelevantContent(...args);
}
