import { TextLoader } from 'langchain/document_loaders/fs/text';

import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import type { BASE_RECORD_TEXT_DOCUMENT, CrawledPage } from './metadata';
import {
  DEFAULT_PREPARE_DOCUMENT_OPTIONS,
  type PrepareDocumentOptions,
  prepareDocument,
} from './prepare-document';
import type {
  GetCrawledContentResponse,
  GetFileContentAsDocResponse,
} from './route-types';

/**
 * Utility function(s) to get a remote Text file's content
 *
 * @note Requires the node.js runtime
 *
 * @see https://github.com/langchain-ai/langchainjs/blob/main/langchain/src/document_loaders/fs/text.ts
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/file_loaders/text
 */

/**
 * Gets a remote Text file's content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the Text file
 * @returns The content of the Text file(s) as a standard CrawledPage(s)
 */
export async function getRemoteTextContent(
  urls: string | string[],
  metadata: Partial<BASE_RECORD_TEXT_DOCUMENT['metadata']> = {},
): Promise<GetCrawledContentResponse> {
  try {
    let finalUrls = Array.isArray(urls) ? urls : [urls];
    // Dedup the URLs
    finalUrls = Array.from(new Set(finalUrls));
    // Retrieve the content of the Text file(s)
    const crawledPages = await Promise.all(
      finalUrls.map(async (url): Promise<CrawledPage[]> => {
        const blob = await fetch(url).then((res) => res.blob());
        const loader = new TextLoader(blob);
        const docs = await loader.load();
        return docs.map((doc) => {
          const textDoc = doc as BASE_RECORD_TEXT_DOCUMENT;

          // @note - Text doc loader does not return the title from the metadata
          // textDoc.metadata.text?.info?.Title ?? 'Untitled Text Document';
          const docTitle =
            metadata.title ?? metadata.documentName ?? 'Text File';

          return {
            source: url,
            sourceType: 'txt',
            content: textDoc.pageContent,
            title: docTitle,
            documentName: docTitle,
            metadata: {
              ...textDoc.metadata,
              title: docTitle,
              documentName: docTitle,
            },
          };
        });
      }),
    );

    // console.log(`crawledPages`, JSON.stringify(crawledPages, null, 2));

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Text content: ', errMsg);
    return [];
  }
}

export interface GetTextContentOptions extends GetBaseContentOptions {}

export const DEFAULT_GET_TEXT_CONTENT_OPTIONS: GetTextContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
};

/**
 * Retrieve the contents of a Text File(s) and return the content as standard Document(s)
 *
 * @note Similar to @getRemoteTextContent, but accepts an array of File objects
 *
 * @param files - The File(s) of the Text file(s)
 * @param opts - The options to use when getting the content
 *
 * @returns The content of the Text file(s) as a standard CrawledPage(s)
 */
export async function getTextContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetTextContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const { fileOrDocName } = { ...DEFAULT_GET_TEXT_CONTENT_OPTIONS, ...opts };

    const filesList = Array.isArray(files) ? files : [files];
    const crawledPages = await Promise.all(
      filesList.map(async (file): Promise<CrawledPage[]> => {
        const loader = new TextLoader(file);
        const docs = await loader.load();
        return docs.map((doc) => {
          const txtDoc = doc as BASE_RECORD_TEXT_DOCUMENT;

          const txtTitle =
            fileOrDocName ??
            (txtDoc?.metadata.title || file.name) ??
            `Text File Title Placeholder`;

          return {
            source: 'file',
            sourceType: 'txt',
            content: txtDoc.pageContent,
            title: txtTitle,
            documentName: file.name,
            metadata: {
              ...txtDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Text content from File: ', errMsg);
    return [];
  }
}

/**
 * Gets a remote Text file's content and returns it as a standard Document
 *
 * @param url - The URL(s) of the Text file(s)
 * @param prepareDocOpts - The options to use when preparing the document(s)
 * @param metadata - Additional metadata to include with the document
 *
 * @returns The content of the Text file(s) as a standard Document(s)
 */
export async function getRemoteTextContentAsDocument(
  urls: string | string[],
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
  metadata: Partial<BASE_RECORD_TEXT_DOCUMENT['metadata']> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getRemoteTextContent(urls, metadata);

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
    console.error('Error getting Text content as document', errMsg);
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
 * Get a Text File(s) content and return the content as standard Document(s)
 *
 * @note similar to @getRemoteTextContentAsDocument, but accepts an array of Blob objects
 *
 * @param files - The File(s) of the Text file(s)
 * @param fileOpts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the Text File(s) as a standard Document(s)
 */
export async function getTextContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetTextContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    // Set the default options
    const { truncateBytesAmount, splitContent } = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    const pages = await getTextContentFromFileBlob(files, fileOpts);
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
    console.error('Error getting Text content from blob as document', errMsg);
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
