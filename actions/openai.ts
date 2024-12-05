import OpenAI from 'openai';

import { type Uploadable, toFile } from 'openai/uploads';

import { getErrorMessage } from '@/lib/errors';

import { uploadFileToBlobStorage } from './file-store';

import {
  CHATGPT_4_TURBO_VISION,
  TRANSCRIPTIONS_MODEL,
} from '@/constants/chat-defaults';
import type {
  ChatCompletion,
  ChatCompletionContentPart,
} from 'openai/resources/index.mjs';

/**
 * Upload files to OpenAI
 */
export const uploadFilesToOpenAI = async (
  files: File[],
): Promise<{
  ok: boolean;
  fileIds: string[];
  error: string | null;
}> => {
  let error: string | null = null;
  let ok = false;
  const fileIds: string[] = [];

  try {
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!openAiKey) {
      throw new Error('Missing OpenAI API key');
    }

    const openai = new OpenAI({
      apiKey: openAiKey,
    });

    await Promise.all(
      files.map(async (file) => {
        const fileToUpload = await toFile(file);
        const fileResp = await openai.files.create({
          file: fileToUpload,
          purpose: 'assistants',
        });

        if (fileResp.id) {
          fileIds.push(fileResp.id);
        }
      }),
    );

    ok = true;
  } catch (err) {
    const errMsg = getErrorMessage(err);
    error = errMsg;
    console.log('OPEN AI ERROR:', {
      errMsg,
    });
  }

  return { ok, fileIds, error };
};

/**
 * Prepare a file for transcription
 *
 * @param file - The file to prepare
 *
 * @return The prepared file
 *
 */
export async function prepareFileForTranscription(
  file: File,
): Promise<Uploadable> {
  try {
    const fileToUpload = await toFile(file);
    return fileToUpload;
  } catch (err) {
    console.error('Error preparing file for transcription:', err);
    return file;
  }
}

/**
 * Get the transcription of an audio file from OpenAI
 *
 * @param formData - The form data to use for the request
 * @param file - The file to transcribe if it's not in the form data
 *
 * @returns The transcription of the audio file
 *
 * @resources
 *  - https://platform.openai.com/docs/api-reference/audio/createTranscription
 */
export const getTranscription = async (
  formData: FormData,
  file?: File,
): Promise<{
  ok: boolean;
  text: string | null;
  error: string | null;
}> => {
  let error: string | null = null;
  const ok = false;
  let text = null;

  const audioFile = (formData.get('file') || file) as Uploadable;

  if (!audioFile) {
    return {
      ok,
      text,
      error: 'No audio file provided',
    };
  }

  // https://platform.openai.com/docs/api-reference/audio/create
  try {
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!openAiKey) {
      throw new Error('Missing OpenAI API key');
    }

    // Add the model to the formData if it's not already there
    if (!formData.get('model')) {
      formData.append('model', TRANSCRIPTIONS_MODEL);
    }

    const openai = new OpenAI({
      apiKey: openAiKey,
    });

    const response = await openai.audio.transcriptions.create({
      file: await prepareFileForTranscription(audioFile as File),
      model: TRANSCRIPTIONS_MODEL,
    });

    ({ text } = response);
  } catch (err) {
    const errMsg = getErrorMessage(err);
    error = errMsg;
    console.log('OPEN AI ERROR:', {
      errMsg,
    });
  }

  return { ok, text, error };
};

/**
 * Interpret the array of File images and return the interpretted text content
 *
 * @param files - The array of File images to interpret
 * @param prompt - The prompt to use for the interpretation
 *
 * @returns The interpreted text content
 */
export const interpretFileImages = async (
  files: File[],
  prompt = 'What is the main idea of this image(s)?',
  promptConstraint = 'Be concise and clear in your response.',
  stream = false,
  model: string = CHATGPT_4_TURBO_VISION,
): Promise<{
  ok: boolean;
  text: string | null;
  error: string | null;
  imgUrls: Array<string | undefined>;
  metadata?: Record<string, any>;
}> => {
  let error: string | null = null;
  let ok = false;
  let text = null;
  let imgUrls: Array<string | undefined> = [];
  const metadata: Record<string, any> = {};

  try {
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!openAiKey) {
      throw new Error('Missing OpenAI API key');
    }

    const openai = new OpenAI({
      apiKey: openAiKey,
    });

    // First, upload the files to a storage location, e.g. Vercel
    imgUrls = (
      await Promise.all(
        files.map(async (file) => {
          const fileUploadRes = await uploadFileToBlobStorage(file);
          return fileUploadRes?.url;
        }),
      )
    )
      .flat()
      .filter(Boolean);

    if (!imgUrls.length) {
      throw new Error('No files uploaded to interpret');
    }

    const imgUrlItems = imgUrls.map((url): ChatCompletionContentPart => {
      if (!url) {
        return {
          type: 'text',
          text: '',
        };
      }

      return {
        type: 'image_url',
        image_url: {
          url,
          detail: 'auto',
        },
      };
    });

    const response = (await openai.chat.completions.create({
      model,
      stream,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${prompt}\n${promptConstraint}`,
            },
            ...imgUrlItems,
          ],
        },
      ],
    })) as ChatCompletion;

    // Grab the first choice and the content of the message
    // This is the interpreted text content
    if (response?.id) {
      const choice = response.choices[0] || [];
      const msgContent = choice?.message?.content || '';
      if (msgContent) {
        text = msgContent;
        ok = true;
      }
      // Grab the metadata
      metadata.model = response.model;
      metadata.responseId = response.id;
      metadata.created = response.created;
      metadata.usage = response.usage;
    } else {
      error = `No response from AI model`;
    }
  } catch (err) {
    const errMsg = getErrorMessage(err);
    error = errMsg;
    console.log('OPEN AI IMAGE FILE INTERPRETATION ERROR:', {
      errMsg,
    });
  }

  return { ok, text, error, imgUrls, metadata };
};
