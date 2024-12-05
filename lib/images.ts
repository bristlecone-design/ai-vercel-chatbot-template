import { getBaseUrl } from '@/lib/getBaseUrl';

export const DEFAULT_NUM_OF_IMGS_TO_ATTACH = 1;

export const MEDIA_FILE_TYPES = [
  // Images
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  // Video
  'video/mp4',
  'video/mov',
  'video/quicktime',
  'video/webm',
  // PDF
  'application/pdf',
  // Word/Docs
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Excel & CSV
  'application/vnd.ms-excel',
  'text/csv',
  // Text
  'text/plain',
  // Webpage
  'text/html',
] as const;

export const ACCEPTED_IMAGE_TYPES = [
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  // 'image/webp',
];

export const ACCEPTED_IMAGE_FILE_EXTENSIONS = ACCEPTED_IMAGE_TYPES.map((type) =>
  type.split('/').pop(),
);

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/quicktime',
  // 'video/webm',
];

export const ACCEPTED_SIMPLE_DOCUMENT_TYPES = [
  // PDF
  'application/pdf',
  // Word/Docs
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // CSV
  'text/csv',
  // Text
  'text/plain',
  // Excel
  // 'application/vnd.ms-excel',
  // 'application/xlsx',
  // Markdown
  // @see @mapMultipleExtensionsToSingleLetterExtensions
  // This will map 'text/markdown' to 'text/md'
  'text/markdown',
];

export const ACCEPTED_SIMPLE_DOCUMENT_TYPES_FILE_EXTENSIONS =
  ACCEPTED_SIMPLE_DOCUMENT_TYPES.map((type) =>
    type.split('/').pop(),
  ) as string[];

export const ACCEPTED_DOCUMENT_TYPES = [
  ...ACCEPTED_SIMPLE_DOCUMENT_TYPES,
  // Audio
  // 'audio/mp3',
  // 'audio/ogg',
  // 'audio/wav',
  'audio/x-m4a',
  'audio/mpeg',
];

export const ACCEPTED_INGEST_CONTENT_MEDIA_TYPES = [
  ...ACCEPTED_DOCUMENT_TYPES,
  // Webpage
  'text/html',
  // Images
  ...ACCEPTED_IMAGE_TYPES,
];

export const ACCEPTED_INGEST_SIMPLE_CONTENT_MEDIA_TYPES = [
  ...ACCEPTED_SIMPLE_DOCUMENT_TYPES,
  // Webpage
  'text/html',
];

export const ACCCEPTED_INGEST_CONTENT_MEDIA_FILE_EXTENSIONS =
  ACCEPTED_INGEST_CONTENT_MEDIA_TYPES.map((type) =>
    type.split('/').pop(),
  ) as string[];

export const ACCEPTED_VIDEO_FILE_EXTENSIONS = ACCEPTED_VIDEO_TYPES.map((type) =>
  type.split('/').pop(),
);

export const ACCEPTED_MEDIA_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
  ...ACCEPTED_DOCUMENT_TYPES,
];

export const ACCEPTED_IMG_VIDEO_MEDIA_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
];

export const ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS = ACCEPTED_MEDIA_TYPES.map(
  (type) => type.split('/').pop(),
).filter(Boolean) as string[];

export const ACCEPTED_IMG_VIDEO_TYPE_FILE_EXTENSIONS =
  ACCEPTED_IMG_VIDEO_MEDIA_TYPES.map((type) => type.split('/').pop()).filter(
    Boolean,
  ) as string[];

export const ACCEPTED_IMAGE_AND_DOCUMENT_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_DOCUMENT_TYPES,
];

export const ACCEPTED_IMAGE_AND_DOCUMENT_FILE_EXTENSIONS =
  ACCEPTED_IMAGE_AND_DOCUMENT_TYPES.map((type) => type.split('/').pop()).filter(
    Boolean,
  ) as string[];

// Explicity defined next.config.js `imageSizes`
type NextCustomSize = 200 | 400 | 1050;
type NextImageDeviceSize =
  | 640
  | 720
  | 750
  | 828
  | 920
  | 1080
  | 1200
  | 1920
  | 2048
  | 3840;

export type NextImageSize = NextCustomSize | NextImageDeviceSize;

// Size in pixels for the largest image (width)
export const MAX_IMAGE_SIZE: NextImageSize = 3840;

export const getNextImageUrlForRequest = (
  imageUrl: string,
  size: NextImageSize,
  quality = 75,
  baseUrl = getBaseUrl(),
) => {
  const url = new URL(`${baseUrl}/_next/image`);

  url.searchParams.append('url', imageUrl);
  url.searchParams.append('w', size.toString());
  url.searchParams.append('q', quality.toString());

  return url.toString();
};

export async function createImageBlobFromSrcPath(
  src: string,
): Promise<Blob | undefined> {
  const file = await fetch(src).then((response) => response.blob());

  return file;
}

export async function createImageFileFromSrcPath(
  src: string,
  fileName = 'image',
): Promise<File | undefined> {
  const blob = await createImageBlobFromSrcPath(src);

  if (blob) {
    return new File([blob], fileName, { type: blob.type });
  }

  return undefined;
}

// Assume 'blob' is your image blob data. For example, from an input file element or fetched from a server.
export async function getImageDimensions(blob: Blob): Promise<
  | {
      width: number;
      height: number;
    }
  | undefined
> {
  return new Promise((resolve, reject) => {
    // Step 1: Create a new FileReader object
    const reader = new FileReader();

    // Step 2: Define the FileReader onload event
    reader.onload = (event) => {
      // Step 3: Create a new Image object
      const img = new Image();

      // Step 4: Define the Image onload event
      img.onload = () => {
        // The image is now loaded; its size can be read
        const width = img.width;
        const height = img.height;
        resolve({ width, height });
      };

      // Handle error in image loading
      img.onerror = () => {
        reject(new Error('There was an error loading the image.'));
      };

      // Step 5: Set the Image object's src to the data URL of the blob
      img.src = (event?.target?.result || '') as string;
    };

    // Handle error in FileReader
    reader.onerror = () => {
      reject(new Error('There was an error reading the blob.'));
    };

    // Step 6: Start reading the blob as a data URL
    reader.readAsDataURL(blob);
  });
}

/**
 * Determine if an image is landscape or portrait based on its dimensions
 */
export function isLandscape(width: number, height: number) {
  return width > height;
}
export function isPortrait(width: number, height: number) {
  return height > width;
}

/**
 * Determine if a media file is wide screen based on its aspect ratio
 */
export function isHorizontalWideScreen(width: number, height: number) {
  return width / height > 1.5;
}

export function isVerticalWideScreen(width: number, height: number) {
  return height / width > 1.5;
}

export function isWideScreen(width: number, height: number) {
  return (
    isHorizontalWideScreen(width, height) || isVerticalWideScreen(width, height)
  );
}

export function isImageTypeSupported(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

export function isVideoTypeSupported(file: File) {
  return ACCEPTED_VIDEO_TYPES.includes(file.type);
}

export function isMediaTypeSupported(file: File) {
  return ACCEPTED_MEDIA_TYPES.includes(file.type);
}

export function isMediaAnImagePerFileTypeExtension(fileName: string): boolean {
  const fileExtension = fileName.split('.').pop();

  if (!fileExtension) {
    return false;
  }

  return (
    ACCEPTED_IMAGE_FILE_EXTENSIONS.includes(fileExtension.toLowerCase()) ||
    ACCEPTED_IMAGE_TYPES.includes(fileExtension.toLowerCase())
  );
}

export function isMediaAnImagePerBase64String(fileName = ''): boolean {
  return fileName.startsWith('data:image');
}

export function isMediaFilePathAnImage(fileName = ''): boolean {
  return (
    isMediaAnImagePerFileTypeExtension(fileName) ||
    isMediaAnImagePerBase64String(fileName)
  );
}

export function isMediaAVideoPerFileTypeExtension(fileName: string): boolean {
  const fileExtension = fileName.split('.').pop();

  if (!fileExtension) {
    return false;
  }

  return (
    ACCEPTED_VIDEO_FILE_EXTENSIONS.includes(fileExtension.toLowerCase()) ||
    ACCEPTED_VIDEO_TYPES.includes(fileExtension.toLowerCase())
  );
}

export function isMediaAVideoPerBase64String(fileName = ''): boolean {
  return fileName.startsWith('data:video');
}

export function isMediaFilePathAVideo(fileName = ''): boolean {
  return (
    isMediaAVideoPerFileTypeExtension(fileName) ||
    isMediaAVideoPerBase64String(fileName)
  );
}

export function isBase64String(path: string) {
  return path ? path.startsWith('data:') : false;
}

export const removeBase64Prefix = (base64: string) => {
  return base64.match(/^data:image\/[a-z]{3,4};base64,(.+)$/)?.[1] ?? base64;
};

export function isExternalImageUrl(url: string) {
  return url.startsWith('http');
}

export async function getFileDataAsBase64(
  file: File,
  cb?: (base64String: string) => void,
): Promise<string | null | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      resolve(base64String);
      if (cb) {
        cb(base64String);
      }
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 media string to a Blob and Object URL for previewing the media on the client
 * @param base64String - e.g. 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
 * @param mediaType - e.g. 'image/png' - The media type of the base64 string, optional, otherwise it will be inferred from the base64 string
 *
 * @returns objectUrl - The Object URL for the Blob
 */
export function setBase64MediaStringToBlobAndObjectUrl(
  base64String = '',
  mediaType?: string,
) {
  let objectUrl: string | undefined = undefined;

  if (base64String.startsWith('data:')) {
    const binaryString = Buffer.from(base64String, 'base64');
    const blob = new Blob([binaryString], { type: mediaType });
    objectUrl = URL.createObjectURL(blob);
  }

  return objectUrl;
}

/**
 * Sets a file blob or blob to an Object URL for previewing the media on the client. If the file blob is undefined, then it will return undefined.
 *
 * @param fileBlob - The file blob to convert to an Object URL.
 * @note - Can be a File or Blob
 *
 * @returns objectUrl - The Object URL for the Blob
 */
export function setFileBlobToObjectUrl(
  fileBlob: File | Blob | undefined = undefined,
) {
  let objectUrl: string | undefined = undefined;

  if (fileBlob) {
    objectUrl = URL.createObjectURL(fileBlob);
  }

  return objectUrl;
}

/**
 * Blob to base64 string
 *
 * @param blob - The Blob to convert to a base64 string
 * @returns base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Blob to image
 *
 * @param blob - The Blob to convert to an image
 */
export const blobToImage = (blob: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject('Error reading image');

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject('Error reading image');
    reader.onload = (e) => {
      const result = (e.currentTarget as any).result as string;
      image.src = result;
    };

    reader.readAsDataURL(blob);
  });

/**
 * Base64 string to blob. Uses `atob` to convert the base64 string to a Blob
 *
 * @param base64String - e.g. 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
 * @param contentType - e.g. 'image/png'
 * @returns Blob
 */
export function base64ToBlob(base64String: string, contentType = '') {
  const byteCharacters = atob(base64String);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  const byteArray = new Uint8Array(byteArrays);
  return new Blob([byteArray], { type: contentType });
}

/**
 * File to Blob
 */
export function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type });
}

/**
 * Base64 string to File. Uses `atob` to convert the base64 string to a Blob and then creates a File
 */
export async function base64ToFile(
  base64String: string,
  fileName = '',
  contentType = '',
) {
  const blob = await base64ToBlobWithFetch(base64String);
  return blob
    ? new File([blob], fileName, { type: blob.type || contentType })
    : null;
}

/**
 * Base64 string to blob with fetch.
 *
 * @note - This is an alternative to `@base64ToBlob`
 * @param base64String
 * @returns Blob | undefined
 */
export async function base64ToBlobWithFetch(
  base64String: string,
): Promise<Blob | null> {
  if (isBase64String(base64String)) {
    return fetch(base64String).then((res) => res.blob());
  }
  return null;
}

/**
 * Save a Blob as a text file
 *
 * @param blob - The Blob to save
 * @param fileName - The name of the file to save as
 */
export function saveBlobAsTextFile(blob: Blob, fileName: string) {
  if (!blob) {
    return;
  }

  const link = document.createElement('a');
  const objUrl = setFileBlobToObjectUrl(blob);

  if (objUrl) {
    link.href = objUrl;
    link.download = fileName;
    link.click();
  }
}

/**
 * Determine the height of an image based on its width and aspect ratio
 *
 * @param width
 * @param aspectRatio
 * @returns height
 */
export function determineHeight(width: number, aspectRatio: number) {
  return Math.round(width / aspectRatio);
}

/**
 * Utilities to use for blurring images w/Next.js Image component
 *
 * @see https://nextjs.org/docs/pages/api-reference/components/image#blurdataurl
 * @see https://github.com/vercel/next.js/blob/canary/examples/image-component/app/color/page.tsx
 */
// Pixel GIF code adapted from https://stackoverflow.com/a/33919020/266535
const keyStr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const triplet = (e1: number, e2: number, e3: number) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63);

export const rgbDataURL = (r: number, g: number, b: number) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;
