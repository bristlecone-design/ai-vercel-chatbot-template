import { createClient } from '@vercel/kv';
import type {
  LanguageModelV1,
  Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
  LanguageModelV1StreamPart,
} from 'ai';
import { simulateReadableStream } from 'ai/test';
import { md5 } from 'js-md5';

/**
 * A cache middleware for the language model.
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/middleware
 * @see https://sdk.vercel.ai/cookbook/next/caching-middleware
 */

const redis = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const cacheMiddleware: LanguageModelV1Middleware = {
  /**
   * Transforms the parameters before they are passed to the language model, for both doGenerate and doStream.
   */
  // transformParams: async ({ params }) => {
  //   const lastUserMessageText = getLastUserMessageText({
  //     prompt: params.prompt,
  //   });

  //   if (lastUserMessageText == null) {
  //     return params; // do not use RAG (send unmodified parameters)
  //   }

  //   const instruction =
  //     'Use the following information to answer the question:\n' +
  //     findSources({ text: lastUserMessageText })
  //       .map((chunk) => JSON.stringify(chunk))
  //       .join('\n');

  //   return addToLastUserMessage({ params, text: instruction });
  // },

  /**
   * Wraps the doGenerate method of the language model. You can modify the parameters, call the language model, and modify the result.
   */
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheParams = JSON.stringify(params);
    const cacheKey = `cache:generate:${md5(cacheParams)}`;

    const cached = (await redis.get(cacheKey)) as Awaited<
      ReturnType<LanguageModelV1['doGenerate']>
    > | null;

    if (cached !== null) {
      return {
        ...cached,
        response: {
          ...cached.response,
          timestamp: cached?.response?.timestamp
            ? new Date(cached?.response?.timestamp)
            : undefined,
        },
      };
    }

    const result = await doGenerate();

    redis.set(cacheKey, result);

    return result;
  },

  /**
   * Wraps the doStream method of the language model. You can modify the parameters, call the language model, and modify the result.
   */
  wrapStream: async ({ doStream, params }) => {
    const cacheParams = JSON.stringify(params);
    const cacheKey = `cache:stream:${md5(cacheParams)}`;

    // Check if the result is in the cache
    const cached = await redis.get(cacheKey);

    // If cached, return a simulated ReadableStream that yields the cached result
    if (cached !== null) {
      console.log('Using cached response for LLM stream');
      // Format the timestamps in the cached response
      const formattedChunks = (cached as LanguageModelV1StreamPart[]).map(
        (p) => {
          if (p.type === 'response-metadata' && p.timestamp) {
            return { ...p, timestamp: new Date(p.timestamp) };
          } else return p;
        },
      );
      return {
        // Create a simulated ReadableStream that returns the cached response.
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 7,
          chunks: formattedChunks,
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    }

    // If not cached, proceed with streaming
    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV1StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // Store the full response in the cache after streaming is complete
        // console.log(
        //   'Storing full response in cache:',
        //   JSON.stringify(fullResponse, null, 2),
        // );
        redis.set(cacheKey, fullResponse);
        // Set the cache expiration time to 3-min
        redis.expire(cacheKey, 180);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
