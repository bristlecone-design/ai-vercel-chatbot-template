'use server';

import OpenAI from 'openai';
import type { SpeechCreateParams } from 'openai/resources/audio/speech';

export async function textToSpeech(
  text = '',
  model: SpeechCreateParams['model'] = 'tts-1',
  voice: SpeechCreateParams['voice'] = 'nova',
) {
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const openai = new OpenAI({
    apiKey: openAiKey,
  });

  const response = await openai.audio.speech.create({
    model,
    voice,
    input: text,
  });

  return new Response(response.body, {
    headers: {
      'Content-Type': response.type,
    },
  });
}
