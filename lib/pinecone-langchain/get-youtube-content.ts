import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';

import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
import type { BASE_RECORD_YOUTUBE_DOCUMENT, CrawledPage } from './metadata';
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
 * Utility function(s) to get YouTube video transcriptions and metadata
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/web_loaders/youtube
 *
 * @note It should work in most environments, including serverless and browser, but if you encounter any issues with running things on the edge/browser, fallback to node.js runtime.
 *
 */

export interface GetYouTubeContentOptions extends GetBaseContentOptions {
  language?: string;
  addVideoInfo?: boolean;
}

export const DEFAULT_GET_YOUTUBE_CONTENT_OPTIONS: GetYouTubeContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
  language: 'en',
  addVideoInfo: true,
};

/**
 * Gets a remote YouTube video's transcription content and returns it as a standard Page object
 *
 * @see `@prepareDocument` for converting the content to a standard Document
 *
 * @param url - The URL(s) of the YouTube video(s)
 * @example https://youtu.be/bZQun8Y4L2A
 *
 * @returns The content of the YouTube video(s) as a standard CrawledPage(s)
 */
export async function getRemoteYouTubeContent(
  urls: string | string[],
  options?: GetYouTubeContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const { language, addVideoInfo, fileOrDocName } = {
      ...DEFAULT_GET_YOUTUBE_CONTENT_OPTIONS,
      ...(options || {}),
    };

    const urlList = Array.isArray(urls) ? urls : [urls];

    // Dedup the URLs
    const finalUrlList = Array.from(new Set(urlList));

    // Retrieve the content of the YouTube video(s)
    const crawledPages = await Promise.all(
      finalUrlList.map(async (url): Promise<CrawledPage[]> => {
        const loader = YoutubeLoader.createFromUrl(url, {
          language,
          addVideoInfo,
        });

        const ytDocs = await loader.load();
        return ytDocs.map((doc) => {
          const ytDoc = doc as BASE_RECORD_YOUTUBE_DOCUMENT;

          const docTitle =
            fileOrDocName ??
            ytDoc.metadata?.title ??
            `YouTube Title Placeholder`;

          return {
            source: ytDoc.metadata?.source ?? 'web',
            sourceType: 'youtube',
            content: ytDoc.pageContent,
            title: docTitle,
            // documentName: file.name,
            metadata: {
              ...ytDoc.metadata,
            },
          };
        });
      }),
    );

    return crawledPages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting YouTube content: ', errMsg);
    return [];
  }
}

/**
 * Gets a remote YouTube video's transcription content and returns it as a standard Document object
 *
 * @param url - The URL(s) of the YouTube video(s)
 * @example https://youtu.be/bZQun8Y4L2A
 * @param contentOpts - The options to use when getting the content
 * @param contentOpts.language - The language of the video
 * @param contentOpts.addVideoInfo - Whether to add the video info to the content
 *
 * @param prepareDocOpts - The options to use when preparing the document
 * @param prepareDocOpts.truncateBytesAmount - The amount of bytes to truncate the content by
 * @param prepareDocOpts.splitContent - Whether to split the content into smaller documents
 *
 * @returns The content of the YouTube video(s) as a standard Document(s)
 *
 */
export async function getRemoteYouTubeContentAsDocument(
  urls: string | string[],
  contentOpts?: GetYouTubeContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getRemoteYouTubeContent(urls, contentOpts);

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
    console.error('Error getting YouTube content as document', errMsg);
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
