import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';

import { getErrorMessage } from '@/lib/errors';

import { stringToMarkdown } from '../content/markdown/content-to-markdown';
import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import type { BASE_RECORD_PDF_DOCUMENT, CrawledPage } from './metadata';
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
 * Utility function(s) to get a remote PDF file's content
 *
 * @note Does not retain PDF table structure, just text-ifies it. If table structure is desired, @see https://blog.logrocket.com/parsing-pdfs-node-js#sample-payload-pdf-tables
 *
 * @note Look into using `pdf-to-image` package for extracting images from PDFs, @see https://www.npmjs.com/package/pdf-img-convert
 *
 * @note It should work in most environments, including serverless and browser, but if you encounter any issues with running things on the edge/browser, fallback to node.js runtime.
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/web_loaders/pdf
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/file_loaders/pdf
 *
 * @docs @see https://api.js.langchain.com/classes/langchain_document_loaders_fs_pdf.PDFLoader.html
 */

export interface GetPdfContentOptions extends GetBaseContentOptions {
  fallbackToOcr?: boolean;
}

export const DEFAULT_GET_PDF_CONTENT_OPTIONS: GetPdfContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
  // If the PDF content cannot be extracted, fallback to OCR
  // In case the PDF is a scanned document
  fallbackToOcr: true,
};

/**
 * Utility function(s) to map the content of parsed HTML files to standard Markdown content. Useful for previewing HTML content as Markdown on the frontend.
 *
 */
export function mapCrawledPdfPagesToMarkdown(
  pages: CrawledPage[],
): CrawledPage[] {
  let xPages: CrawledPage[] = [];

  if (pages.length) {
    xPages = pages.map((page) => {
      const { content } = page;

      if (content?.trim()) {
        const xResponse = stringToMarkdown(content);
        if (xResponse.translated) {
          return {
            ...page,
            xContent: xResponse.content,
            metadata: {
              ...page.metadata,
            },
          } as CrawledPage;
        } else {
          // Nothing happened, return the original
        }
      }

      return page;
    });
  }

  return xPages;
}

/**
 * Gets a remote PDF file's content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the PDF file
 * @returns The content of the PDF file(s) as a standard CrawledPage(s)
 */
export async function getRemotePdfContent(
  urls: string | string[],
): Promise<GetCrawledContentResponse> {
  try {
    let finalUrls = Array.isArray(urls) ? urls : [urls];
    // Dedup the URLs
    finalUrls = Array.from(new Set(finalUrls));
    // Retrieve the content of the PDF file(s)
    const crawledPdfPages = await Promise.all(
      finalUrls.map(async (url): Promise<CrawledPage[]> => {
        const blob = await fetch(url).then((res) => res.blob());
        const loader = new WebPDFLoader(blob);
        const pdfDocs = await loader.load();
        return pdfDocs.map((doc) => {
          const pdfDoc = doc as BASE_RECORD_PDF_DOCUMENT;

          const pdfTitle =
            pdfDoc.metadata.pdf?.info?.Title ?? 'Untitled PDF Document';

          return {
            source: url,
            sourceType: 'pdf',
            content: pdfDoc.pageContent,
            title: pdfTitle,
            documentName: pdfTitle,
            metadata: {
              ...pdfDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPdfPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting PDF content: ', errMsg);
    return [];
  }
}

/**
 * Retrieve the contents of a PDF file(s) from a Blob(s) and return the content as standard Document(s)
 *
 * @note Similar to @getRemotePdfContent, but accepts an array of Blob objects
 *
 * @param files - The File(s) of the PDF file(s)
 * @param opts - The options to use when getting the content
 *
 * @returns The content of the PDF file(s) as a standard CrawledPage(s)
 */
export async function getPdfContentFromFileBlob(
  files: File | File[],
  opts?: GetPdfContentOptions,
): Promise<CrawledPage[]> {
  const { fileOrDocName, fallbackToOcr } = {
    ...DEFAULT_GET_PDF_CONTENT_OPTIONS,
    ...opts,
  };

  try {
    const finalList = Array.isArray(files) ? files : [files];
    const crawledPdfPages = await Promise.all(
      finalList.map(async (file): Promise<CrawledPage[]> => {
        const loader = new WebPDFLoader(file, {
          parsedItemSeparator: ' ',
        });
        const pdfDocs = await loader.load();

        // Fallback to OCR
        // TODO: Implement OCR for PDF files
        if (pdfDocs.length === 0 && fallbackToOcr) {
          console.log('Falling back to OCR for PDF file:', file.name);
          // pdfDocs = await generateDocumentsFromPdfOcrFile(file);
        }

        return pdfDocs.map((doc) => {
          const pdfDoc = doc as BASE_RECORD_PDF_DOCUMENT;

          const pdfTitle =
            fileOrDocName ??
            pdfDoc.metadata.pdf?.info?.Title ??
            file.name ??
            'PDF File Title Placeholder';

          return {
            source: 'file',
            sourceType: pdfDoc.metadata.sourceType || 'pdf',
            content: pdfDoc.pageContent,
            title: pdfTitle,
            documentName: file.name,
            metadata: {
              ...pdfDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPdfPages.flat();
    // return mapCrawledPdfPagesToMarkdown(crawledPdfPages.flat());
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting PDF content from File: ', errMsg);
    return [];
  }
}

/**
 * Gets a remote PDF file's content and returns it as a standard Document
 *
 * @param url - The URL(s) of the PDF file
 * @returns The content of the PDF file(s) as a standard Document(s)
 */
export async function getRemotePdfContentAsDocument(
  urls: string | string[],
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getRemotePdfContent(urls);

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
    console.error('Error getting PDF content as document', errMsg);
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
 * Get a PDF Blob file(s) content and return the content as standard Document(s)
 *
 * @note similar to @getRemotePdfContentAsDocument, but accepts an array of Blob objects
 *
 * @param files - The Files(s) of the PDF to get the content from
 * @param fileOpts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the PDF File(s) as a standard Document(s)
 */
export async function getPdfContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetPdfContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    // Set the default options
    const { truncateBytesAmount, splitContent } = {
      ...DEFAULT_PREPARE_DOCUMENT_OPTIONS,
      ...prepareDocOpts,
    };

    const pages = await getPdfContentFromFileBlob(files, fileOpts);
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
    console.error('Error getting PDF File content as document', errMsg);
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
