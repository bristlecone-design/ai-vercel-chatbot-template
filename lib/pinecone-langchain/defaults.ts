import type { QueryOptions } from '@pinecone-database/pinecone';

import type { SplitterMethod, SplitterOptions } from './pinecone-splitters';

import { DEFAULT_EMBEDDING_MODEL } from '@/constants/chat-defaults';

export type QUERY_DOC_CONTENT_TYPES = QueryOptions & {
  documentName?: string;
};

export const QUERY_DOC_CONTENT_DEFAULTS = {
  topK: 10,
  includeMetadata: true,
  includeValues: true,
} as QUERY_DOC_CONTENT_TYPES;

export type INSERT_DOC_DEFAULT_TYPES = {
  dryrun?: boolean;
  batchSize: number;
  modelName: string;
  chunkSize: SplitterOptions['chunkSize'];
  chunkUpsertSize?: number;
  chunkOverlap: SplitterOptions['chunkOverlap'];
  splitterMethod: SplitterOptions['splitterMethod'];
};

export const DEFAULT_DOC_INSERT_BATCH_SIZE = 100;
export const DEFAULT_CHUNKED_UPSERT_SIZE = 25;
export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_CHUNK_OVERLAP = 200;
export const DEFAULT_SPLITTER_METHOD: SplitterMethod = 'recursive';
// Defaults for truncating content
// Pinecone's overall limit is 40960 bytes so we keep it a bit lower to allow for other metadata
export const DEFAULT_TRUNCATE_BYTES_AMOUNT = 36000;

export const INSERT_DOC_DEFAULTS: INSERT_DOC_DEFAULT_TYPES = {
  dryrun: false,
  batchSize: DEFAULT_DOC_INSERT_BATCH_SIZE,
  chunkSize: DEFAULT_CHUNK_SIZE,
  chunkUpsertSize: DEFAULT_CHUNKED_UPSERT_SIZE,
  chunkOverlap: DEFAULT_CHUNK_OVERLAP,
  splitterMethod: DEFAULT_SPLITTER_METHOD,
  modelName: DEFAULT_EMBEDDING_MODEL,
};

export interface GetBaseContentOptions {
  fileOrDocName?: string;
}

export const DEFAULT_GET_CONTENT_OPTIONS: GetBaseContentOptions = {
  fileOrDocName: '',
};
