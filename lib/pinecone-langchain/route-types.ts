import type {
  BASE_RECORD_DOCUMENT,
  BASE_RECORD_PINECONE,
  CrawledPage,
  IngestedPage,
  PROCESSED_FILE_DOCUMENT,
} from './metadata';
import type { SeedUrlItem } from './pinecone-seed-web-url';
import type { PrepareDocumentOptions } from './prepare-document';

export type ContentAsStandardDocsResponse = {
  success: boolean;
  error?: boolean;
  count: {
    pages: number;
    docs: number;
  };
  meta?: {
    error?: boolean;
    errMsg?: string;
  };
  pages: CrawledPage[];
  docs: BASE_RECORD_DOCUMENT[];
};

export type ExtractedRemoteContentResponse = {
  success: boolean;
  count: {
    pages: number;
    docs: number;
  };
  params?: {
    url: string | SeedUrlItem[];
  };
  meta?: {
    urlsToCrawl?: string[];
    responseMsg?: string;
  };
  pages: CrawledPage[];
  docs: BASE_RECORD_DOCUMENT[];
};

export type GetFileContentAsDocResponse = {
  meta: {
    error?: boolean;
    msg?: string;
    sources?: object[] | string[];
    crawledPages: number;
    mappedDocuments: number;
  };
  pages: CrawledPage[];
  docs: BASE_RECORD_DOCUMENT[];
};

export type ExtractedFileContentResponse = {
  success: boolean;
  count: {
    pages: number;
  };
  params: {
    files: number;
  };
  meta?: {
    [key: string]: any;
    errorMsg?: string;
  };
  pages: CrawledPage[];
};

export type GetCrawledContentResponse = CrawledPage[];

/**
 * Content Ingesting
 */
export type IngestedFileContentResponse = {
  success: boolean;
  count: {
    pages: number;
    docs: number;
  };
  params: Record<string, any>;
  meta?: {
    [key: string]: any;
    errorMsg?: string;
  };
  pages?: IngestedPage[];
  docs: PROCESSED_FILE_DOCUMENT[];
  vectors?: BASE_RECORD_PINECONE[];
};

export type INGEST_CRAWLED_PAGE_POST_BODY = {
  index?: string; // The index to ingest the document into
  namespace?: string; // The namespace to ingest the document into
  description?: string; // The description of the document
  pages: CrawledPage[]; // The CrawledPage(s) to ingest
  metadata?: Record<string, any>; // The metadata to associate with the document
  options?: Partial<PrepareDocumentOptions>;
};
