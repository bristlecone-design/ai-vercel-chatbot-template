import { db } from '@/lib/db/connect';
import { type NewEmbeddingParams, embeddings } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import { openai } from '@ai-sdk/openai';
import { type EmbeddingModelUsage, embed, embedMany } from 'ai';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { md5 } from 'js-md5';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter((i) => i !== '');
};

const generateContentHash = (content: string, userId?: string): string => {
  const seed = userId ? `${content}${userId}` : content;
  const hash = md5(seed);
  return hash;
};

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
  simScore = 0.5,
  limit = 4,
) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, userQueryEmbedded)})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, simScore))
    .orderBy((t) => desc(t.similarity))
    .limit(limit);
  return similarGuides;
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
    const dataWithHash = data.map((d) => ({
      ...d,
      contentHash: generateContentHash(d.content, d.userId),
    }));

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
