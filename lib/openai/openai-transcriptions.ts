'use server';

import { TRANSCRIPTIONS_MODEL } from '@/constants/chat-defaults';
import { toFile } from 'openai';
import type { FileLike } from 'openai/uploads.mjs';
import { getErrorMessage } from '../errors';
import { createOpenAI } from './openai-core';

/**
 * Transcription of the audio file
 */
export async function transcribeAudio(
  file: File | Blob | FileLike,
  model = TRANSCRIPTIONS_MODEL,
) {
  try {
    const openai = createOpenAI();
    const response = await openai.audio.transcriptions.create({
      file: await toFile(file),
      model,
    });

    const { text } = response;
    return { transcribed: true, error: '', text };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error transcribing audio', error);
    return {
      transcribed: false,
      error: errMsg,
      text: errMsg,
    };
  }
}
