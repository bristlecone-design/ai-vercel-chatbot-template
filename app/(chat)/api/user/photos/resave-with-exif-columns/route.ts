import { NextResponse, type NextRequest } from 'next/server';
import { getImageBasicExifDataFromBlob } from '@/photo/server';
import { head } from '@vercel/blob';

import { getErrorMessage } from '@/lib/errors';
import {
  getNextImageUrlForManipulation,
  type NextImageSize,
} from '@/lib/next-image';
import prisma from '@/lib/prisma/client';

// export const runtime = 'nodejs';

export { handler as POST };

type PostParams = {};

/**
 * Handles resaving user photos with EXIF columns
 *
 * @note - this will help to ensure that the EXIF columns are properly set and don't need to be reprocessed on the client or server each time the photo is accessed
 */
const handler = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as PostParams;

    const allFeaturedImgs = await prisma.media.findMany({
      where: {
        featured: true,
        // urlOriginal: { equals: null },
      },
    });

    console.log(`**** allFeaturedImgs count: ${allFeaturedImgs.length}`);

    if (!allFeaturedImgs.length) {
      throw new Error('No featured images to resave found');
    }

    // const subsetFeaturedImgs = allFeaturedImgs.slice(0, 2);

    // Next, resave each image to ensure that the EXIF columns are set
    const resavePromises = await Promise.all(
      allFeaturedImgs.map(async (img) => {
        console.log(`**** Resaving image with ID ${img.id} and URL ${img.url}`);
        const assetWithExif = await getImageBasicExifDataFromBlob(img.url, {
          generateBlurData: true,
          generateThumbnail: false,
        });

        const { blobId, urlDownload, urlOriginal } = img;

        let downloadableUrl = urlDownload;
        const originalUrl = urlOriginal;

        const { extension, metadata, exif, blurData } = assetWithExif || {};

        const {
          iso,
          make,
          model,
          aspectRatio,
          focalLength,
          focalLengthIn35MmFormat,
          fNumber,
          exposureTime,
          exposureCompensation,
          latitude,
          longitude,
          filmSimulation,
          takenAt,
          takenAtNaive,
        } = exif || {};
        console.log(`**** Resaving URL ${img.url} with ID ${img.id}`);

        let newUrlWidth: NextImageSize = 2048;

        const { width: metaWidth = newUrlWidth } = metadata || {};
        // console.log(
        //   `**** Resaving image based on metadata width of: ${metaWidth}`,
        //   metadata
        // );

        if (metaWidth && metaWidth !== newUrlWidth) {
          if (metaWidth >= 3840) {
            newUrlWidth = 3840;
          } else if (metaWidth >= 2048) {
            newUrlWidth = 2048;
          } else if (metaWidth >= 1920) {
            newUrlWidth = 1920;
          } else if (metaWidth >= 1200) {
            newUrlWidth = 1200;
          } else if (metaWidth >= 1080) {
            newUrlWidth = 1080;
          } else if (metaWidth >= 828) {
            newUrlWidth = 828;
          } else if (metaWidth >= 750) {
            newUrlWidth = 750;
          } else if (metaWidth >= 640) {
            newUrlWidth = 640;
          }
        }
        console.log(`**** final newUrlWidth: ${newUrlWidth}`);

        // Get the original and optimized URLs
        // First part is to fix some bad URLs from an earlier bug
        const existingOriginalUrlParams =
          img.urlOriginal && img.urlOriginal.split('?').length
            ? img.urlOriginal.split('?')[1]
            : '';

        const searchParams = existingOriginalUrlParams
          ? new URLSearchParams(decodeURIComponent(existingOriginalUrlParams))
          : new URLSearchParams();

        const existingOriginalUrl = searchParams.has('url')
          ? searchParams.get('url')
          : originalUrl;

        const optimizedUrl = getNextImageUrlForManipulation(
          existingOriginalUrl || img.url,
          newUrlWidth,
          85,
          'https://experience.nv.guide'
        );

        // Get the blobId from Vercel and the downloadable URL
        if (!downloadableUrl && existingOriginalUrl) {
          console.log(
            `***** getting downloadableUrl for URL: ${existingOriginalUrl} for userId: ${img.userId}`
          );
          try {
            const blobResult = await head(existingOriginalUrl);
            if (blobResult?.downloadUrl) {
              downloadableUrl = blobResult.downloadUrl;
            }
          } catch (error) {
            console.log(
              `***** Error getting downloadableUrl for URL: ${existingOriginalUrl} for userId: ${img.userId}`,
              error
            );
          }
        }

        // Save the blob to the same URL to trigger the EXIF columns to be set
        const resaveRes = await prisma.media.update({
          where: { id: img.id },
          data: {
            url: optimizedUrl,
            urlOriginal: existingOriginalUrl,
            urlDownload: downloadableUrl || undefined,
            extension: extension || undefined,
            blurData: blurData || undefined,
            iso: iso ? Number(iso) : undefined,
            make: make || undefined,
            model: model || undefined,
            aspectRatio: aspectRatio ? Number(aspectRatio) : undefined,
            focalLength: focalLength ? String(focalLength) : undefined,
            focalLength35: focalLengthIn35MmFormat
              ? String(focalLengthIn35MmFormat)
              : undefined,
            fNumber: fNumber ? Number(fNumber) : undefined,
            exposureTime: exposureTime ? String(exposureTime) : undefined,
            exposureCompensation: exposureCompensation
              ? String(exposureCompensation)
              : undefined,
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
            filmSimulation: filmSimulation || undefined,
            takenAt: takenAt ? new Date(takenAt) : undefined,
            takenAtNaive: takenAtNaive ? takenAtNaive : undefined,
          },
        });
        console.log(`**** Resave result:`, resaveRes);

        return resaveRes;
      })
    );

    const resavedItems = resavePromises.flat().filter(Boolean);

    return NextResponse.json({
      resavedItemsCount: resavedItems.length,
      resavedItemsUrls: resavedItems.map((res) => res?.url),
      resavedItems: resavedItems,
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    const baseErrMsg = 'Failed to resave user photos with EXIF columns';
    console.log(baseErrMsg, error);
    return new Response(`${baseErrMsg}: ${errMsg}`, {
      status: 500,
      statusText: `Internal Server Error: ${baseErrMsg}: ${errMsg}`,
    });
  }
};
