import { openai } from '@ai-sdk/openai';

import { auth } from '@/app/(auth)/auth';
import {
  getMostRecentUserMessage,
  getMostRecentUserMessageAttachments,
  sanitizeResponseMessages,
} from '@/lib/ai/chat-utils';
import { models } from '@/lib/ai/models';
import { getChatById, saveChat, saveMessages } from '@/lib/db/queries/chat';
import { genId } from '@/lib/id';
import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { StatusCodes } from 'http-status-codes';
import { generateTitleFromUserMessage } from '../../actions';

type POST_PARAMS = {
  id: string;
  modelId: string;
  messages: Array<Message>;
  discoverEnabled?: boolean;
  regenerateResponse?: boolean;
  maxSteps?: number;
};

export async function POST(req: Request) {
  const body: POST_PARAMS = await req.json();
  const {
    id,
    modelId,
    messages,
    maxSteps = 5,
    discoverEnabled = false,
    regenerateResponse = false,
  } = body;
  console.log('body content in api/chat::', body);

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: StatusCodes.NOT_FOUND });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const userMessageAttachments = getMostRecentUserMessageAttachments(messages);

  const [chat] = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = genId('msg');

  // Only save if we are not regenerating the response
  let savedMsgId: string | undefined;
  if (!regenerateResponse) {
    const [savedMsg] = await saveMessages({
      messages: [
        {
          ...userMessage,
          id: userMessageId,
          createdAt: new Date(),
          chatId: id,
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
    execute: (dataStream) => {
      dataStream.writeData({ type: 'action', content: 'initialized call' });

      const result = streamText({
        model: openai('gpt-4o'),
        messages,

        experimental_telemetry: {
          isEnabled: false,
          functionId: 'stream-text',
        },

        experimental_transform: smoothStream(),
        // https://sdk.vercel.ai/docs/ai-sdk-core/generating-text#onchunk-callback
        onChunk({ chunk }) {
          // implement your own logic here, e.g.:
          if (chunk.type === 'text-delta') {
            dataStream.writeMessageAnnotation({
              type: 'text-delta',
              chunk: chunk.textDelta,
            });
          }
        },

        // https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#onstepfinish-callback
        onStepFinish: (step) => {
          console.log(
            'Completed step in root data stream response:',
            JSON.stringify(step, null, 2),
          );
        },

        // https://sdk.vercel.ai/docs/ai-sdk-core/generating-text#onfinish-callback
        async onFinish({ text, finishReason, usage, response }) {
          // your own logic, e.g. for saving the chat history or recording usage

          const responseMessages = response.messages;
          console.log(
            'onFinished invoked in LLM chat in root entry point::',
            JSON.stringify(response, null, 2),
          );

          if (session.user?.id) {
            try {
              const finalResponseMessages = sanitizeResponseMessages(
                responseMessages,
              ).map((message) => {
                const responseMsgId = genId('msg');

                if (message.role === 'assistant') {
                  dataStream.writeMessageAnnotation({
                    type: 'message-id',
                    subType: 'assistant',
                    messageIdFromServer: responseMsgId,
                  });
                }

                return {
                  id: responseMsgId,
                  chatId: id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                };
              });
              console.log('finalResponseMessages::', finalResponseMessages);

              await saveMessages({
                messages: finalResponseMessages,
              });

              if (savedMsgId) {
                // message annotation:
                dataStream.writeMessageAnnotation({
                  type: 'message-id',
                  subType: 'user',
                  content: savedMsgId, // ID from saved DB record
                });
              }
            } catch (error) {
              console.error('Failed to save chat');
            }
          }

          // call annotation:
          dataStream.writeData({
            type: 'action',
            content: 'LLM call completed',
          });
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
  });
}
