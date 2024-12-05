import type OpenAI from 'openai';

// OpenAI Models Overview:
// https://platform.openai.com/docs/models/overview

// https://platform.openai.com/docs/models/gpt-4
export const CHATGPT_3_5_TURBO = 'gpt-3.5-turbo';
export const CHATGPT_3_5_TURBO_1106 = 'gpt-3.5-turbo-1106'; // https://openai.com/blog/new-models-and-developer-products-announced-at-devday
export const CHATGPT_3_5_TURBO_0125 = 'gpt-3.5-turbo-0125'; // https://openai.com/blog/new-embedding-models-and-api-updates

// https://platform.openai.com/docs/models/gpt-4-and-gpt-4-turbo
export const CHATGPT_4 = 'gpt-4';
export const CHATGPT_4_32k = 'gpt-4-32k-0613';

// https://openai.com/index/hello-gpt-4o/
// https://platform.openai.com/docs/models/gpt-4o
export const CHATGPT_4_OMNI = 'gpt-4o';

export const CHATGPT_4_TURBO = 'gpt-4-turbo'; // https://openai.com/blog/new-models-and-developer-products-announced-at-devday

export const CHATGPT_4_TURBO_VISION = 'gpt-4-vision-preview'; // https://platform.openai.com/docs/guides/vision

export const DEFAULT_CHAT_MODEL = CHATGPT_4_OMNI; // gpt-4-32k gpt-3.5-turbo

// https://docs.endpoints.anyscale.com/supported-models/mistralai-Mistral-7B-Instruct-v0.1
export const ANYSCALE_CHAT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

// https://platform.openai.com/docs/models/embeddings
// @deprecated note: 'text-embedding-ada-002' (as of Jan. 2024)
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
// export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_EMBEDDING_METRIC = 'cosine';

export const SELECTABLE_MODELS = {
  'GPT-3-5-Turbo': CHATGPT_3_5_TURBO,
  'GPT-4': DEFAULT_CHAT_MODEL,
};

// Type for the values of the above
export type SelectableModelValuesType =
  (typeof SELECTABLE_MODELS)[keyof typeof SELECTABLE_MODELS];

export const DEFAULT_CHATGPT_MAX_TOKENS = 1024;
export const VISION_CHATGPT_MAX_TOKENS = 180;

// https://platform.openai.com/docs/guides/speech-to-text
// https://platform.openai.com/docs/models/whisper
export const DEFAULT_AUDIO_MODEL = 'whisper-1';

export const COMPLETIONS_MODEL = DEFAULT_CHAT_MODEL;
export const EMBEDDINGS_MODEL = DEFAULT_EMBEDDING_MODEL;
export const TRANSCRIPTIONS_MODEL = DEFAULT_AUDIO_MODEL;

// Custom delimiter for chat responses
export const CHAT_RESPONSE_DELIMITER = '++';
// Marker for pre-list responses by the chat bot
export const CHAT_RESPONSE_PRELIST_MARKER = ':';
// New line character for chat responses
export const CHAT_RESPONSE_NEWLINE = '\n\n';
// Delimiter for pre-list responses by the chat bot
export const CHAT_RESPONSE_PRELIST_DELIMITER = `${CHAT_RESPONSE_PRELIST_MARKER}${CHAT_RESPONSE_NEWLINE}`;
// Number of response items to return
export const CHAT_RESPONSE_ITEMS_COUNT = 8;
// Number of response characters to return
export const CHAT_RESPONSE_CHARS = 680;

export const CONTEXT_DELIMITER = '|||';

/**
 * Typically, a conversation is formatted with a system message first, followed by alternating user and assistant messages.
 * The system message helps set the behavior of the assistant. In the example above, the assistant was instructed with "You are a helpful assistant."
 *
 * @see https://platform.openai.com/docs/guides/chat
 */
export const DEFAULT_CHAT_TONE =
  'I’m an AI assistant, here to help you with your curiosity. Ask me anything!';

export const COOKIE_NAME = 'app-cookie-name'; // TODO: Update with your own cookie name

// https://platform.openai.com/docs/api-reference/chat/create#chat/create-temperature

export type CreateChatCompletionRequest =
  OpenAI.Chat.ChatCompletionCreateParamsStreaming;

// https://platform.openai.com/docs/api-reference/chat/create
// https://docs.endpoints.anyscale.com/guides/function-calling
export const CHAT_COMPLETION_DEFAULTS: Pick<
  CreateChatCompletionRequest,
  | 'temperature'
  | 'max_tokens'
  | 'n'
  | 'stream'
  | 'presence_penalty'
  | 'frequency_penalty'
  | 'top_p'
  | 'model'
> = {
  model: DEFAULT_CHAT_MODEL,
  // model: ANYSCALE_CHAT_MODEL,
  temperature: 0.01,
  max_tokens: DEFAULT_CHATGPT_MAX_TOKENS,
  top_p: undefined,
  frequency_penalty: 0,
  presence_penalty: 0,
  stream: true,
};
