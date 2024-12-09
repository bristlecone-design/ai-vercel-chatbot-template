import {
  Document,
  type MarkdownTextSplitter,
  type RecursiveCharacterTextSplitter,
} from '@pinecone-database/doc-splitter';
import md5 from 'md5';

import { getErrorMessage } from '../errors';
import {
  DEFAULT_CHUNKED_UPSERT_SIZE,
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_TRUNCATE_BYTES_AMOUNT,
} from './defaults';
import type {
  BASE_RECORD_DOCUMENT,
  CrawledPage,
  IngestedPage,
} from './metadata';
import {
  type SplitterMethod,
  pineconeBaseTextSplitter,
} from './pinecone-splitters';
import type { GetFileContentAsDocResponse } from './route-types';
import { truncateStringByBytes } from './truncateStringByBytes';

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

export type PrepareDocumentOptions = {
  truncateBytesAmount: number;
  splitContent?: boolean;
  splitter?: DocumentSplitter;
  splitterMethod?: SplitterMethod;
  chunkUpsertSize?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  applyHash?: boolean;
  appendDescription?: boolean;
  metadata?: Record<string, any>;
};

export const DEFAULT_PREPARE_DOCUMENT_OPTIONS: PrepareDocumentOptions = {
  truncateBytesAmount: DEFAULT_TRUNCATE_BYTES_AMOUNT,
  splitContent: true,
  splitter: undefined,
  splitterMethod: 'recursive',
  chunkSize: DEFAULT_CHUNK_SIZE,
  chunkOverlap: DEFAULT_CHUNK_OVERLAP,
  chunkUpsertSize: DEFAULT_CHUNKED_UPSERT_SIZE,
  appendDescription: true,
  applyHash: true,
  metadata: {},
};

/**
 * Prepare a document of various content type for ingestion into Pinecone or other systems/context usage.
 *
 * @note - Takes into account splitting the content into smaller documents, truncating the content, and applying a hash to the document content.
 *
 * @param page - The page to prepare
 * @param splitContent - Whether to split the content into smaller documents
 * @param splitter - The splitter to use to split the content
 * @param applyHash - Whether to apply a hash to the document content
 *
 * @returns The prepared document(s)
 */
export async function prepareDocument(
  page: CrawledPage | IngestedPage,
  options: Partial<PrepareDocumentOptions> = {},
): Promise<BASE_RECORD_DOCUMENT[]> {
  const {
    truncateBytesAmount,
    splitContent,
    splitter,
    splitterMethod,
    chunkSize,
    chunkOverlap,
    appendDescription,
    applyHash,
    metadata = {},
  } = { ...DEFAULT_PREPARE_DOCUMENT_OPTIONS, ...options };

  // console.log(`prepareDocument invoked`, truncateBytesAmount);
  // Get the content of the page
  const pageDescription =
    page.metadata?.description || metadata?.description || '';

  const pageContent =
    pageDescription && appendDescription
      ? `${page.content}\n${pageDescription}`
      : page.content;

  const truncatedContent = truncateStringByBytes(
    pageContent,
    truncateBytesAmount,
  );
  const isContentAndTruncatedContentDifferent =
    pageContent.length !== truncatedContent.length;

  const pageMetadata = {
    // Core page metadata fields
    ...page.metadata,
    // Additional metadata fields
    ...metadata,
    // Common metadata fields
    title: page.title,
    documentName: page.documentName,
    source: page.source,
    sourceType: page.sourceType,
    // fullContent: page.content, // The full text content of the document is not needed in the metadata as it's already in the pageContent
    // Truncate the text to a maximum byte length
    content: truncatedContent,
  } as BASE_RECORD_DOCUMENT['metadata'];

  // If we don't want to split the content, return the page as a single document
  if (!splitContent) {
    // console.log('No splitter provided, returning single document');
    return [
      {
        pageContent,
        metadata: pageMetadata,
      } as BASE_RECORD_DOCUMENT,
    ];
  }

  // If no splitter is provided, use the default splitter
  // console.log('Splitting content params', {
  //   splitterMethod,
  //   chunkSize,
  //   chunkOverlap,
  // });
  const splitterInstance =
    splitter ||
    pineconeBaseTextSplitter(splitterMethod, chunkSize, chunkOverlap);

  // Split the documents using the provided splitter
  const docs = await splitterInstance.splitDocuments([
    new Document({
      pageContent,
      metadata: pageMetadata,
    }),
  ]);

  // Final map over the documents and add a hash to their metadata
  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent, // The split content at this point
      metadata: {
        ...doc.metadata,
        content: truncatedContent,
        // Only include the full content if it's different from the truncated content
        // fullContent: isContentAndTruncatedContentDifferent
        //   ? pageContent
        //   : undefined,
        loc: JSON.stringify(doc.metadata.loc),
        // Create a hash of the document content
        hash: applyHash ? md5(doc.pageContent) : undefined,
      },
    } as unknown as BASE_RECORD_DOCUMENT;
  });
}

/**
 * Prepare the content of a CrawledPage(s) and return the content as standard Document(s)
 *
 * @note - This is handy if you have already crawled the content and want to prepare it as a standard document
 *
 * @param pages - The CrawledPage(s) to process
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the CrawledPage(s) as a standard Document(s)
 */
export async function prepareCrawledPagesAsDocument(
  pages: CrawledPage[],
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    // Set the default options
    prepareDocOpts = { ...DEFAULT_PREPARE_DOCUMENT_OPTIONS, ...prepareDocOpts };

    // Dedup the crawled pages by source
    // const dedupedPageSources = Array.from(
    //   new Map(pages.map((page) => [page.source, page])).values()
    // );

    const preparedItems = pages.length
      ? await Promise.all(
          pages.map((page) => prepareDocument(page, prepareDocOpts)),
        )
      : [];

    const docs = preparedItems.flat();

    return {
      meta: {
        crawledPages: pages.length,
        mappedDocuments: docs.length,
        sources: pages.map((page) => {
          return {
            url: page.source,
            totalPages: page.metadata?.pdf?.totalPages,
          };
        }),
      },
      pages,
      docs: docs,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error preparing crawled pages as document', errMsg);
    return {
      meta: {
        error: true,
        msg: errMsg,
        crawledPages: 0,
        mappedDocuments: 0,
      },
      pages: [],
      docs: [],
    };
  }
}
