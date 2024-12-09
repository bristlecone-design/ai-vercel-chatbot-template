import type { PineconeRecord } from '@pinecone-database/pinecone';
import type { Document } from 'langchain/document';

export type SourceTypes =
  | 'csv'
  | 'docx'
  | 'file'
  | 'm4a'
  | 'mpeg'
  | 'md'
  | 'mdx'
  | 'pdf'
  | 'img'
  | 'youtube'
  | 'github'
  | 'txt'
  | 'web'
  | 'html';

/**
 * Combined Document and metadata type when loading various document types.
 */
export type PROCESSED_FILE_DOCUMENT =
  | BASE_RECORD_DOCUMENT
  | BASE_RECORD_PDF_DOCUMENT
  | BASE_RECORD_WORD_DOCUMENT
  | BASE_RECORD_CSV_DOCUMENT
  | BASE_RECORD_TEXT_DOCUMENT
  | BASE_RECORD_MARKDOWN_DOCUMENT
  | BASE_RECORD_IMAGE_DOCUMENT
  | BASE_RECORD_AUDIO_DOCUMENT
  | BASE_RECORD_HTML_DOCUMENT;

/**
 * For general Documents and metadata.
 */
export type BASE_RECORD_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general PDF Documents and metadata.
 */
export type BASE_RECORD_PDF_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general Image Documents and metadata.
 */
export type BASE_RECORD_IMAGE_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general YouTube Documents and metadata.
 */
export type BASE_RECORD_YOUTUBE_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general GitHub Documents and metadata.
 */
export type BASE_RECORD_GITHUB_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general Word Documents and metadata.
 */
export type BASE_RECORD_WORD_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general CSV Documents and metadata.
 */
export type BASE_RECORD_CSV_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general Text Documents and metadata.
 */
export type BASE_RECORD_TEXT_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general Markdown Documents and metadata.
 */
export type BASE_RECORD_MARKDOWN_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general HTM(L) Documents and metadata.
 */
export type BASE_RECORD_HTML_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general Audio Documents and metadata.
 */
export type BASE_RECORD_AUDIO_DOCUMENT = Omit<Document, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * For general Pinecone Records and metadata.
 */
export type BASE_RECORD_PINECONE = Omit<PineconeRecord, 'metadata'> & {
  metadata: BASE_RECORD_METADATA;
};

/**
 * PDF Info Metadata
 */
export type PDF_INFO_METADATA = {
  version?: string;
  pageNumber?: number;
  totalPages?: number;
  info?: {
    [key: string]: any;
    Title?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
  metadata?: Record<string, any>; // PDF metadata
};

/**
 * Metadata LOC type
 *
 * @note The location of the embedded text in the original document
 */
export type MetadataLoc = {
  start?: number;
  end?: number;
  pageNumber?: number;
};

/**
 * Metadata file store type
 *
 */
export type MetadataFileStore = {
  [key: string]: any;
  url: string;
  downloadUrl?: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  fileId?: string;
  fileStoreName?: 'local' | 'vercel' | 'openai';
};

/**
 * Metadata for partner data
 */
export type MetadataPartnerData = {
  [key: string]: any;
  partner?: string;
  partnerId?: string;
  partnerType?: string;
  partnerData?: any;
};

/**
 * The base record metadata type.
 *
 * @note This is a type that extends the `Document` metadata type.
 * @note Can be used to add additional metadata to a document.
 */
export type BASE_RECORD_METADATA = Document['metadata'] & {
  [key: string]: any;
  pdf?: PDF_INFO_METADATA;
  source: string; // The source path of the document
  sourceType?: SourceTypes; // The type of the source (e.g. 'file', 'url', etc.)
  line?: number; // The line number of the embedded text in the original document typically for csv files
  loc?: string | MetadataLoc; // The location of the embedded text in the original document
  content: string; // The embedded text content (full or partial/chunk)
  xContent?: string; // A transformed version of the content, e.g. HTML to Markdown
  fullContent?: string; // The full text content of the document
  title: string; // The title of the document (can be the same as the document name)
  documentName?: string; // The name of the document,
  description?: string; // The description of the document
  partners?: Array<MetadataPartnerData>; // Partner data
  // File upload/ingest metadata
  fileStore?: MetadataFileStore;
};

/**
 * The base source/citation item
 *
 * @note For tracking document sources/citations
 */
export type BASE_RECORD_SOURCE = {
  id: string;
  score: number;
  pageContent: string;
  metadata: BASE_RECORD_METADATA;
};

/**
 * URL record metadata type.
 * @note extends the `BASE_RECORD_METADATA` type.
 */
export type URL_RECORD_METADATA = BASE_RECORD_METADATA & {
  url: string; // The URL where the document was found
  hash?: string; // The hash of the document content
};

/**
 * Crawl Page notes:
 *  - The content is the parsed text content of the resource
 *  - The title of the resource acts as a unique string identifier
 *  - The input resource can be the resource url or a File blob, however, the final resource is always a string
 *  - The sourceType is the type of source of the resource, e.g. "web", "pdf", "word", etc.
 */
export type CrawledPageSourceInput = string | File;

export type CrawledPage = {
  source: BASE_RECORD_METADATA['source'];
  sourceType: BASE_RECORD_METADATA['sourceType'];
  content: BASE_RECORD_METADATA['content'];
  xContent?: BASE_RECORD_METADATA['xContent'];
  documentName?: BASE_RECORD_METADATA['documentName'];
  description?: BASE_RECORD_METADATA['description'];
  title: BASE_RECORD_METADATA['title'];
  metadata?: BASE_RECORD_METADATA;
};

export type QueueCrawledItem = Omit<CrawledPage, 'content'> & {
  depth: number;
};

export type ContentUrlItem = {
  url: CrawledPage['source'];
  title?: CrawledPage['title'];
};

/**
 * An Ingested Page are a Crawled Pages with additional metadata.
 */
export type IngestedPage = CrawledPage & {
  fileStore?: BASE_RECORD_METADATA['fileStore'];
};
