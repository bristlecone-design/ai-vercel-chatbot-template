import { del, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { StatusCodes } from 'http-status-codes';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 8 * 1024 * 1024, {
      message: 'File size should be less than 8MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/png',
          'audio/webm',
          'audio/mp3',
          'audio/ogg',
          'audio/wav',
          'audio/mpeg',
          'text/plain',
          'text/markdown',
          'application/pdf',
          'application/msword',
          'application/vnd.ms-excel',
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
          'video/mov',
        ].includes(file.type),
      {
        message: 'File type should be JPEG or PNG',
      },
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: StatusCodes.UNAUTHORIZED },
    );
  }

  if (request.body === null) {
    return new Response('Request body is empty', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: StatusCodes.BAD_REQUEST },
      );
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json(
        { error: errorMessage },
        { status: StatusCodes.BAD_REQUEST },
      );
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: StatusCodes.INTERNAL_SERVER_ERROR },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: StatusCodes.UNAUTHORIZED },
    );
  }

  const data = await request.formData();
  const url = data.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'No file/blob URL provided' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { error: 'Invalid filename' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  try {
    await del(url);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}
