import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  generateObject,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { customModel, openaiModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';

import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import {
  generateUUID,
  getMostRecentUserMessage,
  getMostRecentUserUIMessageAttachments,
  sanitizeResponseMessages,
  transformUserMessageToSimpleContentList,
} from '@/lib/ai/chat-utils';
import { getVisionToolDefinition } from '@/lib/ai/tools/tool-vision';
import { coreBetaPlatformVisionTools } from '@/lib/ai/tools/types';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries/chat';
import { genId } from '@/lib/id';

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
  console.log('chat post body data', {
    body: JSON.stringify(body, null, 2),
    regenerateResponse,
  });

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

  const userMessageAttachments =
    getMostRecentUserUIMessageAttachments(messages);

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

  // Immediately start streaming (solves RAG issues and the like with status, etc.)
  return createDataStreamResponse({
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },

    execute: async (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      console.log('Executing core data stream with user message:', {
        userMessage: JSON.stringify(userMessage, null, 2),
        // coreMessages: JSON.stringify(coreMessages, null, 2),
      });

      console.log('userMessage type', typeof userMessage);
      const classificationPrompt =
        transformUserMessageToSimpleContentList(userMessage);
      console.log('user msg classificationPrompt::', classificationPrompt);

      // https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#enum
      const { object: classification } = await generateObject({
        // fast model for classification:
        model: openaiModel(model.apiIdentifier, { structuredOutputs: true }),
        output: 'enum',
        enum: ['vision', 'question', 'other'],
        system:
          'Classify the user message as a question, vision or other. vision is for image, file, web url, etc. recognition and processing',
        prompt: classificationPrompt,
      });
      console.log(
        'prompt classification',
        JSON.stringify(classification, null, 2),
      );

      const isVision = classification === 'vision';
      console.log('isVision', isVision);

      const tools = {
        // Discover
        // ...getDiscoverToolDefinition(llmModel, dataStream, {
        //   userMessage,
        //   discoverEnabled,
        //   session,
        // }),

        // Image recognition / vision
        ...getVisionToolDefinition(llmModel, dataStream, {
          userMessage,
          visionEnabled: false,
          session,
        }),

        // Parse non-visual resource content (e.g. text, urls, etc.)
        // ...getWebResourceToolDefinition(llmModel, dataStream, {
        //   userMessage,
        //   storeContentEnabled: discoverEnabled,
        //   session,
        // }),

        // Weather
        // ...getWeathereatherToolDefinition(llmModel, dataStream),
      };

      console.log('Tools to be used in core data stream:', {
        toolKeys: Object.keys(tools),
        tools,
      });

      const systemInstructions = isVision
        ? SYSTEM_PROMPTS.vision
        : SYSTEM_PROMPTS.baseWithTools;

      console.log('systemInstructions', systemInstructions);
      console.log('maxSteps', maxSteps);

      const result = streamText({
        model: llmModel,
        system: systemInstructions,
        messages: coreMessages,
        maxSteps,
        experimental_transform: smoothStream(),
        experimental_activeTools: coreBetaPlatformVisionTools,
        toolChoice: isVision ? 'required' : 'auto',
        tools,

        onChunk: (chunk) => {
          // console.log(
          //   'Chunk in root stream response:',
          //   JSON.stringify(chunk, null, 2),
          // );
        },

        onStepFinish: (step) => {
          // console.log(
          //   'Completed step in root data stream response:',
          //   JSON.stringify(step, null, 2),
          // );
        },

        onFinish: async (event) => {
          const responseMessages = event.response.messages;
          console.log(
            'Finished chat in root entry point::',
            JSON.stringify(event, null, 2),
          );

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
