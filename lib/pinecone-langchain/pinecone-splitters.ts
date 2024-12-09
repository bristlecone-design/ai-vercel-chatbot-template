import {
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
} from '@pinecone-database/doc-splitter';

import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE } from './defaults';

// Add other methods as needed
export type SplitterMethod = 'recursive' | 'markdown';

export type SplitterOptions = {
  chunkSize: number;
  chunkOverlap: number;
  splitterMethod: SplitterMethod;
};

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

/**
 * Factory function to create a base text splitter
 *
 * @see https://js.langchain.com/docs/modules/data_connection/document_transformers/
 *
 * @param splitterMethod
 * @param chunkSize - The size of the chunks to split the text into
 * @param chunkOverlap - The amount of overlap between chunks
 * @returns The base text splitter
 */
export function pineconeBaseTextSplitter(
  splitterMethod: SplitterMethod = 'recursive',
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  chunkOverlap: number = DEFAULT_CHUNK_OVERLAP,
) {
  // console.log('pineconeBaseSplitters params', {
  //   splitterMethod,
  //   chunkSize,
  //   chunkOverlap,
  // });
  const splitter: DocumentSplitter =
    splitterMethod === 'recursive'
      ? new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
      : new MarkdownTextSplitter({});

  return splitter;
}
