import type {
  CrawledPage,
  IngestedPage,
  PROCESSED_FILE_DOCUMENT,
} from '@/lib/pinecone-langchain/metadata';

/**
 * Track the status of a file being processed, e.g. loading, success, error
 */
export type ParsedFileStatus = 'loading' | 'success' | 'error';

export type FileKind = 'image' | 'video' | 'audio' | 'document' | 'file';

export type FileInBase64 = {
  mediaId?: string;
  src: string | null | undefined;
  name: string;
  type: string;
  kind: 'image';
};

// Reflects a video file with a Object URL
export type FileInVideoUrl = {
  mediaId?: string;
  src: string | null | undefined;
  name: string;
  type: string;
  kind: 'video';
};

export type FileInGenericUrl = {
  mediaId?: string;
  src: string | null | undefined;
  name: string;
  type: string;
  kind: 'file';
};

export type FileInAttachedVisualKind = FileInBase64 | FileInVideoUrl;

// Any type of the above file kinds
export type FileInAnyValidKind =
  | FileInBase64
  | FileInVideoUrl
  | FileInGenericUrl;

/**
 * Parsed file with status
 */
export interface ParsedFile {
  file: File;
  content: CrawledPage[] | null;
  status: ParsedFileStatus;
  msg?: string;
}

/**
 * Ingested file with status
 */
export interface IngestedFile {
  file?: File; // Source of truth
  pages?: IngestedPage[]; // Extended crawled page's content based on the File
  docs: PROCESSED_FILE_DOCUMENT[]; // The split standard documents based on the page content
  status: ParsedFileStatus;
  msg?: string;
}

/**
 * Upload asset/image file with status
 */
export interface UploadedAssetFile {
  file?: File; // Source of truth
  status: ParsedFileStatus;
  msg?: string;
}

/**
 * Track the status of a file being processed, e.g. loading, success, error
 */
export type ParsedUrlStatus = 'loading' | 'success' | 'error';

/**
 * Parsed URL content with status
 */
export interface ParsedUrlItem {
  url: string;
  content: CrawledPage[] | null;
  status: ParsedUrlStatus;
  msg?: string;
}

/**
 * Ingested URL content with status
 */
export interface IngestedUrlItem {
  url: string;
  pages?: IngestedPage[]; // Extended crawled page's content based on the URL
  docs: PROCESSED_FILE_DOCUMENT[]; // The split standard documents based on the page content
  status: ParsedUrlStatus;
  msg?: string;
}

/**
 * Shared/common types
 */
export type ParsedContentItem = Omit<ParsedFile, 'file'> &
  Omit<ParsedUrlItem, 'url'> & {
    file?: ParsedFile['file'];
    url?: ParsedUrlItem['url'];
  };
