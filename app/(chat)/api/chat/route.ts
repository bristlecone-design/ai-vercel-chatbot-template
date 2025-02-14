import { openai } from '@ai-sdk/openai';

import { auth } from '@/app/(auth)/auth';
import {
  getMostRecentUserMessage,
  getMostRecentUserUIMessageAttachments,
  transformUserMessageToSimpleContentList,
} from '@/lib/ai/chat-utils';
import { classifyDiscoveryPrompt } from '@/lib/ai/classifications';
import { models } from '@/lib/ai/models';
import {
  doesChatByIdExist,
  getMessagesByChatIdExceptCurrentMsg,
  saveChat,
  saveMessages,
} from '@/lib/db/queries/chat';
import type { MessageSave } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import { genId } from '@/lib/id';
import type { ChatMessage, MessageData } from '@/types/chat-msgs';
import {
  type Message,
  appendClientMessage,
  convertToCoreMessages,
  createDataStreamResponse,
  createIdGenerator,
  smoothStream,
  streamText,
} from 'ai';
import { StatusCodes } from 'http-status-codes';
import { generateTitleFromUserMessage } from '../../actions';

type POST_PARAMS = {
  id: string;
  modelId: string;
  messages: Array<Message>;
  numOfMessages?: number;
  discoverEnabled?: boolean;
  regenerateResponse?: boolean;
  maxSteps?: number;
};

/**
 * Handles POST requests to the /api/chat endpoint
 *
 * @note Number of messages is determined by the client-side which defaults to 1, the current user message, which is why we then query the DB for the full chat history, minus the current user message.
 */

export async function POST(req: Request) {
  const body: POST_PARAMS = await req.json();
  const {
    id: chatId,
    modelId,
    messages: uiMessages,
    maxSteps = 5,
    numOfMessages = 1,
    discoverEnabled = false,
    regenerateResponse = false,
  } = body;
  console.log('body content in api/chat:::', body);

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: StatusCodes.UNAUTHORIZED });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('LLM Model not found', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const coreMessages = convertToCoreMessages(uiMessages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const genUserMessageId = genId('msgc');

  const userMessageAttachments =
    getMostRecentUserUIMessageAttachments(uiMessages);

  /**
   * Query the DB for the chat history, if there are more than 1 message, we exclude the current user message
   */
  const prevMsgsFromDb = (
    numOfMessages > 1
      ? await getMessagesByChatIdExceptCurrentMsg({
          chatId,
          messageId: genUserMessageId,
        })
      : []
  ) as Array<Message>;
  // console.log('prevMsgsFromDb:::', prevMsgsFromDb);

  const allMsgHistory = appendClientMessage({
    messages: prevMsgsFromDb,
    message: userMessage as ChatMessage,
  });
  // console.log('allMsgHistory:::', allMsgHistory);

  /**
   * Check if chat exists, if not, generate a title and save the chat
   */
  const doesChatExist = await doesChatByIdExist({ id: chatId });

  if (!doesChatExist) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id: chatId, userId: session.user.id, title });
  }

  // Only save user message if we are not regenerating the response
  let savedMsgId: string | undefined;
  if (!regenerateResponse) {
    const [savedMsg] = await saveMessages({
      messages: [
        {
          ...userMessage,
          chatId,
          id: genUserMessageId,
          createdAt: new Date(),
          attachments: userMessageAttachments,
        },
      ],
    });

    savedMsgId = savedMsg.id;
  }

  /**
   * In your server-side route handler, you can use createDataStreamResponse and pipeDataStreamToResponse in combination with streamText.
   *
   * This approach allows us to immediately start streaming (solves RAG issues with status, etc.)
   *
   * @annotations https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-data#accessing-message-annotations
   *
   */
  return createDataStreamResponse({
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      const errMsg = getErrorMessage(error);
      // console.log('Error in LLM chat in root entry point:::', errMsg);
      return errMsg;
    },

    execute: async (dataStream) => {
      dataStream.writeData({ type: 'action', content: 'initialized call' });

      // Determine type of user message prompt
      const classificationPrompt =
        transformUserMessageToSimpleContentList(userMessage);

      dataStream.writeData({
        type: 'notification',
        content: 'Understanding your message...',
      } as MessageData);

      const classificationResult = await classifyDiscoveryPrompt(
        classificationPrompt,
        model,
      );

      const { classification, isQuestion, isVision } = classificationResult;

      console.log(
        'prompt classification result',
        JSON.stringify(classificationResult, null, 2),
      );

      dataStream.writeData({
        type: 'notification',
        content: isQuestion
          ? `Question detected`
          : isVision
            ? `Vision recognition detected`
            : `Other detected`,
      } as MessageData);

      const result = streamText({
        model: openai(model.apiIdentifier),
        messages: allMsgHistory,

        // TODO: Implement a custom middleware for the LLM chat, e.g. cache, rag, etc.
        // TODO: Implement system instructions based on the classification

        // Generate a unique ID for each (server) message.
        experimental_generateMessageId: createIdGenerator({
          prefix: 'msgs',
          size: 16,
        }),

        experimental_telemetry: {
          isEnabled: false,
          functionId: 'stream-text',
        },

        /**
         * Transform the stream. This is useful for e.g. filtering, changing, or smoothing the text stream.
         *
         * @note The transformations are applied before the callbacks are invoked and the promises are resolved. If you e.g. have a transformation that changes all text to uppercase, the onFinish callback will receive the transformed text.
         */
        experimental_transform: smoothStream(),

        // https://sdk.vercel.ai/docs/ai-sdk-core/generating-text#onchunk-callback
        onChunk({ chunk }) {
          // implement your own logic here, e.g.:
          if (chunk.type === 'text-delta') {
            // dataStream.writeMessageAnnotation({
            //   type: 'text-delta',
            //   chunk: chunk.textDelta,
            // });
          }
        },

        // https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#onstepfinish-callback
        onStepFinish: (step) => {
          // console.log(
          //   'Completed step in root data stream response:',
          //   JSON.stringify(step, null, 2),
          // );
        },

        // https://sdk.vercel.ai/docs/ai-sdk-core/generating-text#onfinish-callback
        async onFinish({ text, finishReason, usage, response }) {
          // your own logic, e.g. for saving the chat history or recording usage

          const responseId = response.id;
          const responseModelId = response.modelId;
          const responseMessages = response.messages;
          // console.log(
          //   'onFinished invoked in LLM chat in root entry point::',
          //   JSON.stringify(
          //     { responseId, responseModelId, responseMessages },
          //     null,
          //     2,
          //   ),
          // );

          /**
           * Track the corresponding user message ID the response was generated for
           */
          if (savedMsgId) {
            // message annotation:
            dataStream.writeMessageAnnotation({
              type: 'message-id',
              subType: 'user',
              content: savedMsgId, // ID from saved DB record
            });
          }

          /**
           * Save the Chat's AI generated responses to the DB for the current authenticated user
           */
          if (session.user?.id) {
            try {
              /**
               * Prepare the response messages for saving to the DB
               *
               * Normalize the response messages to include an ID, role, and content, then
               *
               * Maps the response messages to the DB schema, then
               *
               * Save the response messages to the DB
               *
               * @TODO Accounts for annotations, e.g. data sources
               */

              // const normalizedResponseMessages = appendResponseMessages({
              //   messages: [],
              //   responseMessages,
              // });
              // console.log(
              //   'normalizedResponseMessages:::',
              //   JSON.stringify(normalizedResponseMessages, null, 2),
              // );

              const finalResponseMessages = responseMessages.map((message) => {
                if (message.role === 'assistant') {
                  dataStream.writeMessageAnnotation({
                    type: 'message-id',
                    subType: 'assistant',
                    messageIdFromServer: message.id,
                  });
                }

                return {
                  chatId,
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  // parts: message.parts,
                  // annotations: message.annotations,
                  createdAt: new Date(),
                } as MessageSave;
              });

              await saveMessages({
                messages: finalResponseMessages,
              });
            } catch (error) {
              const errMsg = getErrorMessage(error);
              // console.error(`Failed to save chat: ${errMsg}`);
              dataStream.writeData({
                type: 'action',
                subType: 'error',
                content: errMsg,
              } as MessageData);
              // Bubble up the error
              throw error;
            }
          }

          // call annotation:
          dataStream.writeData({
            type: 'action',
            content: 'LLM call completed',
          } as MessageData);
        },
      });

      // Merge the parent and nested streams together
      result.mergeIntoDataStream(dataStream);
    },
  });
}
