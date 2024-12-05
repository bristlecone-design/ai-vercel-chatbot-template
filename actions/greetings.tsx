'use server';

import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { createStreamableUI, createStreamableValue } from 'ai/rsc';
import { z } from 'zod';

export async function streamGettingStartedGreetingAndSteps({
  name,
}: {
  name: string;
}) {
  'use server';

  const stepStream = createStreamableUI();
  const greetingStream = createStreamableUI();
  const generalStream = createStreamableUI();

  (async () => {
    const currentTime = new Date().toLocaleTimeString();

    const { text, textStream, steps, toolResults } = await streamText({
      model: openai('gpt-4o'),

      system: `Create a warm and brief personalized greeting for users joining Experience Nevada, then encouraging taking certain actionable steps like updating their profile, sharing an experience, or contribute to a story series while waiting for access to the private beta on Nevada Day (2024). Keep the greeting concise, friendly and affirming and the steps unique. If the time is known, greet the user with "Good evening" or "Good morning" accordingly.
      
      Example:
      
      Good evening and welcome to Experience Nevada, {userName}! While you’re waiting for the private beta launch on Nevada Day, take a moment to update your profile, share an experience, or contribute to a story series. More details below!`,

      prompt: `User's name: ${name}; current time: ${currentTime}`,

      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        // your own logic, e.g. for saving the chat history or recording usage
        console.log(
          'step done',
          text,
          toolCalls,
          toolResults,
          finishReason,
          usage
        );
      },

      onFinish: (result) => {
        console.log('stream done', result);
        greetingStream.done();
        generalStream.done();
        stepStream.done();
      },
      maxSteps: 1,
      toolChoice: 'required',
      tools: {
        introGreeting: tool({
          description: 'Generate a personalized greeting for users',
          parameters: z.object({
            greeting: z.string().describe('The intro greeting to generate.'),
            name: z.string().describe('The name of the user to greet.'),
          }),
          execute: async ({ greeting, name }) => {
            greetingStream.update(greeting);
            return `Hello, ${name}! ${greeting}`;
          },
        }),

        actionableSteps: tool({
          description: 'Drive users to take certain actionable steps',
          parameters: z.object({
            step: z
              .enum(['UPDATE_PROFILE', 'SHARE_EXPERIENCE', 'CONTRIBUTE_STORY'])
              .describe('The actionable step to drive users to take.'),
          }),
          execute: async ({ step }) => {
            stepStream.append(step);
            return `Here's the step to take ${step}!`;
          },
        }),
      },
    });

    for await (const delta of textStream) {
      generalStream.update(delta);
    }
  })();

  return {
    general: generalStream.value,
    greeting: greetingStream.value,
    step: stepStream.value,
  } as const;
}

type StreamSimpleGettingStartedGreetingOpts = {
  userLocation?: string;
  userCurrentTime?: string;
  userContext?: string;
};

/**
 *  Stream a personalized greeting to a user and their onboarding experience
 *
 */
export async function streamSimpleGettingStartedGreeting(
  name: string,
  opts = {} as StreamSimpleGettingStartedGreetingOpts
) {
  'use server';

  const stream = createStreamableValue();

  const { userLocation, userCurrentTime, userContext } = opts;

  (async () => {
    const basePrompt = `User name: ${name}\nCurrent time: ${userCurrentTime || new Date().toLocaleTimeString()}`;

    const locationContext = userLocation ? `Location: ${userLocation}` : '';

    const additionalContext = userContext
      ? `Additional Context: ${userContext}`
      : '';

    // String it all together then replace/trim any empty newlines with spaces
    const finalPrompt =
      `${basePrompt}\n${locationContext}\n${additionalContext}`.replace(
        /\n\s*\n/g,
        '\n'
      );

    const { textStream } = await streamText({
      model: openai('gpt-4o-mini'),
      system: `Create a warm and brief personalized greeting for users joining Experience Nevada, encouraging them to update their profile, share an experience, or contribute to a story series while waiting for access to the private beta sometime after Nevada Day (2024) under a staggered rolled-out. Keep it concise, friendly and affirming with a note about more information below. The greeting should be in plain text or markdown. Include a time-based greeting if available (e.g., "Good morning, {userName}!"). Similarly, if the location is known, include a location-based end (e.g., "Hope things are going well in {location}!").
      
      Example:
      
      Good evening and welcome to Experience Nevada, {userName}! While you’re waiting for the private beta launch on Nevada Day, take a moment to update your profile, share an experience, or contribute to a story series. More details on each step below!`,
      prompt: finalPrompt,
      onFinish: () => {
        stream.done();
      },
      // schema: AIGeneratedResponseToUserReplySchema,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }
  })();

  return { reply: stream.value };
}
