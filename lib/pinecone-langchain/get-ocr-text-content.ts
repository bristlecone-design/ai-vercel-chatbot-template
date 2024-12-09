import { generateDocumentsFromImageOcrTextList } from '@/lib/content/img-to-text/img-to-text';
import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import type { BASE_RECORD_IMAGE_DOCUMENT, CrawledPage } from './metadata';
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
 * Utility function(s) to get an Image file's content
 *
 * @note Requires the node.js runtime
 *
 * @see https://github.com/naptha/tesseract.js/tree/master
 * @see https://github.com/naptha/tesseract.js/blob/master/examples/node/recognize.js
 *
 */

export interface GetOcrImageTextContentOptions extends GetBaseContentOptions {}

export const DEFAULT_GET_TEXT_CONTENT_OPTIONS: GetOcrImageTextContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
};

/**
 * Retrieve the contents of an Image File's text using OCR
 *
 * @param files - The File(s) of the Text file(s)
 * @param opts - The options to use when getting the content
 *
 * @returns The content of the Image File(s) as a standard CrawledPage(s)
 */
export async function getOcrImageTextContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetOcrImageTextContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const { fileOrDocName } = { ...DEFAULT_GET_TEXT_CONTENT_OPTIONS, ...opts };

    const filesList = Array.isArray(files) ? files : [files];
    const crawledPages = await Promise.all(
      filesList.map(async (file): Promise<CrawledPage[]> => {
        const docs = await generateDocumentsFromImageOcrTextList(file);
        return docs.map((doc) => {
          const txtDoc = doc as BASE_RECORD_IMAGE_DOCUMENT;

          const txtTitle =
            fileOrDocName ??
            (txtDoc?.metadata.title || file.name) ??
            `Image File Title Placeholder`;

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
    console.error('Error getting Image content from File: ', errMsg);
    return [];
  }
}

/**
 * Get an Image File(s) content and return the content as standard Document(s)
 *
 * @param files - The Image File(s)
 * @param fileOpts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the Image File(s) as a standard Document(s)
 */
export async function getOcrImageTextContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetOcrImageTextContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    // Set the default options
    const { truncateBytesAmount, splitContent } = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    const pages = await getOcrImageTextContentFromFileBlob(files, fileOpts);
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
    console.error('Error getting Image content from File as document', errMsg);
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
