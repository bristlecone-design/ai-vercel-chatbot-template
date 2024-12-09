import { getErrorMessage } from '@/lib/errors';

import { Crawler, DEFAULT_MAX_DEPTH, DEFAULT_MAX_PAGES } from './crawler';
import { DEFAULT_TRUNCATE_BYTES_AMOUNT } from './defaults';
import type { CrawledPage } from './metadata';
import { prepareDocument } from './prepare-document';
import type { GetFileContentAsDocResponse } from './route-types';

export type GetUrlContentOptions = {
  selector?: string;
  sourceType?: CrawledPage['sourceType'];
  maxDepth?: number;
  maxPages?: number;
  excludeUrlTypes?: string[]; // Ex. ['pdf', 'csv']
  excludeUrlDomains?: string[]; // Ex. ['example.com']
  truncateBytesAmount?: number;
  splitContent?: boolean;
};

export const DEFAULT_GET_URL_CONTENT_OPTIONS: GetUrlContentOptions = {
  selector: 'body',
  sourceType: 'web',
  maxDepth: DEFAULT_MAX_DEPTH,
  maxPages: DEFAULT_MAX_PAGES,
  truncateBytesAmount: DEFAULT_TRUNCATE_BYTES_AMOUNT,
  splitContent: true,
};

/**
 * Utility function to get (crawl) the content of a URL.
 * Applies a recursive approach to load nested/related links of the URL.
 *
 * @note Handles different Web source types (e.g. web, pdf, word, text, csv, etc.)
 * @note For handling other document types, @see https://js.langchain.com/docs/integrations/document_loaders
 *
 * @param urls The URL or URLs to load the content from.
 * @param crawlContentOptions The options to use when crawling the content.
 *  - selector: The selector to use to extract the content from the page
 *  - sourceType: The source type of the content
 *  - maxDepth: The maximum depth to crawl
 *  - maxPages: The maximum number of pages to crawl
 *  - truncateBytesAmount: The amount of bytes to truncate the content by
 *  - splitContent: Whether to split the content into smaller documents
 *
 * @returns The content of the URL(s) as a CrawledPage(s)
 *
 */
export async function getUrlContent(
  urls: string | string[],
  crawlContentOptions: Partial<GetUrlContentOptions> = {},
): Promise<CrawledPage[]> {
  const {
    selector,
    sourceType,
    maxDepth,
    maxPages,
    excludeUrlDomains,
    excludeUrlTypes,
    truncateBytesAmount,
    splitContent,
  } = {
    ...DEFAULT_GET_URL_CONTENT_OPTIONS,
    ...crawlContentOptions,
  } as GetUrlContentOptions;

  const finalUrls = Array.isArray(urls) ? urls : [urls];
  const crawledPages = await Promise.all(
    finalUrls.map(async (url) =>
      new Crawler({
        maxDepth,
        maxPages,
        excludeUrlTypes,
        excludeUrlDomains,
        truncateBytesAmount,
        splitContent,
      }).crawl(url, sourceType, undefined, selector),
    ),
  );

  const flattenedPages = crawledPages.flat();

  // Dedup the crawled pages by source
  const dedupedPages = Array.from(
    new Map(flattenedPages.map((page) => [page.source, page])).values(),
  );

  return dedupedPages;
}

/**
 * Get the content of a URL(s) and return the content as standard Document(s).
 */
export async function getUrlContentAsDocument(
  urls: string | string[],
  crawlContentOptions: Partial<GetUrlContentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    crawlContentOptions = {
      ...DEFAULT_GET_URL_CONTENT_OPTIONS,
      ...crawlContentOptions,
    };

    const pages = await getUrlContent(urls, crawlContentOptions);

    // Dedup the crawled pages by source
    const dedupedPageSources = Array.from(
      new Map(pages.map((page) => [page.source, page])).values(),
    );

    const { truncateBytesAmount, splitContent } = crawlContentOptions;
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
        sources: pages.map((page) => page.source),
      },
      pages,
      docs: docs,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting URL document content', errMsg);
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
