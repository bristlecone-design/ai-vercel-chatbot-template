import { getCachedFeaturedPromptCollections } from '@/actions/prompts';
import type { MetadataRoute } from 'next';

import {
  createPromptCollectionStoryPermalink,
  createSingleStoryPromptChallengePermalink,
} from '@/features/experiences/utils/experience-prompt-utils';
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

async function getAllPromptStoriesEntries() {
  // Fetch all featured prompt collections (stories) without any additional data
  const stories = await getCachedFeaturedPromptCollections(true, true, {
    collaborators: false,
    experiences: false,
    prompts: true,
  });

  if (!stories || !stories.length) {
    return [];
  }

  return stories
    .flatMap((story) => {
      const { path: storyPath, updatedAt } = story;
      const promptPath = createPromptCollectionStoryPermalink(storyPath);

      const storyItem = {
        url: `${getBaseUrl()}${promptPath}`,
        lastModified: new Date(updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      };

      const { Prompts } = story;

      const storyPromptItems = Prompts.length
        ? Prompts.map((prompt) => {
            const promptPath = createSingleStoryPromptChallengePermalink(
              prompt.id,
              storyPath,
            );

            return {
              url: `${getBaseUrl()}${promptPath}`,
              lastModified: new Date(updatedAt),
              changeFrequency: 'weekly',
              priority: 0.8,
            };
          })
        : [];

      return [storyItem, ...storyPromptItems];
    })
    .filter(Boolean) as MetadataRoute.Sitemap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // const staticEntries = getStaticEntries();
  const featuredStories = await getAllPromptStoriesEntries();

  return [...featuredStories];
}
