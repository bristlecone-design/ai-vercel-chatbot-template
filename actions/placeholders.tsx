'use server';

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';

import type { StreamCreateExperiencePlaceholderOpts } from '@/types/placeholders';

export async function streamCreateExperiencePlaceholder(
  name = '',
  opts = {} as StreamCreateExperiencePlaceholderOpts
) {
  'use server';

  const generalStream = createStreamableValue();

  const {
    location,
    interests,
    profession,
    storySeries,
    storySeriesDescription,
    storySeriesPrompt,
  } = opts || ({} as StreamCreateExperiencePlaceholderOpts);

  let completedText = '';

  (async () => {
    const currentTime = new Date().toLocaleTimeString();

    const basePrompt = `User's name: ${name}; current time: ${currentTime}`;
    const userContext = `User's location: ${location || 'Unknown'}; User's interests: ${interests || 'Unknown'}; Profession: ${profession}; Story series: ${storySeries || 'Unknown'}; Story series description: ${storySeriesDescription || 'Unknown'}; Story series prompt: ${storySeriesPrompt || 'Unknown'}`;

    const finalPrompt = `${basePrompt}\n${userContext}`;

    const { textStream } = streamText({
      model: openai('gpt-4o'),

      system: `Create a contextual placeholder for the user to help them get started writing an experience for the platform. The placeholder should be warm, inviting, and encourage the user to share their experience. If the user's name is known, include it in the placeholder. The placeholder should be in plain text. Base context to consider always includes the platform purpose, "We all have an experience to share and discover", plus optionally, the user's name, interests, profession, location, etc. You can or don't have to include the story series in the placeholder, depending on the user's context but keep it in mind for generating the placeholder. If the story series has a specific description/purpose, or related prompt, weigh heavily on that so the user and their background can contribute to it with their relevant experiences. Limit the characters to no more than 200.
      
      Examples:

      For a user named "Alice" with interests in hiking and photography, in Carson City, and a platform purpose of sharing experiences and the story series, "Home Means Nevada":
      
      Share your latet hiking and photography adventures around Carson as part of the "Home Means Nevada" series, Alice!

      For a user named "Bob" with interests in cooking and gardening, in Reno, profession as a chef, and the story series, "Home Means Nevada":

      Share your latest cooking and gardening adventures around Reno, Bob!
      
      For an unknown user with unknown interests, but known location:

      Share your latest adventures around Carson City, fellow explorer!
      
      For a user named "Maria" with interests in painting and writing, in Reno, profession as a student, and the story series, "150 Years of UNR" and a prompt of "Which academic programs at UNR have made a lasting impression on you?":

      Share your latest painting and writing adventures around Reno or whatever you'd like to share about the 150 Years of UNR series, Maria!

      OR 
      
      Which academic programs at UNR have made a lasting impression on you, Maria?

      For a user named "Karen" with interests in traveling, in Tonopah, profession as a fundraiser or similar, and the story series, "Building Nevada's Future":

      Share your latest adventures around Tonopah, Karen!

      OR 

      What are your thoughts on building Nevada's future, Karen?

      etc.
      `,

      prompt: finalPrompt,

      onFinish: (result) => {
        completedText = result.text;
        generalStream.done();
      },
    });

    for await (const delta of textStream) {
      generalStream.update(delta);
    }
  })();

  return {
    complete: completedText,
    stream: generalStream.value,
  } as const;
}
