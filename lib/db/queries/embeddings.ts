import { db } from '@/lib/db/connect';
import { type NewEmbeddingParams, embeddings } from '@/lib/db/schema';
import { generateChunks, generateResourceContentHash } from '@/lib/embed-utils';
import { getErrorMessage } from '@/lib/errors';
import type { EmbeddingQueryWithResource } from '@/types/resource-embeddings';
import { openai } from '@ai-sdk/openai';
import { type EmbeddingModelUsage, embed, embedMany } from 'ai';
import {
  and,
  cosineDistance,
  desc,
  eq,
  gte,
  isNotNull,
  sql,
} from 'drizzle-orm';
import { getResourceById } from './resource';

const embeddingModel = openai.embedding('text-embedding-ada-002');

export const generateEmbeddings = async (
  value: string,
  model = embeddingModel,
): Promise<
  Array<{
    embedding: number[];
    content: string;
    model: any;
    usage: EmbeddingModelUsage;
  }>
> => {
  const chunks = generateChunks(value);
  const { embeddings, usage } = await embedMany({
    model,
    values: chunks,
  });
  return embeddings.map((e, i) => ({
    content: chunks[i],
    embedding: e,
    model,
    usage,
  }));
};

export const generateEmbedding = async (
  value: string,
  model = embeddingModel,
): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (
  userQuery: string,
  opts = {} as {
    includeResource?: boolean;
    score?: number;
    limit?: number;
  },
): Promise<Array<EmbeddingQueryWithResource>> => {
  const { includeResource = true, score: simScore = 0.5, limit = 4 } = opts;

  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, userQueryEmbedded)})`;

  const similarEmbeds = await db
    .select({
      content: embeddings.content,
      similarity,
      resourceId: embeddings.resourceId,
    })
    .from(embeddings)
    .where(gte(similarity, simScore))
    .orderBy((t) => desc(t.similarity))
    .limit(limit);

  if (includeResource) {
    const embedsWithResources = await Promise.all(
      similarEmbeds.map(async (e) => {
        const { data: r } = await getResourceById(e.resourceId);
        return { ...e, resource: r } as EmbeddingQueryWithResource;
      }),
    );

    return embedsWithResources;
  }

  return similarEmbeds as Array<EmbeddingQueryWithResource>;
};

export const insertSingleEmbedding = async (data: NewEmbeddingParams) => {
  try {
    const newEmbedding = await db.insert(embeddings).values(data).returning();

    return {
      error: false,
      data: newEmbedding[0],
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      data: null,
      msg: `Failed to insert embedding: ${errMsg}`,
    };
  }
};

export const insertEmbeddings = async (data: Array<NewEmbeddingParams>) => {
  try {
    const dataWithHash = data.map((d) => {
      const { hash: contentHash, seed: contentSeed } =
        generateResourceContentHash({
          content: d.content,
          userId: d.userId,
        } as NewEmbeddingParams);

      return {
        ...d,
        contentHash: d.contentHash || contentHash,
        contentSeed: d.contentSeed || contentSeed,
        // description: d.description || contentSeed,
      };
    });

    const newEmbeddings = await db
      .insert(embeddings)
      .values(dataWithHash)
      .returning();

    return {
      error: false,
      data: newEmbeddings,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      data: null,
      msg: `Failed to insert embeddings: ${errMsg}`,
    };
  }
};

export const deleteEmbedding = async (id: string) => {
  try {
    const deletedEmbedding = await db
      .delete(embeddings)
      .where(eq(embeddings.id, id))
      .returning();

    return {
      error: false,
      data: deletedEmbedding[0],
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return {
      error: true,
      data: null,
      msg: `Failed to delete embedding: ${errMsg}`,
    };
  }
};

export const lookupEmbeddingByHash = async (contentHash: string) => {
  const [lookupEmbed] = await db
    .select()
    .from(embeddings)
    .where(
      and(
        eq(embeddings.contentHash, contentHash),
        isNotNull(embeddings.resourceId),
      ),
    );

  return lookupEmbed;
};
