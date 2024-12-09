import type { BASE_RECORD_IMAGE_DOCUMENT } from '@/lib/pinecone-langchain/metadata';
import { type WorkerOptions, createWorker } from 'tesseract.js';

/**
 * Parse text from an image file using OCR, specifically, Tesseract.js
 *
 * @see https://github.com/naptha/tesseract.js
 */

const DEFAULT_OPTS = {
  workerPath: './node_modules/tesseract.js/src/worker-script/node/index.js',
};

export async function parseOcrTextFromImageFile(
  file: File,
  lang = 'eng',
  useOem = 1,
  opts: Partial<WorkerOptions> = {},
) {
  const worker = await createWorker(lang, useOem, {
    ...DEFAULT_OPTS,
    ...opts,
  });
  const buffer = await file.arrayBuffer().then((buffer) => {
    return Buffer.from(buffer);
  });

  const {
    data: { text },
  } = await worker.recognize(buffer);

  await worker.terminate();

  return text;
}

/**
 * Parse text from a list of image files using OCR, specifically, Tesseract.js
 *
 * @see @generateImagesFromPdf for generating images from PDF files
 *
 * @param files - The list of image files to parse text from
 * @param lang - The language to use when parsing the text, e.g. 'eng'
 * @param useOem - The OCR Engine Mode to use, e.g. 1
 * @param opts - The options to use when creating the Tessaract worker
 * @returns The list of OCR text parsed from the image files
 */
export async function parseOcrTextFromImageFileList(
  files: File[],
  lang = 'eng',
  useOem = 1,
  opts: Partial<WorkerOptions> = {},
) {
  const worker = await createWorker(lang, useOem, {
    ...DEFAULT_OPTS,
    ...opts,
  });

  const ocrTextList = [];

  for (const file of files) {
    const buffer = await file.arrayBuffer().then((buffer) => {
      return Buffer.from(buffer);
    });

    const {
      data: { text },
    } = await worker.recognize(buffer);
    ocrTextList.push(text);
  }
  await worker.terminate();

  return ocrTextList;
}

/**
 * Generate a list of standard Documents from a list of image files
 *
 * @note this assumes that the Files are of image type, e.g. image/png, image/jpeg, etc.
 *
 * @note if you need images from a PDF file, use @generateImagesFromPdf
 *
 * @see also @generateDocumentsFromPdfOcrFile which runs through the entire process of generating images from a PDF file and then parsing the text from the images to generate documents
 *
 * @param files - The list of image files to generate documents from
 * @returns
 */
export async function generateDocumentsFromImageOcrTextList(
  files: File | File[],
): Promise<BASE_RECORD_IMAGE_DOCUMENT[]> {
  const filesList = Array.isArray(files) ? files : [files];
  const ocrTextList = await parseOcrTextFromImageFileList(filesList);

  return ocrTextList.map((text, index): BASE_RECORD_IMAGE_DOCUMENT => {
    return {
      pageContent: text,
      metadata: {
        title: filesList[index].name,
        source: 'file',
        sourceType: 'img',
      } as BASE_RECORD_IMAGE_DOCUMENT['metadata'],
    };
  });
}
