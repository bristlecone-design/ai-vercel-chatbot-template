'use server';

import { getUserProfileById } from '@/lib/db/queries/user';

import { getBaseUrl } from '@/lib/getBaseUrl';
import {
  isImage,
  isVideo,
  sortRawMediaByLatLong,
  sortRawMediaForGallery,
} from '@/lib/media/media-utils';
import { getNextImageUrlForManipulation } from '@/lib/next-image';
import { getUserFromSession } from '@/lib/session';
import {
  getUsersFirstNameFromName,
  mapDbUserToClientFriendlyUser,
} from '@/lib/user/user-utils';

import { getAboutTitleTemplate } from '@/config/site-meta';
import {
  createFeaturedStorySeriesRootPermalink,
  createPromptChallengePermalink,
  createPromptCollectionStoryPermalink,
  createSingleCompletedStoryPromptChallengePermalink,
  createSingleStoryPromptChallengePermalink,
  createUserCompletedPromptChallengePermalink,
  mapPromptRecordToClientFriendlyVersion,
} from '@/features/experiences/utils/experience-prompt-utils';
import { createUserProfileExperiencePermalink } from '@/features/experiences/utils/experience-utils';
import { getCachedSingleUserExperienceForFrontend } from '@/lib/db/queries/experiences';
import { getCachedMediaByExperienceId } from '@/lib/db/queries/media/get-core-media';
import { getCachedUserPublicFeaturedImgs } from '@/lib/db/queries/media/get-featured-imgs';
import {
  getCachedCompletedPromptCollaborationsByPromptIdAndExpId,
  getCachedFeaturedPromptCollections,
  getCachedPromptCollaboratorByExpId,
  getCachedSingleExperiencePromptById,
  getCachedSinglePromptCollectionByPath,
} from '@/lib/db/queries/prompts';
import type {
  ExperienceUserPromptModel,
  PromptStoryModel,
  StorySeriesPageViewModel,
} from '@/types/experience-prompts';
import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';
import type { AppUser } from '@/types/next-auth';
import type { USER_PROFILE_MODEL } from '@/types/user';

function mapPromptCollaboratorAuthorDetails(
  Collaborator: USER_PROFILE_MODEL | null | undefined,
) {
  const promptAuthorUsername = Collaborator ? Collaborator.username : '';

  const promptAuthor = Collaborator ? Collaborator.name : '';

  const promptAuthorFirstName = getUsersFirstNameFromName(promptAuthor);

  const promptAuthorWebsite = Collaborator
    ? Collaborator.urlSocial || Collaborator.url
    : '';

  return {
    author: promptAuthor,
    authorFirstName: promptAuthorFirstName,
    authorUsername: promptAuthorUsername,
    authorWebsite: promptAuthorWebsite,
  };
}

function mapSinglePromptChallengeForPageView(
  prompt: ExperienceUserPromptModel | null,
  expId?: string | null,
  authUser?: AppUser | USER_PROFILE_MODEL,
) {
  if (!prompt) {
    return {
      found: false,
      prompt: undefined,

      // Permalinks
      promptPermalinkRelative: '',
      promptPermalinkFull: '',
      storyPermalink: '',
      storyPermalinkFull: '',

      // Experience details
      expId: expId,
      completedExperience: undefined,
      experiences: [] as ExperienceModel[],

      // Story details
      storyId: null,
      storyTitle: '',
      storyPath: '',

      // Prompt details
      id: null,
      url: '',
      title: 'Not Found Prompt Challenge',
      question: '',
      response: '',
      description: 'An Experience Nevada Prompt Challenge',

      // Convenience flags
      isPromptResponse: false,
      isStoryContribution: false,

      // Author details
      author: undefined,
      authorName: undefined,
      authorFirstName: undefined,
      authorWebsite: undefined,
      authorUsername: undefined,

      // Assets
      assets: [],

      // Open Graph
      openGraphTitle: '',
      openGraphDescription: '',
      openGraphImages: [],
      openGraphVideos: [],
      openGraphCreators: [],
      openGraphUrl: '',
    };
  }

  const {
    id: promptId,
    content: promptResponse,
    prompt: promptQuestion,
    storyId: storyIdProp,
    Collaborator,
    Experiences = [],
    Author: promptAuthor,
    Story,
  } = prompt;

  const authUserId = authUser?.id;
  const isAuthenticated = Boolean(authUserId);

  const completedExperience =
    expId && Experiences.length > 0
      ? Experiences.find((e) => e.id === expId)
      : isAuthenticated && Experiences.length > 0
        ? Experiences.find(
            (e) => e.authorId === authUserId && e.promptId === promptId,
          )
        : undefined;

  const { id: storyId, path: storyPath, title: storyTitle } = Story || {};

  const isPromptResponse = Boolean(promptId);
  const isStoryContribution = Boolean(storyId);

  const baseUrl = getBaseUrl();

  const storyPermalink = createPromptCollectionStoryPermalink(storyPath);
  const storyFullPermalink = `${baseUrl}${storyPermalink}`;

  const promptChallengePermalink = createPromptChallengePermalink(promptId);
  const promptChallengeFullPermalink = `${baseUrl}${promptChallengePermalink}`;

  let author = promptAuthor || Collaborator;

  // If the author is missing, then use the author from the completed experience if it exists
  if (completedExperience) {
    if (!author) {
      author = completedExperience.Author;
    }
    if (!prompt.Collaborator) {
      prompt.Collaborator = author;
    }
  }

  const {
    author: promptAuthorName,
    authorFirstName,
    authorUsername,
    authorWebsite,
  } = mapPromptCollaboratorAuthorDetails(author);

  const promptDescription =
    `An Experience Nevada prompt challenge ${promptAuthorName ? `by ${promptAuthorName}` : ''}`.trim();

  const promptAllAssets = Experiences?.flatMap((e) => e.Media) || [];

  const imageAssets = (
    promptAllAssets.length > 0
      ? promptAllAssets
          .filter((a) => (a?.urlOriginal ? isImage(a.urlOriginal) : false))
          .map((a) =>
            a?.urlOriginal
              ? getNextImageUrlForManipulation(a.urlOriginal)
              : null,
          )
          .filter(Boolean)
      : []
  ) as string[];

  const videoAssets = (
    promptAllAssets.length > 0
      ? promptAllAssets
          .filter((a) => (a?.urlOriginal ? isVideo(a.urlOriginal) : false))
          .map((a) => (a ? a.urlOriginal : null))
          .filter(Boolean)
      : []
  ) as string[];

  const openGraphImages = [...imageAssets].filter(Boolean);
  const openGraphVideos = [...videoAssets].filter(Boolean);

  return {
    found: true,
    prompt: mapPromptRecordToClientFriendlyVersion(prompt),

    // Permalinks
    promptPermalinkRelative: promptChallengePermalink,
    promptPermalinkFull: promptChallengeFullPermalink,
    storyPermalink: storyPermalink,
    storyPermalinkFull: storyFullPermalink,

    // Experience details
    expId,
    experiences: Experiences || [],
    completedExperience,

    // Story details
    storyId: storyIdProp || storyId,
    storyTitle: storyTitle,
    storyPath: storyPath,

    // Prompt details
    id: promptId,
    question: promptQuestion,
    response: promptResponse,
    title: `${promptQuestion} | Prompt Challenge by ${promptAuthor}`,
    description:
      promptDescription.length > 150
        ? promptDescription.slice(0, 150)
        : promptDescription,

    // Convenience flags
    isPromptResponse,
    isStoryContribution,

    // Author details
    author,
    authorName: promptAuthor,
    authorFirstName,
    authorUsername,
    authorWebsite,

    // Assets
    assets: [],

    // Open Graph
    openGraphUrl: promptChallengeFullPermalink,
    openGraphTitle: `${promptQuestion} | Prompt Challenge by ${promptAuthorName}`,
    openGraphDescription: promptDescription,
    openGraphImages,
    openGraphVideos,
    openGraphCreators: [authorUsername ? `@${authorUsername}` : ''],
  };
}

/**
 * Map a single prompt collection (story series) to the client-friendly version
 */
function mapSinglePromptCollectionForPageView(
  story: PromptStoryModel | undefined,
  promptId?: string | null,
  expId?: string | null,
  userProfileId?: string,
): StorySeriesPageViewModel {
  if (!story) {
    return {
      found: false,

      // Permalinks
      permalinkRelative: '',
      permalinkFull: '',

      // Story details
      id: null,
      path: undefined,
      story: undefined,
      title: 'Prompt Collection Not Found',
      description: 'Sad Panda',
      logo: undefined,
      banner: undefined,
      website: undefined,
      videoUrl: undefined,
      videoCaption: undefined,

      // Prompt details
      activePrompt: undefined,

      // Author details
      activeAuthor: undefined,

      // Experience details
      activeExperience: undefined,
      completedExperience: undefined,

      // List of experiences, prompts, and collaborators
      experiences: [] as ExperienceModel[],
      collaborators: [] as USER_PROFILE_MODEL[],
      prompts: [] as ExperienceUserPromptModel[],

      // Assets
      opengraphAssets: [] as unknown[],
    };
  }

  const {
    id: storyId,
    path: storyPath,
    logo: storyLogo,
    banner: storyBanner,
    title: storyTitle,
    website: storyWebsite,
    videoUrl: storyVideoUrl,
    videoCaption: storyVideoCaption,
    description: storyDescription,
    Experiences,
    Prompts: promptChallenges,
    Collaborators,
  } = story;

  const openGraphImages = [storyLogo].filter(Boolean);

  const promptStoryPermalink = createPromptCollectionStoryPermalink(storyPath);
  const promptStoryFullPermalink = `${getBaseUrl()}${promptStoryPermalink}`;

  const activeExperience =
    expId && Experiences.length > 0
      ? Experiences.find((e) => e.id === expId)
      : promptId && Experiences.length > 0
        ? Experiences.find((e) => e.promptId === promptId)
        : undefined;

  const activePrompt =
    promptId && promptChallenges.length > 0
      ? (promptChallenges.find(
          (p) => p.id === promptId,
        ) as ExperienceUserPromptModel)
      : undefined;

  const collaborators = (
    Collaborators?.length > 0
      ? Collaborators.map((pc) => pc).filter(Boolean)
      : []
  ) as USER_PROFILE_MODEL[];

  const experienceAuthor = activeExperience?.Author
    ? mapDbUserToClientFriendlyUser(activeExperience.Author)
    : undefined;

  const activeAuthor = experienceAuthor
    ? experienceAuthor
    : userProfileId && collaborators.length > 0
      ? collaborators.find((c) => c.id === userProfileId)
      : undefined;

  // Re-assign the the scrubbed author to the active experience
  if (activeExperience?.Author) {
    activeExperience.Author = experienceAuthor;
  }

  // Completed prompt challenge by the user
  const userCompletedPromptExperience =
    userProfileId && Experiences.length > 0
      ? Experiences.find(
          (exp) => exp.authorId === userProfileId && exp.promptId === promptId,
        )
      : undefined;

  return {
    found: true,

    // Permalinks
    permalinkRelative: promptStoryPermalink,
    permalinkFull: promptStoryFullPermalink,

    // Story details
    story,
    id: storyId,
    path: storyPath,
    title: storyTitle,
    description: storyDescription,
    logo: storyLogo,
    banner: storyBanner,
    website: storyWebsite,
    videoUrl: storyVideoUrl,
    videoCaption: storyVideoCaption,

    // Prompt details
    activePrompt,

    // Author details
    activeAuthor: activeAuthor,

    // Experience details
    activeExperience: activeExperience ? activeExperience : undefined,
    completedExperience: userCompletedPromptExperience,

    // List of experiences, prompts, and collaborators
    collaborators: collaborators,
    experiences: Experiences,
    prompts: promptChallenges as ExperienceUserPromptModel[],

    // Assets
    opengraphAssets: openGraphImages as unknown[],
  };
}

export async function getUserProfileMetadataAssets(
  userProfile: USER_PROFILE_MODEL,
  numOfOpenGraphImages = 1,
) {
  const userFeaturedAssets = await getCachedUserPublicFeaturedImgs(
    userProfile.id,
  ).then((assets) => {
    // Sort by staffPick and then by createdAt
    return assets?.length
      ? assets
          .sort((a, b) => {
            if (a.staffPick && !b.staffPick) {
              return -1;
            }

            if (!a.staffPick && b.staffPick) {
              return 1;
            }

            if (b.createdAt && a.createdAt) {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            }

            return 0;
          })
          .map((asset) => ({
            url: asset.urlOriginal
              ? getNextImageUrlForManipulation(asset.urlOriginal)
              : asset.url,
          }))
          .filter((asset) => asset.url)
      : [];
  });

  const { avatar, image, name, username } = userProfile;

  const usersAvatarUrl = avatar || image;

  const profileTitle = `${name ? `${name}'s Profile` : 'User Profile'}`;

  const profileUrl = `${getBaseUrl()}/profile/${username}`;

  // Only take up to X image(s) from the user's featured assets
  const opengraphAssets = userFeaturedAssets.length
    ? userFeaturedAssets.slice(0, numOfOpenGraphImages)
    : [];

  // Add the user's avatar to the list of images
  if (usersAvatarUrl) {
    opengraphAssets.push({ url: usersAvatarUrl });
  }

  return {
    title: profileTitle,
    url: profileUrl,
    avatar: usersAvatarUrl,
    description: userProfile.bio,
    assets: userFeaturedAssets,
    opengraphAssets,
  };
}

/**
 * Get/derive the metadata for a completed prompt challenge view by the expId
 *
 * @note These prompts are for a specific user and their completed prompt challenge, which is an experience and may include media/assets.
 *
 */
export async function getUserCompletedPromptMetadataByExpId(
  expId: string,
  numOfOpenGraphImages = 2,
) {
  const userCompletedPromptCollaboration =
    await getCachedPromptCollaboratorByExpId(expId);

  const completedPromptPermalinkPath =
    createUserCompletedPromptChallengePermalink(expId);

  const completedPromptFullPermalink = `${getBaseUrl()}${completedPromptPermalinkPath}`;

  if (!userCompletedPromptCollaboration) {
    console.warn(`No user completed prompt found for expId: ${expId}`);
    return {
      prompt: undefined,
      id: null,
      found: false,
      title: 'Completed Prompt Challenge',
      url: completedPromptFullPermalink,
      description: 'An Experience Nevada Prompt Challenge',
      author: undefined,
      authorFirstName: undefined,
      authorWebsite: undefined,
      authorUsername: undefined,
      assets: [],
      opengraphAssets: [],
    };
  }

  // If the user has completed the prompt challenge, but the experience media is missing from the payload, then fetch the media
  if (
    userCompletedPromptCollaboration.Experience &&
    !userCompletedPromptCollaboration.Experience.Media
  ) {
    const expMedia = await getCachedMediaByExperienceId(
      userCompletedPromptCollaboration.Experience.id,
    );
    if (expMedia) {
      userCompletedPromptCollaboration.Experience.Media = sortRawMediaByLatLong(
        expMedia,
      ) as ExperienceMediaModel[];
    }
  }

  const {
    Experience: promptExperience,
    Prompt,
    Collaborator,
  } = userCompletedPromptCollaboration;

  const promptAssets = promptExperience.Media || [];
  const mappedPromptAssets = promptAssets.length
    ? promptAssets.map((p) => {
        // console.log(`**** mapping p url to next image url`, {
        //   url: p.url,
        //   originalUrl: p.urlOriginal,
        // });
        // Let's first try to optimize the original image if it exists
        if (p.urlOriginal) {
          return {
            url: getNextImageUrlForManipulation(p.urlOriginal),
          };
        }

        return {
          url: p.url.includes('_next')
            ? p.url
            : getNextImageUrlForManipulation(p.url),
        };
      })
    : [];

  // Only take up to X image(s) from the user's featured assets
  const opengraphAssets = mappedPromptAssets.length
    ? mappedPromptAssets.slice(0, numOfOpenGraphImages)
    : [];

  const promptQuestion = Prompt.prompt;
  const promptAuthor = Collaborator.name;
  const promptAuthorFirstName = getUsersFirstNameFromName(Collaborator.name);
  const promptDescription =
    promptExperience.description || promptExperience.content;
  const promptAuthorUsername = Collaborator.username;

  return {
    prompt: mapPromptRecordToClientFriendlyVersion(
      promptExperience as unknown as ExperienceUserPromptModel,
    ),
    id: promptExperience.promptId,
    found: true,
    title: `${promptQuestion} | Prompt Challenge by ${promptAuthor}`,
    url: completedPromptFullPermalink,
    description:
      promptDescription.length > 150
        ? promptDescription.slice(0, 150)
        : promptDescription,
    author: promptAuthor,
    authorFirstName: promptAuthorFirstName,
    authorWebsite: Collaborator.urlSocial || Collaborator.url,
    authorUsername: promptAuthorUsername,
    assets: promptAssets,
    opengraphAssets,
  };
}

type SingleExperienceMetadataOpts = {
  isProfilePublic?: boolean | null;
  profileRelativeUrl?: string;
  numOfOpenGraphImages?: number;
};

/**
 * Get/derive the metadata for a completed experience view by the expId
 *
 */
export async function getUserCompletedSingleExperienceMetadataById(
  expId: string,
  opts = {} as SingleExperienceMetadataOpts,
) {
  // 'use cache';

  // cacheLife('experiencePost');

  const {
    isProfilePublic = false,
    profileRelativeUrl = '',
    numOfOpenGraphImages = 2,
  } = opts;

  const completedExperiencePermalinkPath = createUserProfileExperiencePermalink(
    expId,
    profileRelativeUrl,
  );

  let completedExperienceFullPermalink = `${getBaseUrl()}${completedExperiencePermalinkPath}`;

  const experience = (await getCachedSingleUserExperienceForFrontend(
    expId,
  )) as ExperienceModel;

  if (!experience) {
    console.warn(`No user completed prompt found for expId: ${expId}`);
    return {
      found: false,
      experience: undefined,

      // Permalinks
      experiencePermalinkRelative: completedExperiencePermalinkPath,
      experiencePermalinkFull: completedExperienceFullPermalink,

      // Experience details
      id: null,
      title: 'Completed Experience Not Found',
      url: completedExperienceFullPermalink,
      description: 'An experience',
      content: '',
      richContent: '',

      // Story and Prompt Challenge details
      storyId: null,
      storyTitle: '',
      storyPath: '',

      promptId: null,
      promptTitle: '',
      promptQuestion: '',
      promptResponse: '',

      // Convenience flags
      isPromptResponse: false,
      isStoryContribution: false,

      // Author details
      author: undefined,
      authorUsername: undefined,
      authorFirstName: undefined,
      authorWebsite: undefined,

      // Assets
      assets: [],

      // Open Graph
      openGraphTitle: '',
      openGraphDescription: '',
      openGraphImages: [],
      openGraphVideos: [],
      openGraphCreators: [],
      openGraphUrl: '',
    };
  }

  // Experience details
  const {
    Author,
    Media,
    Story,
    prompt,
    content,
    richContent,
    title: titleProp,
    promptId: promptIdProp,
    storyId: storyIdProp,
  } = experience;

  const title = titleProp;
  const description = content;

  // Story and Prompt Challenge details
  const storyId = storyIdProp;
  const storyTitle = Story?.title;
  const storyPath = Story?.path;
  const isStoryContribution = Boolean(storyId);

  const promptQuestion = prompt;
  const promptResponse = content;
  const isPromptChallengeResponse = Boolean(promptIdProp);

  // Author details
  const authorName = Author?.name;
  const authorUsername = Author?.username;
  const authorFirstName = getUsersFirstNameFromName(Author?.name);
  const authorWebsite = Author?.urlSocial || Author?.url;

  // Assets
  // Only take up to X image(s) from the user's featured assets
  const sortedExperienceMedia = Media?.length
    ? sortRawMediaForGallery<ExperienceMediaModel[]>(Media)
    : [];

  const experienceAssets =
    isProfilePublic && sortedExperienceMedia?.length
      ? sortedExperienceMedia.slice(0, numOfOpenGraphImages)
      : [];

  const imageAssets = experienceAssets
    .filter((a) => (a?.urlOriginal ? isImage(a.urlOriginal) : false))
    .map((a) =>
      a?.urlOriginal ? getNextImageUrlForManipulation(a.urlOriginal) : null,
    )
    .filter(Boolean) as string[];

  const videoAssets = experienceAssets
    .filter((a) => (a?.urlOriginal ? isVideo(a.urlOriginal) : false))
    .map((a) => (a ? a.urlOriginal : null))
    .filter(Boolean) as string[];

  const openGraphImages = isProfilePublic
    ? [...imageAssets].filter(Boolean)
    : [];
  const openGraphVideos = isProfilePublic
    ? [...videoAssets].filter(Boolean)
    : [];

  // Open Graph
  const ogProfileTitle = isProfilePublic
    ? isPromptChallengeResponse && authorName
      ? `${promptQuestion} by ${authorName}`
      : title
        ? `${title} by ${authorName}`
        : `An Experience by ${authorName}`
    : 'Private Experience';

  const ogSiteTitle = isPromptChallengeResponse
    ? getAboutTitleTemplate(ogProfileTitle)
    : getAboutTitleTemplate(ogProfileTitle);
  // const ogSiteDescription = siteDescription;

  const ogDescription = isProfilePublic ? content : description;

  const ogCreators =
    authorUsername && isProfilePublic ? [`@${authorUsername}`] : undefined;

  // Update the full permalink with the prompt or story path if warranted
  if (isPromptChallengeResponse && !isStoryContribution) {
    completedExperienceFullPermalink =
      createUserCompletedPromptChallengePermalink(expId);
  } else if (isStoryContribution && promptIdProp) {
    completedExperienceFullPermalink =
      createSingleCompletedStoryPromptChallengePermalink(
        expId,
        promptIdProp,
        storyPath,
      );
  }

  if (!completedExperienceFullPermalink.startsWith(getBaseUrl())) {
    completedExperienceFullPermalink = `${getBaseUrl()}${completedExperienceFullPermalink}`;
  }

  const ogUrl = completedExperienceFullPermalink;

  return {
    found: true,
    experience,
    id: expId,

    // Permalinks
    experiencePermalinkRelative: completedExperiencePermalinkPath,
    experiencePermalinkFull: completedExperienceFullPermalink,

    // Experience details
    title: title,
    content: content,
    richContent: richContent,
    url: completedExperienceFullPermalink,
    description:
      description.length > 150 ? description.slice(0, 150) : description,

    // Story and Prompt Challenge details
    storyId: storyId,
    storyTitle: storyTitle,
    storyPath: storyPath,

    promptId: promptIdProp,
    promptQuestion: promptQuestion,
    promptResponse: promptResponse,

    // Convenience flags
    isPromptResponse: isPromptChallengeResponse,
    isStoryContribution: isStoryContribution,

    // Author details
    authorName: authorName,
    authorUsername: authorUsername,
    authorFirstName: authorFirstName,
    authorWebsite: authorWebsite,

    // Assets
    assets: experienceAssets,

    // Open Graph
    openGraphTitle: ogSiteTitle,
    openGraphDescription: ogDescription,
    openGraphImages: openGraphImages,
    openGraphVideos: openGraphVideos,
    openGraphCreators: ogCreators,
    openGraphUrl: ogUrl,
  };
}

/**
 * Get/derive the metadata for a prompt challenge view by the promptId
 *
 * @note These prompts are for the general public so we're not fetching the user's featured images or the like.
 */
export async function getPromptChallengeMetadataByPromptId(
  promptId: string,
  expId?: string | null,
  numOfOpenGraphImages = 1,
) {
  const authUserSession = await getUserFromSession();
  const promptChallenge = await getCachedSingleExperiencePromptById(promptId, {
    story: true,
  });

  return mapSinglePromptChallengeForPageView(
    promptChallenge,
    expId,
    authUserSession,
  );
}

export type FeaturedStorySeriesProps = {
  prompts?: boolean;
  collaborators?: boolean;
  experiences?: boolean;
};

/**
 * Fetch all featured collections then map them to the client-friendly version similar to the getPromptCollectionAndMetaByPath function
 *
 * @note Prompt Collections are Story Series by another name
 */
export async function getAllFeaturedStorySeries(
  props?: FeaturedStorySeriesProps,
) {
  const {
    prompts = false,
    collaborators = false,
    experiences = false,
  } = props || {};

  const featuredPromptCollections = await getCachedFeaturedPromptCollections(
    true, // featured
    true, // published
    {
      prompts,
      collaborators,
      experiences,
    },
  );

  const baseUrl = getBaseUrl();
  const storySeriesPermalink = createFeaturedStorySeriesRootPermalink();
  const storySeriesFullPermalink = `${baseUrl}${storySeriesPermalink}`;

  const title = 'Story Series';

  const description = `Story Series are themed prompt challenges that highlight the best of Nevada, its people and its progress. They offer a fun and engaging way to share and explore the state's rich history, culture, innovations and natural beauty through personal stories, collaborations and insights.`;

  if (!featuredPromptCollections) {
    console.warn('No featured story series found');
    return {
      found: false,

      permalinkRelative: storySeriesPermalink,
      permalinkFull: storySeriesFullPermalink,

      stories: [] as StorySeriesPageViewModel[],

      title,
      description,

      opengraphAssets: [] as unknown[],
    };
  }

  const mappedFeaturedPromptCollections = featuredPromptCollections.map(
    (story) => {
      return mapSinglePromptCollectionForPageView(story);
    },
  );

  // Get all open graph images from the featured stories
  const opengraphAssets = mappedFeaturedPromptCollections.flatMap(
    (story) => story.opengraphAssets,
  );

  return {
    found: true,

    permalinkRelative: storySeriesPermalink,
    permalinkFull: storySeriesFullPermalink,

    stories: mappedFeaturedPromptCollections as StorySeriesPageViewModel[],

    title,
    description,

    opengraphAssets: opengraphAssets as unknown[],
  };
}

/**
 * Get/derive the metadata for a prompt collection and meta by the ID
 *
 * @note Prompt collections (aka: stories) are a set of prompts that are grouped together.
 */
export async function getPromptCollectionAndMetaByPath(
  path: string,
  promptId?: string,
  expId?: string,
  userProfileId?: string,
) {
  const promptStory = await getCachedSinglePromptCollectionByPath(path, {
    prompts: true,
    collaborators: true,
    experiences: true,
  });

  const mappedStory = mapSinglePromptCollectionForPageView(
    promptStory,
    promptId,
    expId,
    userProfileId,
  );

  const { found } = mappedStory;

  if (!found) {
    console.warn(`No user completed prompt found for path: ${path}`);
    return mappedStory;
  }

  return mappedStory;
}

/**
 * Get/derive the metadata for a completed prompt view by the promptId and expId
 *
 */
export async function getCompletedStoryPromptChallengeMetadata(
  storyPath: string,
  promptId: string,
  expId: string,
  userSessionProfileId?: string,
) {
  const baseUrl = getBaseUrl();
  // /prompts/stories/:storyPath
  const storyPermalink = createPromptCollectionStoryPermalink(storyPath);
  const storyFullPermalink = `${baseUrl}${storyPermalink}`;

  // /prompts/stories/:storyPath/:promptId
  const storyPromptPermalink = createSingleStoryPromptChallengePermalink(
    promptId,
    storyPath,
  );

  const storyPromptFullPermalink = `${baseUrl}${storyPromptPermalink}`;

  // /prompts/stories/:storyPath/:promptId/completed/:expId
  const completedStoryPromptPermalink =
    createSingleCompletedStoryPromptChallengePermalink(
      expId,
      promptId,
      storyPath,
    );
  const completedStoryPromptFullPermalink = `${baseUrl}${completedStoryPromptPermalink}`;

  // Retrieve the completed prompt challenge from the cache (db)
  const completedStoryCollaboration =
    await getCachedCompletedPromptCollaborationsByPromptIdAndExpId(
      promptId,
      expId,
      storyPath,
    );

  if (!completedStoryCollaboration) {
    console.warn(`No user completed prompt found for promptId: ${promptId}`);
    return {
      found: false,

      // Permalinks
      storyPermalinkRelative: storyPermalink,
      storyPermalinkFull: storyFullPermalink,
      promptPermalinkRelative: storyPromptPermalink,
      promptPermalinkFull: storyPromptFullPermalink,
      completedPromptPermalinkRelative: completedStoryPromptPermalink,
      completedPromptPermalinkFull: completedStoryPromptFullPermalink,

      // Story details
      story: undefined,
      storyTitle: 'Story Not Found',
      storyDescription: 'Sad Panda',
      storyLogo: undefined,
      storyBanner: undefined,
      storyWebsite: undefined,
      storyVideoUrl: undefined,

      // Experience details
      expId: expId,
      experience: undefined,
      experiences: [] as ExperienceModel[],

      // Prompt challenge details
      id: null,
      prompt: undefined,
      question: '',
      response: '',
      title: 'Requested Completed Prompt Challenge Not Found',
      description: 'An Experience Nevada Prompt Challenge',

      // Author details
      author: undefined,
      authorName: undefined,
      authorFirstName: undefined,
      authorWebsite: undefined,
      authorUsername: undefined,

      // Assets
      assets: [],
      openGraphVideos: [],
      openGraphImages: [],
    };
  }

  const {
    Story,
    Collaborator: activeAuthor,
    Experience: completedExperience,
    Prompt: activePrompt,
  } = completedStoryCollaboration;

  // Author details
  const expAuthorId = completedExperience?.authorId ?? activeAuthor?.id;

  const experienceAuthor = activeAuthor
    ? activeAuthor
    : expAuthorId
      ? await getUserProfileById(expAuthorId)
      : undefined;

  const promptAuthorDetails =
    mapPromptCollaboratorAuthorDetails(experienceAuthor);

  const {
    author: promptAuthorName,
    authorFirstName: promptAuthorFirstName,
    authorUsername: promptAuthorUsername,
    authorWebsite: promptAuthorWebsite,
  } = promptAuthorDetails;

  // Fallbacks for missing author and prompt
  if (completedExperience) {
    // If the experience author is missing, then use the prompt author
    if (!completedExperience?.Author && experienceAuthor) {
      completedExperience.Author = experienceAuthor;
    }
    // If the experience prompt is missing, then use the active prompt
    if (!completedExperience?.Prompt && activePrompt) {
      completedExperience.Prompt = activePrompt;
    }
    // If the experience story is missing, then use the story
    if (!completedExperience?.Story && Story) {
      completedExperience.Story = Story;
    }
  }

  // Prompt details
  const promptQuestion = activePrompt.prompt;
  const promptResponse = activePrompt.content;

  const promptDescription =
    `A story contribution ${promptAuthorName ? `by ${promptAuthorName}` : ''}`.trim();

  const promptTitle = `${promptQuestion} | Story Contribution by ${promptAuthorName}`;

  // Story details
  const { Experiences } = Story || {};
  const storyTitle = Story?.title;
  const storyDescription = Story?.description;
  const storyLogo = Story?.logo;
  const storyBanner = Story?.banner;
  const storyWebsite = Story?.website;
  const storyVideoUrl = Story?.videoUrl;

  // Assets
  const sortedExperienceMedia = completedExperience?.Media?.length
    ? sortRawMediaForGallery<ExperienceMediaModel[]>(completedExperience.Media)
    : [];

  const completedExperienceAssets = sortedExperienceMedia || [];

  const imageAssets = completedExperienceAssets
    .filter((a) => (a.urlOriginal ? isImage(a.urlOriginal) : false))
    .map((a) => (a ? a.urlOriginal : null))
    .filter(Boolean) as string[];

  const videoAssets = completedExperienceAssets
    .filter((a) => (a.urlOriginal ? isVideo(a.urlOriginal) : false))
    .map((a) => (a ? a.urlOriginal : null))
    .filter(Boolean) as string[];

  const openGraphImages = [...imageAssets, storyLogo].filter(Boolean);
  const openGraphVideos = [...videoAssets].filter(Boolean);

  return {
    found: true,

    // Permalinks
    storyPermalinkRelative: storyPermalink,
    storyPermalinkFull: storyFullPermalink,
    promptPermalinkRelative: storyPromptPermalink,
    promptPermalinkFull: storyPromptFullPermalink,
    completedPromptPermalinkRelative: completedStoryPromptPermalink,
    completedPromptPermalinkFull: completedStoryPromptFullPermalink,

    // Story details
    story: Story,
    storyTitle: storyTitle,
    storyDescription: storyDescription,
    storyLogo: storyLogo,
    storyBanner: storyBanner,
    storyWebsite: storyWebsite,
    storyVideoUrl: storyVideoUrl,

    // Experience details
    expId,
    experience: completedExperience,
    experiences: Experiences || [],

    // Prompt challenge details
    prompt: mapPromptRecordToClientFriendlyVersion(activePrompt),
    id: activePrompt.id,
    title: promptTitle,
    question: promptQuestion,
    response: promptResponse,
    description:
      promptDescription.length > 150
        ? promptDescription.slice(0, 150)
        : promptDescription,

    // Author details
    author: experienceAuthor,
    authorName: promptAuthorName,
    authorFirstName: promptAuthorFirstName,
    authorUsername: promptAuthorUsername,
    authorWebsite: promptAuthorWebsite,

    // Assets
    assets: completedExperienceAssets,
    openGraphVideos,
    openGraphImages,
  };
}
