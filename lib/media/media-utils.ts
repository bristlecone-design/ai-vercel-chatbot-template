/**
 * This file contains utility functions for crawling the web and scraping data for various multimedia types, e.g. images, webpages, PDFs, etc.
 *
 * @todo - combine this file and the images.ts file where appropriate
 */

import { ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS } from '../images';

import type { ExperienceMediaModel } from '@/types/experiences';
import type {
  MediaAudio,
  MediaAudioTextToSpeech,
  MediaModel,
} from '@/types/media';
import type { PhotoBasicExifData } from '@/types/photo';

export function isExternalUrl(url: string): boolean {
  return url.startsWith('http') || url.startsWith('//');
}

export function isRelativeUrl(url: string): boolean {
  return url.startsWith('/');
}

export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http') || url.startsWith('https');
}

/**
 * Determines if a URL is a webpage URL. Can end in .html or .htm. or be a root URL, e.g. https://example.com, or a subpage, e.g. https://example.com/page
 */
export function isWebpageUrl(url: string): boolean {
  return (
    url.match(/\.(html|htm)$/) != null ||
    url.match(/^(http|https):\/\/[^ "]+$/) != null
  );
}

export function isWebpage(url: string): boolean {
  return isWebpageUrl(url) || isExternalUrl(url);
}

export function isImageUrl(url: string): boolean {
  return url.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null;
}

export function isImageExtension(extension: string): boolean {
  return extension.toLowerCase().match(/(jpeg|jpg|gif|png)$/) != null;
}

export function isImageFile(file: File): boolean {
  if (!file || typeof file === 'string') {
    return false;
  }

  return (
    file.type === 'image/jpeg' ||
    file.type === 'image/jpg' ||
    file.type === 'image/gif' ||
    file.type === 'image/png'
  );
}

export function isImage(asset: string | File): boolean {
  return typeof asset === 'string'
    ? isImageUrl(asset.toLowerCase())
    : isImageFile(asset);
}

export function isVideoUrl(url: string): boolean {
  return url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) != null;
}

export function isVideoExtension(extension: string): boolean {
  return extension.toLowerCase().match(/(mp4|webm|ogg|mov)$/) != null;
}

export function isVideoFile(file: File): boolean {
  if (!file || typeof file === 'string') {
    return false;
  }

  return (
    file.type === 'video/mp4' ||
    file.type === 'video/webm' ||
    file.type === 'video/ogg' ||
    file.type === 'video/quicktime' ||
    file.type === 'video/mov'
  );
}

export function isVideo(asset: string | File): boolean {
  return typeof asset === 'string'
    ? isVideoUrl(asset.toLowerCase())
    : isVideoFile(asset);
}

export function isVideoBlobDataUrl(url: string): boolean {
  return url.startsWith('data:video');
}

export function isYouTubeUrl(url: string): boolean {
  return (
    url.match(/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/) != null
  );
}

export function isYouTubeEmbedUrl(url: string): boolean {
  return url.match(/^(https?\:\/\/)?(www\.)?youtube\.com\/embed\/.+/) != null;
}

export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

export function isAudioUrl(url: string): boolean {
  return url.match(/\.(mp3|wav|ogg)$/) != null;
}

export function isAudioFile(file: File | Blob): boolean {
  return (
    file.type === 'audio/mpeg' ||
    file.type === 'audio/wav' ||
    file.type === 'audio/ogg' ||
    file.type === 'audio/webm'
  );
}

export function isAudio(asset: string | File | Blob): boolean {
  return typeof asset === 'string' ? isAudioUrl(asset) : isAudioFile(asset);
}

export function isPdfUrl(url: string): boolean {
  return url.match(/\.(pdf)$/) != null;
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

export function isPdf(asset: string | File): boolean {
  return typeof asset === 'string' ? isPdfUrl(asset) : isPdfFile(asset);
}

export function isTextUrl(url: string): boolean {
  return url.match(/\.(txt)$/) != null;
}

export function isTextFile(file: File): boolean {
  return file.type === 'text/plain';
}

export function isTextAsset(asset: string | File): boolean {
  return typeof asset === 'string' ? isTextUrl(asset) : isTextFile(asset);
}

export function isMarkdownUrl(url: string): boolean {
  return url.match(/\.(md|mdx)$/) != null;
}

export function isMarkdownFile(file: File): boolean {
  return (
    file.type === 'text/markdown' || file.name.match(/\.(md|mdx)$/) != null
  );
}

export function isMarkdown(asset: string | File): boolean {
  return typeof asset === 'string'
    ? isMarkdownUrl(asset)
    : isMarkdownFile(asset);
}

export function isCsvUrl(url: string): boolean {
  return url.match(/\.(csv)$/) != null;
}

export function isCsvFile(file: File): boolean {
  return file.type === 'text/csv';
}

export function isCsv(asset: string | File): boolean {
  return typeof asset === 'string' ? isCsvUrl(asset) : isCsvFile(asset);
}

export function isLegacyWordDocUrl(url: string): boolean {
  return url.match(/\.(doc)$/) != null;
}

export function isWordDocUrl(url: string): boolean {
  return url.match(/\.(doc|docx)$/) != null;
}

export function isWordDocFile(file: File): boolean {
  return (
    file.type === 'application/msword' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

export function isWordDoc(asset: string | File): boolean {
  return typeof asset === 'string' ? isWordDocUrl(asset) : isWordDocFile(asset);
}

export function isExcelUrl(url: string): boolean {
  return url.match(/\.(xls|xlsx)$/) != null;
}

export function isExcelFile(file: File): boolean {
  return (
    file.type === 'application/vnd.ms-excel' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export function isExcel(asset: string | File): boolean {
  return typeof asset === 'string' ? isExcelUrl(asset) : isExcelFile(asset);
}

/**
 * Determines if a file is a Microsoft Office file, e.g. Word, Excel, etc.
 *
 * @note - Microsoft Office files can have different type designations so we account for them here, just in case, e.g. 'application/msword' or 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' for Word documents.
 *
 * @param fileType
 * @returns
 */
export function getFileTypeExtensionForMicrosoftOfficeFile(
  fileType: string,
): string {
  switch (fileType) {
    case 'msword':
    case 'application/msword':
    case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'vnd.ms-excel':
    case 'application/vnd.ms-excel':
    case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'xlsx';
    default:
      return fileType;
  }
}

/**
 * Converts a file type to an extension, e.g. 'image/jpeg' to 'jpeg'.
 *
 * @note - Takes into account Microsoft Office file types.
 *
 * @param fileType - The file type, e.g. 'image/jpeg'.
 * @returns The file extension, e.g. 'jpeg'.
 */
export function fileTypeToExtension(fileType: string): string {
  // Just in case...
  const mappedFileType = getFileTypeExtensionForMicrosoftOfficeFile(fileType);
  // Example: fileType = 'image/jpeg'
  const fileParts = mappedFileType.split('/');
  // Since the fileType is a string, we can assume that the split will always return an array of length 2 or greater
  // Since it can be greater than 2, we will only take the last element
  const fileExtension = fileParts[fileParts.length - 1];

  // Return the original fileType if the split failed
  // @note - could be that the fileType is already an extension
  if (!fileExtension) {
    return mappedFileType;
  }

  return fileExtension;
}

/**
 * Map some file types to their respective, single letter extensions.
 *
 * @note some file types have multiple extensions, e.g. 'text/x-markdown' can be '.md' or '.mdx' or even 'text/markdown' or 'text/md' or 'text/x-markdown' so we need to account for all of these as one type, e.g. 'md'.
 */
export function mapMultipleFileExtsToSingleLetterExt(fileType: string): string {
  switch (fileType) {
    case 'x-markdown':
    case 'markdown':
    case 'md':
    case 'text/x-markdown':
    case 'text/markdown':
    case 'text/md':
      return 'markdown';
    case 'application/vnd.ms-excel':
    case 'vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'xlsx':
      return 'xlsx';
    default:
      return fileType;
  }
}

/**
 * Determines if a file is a supported media file type based on its file extension and the list of accepted media file extensions.
 *
 * @param fileName - The name of the file, e.g. 'image.jpg' or 'image/jpg'.
 * @param validTypes
 * @returns
 */
export function isMediaFileSupported(
  fileName: string,
  validTypes = ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS,
): boolean {
  let fileExtension = undefined;

  // Determine file extension by splitting the file name
  if (fileName.includes('/')) {
    fileExtension = fileName.split('/').pop();
  } else if (fileName.includes('.')) {
    fileExtension = fileName.split('.').pop();
  }

  if (!fileExtension) {
    return false;
  }

  const finalFileExtension = mapMultipleFileExtsToSingleLetterExt(
    fileExtension.toLowerCase(),
  );

  return validTypes.some((type) => type.includes(finalFileExtension));
}

/**
 * Get a File's size in bytes or mega-bytes.
 *
 * @param file - The File object.
 * @returns The size of the File in bytes.
 */
export function getFileSize(file: File, inMegaBytes = false): number {
  if (inMegaBytes) {
    return file.size / (1024 * 1024);
  }

  return file.size;
}

/**
 * Get a File's size in kilo-bytes.
 *
 * @param file - The File object.
 * @returns The size of the File in kilo-bytes.
 */
export function getFileSizeInKiloBytes(file: File): number {
  return file.size / 1024;
}

/**
 * Get a File's size in gigabytes.
 *
 * @param file - The File object.
 * @returns The size of the File in gigabytes.
 */
export function getFileSizeInGigaBytes(file: File): number {
  return file.size / (1024 * 1024 * 1024);
}

/**
 * Determine a file's size in human-readable format, e.g. 1.2 MB, 500 KB, 2 GB, etc.
 *
 * @param file - The File object.
 * @param fixedAmount - The number of decimal places to round to.
 *
 * @returns The size of the File in human-readable format.
 */
export function getFileSizeInHumanReadableFormat(
  file: File,
  fixedAmount = 2,
): string {
  const fileSize = getFileSize(file);

  if (fileSize < 1024) {
    return `${fileSize} bytes`;
  }

  if (fileSize < 1024 * 1024) {
    return `${fileSize} KB`;
  }

  if (fileSize < 1024 * 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(fixedAmount)} MB`;
  }

  if (fileSize < 1024 * 1024 * 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(fixedAmount)} GB`;
  }

  return `${(fileSize / (1024 * 1024 * 1024 * 1024)).toFixed(fixedAmount)} Ginormous`;
}

/**
 * Convert certain Files of type X to a standard type, e.g 'audio/x-m4a' to 'audio/m4a' type.
 *
 * @param file - The File to convert
 * @returns The File with the correct type
 */
export function convertCertainAudioFilesToStandardType(file: File): File {
  let xFile = file as File;

  if (file.type === 'audio/x-m4a') {
    xFile = new File([file], file.name, {
      type: 'audio/m4a',
      lastModified: file.lastModified,
    });
  }
  // TODO: Add more conversions here as needed

  console.log(`xFile after conversion`, xFile);
  return xFile;
}

/**
 * Remove file extension from a file name.
 */
export function removeFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * Map raw media record to a media record with exif data.
 */
export function mapMediaRecordToMediaWithExif(photo: Record<string, any>) {
  const exif = {
    blurData: photo.blurData,
    extension: photo.extension,
    iso: photo.iso,
    make: photo.make,
    model: photo.model,
    aspectRatio: photo.aspectRatio,
    focalLength: photo.focalLength,
    focalLengthIn35MmFormat: photo.focalLength35,
    fNumber: photo.fNumber,
    exposureTime: photo.exposureTime,
    exposureCompensation: photo.exposureCompensation,
    latitude: photo.latitude,
    longitude: photo.longitude,
    filmSimulation: photo.filmSimulation,
    takenAt: photo.takenAt,
    takenAtNaive: photo.takenAtNaive,
  } as unknown as PhotoBasicExifData['exif'];

  // Iterate through the photo record to create the root-level photo object without any exif keys
  const photoAsset = {} as Record<string, any>;

  for (const key in photo) {
    if (key in exif) {
      continue;
    }

    const newKey = key as keyof typeof photo;
    photoAsset[key] = photo[newKey];
  }

  // Attach the exif data to the photo object
  photoAsset.exif = exif;

  return photoAsset as PhotoBasicExifData;
}

/**
 * Determine an image's aspect ratio based on its natural width and height.
 */
export function determineImageAspectRatio(
  imgElement: HTMLImageElement,
): number {
  return imgElement.naturalWidth / imgElement.naturalHeight;
}

/**
 * Determine a video's aspect ratio based on its natural width and height.
 */
export function determineVideoAspectRatio(
  videoElement: HTMLVideoElement,
): number {
  return videoElement.videoWidth / videoElement.videoHeight;
}

/**
 * Get 5 random media assets from the array of media assets. If the array has less than 5 media assets, return the array as is.Each media asset is an object with a 'url' property.
 */
export function getRandomMediaAssets(
  mediaAssets: PhotoBasicExifData[],
  numOfRandomItems = 5,
): PhotoBasicExifData[] {
  if (mediaAssets.length <= numOfRandomItems) {
    return mediaAssets;
  }

  const randomMediaAssets = [];
  const randomIndexes: number[] = [];

  while (randomIndexes.length < numOfRandomItems) {
    const randomIndex = Math.floor(Math.random() * mediaAssets.length);

    if (!randomIndexes.includes(randomIndex)) {
      randomIndexes.push(randomIndex);
      randomMediaAssets.push(mediaAssets[randomIndex]);
    }
  }

  return randomMediaAssets;
}

/**
 * Sort media by those that have latitude and longitude first.
 */
export function sortRawMediaByLatLong<T>(
  media: MediaModel[] | ExperienceMediaModel[],
): T {
  return media.sort((a, b) => {
    // Account for both a and b having lat and long
    if (a.latitude && a.longitude && b.latitude && b.longitude) {
      return 0;
    }

    // Account for a having lat and long
    if (a.latitude && a.longitude) {
      return -1;
    }

    // Account for b having lat and long
    if (b.latitude && b.longitude) {
      return 1;
    }

    // Account for neither having lat and long
    return 0;
  }) as unknown as T;
}

/**
 * Sort media by media type, e.g. videos first, then images, then audio, etc.
 */
export function sortRawMediaByMediaType<T>(
  media: MediaModel[] | ExperienceMediaModel[],
): T {
  return media.sort((a, b) => {
    // Account for both a and b being videos
    if (isVideo(a.urlOriginal || a.url) && isVideo(b.urlOriginal || b.url)) {
      return 0;
    }

    // Account for a being a video
    if (isVideo(a.urlOriginal || a.url)) {
      return -1;
    }

    // Account for b being a video
    if (isVideo(b.urlOriginal || b.url)) {
      return 1;
    }

    // Account for both a and b being images
    if (isImage(a.urlOriginal || a.url) && isImage(b.urlOriginal || b.url)) {
      return 0;
    }

    // Account for a being an image
    if (isImage(a.urlOriginal || a.url)) {
      return -1;
    }

    // Account for b being an image
    if (isImage(b.urlOriginal || b.url)) {
      return 1;
    }

    // Account for both a and b being audio
    if (isAudio(a.urlOriginal || a.url) && isAudio(b.urlOriginal || b.url)) {
      return 0;
    }

    // Account for a being an audio
    if (isAudio(a.urlOriginal || a.url)) {
      return -1;
    }

    // Account for b being an audio
    if (isAudio(b.urlOriginal || b.url)) {
      return 1;
    }

    // No more media types to account for for now
    return 0;
  }) as unknown as T;
}

/**
 * Sort media by the 'order' attribute in ascending or descending order.
 */
export function sortRawMediaByOrder<T>(
  media: MediaModel[] | ExperienceMediaModel[],
  ascending = true,
): T {
  if (!media || !media.length) {
    return media as unknown as T;
  }

  return media.sort((a, b) => {
    if (ascending) {
      // Account for order being null/undefined
      if (!a.order && !b.order) {
        return 0;
      }

      // Account for a.order being null/undefined
      if (!a.order) {
        return -1;
      }

      // Account for b.order being null/undefined
      if (!b.order) {
        return 1;
      }

      return a.order - b.order;
    }

    // Account for order being null/undefined
    if (!a.order && !b.order) {
      return 0;
    }

    // Account for a.order being null/undefined
    if (!a.order) {
      return 1;
    }

    // Account for b.order being null/undefined
    if (!b.order) {
      return -1;
    }

    return b.order - a.order;
  }) as unknown as T;
}

export function filterOutMediaWithTextToSpeech<T>(
  media: MediaModel[] | ExperienceMediaModel[],
): T {
  return media.filter((m) => m && !m.isTTS) as unknown as T;
}

export function sortRawMediaForGallery<T>(
  media: MediaModel[] | ExperienceMediaModel[],
  excludeAudio = true,
): T {
  if (!media || !media.length) {
    return media as unknown as T;
  }

  const sortedMedia = sortRawMediaByOrder<T>(
    sortRawMediaByMediaType(sortRawMediaByLatLong(media)),
  ) as unknown as T;

  return excludeAudio
    ? filterOutMediaWithTextToSpeech<T>(sortedMedia as ExperienceMediaModel[])
    : sortedMedia;
}

/**
 * Create File from video URL.
 */
export async function createVideoBlobFromSrcPath(
  src: string,
): Promise<Blob | undefined> {
  const file = await fetch(src).then((response) => response.blob());

  return file;
}

export async function createVideoFileFromSrcPath(
  src: string,
  fileName = 'image',
): Promise<File | undefined> {
  const blob = await createVideoBlobFromSrcPath(src);

  if (blob) {
    return new File([blob], fileName, { type: blob.type });
  }

  return undefined;
}

/**
 * Create File from a media URL, e.g. image, video, etc.
 *
 * @note - Wrapper function for createVideoFileFromSrcPath.
 */
export async function createMediaFileFromSrcPath(
  src: string,
): Promise<File | undefined> {
  return createVideoFileFromSrcPath(src);
}

/**
 * Create an createObjectURL from a video/image URL.
 */
export async function createObjectURLFromSrcPath(
  src: string,
): Promise<string | undefined> {
  const file = await createMediaFileFromSrcPath(src);

  if (file) {
    return URL.createObjectURL(file);
  }

  return undefined;
}

/**
 * Map general media to an audio media type.
 *
 * @note Loops through the media object and sets the valid media type attributes to the audio media type.
 */
export function mapGeneralMediaToAudioMedia(
  media: MediaAudio,
): MediaAudioTextToSpeech {
  const audioMedia: MediaAudioTextToSpeech = {
    id: media.id,
    // createdAt: media.createdAt,
    updatedAt: media.updatedAt,
    order: media.order,
    url: media.url,
    urlOriginal: media.urlOriginal,
    language: media.language,
    voice: media.voice,
    model: media.model,
    isTTS: media.isTTS,
    latitude: media.latitude,
    longitude: media.longitude,
    experienceId: media.experienceId,
    // userId: media.userId,
  };

  return audioMedia;
}
