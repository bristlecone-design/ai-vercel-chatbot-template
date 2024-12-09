import { getErrorMessage } from '@/lib/errors';

import { htmlToMarkdown } from '../content/markdown/content-to-markdown';
import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import { getTextContentFromFileBlob } from './get-text-content';
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

/**
 * Utility function(s) to get content from HTML files, e.g. index.html.
 *
 * @note For remote content, @see get-url-content.ts
 * @note An extension of the TextLoader to handle HTML content
 *
 * @note Requires the node.js runtime
 *
 * @see https://js.langchain.com/docs/integrations/document_transformers/html-to-text
 * @see https://js.langchain.com/docs/integrations/document_loaders/file_loaders/text
 * @see https://js.langchain.com/docs/integrations/document_loaders/web_loaders/web_cheerio
 */

export interface GetHtmlContentOptions extends GetBaseContentOptions {
  // To specify a selector to extract content from the HTML file
  // Defaults to the entire HTML content, aka: 'html'
  selector: string;
}

export const DEFAULT_GET_HTML_CONTENT_OPTIONS: GetHtmlContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
  selector: '',
};

/**
 * Utility function(s) to map the content of parsed HTML files to standard Markdown content. Useful for previewing HTML content as Markdown on the frontend.
 *
 */
export function mapCrawledHtmlPagesToMarkdown(
  pages: CrawledPage[],
  selector: string = DEFAULT_GET_HTML_CONTENT_OPTIONS.selector,
): CrawledPage[] {
  let xPages: CrawledPage[] = [];

  if (pages.length) {
    xPages = pages.map((page) => {
      const { content } = page;

      if (content?.trim()) {
        const xResponse = htmlToMarkdown(content, selector);
        if (xResponse.translated) {
          return {
            ...page,
            xContent: xResponse.content,
            title: xResponse.title ?? page.title,
            description: xResponse.description ?? page.description,
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
 * Retrieve the contents of a HTML file(s) and return the content as standard Crawled Page(s)
 *
 * @param files - The HTML File(s) to retrieve the content from
 * @param opts - The options to use when getting the HTML content
 *
 * @returns The content of the HTML file(s) as a standard CrawledPage(s)
 */
export async function getHtmlContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetHtmlContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const mappedOpts = { ...DEFAULT_GET_HTML_CONTENT_OPTIONS, ...opts };

    const pages = await getTextContentFromFileBlob(files, mappedOpts);

    return pages.length
      ? mapCrawledHtmlPagesToMarkdown(pages).map((p) => {
          return {
            ...p,
            // Since we're inheriting from text, we need to update the sourceType
            sourceType: 'html',
          };
        })
      : pages;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting HTML content from file: ', errMsg);
    return [];
  }
}

/**
 * Get HTML File(s) content and return the content as standard Document(s)
 *
 * @see https://js.langchain.com/docs/integrations/document_transformers/html-to-text
 *
 * @param files - The File(s) to get the HTML content from
 * @param fileOrDocName - The file or document name to use as the title (Optional)
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the HTML File(s) as a standard Document(s)
 */
export async function getHtmlContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetHtmlContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getHtmlContentFromFileBlob(files, fileOpts);

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
      'Error getting HTML content from file(s) as document',
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
