import {
  type ResourceContentHashParams,
  resourceContentHashSchema,
} from '@/types/resource-embeddings';
import { md5 } from 'js-md5';
import { z } from 'zod';
import { getErrorMessage } from './errors';

export const generateChunks = (input: string, splitChar = '\n'): string[] => {
  return input
    .trim()
    .split(splitChar)
    .filter((i) => i !== '');
};

/**
 * Create a unique concatenated content value for a resource's embed content column
 */
export const generateResourceContent = (
  props: ResourceContentHashParams,
): string => {
  try {
    const { content, userId, title, url, note } = props || {};

    const propsValid = resourceContentHashSchema.safeParse(props);

    if (!propsValid.success) {
      const errMsg = propsValid.error.issues
        .map((e) => `${e.path}: ${e.message}`)
        .join(', ');
      throw new Error(errMsg);
    }

    const propList = [content, userId, title, note, url].filter((i) => i);

    // Concatenate all the properties
    let seed = '';
    for (const i in propList) {
      seed += propList[i];
    }

    return seed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(`Resource content schema issues: ${error.issues}`);
      return '';
    }
    const errMsg = getErrorMessage(error);
    console.error('Error generating resource content:', errMsg);
    return '';
  }
};

/**
 * Hash existing content for a resource
 */
export const hashExistingContent = (content: string) => {
  return md5(content);
};

/**
 * Hash the content of a resource to create a unique identifier
 *
 */
export const generateResourceContentHash = (
  props: ResourceContentHashParams,
): {
  hash: string;
  seed: string;
} => {
  const seed = generateResourceContent(props);
  const hash = hashExistingContent(seed);
  return { hash, seed };
};
