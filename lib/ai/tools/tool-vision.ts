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
import { generateUUID } from '../chat-utils';
import { SYSTEM_PROMPTS } from '../prompts';

export type VisionToolCall = CoreToolCallUnion<
  ReturnType<typeof visionToolDefinition>
>;

export type VisionToolResult = CoreToolResultUnion<
  ReturnType<typeof visionToolDefinition>
>;

export type VisionToolOpts = {
  userMessage: any;
  visionEnabled?: boolean;
  fallbackPrompt?: string;
  description?: string;
  session?: Session;
};

export const getVisionToolDefinition = (
  ...args: Parameters<typeof visionToolDefinition>
) => {
  return visionToolDefinition(...args);
};

export function visionToolDefinition(
  llmModel: ReturnType<typeof customModel>,
  dataStream?: DataStreamWriter,
  opts = {} as VisionToolOpts,
) {
  const {
    session,
    userMessage,
    visionEnabled = false,
    fallbackPrompt = 'Describe this asset for the user',
    description = 'Describes/interprets/understands multimedia content, such as images, videos, audio, etc.',
  } = opts;

  console.log('Vision tool  called with opts', {
    session,
    visionEnabled,
    fallbackPrompt,
    description,
    userMessage: JSON.stringify(userMessage, null, 2),
  });

  return {
    // name: 'discover' as AllowedTools,
    vision: tool({
      description,
      parameters: z.object({
        numAssetsToAnalyze: z
          .string()
          .describe('Number of assets to analyze/interpret/understand')
          .optional(),
      }),
      execute: async (args, meta) => {
        const { numAssetsToAnalyze } = args;
        const { abortSignal, toolCallId, messages: metaMsgs } = meta;
        // console.log('vision tool executed with', {
        //   metaMsgs,
        //   numAssetsToAnalyze,
        //   userMessage: JSON.stringify(userMessage, null, 2),
        // });

        const id = generateUUID();
        let visionRecognitionText = '';

        if (dataStream) {
          dataStream.writeData({
            type: 'id',
            content: id,
          });
        }

        const { fullStream } = streamText({
          model: llmModel,
          system: visionEnabled
            ? SYSTEM_PROMPTS.vision
            : SYSTEM_PROMPTS.visionInactive,
          // prompt: visionPrompt,
          messages: metaMsgs,
          experimental_continueSteps: true,
          onStepFinish: (step) => {
            // dataStream.writeData({
            //   type: 'step',
            //   content: `Completed step: ${JSON.stringify(step)}`,
            // });
          },
          onFinish: async (event) => {
            console.log('Finished vision tool', JSON.stringify(event, null, 2));
          },
        });

        // Capture the stream as it comes in and send it to the parent stream and client
        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            visionRecognitionText += textDelta;

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

        return {
          id,
          content: visionRecognitionText,
        };
      },
    }),
  };
}
