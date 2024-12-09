import type { Metadata } from 'sharp';

import type { Media, MediaInsert } from '@/lib/db/schema';
import type { USER_PROFILE_MODEL } from '@/types/user';
import type { MediaExif } from './media';

/**
 * Photo types are an extension of Media types
 */

export interface PhotoAuthor extends Partial<USER_PROFILE_MODEL> {}

export type BASE_PHOTO_AUTHOR_KEY_TYPES = Array<keyof PhotoAuthor>;

// Raw db insert
export interface PhotoDbInsert extends MediaInsert {
  // credit?: string;
  // creditLink?: string;
  // creditLinkTitle?: string;
  // semanticDescription?: string;
}

// Raw db response
export interface PhotoDb extends Omit<Media, 'takenAt' | 'tags'> {
  // updatedAt: Date;
  // createdAt: Date;
  // takenAt: Date;
  // tags: string[];
}

// Parsed db response
export interface Photo extends PhotoDb {
  // focalLengthFormatted?: string;
  // focalLengthIn35MmFormatFormatted?: string;
  // fNumberFormatted?: string;
  // isoFormatted?: string;
  // exposureTimeFormatted?: string;
  // exposureCompensationFormatted?: string;
  // takenAtNaiveFormatted: string;
}

export type VirtualFields = 'favorite';

export type FieldSetType =
  | 'text'
  | 'email'
  | 'password'
  | 'checkbox'
  | 'textarea';

export type AnnotatedTag = {
  value: string;
  annotation?: string;
  annotationAria?: string;
};

export type PhotoFormData = Record<keyof PhotoDbInsert | VirtualFields, string>;

export type FormMeta = {
  label: string;
  note?: string;
  required?: boolean;
  excludeFromInsert?: boolean;
  readOnly?: boolean;
  validate?: (value?: string) => string | undefined;
  validateStringMaxLength?: number;
  capitalize?: boolean;
  hide?: boolean;
  hideIfEmpty?: boolean;
  shouldHide?: (formData: Partial<PhotoFormData>) => boolean;
  loadingMessage?: string;
  type?: FieldSetType;
  selectOptions?: { value: string; label: string }[];
  selectOptionsDefaultLabel?: string;
  tagOptions?: AnnotatedTag[];
};

export type PhotoThumbnail = {
  path: string;
  width: string;
  height?: string;
};

export interface PhotoExif extends MediaExif {}

export type PhotoBasicExifData = Omit<
  PhotoFormData,
  'public' | 'downloadable' | 'remixable' | 'staffPick'
> & {
  order: number;
  blobId?: string;
  public: boolean;
  remixable: boolean;
  downloadable: boolean;
  staffPick: boolean;
  selected?: boolean;
  exif: PhotoExif;
  imageResizedBase64?: string;
  thumbnail?: PhotoThumbnail;
  user?: PhotoAuthor;
  metadata?: Metadata;
};
