import type { Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware } from 'ai';

export const yourRagMiddleware: LanguageModelV1Middleware = {
  /**
   * Transforms the parameters before they are passed to the language model, for both doGenerate and doStream.
   *
   * @see https://sdk.vercel.ai/docs/ai-sdk-core/middleware#retrieval-augmented-generation-rag
   */
  transformParams: async ({ params }) => {
    const lastUserMessageText = getLastUserMessageText({
      prompt: params.prompt,
    });

    if (lastUserMessageText == null) {
      return params; // do not use RAG (send unmodified parameters)
    }

    const instruction =
      'Use the following information to answer the question:\n' +
      findSources({ text: lastUserMessageText })
        .map((chunk) => JSON.stringify(chunk))
        .join('\n');

    return addToLastUserMessage({ params, text: instruction });
  },
};
