import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';

import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import type { BASE_RECORD_WORD_DOCUMENT, CrawledPage } from './metadata';
import {
  DEFAULT_PREPARE_DOCUMENT_OPTIONS,
  type PrepareDocumentOptions,
  prepareDocument,
} from './prepare-document';
import type { GetFileContentAsDocResponse } from './route-types';

/**
 * Utility function(s) to get a remote Word file's content
 *
 * @note Requires the node.js runtime
 *
 * @see https://github.com/langchain-ai/langchainjs/blob/main/langchain/src/document_loaders/fs/docx.ts
 */

/**
 * Utility to parse a Word file's content and return it's inferred title from it's main content
 */
export function parseWordContentForTitle(
  content: string,
  numOfLines = 1,
): string | undefined {
  try {
    // If the content is empty, return undefined
    if (!content) return undefined;
    // Otherwise, return the first line of the content as the title if it is followed by {numOfLines} lines
    const lines = content.split('\n');
    return lines.slice(0, numOfLines).join(' ');
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error parsing Word content for title: ', errMsg);
    return undefined;
  }
}

/**
 * Gets a remote Word file's content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the Word file
 * @returns The content of the Word file(s) as a standard CrawledPage(s)
 */
export async function getRemoteWordContent(
  urls: string | string[],
): Promise<CrawledPage[]> {
  try {
    let finalUrls = Array.isArray(urls) ? urls : [urls];
    // Dedup the URLs
    finalUrls = Array.from(new Set(finalUrls));
    // Retrieve the content of the Word file(s)
    const crawledPages = await Promise.all(
      finalUrls.map(async (url): Promise<CrawledPage[]> => {
        const blob = await fetch(url).then((res) => res.blob());
        const loader = new DocxLoader(blob);
        const docs = await loader.load();
        return docs.map((doc) => {
          const wordDoc = doc as BASE_RECORD_WORD_DOCUMENT;

          // @note - Word doc loader does not return the title from the metadata
          // wordDoc.metadata.word?.info?.Title ?? 'Untitled Word Document';
          const docTitle =
            parseWordContentForTitle(wordDoc.pageContent, 2) ??
            'Untitled Word Document';

          return {
            source: url,
            sourceType: 'docx',
            content: wordDoc.pageContent,
            title: docTitle,
            documentName: docTitle,
            metadata: {
              ...wordDoc.metadata,
              title: docTitle,
              documentName: docTitle,
            },
          };
        });
      }),
    );

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Word content: ', errMsg);
    return [];
  }
}

export interface GetWordContentOptions extends GetBaseContentOptions {}

export const DEFAULT_GET_WORD_CONTENT_OPTIONS: GetWordContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
};

/**
 * Retrieve the contents of a Word File(s) and return the content as standard Document(s)
 *
 * @note Similar to @getRemoteWordContent, but accepts an array of File objects
 *
 * @param files - The CSV File(s) to retrieve the content from
 * @param opts - The options to use when getting the content
 *
 * @returns The content of the Word file(s) as a standard CrawledPage(s)
 */
export async function getWordContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetWordContentOptions,
): Promise<CrawledPage[]> {
  try {
    const { fileOrDocName } = {
      ...DEFAULT_GET_WORD_CONTENT_OPTIONS,
      ...opts,
    };

    const filesList = Array.isArray(files) ? files : [files];
    const crawledPages = await Promise.all(
      filesList.map(async (file): Promise<CrawledPage[]> => {
        const loader = new DocxLoader(file);
        const docs = await loader.load();
        return docs.map((doc) => {
          const wordDoc = doc as BASE_RECORD_WORD_DOCUMENT;

          const docTitle =
            fileOrDocName ??
            wordDoc?.metadata.title ??
            file.name ??
            `Word File Title Placeholder`;

          return {
            source: 'file',
            sourceType: 'docx',
            content: wordDoc.pageContent,
            title: docTitle,
            documentName: file.name,
            metadata: {
              ...wordDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Word content from File: ', errMsg);
    return [];
  }
}

/**
 * Gets a remote Word file's content and returns it as a standard Document
 *
 * @param url - The URL(s) of the Word file
 * @returns The content of the Word file(s) as a standard Document(s)
 */
export async function getRemoteWordContentAsDocument(
  urls: string | string[],
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getRemoteWordContent(urls);

    // Dedup the crawled pages by source
    const dedupedPageSources = Array.from(
      new Map(pages.map((page) => [page.source, page])).values(),
    );

    // Set the default options
    const { truncateBytesAmount, splitContent } = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    const preparedItems = dedupedPageSources.length
      ? await Promise.all(
          dedupedPageSources.map((page) =>
            prepareDocument(page, { truncateBytesAmount, splitContent }),
          ),
        )
      : [];

    const docs = preparedItems.flat();

    return {
      meta: {
        crawledPages: pages.length,
        mappedDocuments: docs.length,
        sources: dedupedPageSources.map((page) => {
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
    console.error('Error getting Word content as document', errMsg);
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

/**
 * Get a Word Blob file(s) content and return the content as standard Document(s)
 *
 * @note similar to @getRemoteWordContentAsDocument, but accepts an array of Blob objects
 *
 * @param files - The Word Files(s) to get the content from
 * @param opts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the Word Blob file(s) as a standard Document(s)
 */
export async function getWordContentFromFileBlobAsDocument(
  files: File | File[], // File inherits from Blob, so we can use it here
  fileOpts?: GetWordContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getWordContentFromFileBlob(files, fileOpts);

    // Set the default options
    const { truncateBytesAmount, splitContent } = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    const docs = await Promise.all(
      pages.map((page) =>
        prepareDocument(page, { truncateBytesAmount, splitContent }),
      ),
    );

    // Dedup the crawled pages by source
    const dedupedPageSources = Array.from(
      new Map(pages.map((page) => [page.source, page])).values(),
    );

    return {
      meta: {
        crawledPages: pages.length,
        mappedDocuments: docs.length,
        sources: dedupedPageSources.map((page) => {
          return {
            url: page.source,
            totalPages: page.metadata?.pdf?.totalPages,
          };
        }),
      },
      pages,
      docs: docs.flat(),
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error(
      'Error getting Word content from file(s) as document',
      errMsg,
    );
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
