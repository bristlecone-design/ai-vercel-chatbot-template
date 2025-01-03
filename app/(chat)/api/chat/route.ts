import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';

import {
  generateUUID,
  getMostRecentUserMessage,
  getMostRecentUserMessageAttachments,
  sanitizeResponseMessages,
} from '@/lib/ai/chat-utils';
import { discoverToolDefinition } from '@/lib/ai/tools/tool-discover';
import { getWeathereatherToolDefinition } from '@/lib/ai/tools/tool-weather';
import { coreBetaPlatformTools } from '@/lib/ai/tools/types';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries/chat';
import { genId } from '@/lib/id';
import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 300;

// export const runtime = 'edge';

type POST_PARAMS = {
  id: string;
  modelId: string;
  messages: Array<Message>;
  discoverEnabled?: boolean;
  regenerateResponse?: boolean;
  maxSteps?: number;
};

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const [chat] = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const body: POST_PARAMS = await request.json();
  const {
    id,
    modelId,
    messages,
    maxSteps = 5,
    discoverEnabled = false,
    regenerateResponse = false,
  } = body;
  // console.log('chat post body data', {
  //   body: JSON.stringify(body, null, 2),
  //   regenerateResponse,
  // });

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
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
  if (!regenerateResponse) {
    await saveMessages({
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
  }

  const llmModel = customModel(model.apiIdentifier);
  // const activeTools = discoverEnabled ? allTools : toolsSansDiscover;

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      const result = streamText({
        model: llmModel,
        system: SYSTEM_PROMPTS.base,
        messages: coreMessages,
        maxSteps,
        toolChoice: 'auto',
        experimental_activeTools: coreBetaPlatformTools,
        tools: {
          // Discover
          ...discoverToolDefinition(llmModel, dataStream, {
            userMessage,
            discoverEnabled,
            session,
          }),
          // Weather
          ...getWeathereatherToolDefinition(llmModel, dataStream),
        },
        onFinish: async (event) => {
          const responseMessages = event.response.messages;

          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(responseMessages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: false,
          functionId: 'stream-text',
        },
      });

      // Combine the result of the inner stream with the main data stream
      result.mergeIntoDataStream(dataStream);
    },
  });
}
