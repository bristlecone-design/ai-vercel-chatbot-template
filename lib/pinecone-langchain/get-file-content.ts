// import type { BaseDocumentLoader } from 'langchain/dist/document_loaders/base';

import { getErrorMessage } from '@/lib/errors';

import type { BaseDocumentLoader } from '@langchain/core/document_loaders/base';
import { mapFileTypeToSourceType } from './common-utils';
import type { GetBaseContentOptions } from './defaults';
import {
  getAudioContentFromFileBlob,
  getAudioContentFromFileBlobAsDocument,
} from './get-audio-transcription-content';
import {
  getCsvContentFromFileBlob,
  getCsvContentFromFileBlobAsDocument,
} from './get-csv-content';
import {
  getHtmlContentFromFileBlob,
  getHtmlContentFromFileBlobAsDocument,
} from './get-html-content';
import {
  getMarkdownContentFromFileBlob,
  getMarkdownContentFromFileBlobAsDocument,
} from './get-markdown-content';
import {
  getOcrImageTextContentFromFileBlob,
  getOcrImageTextContentFromFileBlobAsDocument,
} from './get-ocr-text-content';
import {
  getPdfContentFromFileBlob,
  getPdfContentFromFileBlobAsDocument,
} from './get-pdf-content';
import {
  getTextContentFromFileBlob,
  getTextContentFromFileBlobAsDocument,
} from './get-text-content';
import {
  getWordContentFromFileBlob,
  getWordContentFromFileBlobAsDocument,
} from './get-word-content';
import type { CrawledPage } from './metadata';
import {
  DEFAULT_PREPARE_DOCUMENT_OPTIONS,
  type PrepareDocumentOptions,
  prepareDocument,
} from './prepare-document';
import type {
  GetCrawledContentResponse,
  GetFileContentAsDocResponse,
} from './route-types';

export type loaderTypeFunction = (filePath: string) => BaseDocumentLoader;
export type LoaderOptions = {
  csvColumn?: string;
};

/**
 * Factory entry-point to get the contents of different File types
 *
 * @note Handles different File types (e.g. web, pdf, word, text, csv, etc.)
 *
 * @note Requires the node.js runtime since it uses various document loaders that are both node.js and edge compatible
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders
 */

export type LoaderInput = string | File;

type ContentFetcherTypePages = 'pages';
type ContentFetcherTypeDocument = 'document';
type ContentFetcherType = ContentFetcherTypePages | ContentFetcherTypeDocument;

/**
 * Map a File's source type to the relevant content and document fetcher.
 *
 * For Example:
 *  Crawled Pages - @getTextContentFromFileBlob (or the relevant document fetcher)
 *  Standard Documents - @getTextContentFromFileBlobAsDocument (or the relevant document fetcher)
 *
 * @note Requires the node.js runtime
 * @note Handles different file types (e.g. web, pdf, word, text, csv, etc.)
 * @note For handling other document types, @see https://js.langchain.com/docs/integrations/document_loaders
 *
 * @param file - The File to map @see mapFileTypeToSourceType
 * @returns The relevant document fetcher for the File
 */
export function mapFileTypeToContentFetcher(
  file: File,
  sourceType?: CrawledPage['sourceType'],
  fetcherType: ContentFetcherType = 'pages',
  options: LoaderOptions = {},
) {
  const type: CrawledPage['sourceType'] =
    sourceType ?? mapFileTypeToSourceType(file);

  if (!type) return undefined;

  const fetchCrawledPageContent = fetcherType === 'pages';

  switch (type.toLowerCase()) {
    case 'txt':
      return fetchCrawledPageContent
        ? getTextContentFromFileBlob
        : getTextContentFromFileBlobAsDocument;

    case 'md':
    case 'mdx':
      return fetchCrawledPageContent
        ? getMarkdownContentFromFileBlob
        : getMarkdownContentFromFileBlobAsDocument;

    case 'csv':
      return fetchCrawledPageContent
        ? getCsvContentFromFileBlob
        : getCsvContentFromFileBlobAsDocument;

    case 'pdf':
      return fetchCrawledPageContent
        ? getPdfContentFromFileBlob
        : getPdfContentFromFileBlobAsDocument;

    // case 'doc': // Legacy Word format is not supported
    case 'docx':
      return fetchCrawledPageContent
        ? getWordContentFromFileBlob
        : getWordContentFromFileBlobAsDocument;

    case 'htm':
    case 'html':
      return fetchCrawledPageContent
        ? getHtmlContentFromFileBlob
        : getHtmlContentFromFileBlobAsDocument;

    case 'm4a':
    case 'mpeg':
      return fetchCrawledPageContent
        ? getAudioContentFromFileBlob
        : getAudioContentFromFileBlobAsDocument;

    case 'img':
      return fetchCrawledPageContent
        ? getOcrImageTextContentFromFileBlob
        : getOcrImageTextContentFromFileBlobAsDocument;

    default:
      return undefined;
  }
}

/**
 * Retrieve the contents of a File(s) and return the content as standard Crawled Page(s)
 *
 * @note To map crawled pages to standard documents,
 * use @getFileContentFromFileBlobAsDocument
 *
 * @param files - The File(s) to process
 * @param fileOpts - The options to use when getting the content
 *
 * @returns The content of the various file(s) as a standard CrawledPage(s)
 */
export async function getFileContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  fileOpts?: GetBaseContentOptions,
  fetcherType: ContentFetcherTypePages = 'pages',
): Promise<GetCrawledContentResponse> {
  try {
    // Ensure files are in an array
    const fileList = Array.isArray(files)
      ? files
      : typeof files === 'string'
        ? [files]
        : [];

    if (!fileList.length) {
      throw new Error('No File(s) provided to extract content from.');
    }

    const crawledContentItems = await Promise.all(
      fileList.map(async (file): Promise<CrawledPage[]> => {
        const sourceType = mapFileTypeToSourceType(file);
        // console.log(`sourceType: ${sourceType} for file ${file.name}`);
        // Map to the relevant fetcher by source type
        // e.g. 'pdf', 'word', 'text', 'csv', etc.
        const contentFetcher = mapFileTypeToContentFetcher(
          file,
          sourceType,
          fetcherType,
        );

        if (!contentFetcher || typeof contentFetcher !== 'function') {
          console.error(
            `No content fetcher found for the file type: ${sourceType}`,
          );
          throw new Error(
            `No content fetcher found for the file type: ${sourceType}`,
          );
        }

        const contentPages = (await contentFetcher(
          file,
          fileOpts as any,
        )) as GetCrawledContentResponse;

        return contentPages;
      }),
    );

    return crawledContentItems.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting content from file: ', errMsg);
    return [];
  }
}

/**
 * Get a File(s) content and return the content as standard Document(s)
 *
 * @note To retrieve the content as standard Crawled Page(s), use @getFileContentFromFileBlob
 *
 * @param files - The File(s) to process
fileOpts?: GetBaseContentOptions,
 * @param opts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the CSV Blob file(s) as a standard Document(s)
 */
export async function getFileContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetBaseContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    // Set the default options
    const mappedPrepareDocOpts = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    // Ensure File(s) are in an array
    const fileList = Array.isArray(files)
      ? files
      : typeof files === 'string'
        ? [files]
        : [];

    // Get the content of the File(s) as standard crawled page(s)
    const pages = await getFileContentFromFileBlob(fileList, fileOpts);

    // Dedup the crawled pages by source
    const dedupedPageSources = Array.from(
      new Map(pages.map((page) => [page.source, page])).values(),
    );

    const preparedItems = dedupedPageSources.length
      ? await Promise.all(
          dedupedPageSources.map((page) =>
            prepareDocument(page, mappedPrepareDocOpts),
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
    console.error('Error getting file content', errMsg);
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
