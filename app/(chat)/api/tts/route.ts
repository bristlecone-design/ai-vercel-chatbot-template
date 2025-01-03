import { textToSpeech } from '@/actions/speech';
import { NextResponse } from 'next/server';
import type { SpeechCreateParams } from 'openai/resources/audio/speech';

import { getErrorMessage } from '@/lib/errors';
import { generateTranslatedTextFromEnglish } from '@/actions/experience-prompts';

// export const revalidate = 0;

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

/**
 * Text to Speech API route
 *
 * @resource https://platform.openai.com/docs/guides/text-to-speech/quickstart
 */

type PostData = {
  save?: boolean;
  text: string; // Text to convert to speech. Assumes text is in English.
  language?: string; // Language code (Default is 'en')
  voice?: SpeechCreateParams['voice'];
  model?: SpeechCreateParams['model'];
};

export async function POST(request: Request) {
  // Inspiration: https://github.com/directus/directus/discussions/18018
  // https://developer.mozilla.org/en-US/docs/Web/API/Request#instance_properties
  try {
    const formData = await request.formData();

    // for (const pair of formData.entries()) {
    //   console.log('Form data pair entry values', pair[0], pair[1]);
    // }

    // Get file from formData to validate it's a Blob
    const text = formData.get('text') as PostData['text'];

    if (!text) {
      return NextResponse.json({ error: 'No text provided' });
    }

    const model = (formData.get('model') ?? 'tts-1-hd') as PostData['model'];
    // console.log('Text to Speech params', {
    //   text,
    //   model,
    // });
    const language = (formData.get('language') || 'en') as PostData['language'];

    const voice = (formData.get('voice') ?? 'nova') as PostData['voice'];

    let textToConvert = text;

    if (language && language !== 'en') {
      // console.log('Translating text from English');
      const { translation } = await generateTranslatedTextFromEnglish(
        text,
        language,
      );
      // console.log('Translation:', { translation });

      if (translation.translated && translation.translatedText) {
        textToConvert = translation.translatedText;
      }
    }

    return textToSpeech(textToConvert as string, model, voice);
  } catch (error) {
    console.error('Text to Speech Error:', {
      error,
    });
    const errorMsg = getErrorMessage(error);
    return NextResponse.json({ error: errorMsg });
  }
}
