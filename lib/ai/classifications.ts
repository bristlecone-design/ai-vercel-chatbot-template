import { generateObject } from 'ai';
import { openaiModel } from '.';
import type { Model } from './models';

const promptClassificationTypes = [
  {
    name: 'vision',
    purpose: 'image, file, web url, etc. recognition and processing',
  },
  {
    name: 'question',
    purpose: 'Stand-alone question, query, etc. for information retrieval',
  },
  { name: 'other', purpose: 'other, miscellaneous, etc.' },
];

// Object of prompt classification keys
const promptClassificationKeys = promptClassificationTypes.reduce(
  (acc, type) => {
    acc[type.name] = type.purpose;
    return acc;
  },
  {} as Record<string, string>,
);

const promptClassificationKeyOpts = promptClassificationTypes.map(
  (type) => type.name,
);

type promptClassificationKeyOpts = (typeof promptClassificationKeyOpts)[number];

function getClassificationKeyPurpose(
  key: promptClassificationKeyOpts,
  separatorText = 'is for',
) {
  const classification = promptClassificationTypes.find(
    (type) => type.name === key,
  );

  return classification?.purpose
    ? separatorText
      ? `${key} ${separatorText} ${classification.purpose}`
      : classification.purpose
    : '';
}

/**
 * Classify a discovery prompt as a question, vision or other - based on core product features.
 *
 * @example classifyDiscoveryPrompt('What is the capital of France?', model) => 'question'
 *
 * @note Used primarily in the root of the app to determine the type of user input.
 *
 */
export async function classifyDiscoveryPrompt(prompt: string, model: Model) {
  // https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#enum
  const { object: classification } = await generateObject({
    // fast model for classification:
    model: openaiModel(model.apiIdentifier, { structuredOutputs: true }),
    output: 'enum',
    enum: promptClassificationKeyOpts,
    system: `Classify the user message as either ${promptClassificationKeyOpts.join(', ')}. ${promptClassificationTypes.map((type) => getClassificationKeyPurpose(type.name)).join(', ')}`,
    prompt,
  });
  console.log(
    'prompt classification result',
    JSON.stringify(classification, null, 2),
  );

  const isVision = classification === 'vision';
  const isQuestion = classification === 'question';
  // const isOther = classification === 'other';

  return {
    classification,
    isVision,
    isQuestion,
    // isOther,
  };
}
