import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';

import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import type { BASE_RECORD_CSV_DOCUMENT, CrawledPage } from './metadata';
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
 * Utility function(s) to get a remote CSV file's content
 *
 * @note Requires the node.js runtime
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/file_loaders/csv
 */

/**
 * Gets a remote CSV file's content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the CSV file
 * @returns The content of the CSV file(s) as a standard CrawledPage(s)
 */
export async function getRemoteCsvContent(
  urls: string | string[],
  metadata: Partial<BASE_RECORD_CSV_DOCUMENT['metadata']> = {},
): Promise<GetCrawledContentResponse> {
  try {
    let finalUrls = Array.isArray(urls) ? urls : [urls];
    // Dedup the URLs
    finalUrls = Array.from(new Set(finalUrls));
    // Retrieve the content of the CSV file(s)
    const crawledPages = await Promise.all(
      finalUrls.map(async (url): Promise<CrawledPage[]> => {
        const blob = await fetch(url).then((res) => res.blob());
        const loader = new CSVLoader(blob);
        const docs = await loader.load();
        return docs.map((doc) => {
          const csvDoc = doc as BASE_RECORD_CSV_DOCUMENT;

          // @note - CSV doc loader does not return the title from the metadata
          // csvDoc.metadata.csv?.info?.Title ?? 'Untitled CSV Document';
          const docTitle =
            metadata.title ?? metadata.documentName ?? 'CSV File';

          return {
            source: url,
            sourceType: 'csv',
            content: csvDoc.pageContent,
            title: docTitle,
            documentName: docTitle,
            metadata: {
              ...csvDoc.metadata,
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
    console.error('Error getting CSV content: ', errMsg);
    return [];
  }
}

export interface GetCsvContentOptions extends GetBaseContentOptions {}

export const DEFAULT_GET_CSV_CONTENT_OPTIONS: GetCsvContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
};

/**
 * Retrieve the contents of a CSV File(s) and return the content as standard Document(s)
 *
 * @note Similar to @getRemoteCsvContent, but accepts an array of Blob objects
 *
 * @param files - The CSV File(s) to retrieve the content from
 * @param opts - The options to use when getting the content
 *
 * @returns The content of the CSV file(s) as a standard CrawledPage(s)
 */
export async function getCsvContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetCsvContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const { fileOrDocName } = {
      ...DEFAULT_GET_CSV_CONTENT_OPTIONS,
      ...opts,
    };

    const filesList = Array.isArray(files) ? files : [files];
    const crawledPages = await Promise.all(
      filesList.map(async (file): Promise<CrawledPage[]> => {
        const loader = new CSVLoader(file);
        const docs = await loader.load();
        return docs.map((doc) => {
          const csvDoc = doc as BASE_RECORD_CSV_DOCUMENT;

          const csvTitle =
            fileOrDocName ??
            csvDoc?.metadata.title ??
            file.name ??
            `CSV File Title Placeholder`;

          return {
            source: 'file',
            sourceType: 'csv',
            content: csvDoc.pageContent,
            title: csvTitle,
            documentName: file.name,
            metadata: {
              ...csvDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting CSV content from file: ', errMsg);
    return [];
  }
}

/**
 * Gets a remote CSV file's content and returns it as a standard Document
 *
 * @param url - The URL(s) of the CSV file
 * @param prepareDocOpts - The options to use when preparing the document(s)
 * @param metadata - The metadata to use for the document(s)
 *
 * @returns The content of the CSV file(s) as a standard Document(s)
 */
export async function getRemoteCsvContentAsDocument(
  urls: string | string[],
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
  metadata: Partial<BASE_RECORD_CSV_DOCUMENT['metadata']> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    // Set the default options
    const { truncateBytesAmount, splitContent } = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    const pages = await getRemoteCsvContent(urls, metadata);
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
    console.error('Error getting CSV content as document', errMsg);
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
 * Get a CSV File(s) content and return the content as standard Document(s)
 *
 * @note similar to @getRemoteCsvContentAsDocument, but accepts an array of Blob objects
 *
 * @param files - The File(s) of the CSV file(s) to get the content from
 * @param fileOpts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the CSV File(s) as a standard Document(s)
 */
export async function getCsvContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetCsvContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getCsvContentFromFileBlob(files, fileOpts);

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
    console.error('Error getting CSV content from blob as document', errMsg);
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
