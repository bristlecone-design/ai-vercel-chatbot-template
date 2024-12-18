import { NextResponse } from 'next/server';

import { getErrorMessage } from '@/lib/errors';

import { TRANSCRIPTIONS_MODEL } from '@/constants/chat-defaults';
import { transcribeAudio } from '@/lib/openai/openai-transcriptions';

export const runtime = 'edge';

/**
 * Resources
 * - https://platform.openai.com/docs/api-reference/audio/createTranscription
 * - https://github.com/zahidkhawaja/whisper-nextjs/blob/main/pages/index.js
 * - https://jsfiddle.net/f06exuow/
 */

export async function POST(request: Request) {
  // Inspiration: https://github.com/directus/directus/discussions/18018
  // https://developer.mozilla.org/en-US/docs/Web/API/Request#instance_properties
  try {
    const formData = await request.formData();

    // Get file from formData to validate it's a Blob
    const fileData = formData.get('file');

    // If our file is not a Blob or File, throw
    if (!(fileData instanceof Blob)) {
      throw new Error('Invalid file type');
    }

    if (!(fileData instanceof File)) {
      throw new Error('Invalid file type');
    }

    const model = (formData.get('model') as string) || TRANSCRIPTIONS_MODEL;
    const file = fileData as File;

    const {
      error,
      transcribed,
      text: tanscription,
    } = await transcribeAudio(file, model);

    if (transcribed && tanscription) {
      return NextResponse.json({
        tanscription,
        transcribed: Boolean(tanscription),
      });
    }

    throw new Error(`Error transcribing audio: ${error}`);
  } catch (error) {
    const errorMsg = getErrorMessage(error);
    console.error(errorMsg);
    return NextResponse.json({ error: errorMsg });
  }
}
