import { getAllCompletedPromptStories } from '@/actions/prompts';
import type { MetadataRoute } from 'next';

import { createSingleCompletedStoryPromptChallengePermalink } from '@/features/experiences/utils/experience-prompt-utils';
import { getBaseUrl } from '@/lib/getBaseUrl';

// function getStaticEntries() {
//   return [
//     {
//       url: 'https://nv.guide',
//       lastModified: new Date(),
//       changeFrequency: 'yearly',
//       priority: 1,
//     },
//   ] as MetadataRoute.Sitemap;
// }

async function getAllCompletedPromptStoriesEntries() {
  // Fetch all featured prompt collections (stories) without any additional data
  const completedStories = await getAllCompletedPromptStories();

  if (!completedStories || !completedStories.length) {
    return [];
  }

  return completedStories
    .map((pc) => {
      const {
        Story: story,
        Experience: experience,
        Prompt: prompt,
        updatedAt,
      } = pc;

      if (!story || !experience || !prompt) {
        return null;
      }

      const { id: promptId } = prompt;
      const { id: storyId, path: storyPath } = story;
      const { id: expId } = experience;

      const baseUrl = getBaseUrl();

      // /prompts/stories/:storyPath/:promptId/completed/:expId
      const completedStoryPromptPermalink =
        createSingleCompletedStoryPromptChallengePermalink(
          expId,
          promptId,
          storyPath,
        );
      const completedStoryPromptFullPermalink = `${baseUrl}${completedStoryPromptPermalink}`;

      return {
        url: completedStoryPromptFullPermalink,
        lastModified: new Date(updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      };
    })
    .filter(Boolean) as MetadataRoute.Sitemap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // const staticEntries = getStaticEntries();
  const completedStories = await getAllCompletedPromptStoriesEntries();

  return [...completedStories];
}
