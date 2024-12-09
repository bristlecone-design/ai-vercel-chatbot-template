import type { Index, PineconeRecord } from '@pinecone-database/pinecone';

import { INSERT_DOC_DEFAULTS } from './defaults';

const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize),
  );
};

export const chunkedUpsert = async (
  index: Index,
  vectors: Array<PineconeRecord>,
  chunkSize = INSERT_DOC_DEFAULTS.chunkSize,
  namespace?: string,
) => {
  // Split the vectors into chunks
  const chunks = sliceIntoChunks<PineconeRecord>(vectors, chunkSize);

  try {
    // Upsert each chunk of vectors into the index
    await Promise.allSettled(
      chunks.map(async (chunk) => {
        try {
          // console.log(`namespace in chunkedUpsert`, namespace);
          // await index.namespace(namespace).upsert(vectors);
          const op =
            namespace && index.namespace(namespace)
              ? index.namespace(namespace)
              : index;

          const upsertChunkRes = await op.upsert(chunk);
          // console.log(`upsertChunkRes`, upsertChunkRes);
          return upsertChunkRes;
        } catch (e) {
          console.log('Error upserting chunk', e);
        }
      }),
    );

    return true;
  } catch (e) {
    throw new Error(`Error upserting vectors into index: ${e}`);
  }
};
