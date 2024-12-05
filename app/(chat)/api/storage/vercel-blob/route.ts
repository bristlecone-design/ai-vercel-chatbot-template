import {
  ACCEPTED_PHOTO_FILE_TYPES,
  MAX_PHOTO_UPLOAD_SIZE_IN_BYTES,
} from '@/features/photo';
import {
  revalidateAdminPaths,
  revalidatePhotosKey,
} from '@/features/photo/cache';
import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { getUserSession } from '@/lib/session';
import { isUploadPathnameValid } from '@/lib/storage';

export async function POST(request: Request): Promise<NextResponse> {
  const body: HandleUploadBody = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getUserSession();
        if (session?.user) {
          if (isUploadPathnameValid(pathname)) {
            return {
              maximumSizeInBytes: MAX_PHOTO_UPLOAD_SIZE_IN_BYTES,
              allowedContentTypes: ACCEPTED_PHOTO_FILE_TYPES,
            };
          } else {
            throw new Error('Invalid upload');
          }
        } else {
          throw new Error('Unauthenticated upload');
        }
      },
      // This argument is required, but doesn't seem to fire
      onUploadCompleted: async () => {
        revalidatePhotosKey();
        revalidateAdminPaths();
      },
    });
    revalidatePhotosKey();
    revalidateAdminPaths();
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
