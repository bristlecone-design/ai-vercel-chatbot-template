import { getErrorMessage } from '@/lib/errors';

import { parseGrayMatterAndModifyText } from '../markdown';
import {
  type GetTextContentOptions,
  getRemoteTextContent,
  getTextContentFromFileBlob,
} from './get-text-content';
import type { BASE_RECORD_MARKDOWN_DOCUMENT, CrawledPage } from './metadata';
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
 * Utility function(s) to get a remote Markdown file's content
 *
 * @note Requires the node.js runtime
 * @note Core functionality is a wrapper for the TextLoader get method(s)
 * @see get-text-content.ts for the core functionality
 *
 * @see https://github.com/langchain-ai/langchainjs/blob/main/langchain/src/document_loaders/fs/text.ts
 */

export function mapCrawledPagestoMarkdownFrontmatter(
  pages: CrawledPage[],
): CrawledPage[] {
  let xPages: CrawledPage[] = [];

  if (pages.length) {
    xPages = pages.map((page) => {
      const { content } = page;

      if (content?.trim()) {
        const { grayMatter, content: modifiedContent } =
          parseGrayMatterAndModifyText(content);

        if (grayMatter) {
          return {
            ...page,
            content: modifiedContent,
            title: grayMatter.title ?? page.title,
            metadata: {
              ...page.metadata,
              ...grayMatter,
            },
          } as CrawledPage;
        }
      }

      return page;
    });
  }

  return xPages;
}

/**
 * Gets a remote Markdown file's content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the Markdown file(s)
 * @returns The content of the Markdown file(s) as a standard CrawledPage(s)
 */
export async function getRemoteMarkdownContent(
  urls: string | string[],
  metadata: Partial<BASE_RECORD_MARKDOWN_DOCUMENT['metadata']> = {},
): Promise<GetCrawledContentResponse> {
  try {
    // Retrieve the core content of the Markdown file(s) using the TextLoader
    const pages = await getRemoteTextContent(urls, metadata);
    return mapCrawledPagestoMarkdownFrontmatter(pages).map((page) => {
      return {
        ...page,
        // Since we're inheriting from text, we need to update the sourceType
        sourceType: 'md',
      };
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Markdown content: ', errMsg);
    return [];
  }
}

/**
 * Gets a remote Markdown file's content and returns it as a standard Document
 *
 * @param url - The URL(s) of the Markdown file(s)
 * @param prepareDocOpts - The options to use when preparing the document(s)
 * @param metadata - Additional metadata to include with the document
 *
 * @returns The content of the Markdown file(s) as a standard Document(s)
 */
export async function getRemoteMarkdownContentAsDocument(
  urls: string | string[],
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
  metadata: Partial<BASE_RECORD_MARKDOWN_DOCUMENT['metadata']> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getRemoteMarkdownContent(urls, metadata);

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
    console.error('Error getting Markdown content as document', errMsg);
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
 * Retrieve the contents of a Markdown File(s) and return the content as standard Document(s)
 *
 * @note Similar to @getRemoteMarkdownContent, but accepts an array of File objects
 *
 * @param files - The File(s) of the Markdown file(s)
 * @param opts - The options to use when getting the content
 *
 * @returns The content of the Markdown File(s) as a standard CrawledPage(s)
 */
export async function getMarkdownContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetTextContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const pages = await getTextContentFromFileBlob(files, opts);
    return mapCrawledPagestoMarkdownFrontmatter(pages).map((page) => {
      return {
        ...page,
        // Since we're inheriting from text, we need to update the sourceType
        sourceType: 'md',
      };
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Markdown content from file(s): ', errMsg);
    return [];
  }
}

/**
 * Get a Markdown File(s) content and return the content as standard Document(s)
 *
 * @note similar to @getRemoteMarkdownContentAsDocument, but accepts an array of File objects
 *
 * @param files - The File(s) to get the Markdown content from
 * @param fileOpts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the Markdown File(s) as a standard Document(s)
 */
export async function getMarkdownContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetTextContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getMarkdownContentFromFileBlob(files, fileOpts);

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
      'Error getting Markdown content from file(s) as document',
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
