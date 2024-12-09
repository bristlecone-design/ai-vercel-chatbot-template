import type {
  ContentAsStandardDocsResponse,
  ExtractedFileContentResponse,
  IngestedFileContentResponse,
} from '@/lib/pinecone-langchain/route-types';

import type { ParsedContentItem } from '../files/file-uploader-types';

// For preparing raw content as documents
export const DEFAULT_API_PREPARE_CONTENT_ENDPOINT =
  '/api/pinecone/transform/docs/content';
// For parsing the content of files
export const DEFAULT_API_PARSER_ENDPOINT = '/api/pinecone/extract/file';
// For ingesting the content of parsed files
export const DEFAULT_API_INGEST_ENDPOINT = '/api/pinecone/ingest/crawled';

/**
 * Prepare raw/simple content as a standard Document(s)
 *
 * @param content - The raw content to prepare as a standard Document(s)
 * @param api - The API endpoint to use for preparing the content
 *
 * @returns The prepared content as a standard Document(s)
 */
export async function handlePreparingRawContentAsDocument(
  content: string | Record<string, any>,
  api: string = DEFAULT_API_PREPARE_CONTENT_ENDPOINT,
) {
  const response: ContentAsStandardDocsResponse = await fetch(
    `${api}?cachebuster=${Date.now()}`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
  ).then((res) => res.json());

  if (!response.success) {
    const errMsg = response.meta?.errMsg;
    console.error('Error preparing content as standard doc(s):', errMsg);
    throw new Error(errMsg || 'Error preparing content as standard doc(s):');
  }

  return response;
}

/**
 * Parse the content of a File remotely and return the content as a standard Crawled Page
 *
 * @param formData
 * @param api
 *
 * @returns The content of the file as a standard CrawledPage(s) via ExtractedFileContentResponse
 */
export async function handleFetchingParsedFileContent(
  formData: FormData,
  api: string = DEFAULT_API_PARSER_ENDPOINT,
) {
  const parseFilesResponse: ExtractedFileContentResponse = await fetch(api, {
    method: 'POST',
    body: formData,
  }).then((res) => res.json());

  if (!parseFilesResponse.success) {
    console.error('Error parsing files content: ', parseFilesResponse.meta);
    throw new Error(parseFilesResponse.meta?.errorMsg || 'Error parsing files');
  }

  return parseFilesResponse;
}

export type IngestParsedFilesContentOptions = {
  namespace: string;
  description?: string;
  sourceUrl?: string;
  sourceTitle: string;
  dryrun: boolean;
  storeFile?: boolean;
  partner?: string;
  api?: string;
};

/**
 * Ingest the content of parsed files remotely
 *
 * @param parsedFile - The parsed file content which can be for a file(s) or a URL(s)
 * @param namespace - The namespace to associate the content with
 * @param description - The description to associate with the content
 * @param sourceUrl - The source URL to associate with the content
 * @param dryrun - Whether to ingest the content as a dryrun
 * @param storeFile - Whether to store the file and associate it with the ingested document(s). Requires the file to be passed in the request.
 * @param api - The API endpoint to use for ingesting the content
 *
 * @returns The content of the file as a standard CrawledPage(s) via IngestedFileContentResponse
 */
export async function handleIngestingParsedFilesContent(
  parsedFile: ParsedContentItem,
  options = {} as IngestParsedFilesContentOptions,
) {
  const {
    namespace = '',
    description = '',
    sourceUrl = '',
    sourceTitle = '',
    partner = '',
    dryrun = false,
    storeFile = true,
    api = DEFAULT_API_INGEST_ENDPOINT,
  } = options || {};

  const formData = new FormData();
  if (parsedFile.file) {
    formData.append('file', parsedFile.file);
  }
  // Content is an array of CrawledPage(s)
  formData.append('pages', JSON.stringify(parsedFile.content));
  formData.append('namespace', namespace);
  formData.append('description', description);
  formData.append('sourceUrl', sourceUrl);
  formData.append('sourceTitle', sourceTitle);
  formData.append('dryrun', String(dryrun));
  formData.append('storeFile', String(storeFile));

  // Partner meta
  if (partner) {
    formData.append('metadata', JSON.stringify({ partners: [{ partner }] }));
  }

  // console.log(`handleIngestingParsedFilesContent`, {
  //   parsedFile,
  //   namespace,
  //   description,
  //   dryrun,
  //   storeFile,
  //   api,
  // });

  const ingestResponse: IngestedFileContentResponse = await fetch(
    `${api}?cachebuster=${Date.now()}`,
    {
      method: 'POST',
      body: formData,
    },
  ).then((res) => res.json());
  console.log(`ingestResponse`, ingestResponse);

  if (!ingestResponse.success) {
    console.error('Error parsing files content: ', ingestResponse.meta);
    throw new Error(ingestResponse.meta?.errorMsg || 'Error parsing files');
  }

  return ingestResponse;
}
