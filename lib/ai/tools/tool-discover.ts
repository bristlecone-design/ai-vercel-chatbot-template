import { generateUUID } from '@/lib/utils';
import {
  type CoreToolCallUnion,
  type CoreToolResultUnion,
  type DataStreamWriter,
  streamText,
  tool,
} from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import type { customModel } from '..';
import { SYSTEM_PROMPTS } from '../prompts';

export type DiscoverToolCall = CoreToolCallUnion<
  ReturnType<typeof discoverToolDefinition>
>;

export type DiscoverToolResult = CoreToolResultUnion<
  ReturnType<typeof discoverToolDefinition>
>;

export type DiscoverToolOpts = {
  userMessage: any;
  discoverEnabled?: boolean;
  fallbackPrompt?: string;
  description?: string;
  session?: Session;
};

export const discoverToolWrapper = (
  ...args: Parameters<typeof discoverToolDefinition>
) => {
  return discoverToolDefinition(...args);
};

export function discoverToolDefinition(
  llmModel: ReturnType<typeof customModel>,
  dataStream?: DataStreamWriter,
  opts = {} as DiscoverToolOpts,
) {
  const {
    session,
    userMessage,
    discoverEnabled = false,
    fallbackPrompt = 'Help me discover something new based on provided context and known interests',
    description = 'Discover new experiences, connections, suggestions, collaborations, opportunities and specific knowledge based on user interests and preferences.',
  } = opts;

  return {
    // name: 'discover' as AllowedTools,
    discover: tool({
      description,
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

        if (dataStream) {
          dataStream.writeData({
            type: 'id',
            content: id,
          });
        }

        const isUserMsgString = typeof userMessage.content === 'string';

        const { fullStream } = streamText({
          model: llmModel,
          system: discoverEnabled
            ? SYSTEM_PROMPTS.discovery
            : SYSTEM_PROMPTS.discoveryInactive,
          prompt: isUserMsgString
            ? (userMessage.content as string)
            : `${fallbackPrompt}: ${interests.join(', ')}`,
          messages: !isUserMsgString ? metaMsgs : undefined,
          experimental_continueSteps: true,
          onStepFinish: (step) => {
            // dataStream.writeData({
            //   type: 'step',
            //   content: `Completed step: ${JSON.stringify(step)}`,
            // });
          },
        });

        // Capture the stream as it comes in and send it to the parent stream and client
        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            discoveryText += textDelta;

            if (dataStream) {
              dataStream.writeData({
                type: 'text-delta',
                content: textDelta,
              });
            }
          }
        }

        if (dataStream) {
          dataStream.writeData({ type: 'finish', content: '' });
        }

        if (session?.user?.id) {
          // TODO: Save discovery chat
        }

        return {
          id,
          content: discoveryText,
        };
      },
    }),
  };
}
