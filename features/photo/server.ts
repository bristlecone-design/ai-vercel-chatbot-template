'use server';

import { determineHeight } from '@/lib/images';
import { getExtensionFromStorageUrl, getIdFromStorageUrl } from '@/lib/storage';
import type { PhotoBasicExifData, PhotoFormData } from '@/types/photo';
import sharp, { type Sharp } from 'sharp';
import { type ExifData, ExifParserFactory } from 'ts-exif-parser';
import type { FilmSimulation } from '../simulation';
import { convertExifToFormData } from './form';
import {
  getFujifilmSimulationFromMakerNote,
  isExifForFujifilm,
} from './vendors/fujifilm';

const IMAGE_WIDTH_RESIZE = 200;
const IMAGE_WIDTH_BLUR = 200;
const IMAGE_THUMBNAIL_WIDTH = 48;

export const extractImageDataFromBlobPath = async (
  blobPath: string,
  options?: {
    includeInitialPhotoFields?: boolean;
    generateBlurData?: boolean;
    generateResizedImage?: boolean;
  },
): Promise<{
  blobId?: string;
  photoFormExif?: Partial<PhotoFormData>;
  imageResizedBase64?: string;
}> => {
  const { includeInitialPhotoFields, generateBlurData, generateResizedImage } =
    options ?? {};

  const url = decodeURIComponent(blobPath);

  const blobId = getIdFromStorageUrl(url);

  const extension = getExtensionFromStorageUrl(url);

  const fileBytes = blobPath
    ? await fetch(url).then((res) => res.arrayBuffer())
    : undefined;

  let exifData: ExifData | undefined;
  let filmSimulation: FilmSimulation | undefined;
  let blurData: string | undefined;
  let imageResizedBase64: string | undefined;

  if (fileBytes) {
    const parser = ExifParserFactory.create(Buffer.from(fileBytes));

    // Data for form
    parser.enableBinaryFields(false);
    exifData = parser.parse();

    // Capture film simulation for Fujifilm cameras
    if (isExifForFujifilm(exifData)) {
      // Parse exif data again with binary fields
      // in order to access MakerNote tag
      parser.enableBinaryFields(true);
      const exifDataBinary = parser.parse();
      const makerNote = exifDataBinary.tags?.MakerNote;
      if (Buffer.isBuffer(makerNote)) {
        filmSimulation = getFujifilmSimulationFromMakerNote(makerNote);
      }
    }

    if (generateBlurData) {
      blurData = await blurImage(fileBytes);
    }

    if (generateResizedImage) {
      imageResizedBase64 = await resizeImage(fileBytes);
    }
  }

  return {
    blobId,
    ...(exifData && {
      photoFormExif: {
        ...(includeInitialPhotoFields && {
          hidden: 'false',
          favorite: 'false',
          extension,
          url,
        }),
        ...(generateBlurData && { blurData }),
        ...convertExifToFormData(exifData, filmSimulation),
      },
    }),
    imageResizedBase64,
  };
};

export const getImageBasicExifDataFromBlob = async (
  blobPath: string,
  options?: {
    generateBlurData?: boolean;
    generateThumbnail?: boolean;
    thumbnailWidthSize?: number;
  },
): Promise<PhotoBasicExifData | undefined> => {
  try {
    const {
      generateBlurData,
      generateThumbnail,
      thumbnailWidthSize = IMAGE_THUMBNAIL_WIDTH,
    } = options ?? {};

    let metadata: sharp.Metadata | undefined;

    const url = decodeURIComponent(blobPath);

    const blobId = getIdFromStorageUrl(url);

    const extension = getExtensionFromStorageUrl(url);

    const fileBytes = blobPath
      ? await fetch(url).then((res) => res.arrayBuffer())
      : undefined;

    let exifData: ExifData | undefined;
    let filmSimulation: FilmSimulation | undefined;
    let blurData: string | undefined;
    let imageResizedBase64: string | undefined;
    let imageThumbnailBase64: string | undefined;
    let imageThumbnailHeight: string | number | undefined;

    if (fileBytes) {
      // try {
      //   metadata = await sharp(Buffer.from(fileBytes)).metadata();
      // } catch (error) {
      //   console.error(`Error in getting sharp metadata for url ${url}`, error);
      // }

      const parser = ExifParserFactory.create(Buffer.from(fileBytes));

      // Data for form
      parser.enableBinaryFields(false);
      exifData = parser.parse();

      // Capture film swimulation for Fujifilm cameras
      if (isExifForFujifilm(exifData)) {
        // Parse exif data again with binary fields
        // in order to access MakerNote tag
        parser.enableBinaryFields(true);
        const exifDataBinary = parser.parse();
        const makerNote = exifDataBinary.tags?.MakerNote;
        if (Buffer.isBuffer(makerNote)) {
          filmSimulation = getFujifilmSimulationFromMakerNote(makerNote);
        }
      }

      if (generateBlurData) {
        blurData = await blurImage(fileBytes);
      }

      if (generateThumbnail) {
        imageThumbnailBase64 = await resizeImageToThumbnail(
          fileBytes,
          thumbnailWidthSize,
        );
      }
    }

    // Extract exif data
    let exif;

    if (exifData) {
      exif = {
        ...convertExifToFormData(exifData, filmSimulation),
      } as unknown as PhotoBasicExifData['exif'];

      // Get the height dynamically
      if (exif.aspectRatio && imageThumbnailBase64) {
        imageThumbnailHeight = determineHeight(
          thumbnailWidthSize,
          exif.aspectRatio,
        );
      }
    }

    const photoProps = {
      blobId,
      extension,
      blurData,
      exif,
      imageResizedBase64,
      metadata,
      thumbnail: {
        path: imageThumbnailBase64,
        width: String(thumbnailWidthSize),
        height: String(imageThumbnailHeight),
      },
    } as PhotoBasicExifData;

    return photoProps as PhotoBasicExifData;
  } catch (error) {
    console.error(`Error in getImageBasicExifDataFromBlob`, error);
    return undefined;
  }
};

export const getImageThumbnailBase64 = async (
  srcUrl: string,
  thumbnailWidthSize = IMAGE_THUMBNAIL_WIDTH,
  aspectRatio?: number,
) => {
  const fileBytes = srcUrl
    ? await fetch(srcUrl).then((res) => res.arrayBuffer())
    : undefined;

  let imageThumbnailBase64: string | undefined;
  let imageThumbnailHeight: string | number | undefined;

  if (fileBytes) {
    imageThumbnailBase64 = await resizeImageToThumbnail(
      fileBytes,
      thumbnailWidthSize,
    );

    if (aspectRatio && imageThumbnailBase64) {
      imageThumbnailHeight = determineHeight(thumbnailWidthSize, aspectRatio);
    }
  }

  if (!imageThumbnailBase64) {
    return undefined;
  }

  return {
    path: imageThumbnailBase64,
    width: String(thumbnailWidthSize),
    height: String(imageThumbnailHeight),
  };
};

const generateBase64 = async (
  image: ArrayBuffer,
  middleware: (sharp: Sharp) => Sharp,
) => {
  try {
    return middleware(sharp(image))
      .toFormat('jpeg', { quality: 90 })
      .toBuffer()
      .then((data) => `data:image/jpeg;base64,${data.toString('base64')}`);
  } catch (error) {
    console.error(`Error in generateBase64`, error);
    return '';
  }
};

export const resizeImage = async (
  image: ArrayBuffer,
  width = IMAGE_WIDTH_RESIZE,
) => generateBase64(image, (sharp) => sharp.resize(width));

export const resizeImageToThumbnail = async (
  image: ArrayBuffer,
  width = IMAGE_THUMBNAIL_WIDTH,
) => generateBase64(image, (sharp) => sharp.resize(width));

export const blurImage = async (image: ArrayBuffer) =>
  generateBase64(image, (sharp) =>
    sharp.resize(IMAGE_WIDTH_BLUR).modulate({ saturation: 1.15 }).blur(4),
  );

export const resizeImageFromUrl = async (url: string) =>
  fetch(decodeURIComponent(url))
    .then((res) => res.arrayBuffer())
    .then((buffer) => resizeImage(buffer));

export const blurImageFromUrl = async (url: string) =>
  fetch(decodeURIComponent(url))
    .then((res) => res.arrayBuffer())
    .then((buffer) => blurImage(buffer));
