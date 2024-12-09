import {
  GithubRepoLoader,
  type GithubRepoLoaderParams,
} from '@langchain/community/document_loaders/web/github';

import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import { getUrlContentAsDocument } from './get-url-content';
import type { BASE_RECORD_GITHUB_DOCUMENT, CrawledPage } from './metadata';
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
 * Utility function(s) to get GitHub repository content and metadata
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/web_loaders/github
 *
 * @note It should work in most environments, including serverless and browser, but if you encounter any issues with running things on the edge/browser, fallback to node.js runtime.
 *
 */

export interface GetGitHubContentOptions extends GetBaseContentOptions {
  branch?: GithubRepoLoaderParams['branch'];
  recursive?: GithubRepoLoaderParams['recursive'];
  verbose?: GithubRepoLoaderParams['verbose'];
  ignoreFiles?: GithubRepoLoaderParams['ignoreFiles'];
  ignorePaths?: GithubRepoLoaderParams['ignorePaths'];
  processSubmodules?: GithubRepoLoaderParams['processSubmodules'];
  maxConcurrency?: GithubRepoLoaderParams['maxConcurrency'];
  unknown?: GithubRepoLoaderParams['unknown'];
}

export const DEFAULT_GET_GITHUB_CONTENT_OPTIONS: GetGitHubContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
  branch: 'main',
  recursive: true,
  // ignorePaths: ['*.md'],
};

/**
 * Gets a remote GitHub repository's content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the GitHub repo(s)
 * @example git@github.com:vercel/next.js.git
 *
 * @param options - The options to use when getting the content
 * @param options.branch - The branch of the GitHub repo
 * @param options.recursive - Whether to recursively process submodules
 * @param options.maxConcurrency - The maximum number of concurrent calls that can be made
 * @param options.unknown - The handling of unknown content
 * @param options.fileOrDocName - The name of the file or document
 *
 * @returns The content of the GitHub repo(s) as a standard CrawledPage(s)
 */
export async function getRemoteGitHubContent(
  urls: string | string[],
  options?: GetGitHubContentOptions,
): Promise<GetCrawledContentResponse> {
  let urlList: string[] = [];

  try {
    const { branch, recursive, maxConcurrency, unknown, fileOrDocName } = {
      ...DEFAULT_GET_GITHUB_CONTENT_OPTIONS,
      ...(options || {}),
    };

    urlList = Array.isArray(urls) ? urls : [urls];

    // Dedup the URLs
    const finalUrlList = Array.from(new Set(urlList));

    // Retrieve the content of the GitHub repo(s)
    const crawledPages = await Promise.all(
      finalUrlList.map(async (url): Promise<CrawledPage[]> => {
        const loader = new GithubRepoLoader(url, {
          branch,
          recursive,
          unknown,
          maxConcurrency,
        });

        // @note to stream, @see https://js.langchain.com/docs/integrations/document_loaders/web_loaders/github#stream-large-repository
        const gitDocs = await loader.load();
        return gitDocs.map((doc) => {
          const gitDoc = doc as BASE_RECORD_GITHUB_DOCUMENT;

          // const docTitle =
          //   fileOrDocName ??
          //   gitDoc.metadata?.branch ??
          //   `GitHub Title Placeholder`;

          return {
            source: gitDoc.metadata?.source ?? 'web',
            sourceType: 'github',
            content: gitDoc.pageContent,
            title: `Branch: ${gitDoc.metadata?.branch}`,
            // documentName: file.name,
            metadata: {
              ...gitDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting GitHub content: ', errMsg);
    console.log('Will try to parse the content as a general URL document');
    const fallback = await getUrlContentAsDocument(urlList);
    if (fallback.pages.length) {
      return fallback.pages;
    } else {
      return [];
    }
  }
}

/**
 * Gets a remote GitHub repository's content and returns it as a standard Document object
 *
 * @param url - The URL(s) of the GitHub repo(s)
 * @example git@github.com:vercel/next.js.git
 *
 * @param contentOpts - The options to use when getting the content
 * @param contentOpts.branch - The branch of the GitHub repo
 * @param contentOpts.recursive - Whether to recursively process submodules
 * @param contentOpts.maxConcurrency - The maximum number of concurrent calls that can be made
 * @param contentOpts.unknown - The handling of unknown content
 * @param contentOpts.fileOrDocName - The name of the file or document
 *
 * @param prepareDocOpts - The options to use when preparing the document
 * @param prepareDocOpts.truncateBytesAmount - The amount of bytes to truncate the content by
 * @param prepareDocOpts.splitContent - Whether to split the content into smaller documents
 *
 * @returns The content of the GitHub repo(s) as a standard Document(s)
 *
 */
export async function getRemoteGitHubContentAsDocument(
  urls: string | string[],
  contentOpts?: GetGitHubContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getRemoteGitHubContent(urls, contentOpts);

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
    console.error('Error getting GitHub content as document', errMsg);
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
