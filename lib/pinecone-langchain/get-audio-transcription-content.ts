import { getTranscription } from '@/actions/openai';
import OpenAI from 'openai';

import { getErrorMessage } from '@/lib/errors';

import {
  DEFAULT_GET_CONTENT_OPTIONS,
  type GetBaseContentOptions,
} from './defaults';
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
 * Utility function(s) to get transcibed content from Audio files, e.g. audio.mp3.
 *
 * @note Leverages OpenAI Whisper
 *
 * @note Requires the node.js runtime
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/file_loaders/openai_whisper_audio
 *
 */

export async function transcribeAudioFile(file: File): Promise<string | null> {
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    throw new Error('Missing OpenAI API key');
  }
  const openai = new OpenAI({
    apiKey: openAiKey,
  });

  const formData = new FormData();
  formData.append('file', file);
  const response = await getTranscription(formData);

  const { text } = response;
  return text;
}

export interface GetAudioContentOptions extends GetBaseContentOptions {}

export const DEFAULT_GET_AUDIO_CONTENT_OPTIONS: GetAudioContentOptions = {
  ...DEFAULT_GET_CONTENT_OPTIONS,
};

/**
 * Retrieve the transcribed contents of an Audio file(s) and return the content as standard Crawled Page(s)
 *
 * @param files - The Audio File(s) to retrieve the content from
 * @param opts - The options to use when getting the Audio content
 *
 * @returns The transcribed content of the Audio file(s) as a standard CrawledPage(s)
 */
export async function getAudioContentFromFileBlob(
  files: File | File[], // File inherits from Blob, so we can use it here
  opts?: GetAudioContentOptions,
): Promise<GetCrawledContentResponse> {
  try {
    const { fileOrDocName } = { ...DEFAULT_GET_AUDIO_CONTENT_OPTIONS, ...opts };

    const filesList = Array.isArray(files) ? files : [files];

    // Transcribe all the audio files one by one
    const pages: CrawledPage[] = await Promise.all(
      filesList.map(async (file) => {
        const textTranscription = await transcribeAudioFile(file);
        const xFileOrDocName = fileOrDocName ?? file.name;

        const page: CrawledPage = {
          content: textTranscription ?? '',
          title: xFileOrDocName,
          source: file.name,
          documentName: file.name,
          sourceType: 'file',
          description: textTranscription
            ? `Transcribed content from Audio file: ${file.name}`
            : `Transcription failed for Audio file: ${file.name}`,
        };

        return page;
      }),
    );

    return pages.flat();
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error getting Audio content from file: ', errMsg);
    return [];
  }
}

/**
 * Get Audio File(s) content and return the content as standard Document(s)
 *
 * @see https://js.langchain.com/docs/integrations/document_loaders/file_loaders/openai_whisper_audio
 *
 * @param files - The File(s) to get the Audio content from
 * @param fileOpts - The options to use when getting the content
 * @param prepareDocOpts - The options to use when preparing the document(s)
 *
 * @returns The content of the Audio File(s) as a standard Document(s)
 */
export async function getAudioContentFromFileBlobAsDocument(
  files: File | File[],
  fileOpts?: GetAudioContentOptions,
  prepareDocOpts: Partial<PrepareDocumentOptions> = {},
): Promise<GetFileContentAsDocResponse> {
  try {
    const pages = await getAudioContentFromFileBlob(files, fileOpts);

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
      'Error getting Audio content from file(s) as document',
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
