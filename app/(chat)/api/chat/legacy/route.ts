import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';

import type { DocSuggestion } from '@/lib/db/schema';

import {
  generateUUID,
  getMostRecentUserMessage,
  getMostRecentUserMessageAttachments,
  sanitizeResponseMessages,
} from '@/lib/ai/chat-utils';
import { allTools } from '@/lib/ai/tools/types';
import { genId } from '@/lib/id';
import { generateTitleFromUserMessage } from '../../../actions';
import {
  getChatById,
  deleteChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries/chat';
import {
  saveDocument,
  getDocumentById,
  saveSuggestions,
} from '@/lib/db/queries/documents';

export const maxDuration = 300;

// export const runtime = 'edge';

type POST_PARAMS = {
  id: string;
  modelId: string;
  messages: Array<Message>;
  discoverEnabled?: boolean;
  regenerateResponse?: boolean;
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
  const activeTools = allTools;

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
        maxSteps: 5,
        toolChoice: 'auto',
        experimental_activeTools: activeTools,
        tools: {
          discover: tool({
            description:
              'Discover new experiences, connections, suggestions, collaborations, opportunities and specific knowledge based on user interests and preferences.',
            parameters: z.object({
              location: z.string().optional(),
              interests: z.array(z.string()).optional(),
            }),
            execute: async (args, meta) => {
              const { location, interests = [] } = args;
              const { abortSignal, toolCallId, messages: metaMsgs } = meta;
              // console.log('metaMsgs in discover tool', {
              //   metaMsgs,
              //   userMessage,
              // });
              // console.log('discover tool args', args);

              const id = generateUUID();
              let discoveryText = '';

              dataStream.writeData({
                type: 'id',
                content: id,
              });

              const isUserMsgString = typeof userMessage.content === 'string';

              const { fullStream } = streamText({
                model: llmModel,
                system: discoverEnabled
                  ? SYSTEM_PROMPTS.discovery
                  : SYSTEM_PROMPTS.discoveryInactive,
                prompt: isUserMsgString
                  ? (userMessage.content as string)
                  : `Help me discover something new based on my provided context and interests: ${interests.join(', ')}`,
                messages: !isUserMsgString ? metaMsgs : undefined,
                experimental_continueSteps: true,
                onStepFinish: (step) => {
                  // dataStream.writeData({
                  //   type: 'step',
                  //   content: `Completed step: ${JSON.stringify(step)}`,
                  // });
                },
              });

              for await (const delta of fullStream) {
                const { type } = delta;

                if (type === 'text-delta') {
                  const { textDelta } = delta;

                  discoveryText += textDelta;
                  dataStream.writeData({
                    type: 'text-delta',
                    content: textDelta,
                  });
                }
              }

              dataStream.writeData({ type: 'finish', content: '' });

              if (session.user?.id) {
                // TODO: Save discovery chat
              }

              return {
                id,
                content: discoveryText,
              };
            },
          }),
          getWeather: {
            description: 'Get the current weather at a location',
            parameters: z.object({
              latitude: z.number(),
              longitude: z.number(),
            }),
            execute: async ({ latitude, longitude }) => {
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
              );

              const weatherData = await response.json();
              return weatherData;
            },
          },
          createDocument: {
            description: 'Create a document for a writing activity',
            parameters: z.object({
              title: z.string(),
            }),
            execute: async ({ title }) => {
              const id = generateUUID();
              let draftText = '';

              dataStream.writeData({
                type: 'id',
                content: id,
              });

              dataStream.writeData({
                type: 'title',
                content: title,
              });

              dataStream.writeData({
                type: 'clear',
                content: '',
              });

              const { fullStream } = streamText({
                model: llmModel,
                system:
                  'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
                prompt: title,
              });

              for await (const delta of fullStream) {
                const { type } = delta;

                if (type === 'text-delta') {
                  const { textDelta } = delta;

                  draftText += textDelta;
                  dataStream.writeData({
                    type: 'text-delta',
                    content: textDelta,
                  });
                }
              }

              dataStream.writeData({ type: 'finish', content: '' });

              if (session.user?.id) {
                await saveDocument({
                  id,
                  title,
                  content: draftText,
                  userId: session.user.id,
                });
              }

              return {
                id,
                title,
                content:
                  'A document was created and is now visible to the user.',
              };
            },
          },
          updateDocument: {
            description: 'Update a document with the given description',
            parameters: z.object({
              id: z.string().describe('The ID of the document to update'),
              description: z
                .string()
                .describe('The description of changes that need to be made'),
            }),
            execute: async ({ id, description }) => {
              const document = await getDocumentById({ id });

              if (!document) {
                return {
                  error: 'Document not found',
                };
              }

              const { content: currentContent } = document;
              let draftText = '';

              dataStream.writeData({
                type: 'clear',
                content: document.title,
              });

              const { fullStream } = streamText({
                model: llmModel,
                system:
                  'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
                experimental_providerMetadata: {
                  openai: {
                    prediction: {
                      type: 'content',
                      content: currentContent,
                    },
                  },
                },
                messages: [
                  {
                    role: 'user',
                    content: description,
                  },
                  { role: 'user', content: currentContent },
                ],
              });

              for await (const delta of fullStream) {
                const { type } = delta;

                if (type === 'text-delta') {
                  const { textDelta } = delta;

                  draftText += textDelta;
                  dataStream.writeData({
                    type: 'text-delta',
                    content: textDelta,
                  });
                }
              }

              dataStream.writeData({ type: 'finish', content: '' });

              if (session.user?.id) {
                await saveDocument({
                  id,
                  title: document.title,
                  content: draftText,
                  userId: session.user.id,
                });
              }

              return {
                id,
                title: document.title,
                content: 'The document has been updated successfully.',
              };
            },
          },
          requestDocumentSuggestions: {
            description: 'Request suggestions for a document',
            parameters: z.object({
              documentId: z
                .string()
                .describe('The ID of the document to request edits'),
            }),
            execute: async ({ documentId }) => {
              const document = await getDocumentById({ id: documentId });

              if (!document || !document.content) {
                return {
                  error: 'Document not found',
                };
              }

              const suggestions: Array<
                Omit<
                  DocSuggestion,
                  'userId' | 'createdAt' | 'documentCreatedAt'
                >
              > = [];

              const { elementStream } = streamObject({
                model: llmModel,
                system:
                  'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
                prompt: document.content,
                output: 'array',
                schema: z.object({
                  originalSentence: z
                    .string()
                    .describe('The original sentence'),
                  suggestedSentence: z
                    .string()
                    .describe('The suggested sentence'),
                  description: z
                    .string()
                    .describe('The description of the suggestion'),
                }),
              });

              for await (const element of elementStream) {
                const suggestion = {
                  originalText: element.originalSentence,
                  suggestedText: element.suggestedSentence,
                  description: element.description,
                  id: generateUUID(),
                  documentId: documentId,
                  isResolved: false,
                };

                dataStream.writeData({
                  type: 'suggestion',
                  content: suggestion,
                });

                suggestions.push(suggestion);
              }

              if (session.user?.id) {
                const userId = session.user.id;

                await saveSuggestions({
                  suggestions: suggestions.map((suggestion) => ({
                    ...suggestion,
                    userId,
                    createdAt: new Date(),
                    documentCreatedAt: document.createdAt,
                  })),
                });
              }

              return {
                id: documentId,
                title: document.title,
                message: 'Suggestions have been added to the document',
              };
            },
          },
        },
        onFinish: async (event) => {
          const responseMessages = event.response.messages;
          // console.log(
          //   'responseMessages in onFinish',
          //   JSON.stringify(responseMessages, null, 2),
          // );
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
