'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearPathCache, clearTagCache } from '@/actions/cache';
import {
  CACHE_KEY_PUBLIC_FEATURED_PHOTOS,
  CACHE_KEY_USER_EXPERIENCE,
  CACHE_KEY_USER_EXPERIENCES,
} from '@/actions/cache-keys';
import { useAppState } from '@/state/app-state';
import { useDebouncedCallback } from 'use-debounce';

import { sortRawMediaForGallery } from '@/lib/media/media-utils';
import { fetchUserProfileFromDb, getUserFromSession } from '@/lib/session';
import {
  getUsersFirstNameFromName,
  getUsersLastNameFromName,
} from '@/lib/user/user-utils';
import { sleep } from '@/lib/utils';

import {
  createGeneratedCompletePromptCacheKey,
  createGeneratedIncompletePromptCacheKey,
} from '../utils/experience-prompt-utils';
import {
  createUserProfileExperiencePermalink,
  getUniqueExperiencesById,
  getUserProfilePermalink,
  sortExperiencesForUserProfilePage,
} from '../utils/experience-utils';

import type {
  ExperienceMediaModel,
  ExperienceModel,
  PartialExperienceModel,
} from '@/types/experiences';
import type { USER_PROFILE_MODEL } from '@/types/user';

/**
 * Creates a hash of experiences with the id and cachedAt as the key
 *
 * @note This is used to compare the source experiences with the added experiences
 *
 * @note If an experience doesn't have a cachedAt, it's considered a new experience on the client. If it does, it's considered a source experience. Source experiences are the source of truth.
 *
 * @example Output: ['id-cachedAt', 'id-cachedAt', ...]
 */
function createExperiencesHashList(experiences: ExperienceModel[]) {
  return experiences
    .map(
      (exp) => `${exp.id}-${exp.cachedAtTimestamp ? exp.cachedAtTimestamp : ''}`
    )
    .sort();
}

const useSyncExperiencesWithServer = ({
  notEnabled = false,
  intervalDelay = 7500,
  experiences,
  serverExperiences,
  setExperiences,
  handleSortingList,
  // setAddedExperiences,
}: {
  notEnabled?: boolean;
  intervalDelay?: number;
  experiences: ExperienceModel[];
  serverExperiences: ExperienceModel[];
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceModel[]>>;
  handleSortingList: (expList: ExperienceModel[]) => ExperienceModel[];
  // setAddedExperiences: React.Dispatch<React.SetStateAction<ExperienceModel[]>>;
}) => {
  const [updatingExperiences, setUpdatingExperiences] = React.useState(false);

  const analyzedAndUpdateExperiences = useDebouncedCallback(
    async ({
      experiences,
      serverExperiences,
      setExperiences,
      handleSortingList,
    }: {
      experiences: ExperienceModel[];
      serverExperiences: ExperienceModel[];
      setExperiences: React.Dispatch<React.SetStateAction<ExperienceModel[]>>;
      handleSortingList: (expList: ExperienceModel[]) => ExperienceModel[];
    }) => {
      if (updatingExperiences || !notEnabled) {
        return;
      }

      setUpdatingExperiences(true);

      const toSyncAddLocally: ExperienceModel[] = [];
      const toSyncRemoveLocally: ExperienceModel[] = [];

      // First, iterate through the server experiences
      for await (const serverExp of serverExperiences) {
        const foundExpInProvider = experiences.find(
          (exp) => exp.id === serverExp.id
        );

        if (foundExpInProvider) {
          // If a removed experience is found in the provider, compare the updatedAt dates. If they're equal, skip. If the server experience is newer, update the experience in the provider
          if (foundExpInProvider.removed) {
            // console.log(`**** found removed experience in provider`, {
            //   provider: foundExpInProvider,
            //   server: serverExp,
            // });
            if (foundExpInProvider.updatedAt === serverExp.updatedAt) {
              // console.log(`**** updatedAt dates are equal, skipping`, {
              //   expId: foundExpInProvider.id,
              //   updatedAt: foundExpInProvider.updatedAt,
              //   provider: foundExpInProvider,
              //   server: serverExp,
              // });
              continue;
            }
          }

          if (serverExp.cachedAtTimestamp) {
            // Compare the cachedAtTimestamp
            // If the server experience is newer, update the experience in the provider
            if (foundExpInProvider.cachedAtTimestamp) {
              const serverExpDate = serverExp.cachedAtTimestamp;
              const providerExpDate = foundExpInProvider.cachedAtTimestamp;

              if (serverExpDate > providerExpDate) {
                toSyncAddLocally.push(serverExp);
              }
            } else {
              toSyncAddLocally.push(serverExp);
            }
          }
        } else {
          toSyncAddLocally.push(serverExp);
        }
      }
      // console.log(`**** toSyncAddLocally`, toSyncAddLocally);
      // Next, iterate through the provider experiences for any removed experiences
      for await (const providerExp of experiences) {
        const foundExpInServer = serverExperiences.find(
          (exp) => exp.id === providerExp.id
        );

        if (providerExp.removed && !foundExpInServer) {
          toSyncRemoveLocally.push(providerExp);
        }
      }

      // Lastly, update the provider experiences based on the toSyncAddLocally and toSyncRemoveLocally lists
      setExperiences((experiences) => {
        const unmodifiedExperiences = experiences.filter(
          (exp) => !toSyncAddLocally.some((syncExp) => syncExp.id === exp.id)
        );

        const toSyncRemoveLocallyIds = toSyncRemoveLocally.map((exp) => exp.id);
        const unmodifiedExperiencesAfterRemoval = unmodifiedExperiences.filter(
          (exp) => !toSyncRemoveLocallyIds.includes(exp.id)
        );

        return [...unmodifiedExperiencesAfterRemoval, ...toSyncAddLocally];
      });

      setUpdatingExperiences(false);
    },
    intervalDelay,
    {
      leading: true,
    }
  );

  React.useEffect(() => {
    if (!notEnabled) {
      return;
    }

    const experiencesHash = createExperiencesHashList(experiences);
    const serverExperiencesHash = createExperiencesHashList(serverExperiences);
    const areExperiencesEqual =
      JSON.stringify(experiencesHash) === JSON.stringify(serverExperiencesHash);
    // console.log(`***** experience hash values`, {
    //   experiencesHash,
    //   serverExperiencesHash,
    //   areExperiencesEqual,
    // });

    if (!updatingExperiences && !areExperiencesEqual) {
      // console.log(`**** syncing provider experiences with server experiences`);

      analyzedAndUpdateExperiences({
        experiences,
        serverExperiences,
        setExperiences,
        handleSortingList,
      });
    }
  }, [
    notEnabled,
    updatingExperiences,
    JSON.stringify(serverExperiences),
    JSON.stringify(experiences),
  ]);
};

export type UserExperiencePostsContextType = {
  //-- Experience Lists
  // All + Added experiences
  experiences: ExperienceModel[]; // From the server (source of truth)
  partialExperiences: PartialExperienceModel[];
  filteredExperiences: ExperienceModel[]; // Filtered and sorted for UI
  addedExperiences?: ExperienceModel[];
  removedExperiences?: ExperienceModel[];
  updatedExperiences?: ExperienceModel[];
  sourceExperiences: ExperienceModel[];

  countExperiences: number;
  countFilteredExperiences: number;

  //-- User and Profile Info

  //-- Flags
  // Initiate the creation of a new experience
  createExperienceEnabled?: boolean;
  experienceCreatedSuccessfully: boolean | null;

  //-- Profile User
  // Specifically for the profile user not the auth user
  userProfile: USER_PROFILE_MODEL;
  profileUserDisplayName?: string | null;
  profileUserFirstName: string | null;
  profileUserLastName?: string | null;
  profilePermalink: string;
  profileUsername: string;
  profileUserId: string;
  // Auth User
  isProfilePublic?: boolean;
  isAuthUserOwnProfile: boolean;

  //-- Handlers
  // Create Experience Handlers
  handleEnablingCreateExperience: (nextState?: boolean) => void;
  handleDisablingCreateExperience: (nextState?: boolean) => void;
  handleOnSuccessfullyCreatedExperience: (
    newExperience: ExperienceModel,
    clearUserProfileCache?: boolean,
    closeDialog?: boolean
  ) => void;

  // User + Profile Info Handlers
  handleGettingAuthUser: () => void;
  handleGettingUserProfile: (userId?: string) => void;
  handleIsProfilePublic: () => void;
  handleIsInPrivateBeta: () => void;
  handleIsAuthenticated: () => void;

  // Add/Remove Experience Handlers
  handleRemovingExperience: (
    expToRemove: ExperienceModel,
    clearAndRefresh?: boolean
  ) => void;
  handleAddingExperience: (
    expToAdd: ExperienceModel,
    clearAndRefresh?: boolean
  ) => void;
  handleUpdatingExperience: (
    updatedExperience: ExperienceModel,
    setNewDate?: boolean,
    clearAndRefresh?: boolean
  ) => void;
  handleInitializingSingleExperience: (initExp: ExperienceModel) => void;
  handleSortingExperiences: (expList: ExperienceModel[]) => ExperienceModel[];
  // Get Raw Experiences which are the source of truth (server)
  handleGettingRawExperiences: () => void;
  handleGettingRawExperiencesById: (userId: string) => void;

  // Cache Clearing and Refreshing Handlers
  handleRefreshingView?: () => void;
  handleClearingUserAuthorProfileCache?: (profilePath?: string) => void;
  handleClearingPathCache?: (pathname?: string) => void;
  handleClearingAllUserExperiencesTagCache?: (
    userId: string,
    refresh?: boolean,
    key?: string
  ) => void;
  handleClearingSingleUserExperiencesTagCache?: (
    expId: string,
    refresh?: boolean,
    key?: string
  ) => void;
};

export const UserExperiencePostsDefaultValues: UserExperiencePostsContextType =
  {
    experiences: [],
    partialExperiences: [],
    addedExperiences: [],
    removedExperiences: [],
    filteredExperiences: [],
    updatedExperiences: [],
    sourceExperiences: [],

    countExperiences: 0,
    countFilteredExperiences: 0,

    createExperienceEnabled: false,
    experienceCreatedSuccessfully: null,

    // Profile User
    userProfile: {} as USER_PROFILE_MODEL,
    profileUserId: '',
    profileUserFirstName: '',
    profileUsername: '',
    profilePermalink: '',
    isAuthUserOwnProfile: false,
    isProfilePublic: false,

    // Auth User
    // authUser: {} as AppUser,
    // isAuthenticated: false,
    // isInPrivateBeta: false,

    // Handlers
    // Add/Remove Experience Handlers
    handleEnablingCreateExperience: () => {},
    handleDisablingCreateExperience: () => {},
    handleOnSuccessfullyCreatedExperience: () => {},
    handleRemovingExperience: () => {},
    handleUpdatingExperience: () => {},
    handleAddingExperience: () => {},
    handleInitializingSingleExperience: () => {},
    handleSortingExperiences: () => [],
    handleGettingRawExperiences: () => [],
    handleGettingRawExperiencesById: () => null,

    // Profile User
    handleGettingUserProfile: () => {},

    // Auth User
    handleGettingAuthUser: () => {},
    handleIsProfilePublic: () => {},
    handleIsInPrivateBeta: () => {},
    handleIsAuthenticated: () => {},
  };

export const UserExperiencePostsContext =
  React.createContext<UserExperiencePostsContextType>(
    UserExperiencePostsDefaultValues
  );

export type UserExperiencePostsProviderProps = Pick<
  UserExperiencePostsContextType & {
    children: React.ReactNode;
  },
  | 'experiences'
  // | 'session'
  // | 'authUser'
  // | 'isInPrivateBeta'
  // | 'isAuthenticated'
  // | 'profilePermalink'
  | 'userProfile'
  | 'isProfilePublic'
  | 'isAuthUserOwnProfile'
  | 'children'
> &
  Partial<
    Pick<
      UserExperiencePostsContextType,
      | 'profileUserId'
      | 'profileUsername'
      | 'profileUserDisplayName'
      | 'profileUserFirstName'
      | 'profileUserLastName'
    >
  > & {
    noServerSync?: boolean;
    partialExperiences?: UserExperiencePostsContextType['partialExperiences'];
  };

export function UserExperiencePostsProvider({
  noServerSync = false, // On by default
  experiences: experiencesProp = [], // Source of truth (e.g. from the server)
  partialExperiences: partialExperiencesProp = [], // Source of truth (e.g. from the server)
  // session,
  // authUser,
  // isInPrivateBeta,
  // isAuthenticated,
  userProfile,
  profileUserId: profileUserIdProp,
  profileUsername: profileUsernameProp,
  profileUserDisplayName: profileUserDisplayNameProp,
  profileUserFirstName: profileUserFirstNameProp,
  profileUserLastName: profileUserLastNameProp,
  isAuthUserOwnProfile,
  isProfilePublic,
  children,
}: UserExperiencePostsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    // userProfile: authUserProfile,
    // userId: authUserProfileId,
    userSession: authUserSession,
    isInPrivateBeta: isAuthUserInPrivateBeta,
  } = useAppState();

  const profileUserId = profileUserIdProp || userProfile.id;
  const profileUsername = profileUsernameProp || userProfile.username || '';
  const profileUserDisplayName =
    profileUserDisplayNameProp || userProfile.name || '';
  const profileUserFirstName =
    profileUserFirstNameProp ||
    getUsersFirstNameFromName(profileUserDisplayName);
  const profileUserLastName = getUsersLastNameFromName(profileUserDisplayName);

  const profilePermalink = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';

  const profileExperienceRootView = profilePermalink
    ? `${profilePermalink}/experiences`
    : '';

  const [experienceCreatedSuccessfully, setExperienceCreatedSuccessfully] =
    React.useState<
      UserExperiencePostsContextType['experienceCreatedSuccessfully']
    >(null);

  // Used for initializing the experiences list and fetching the full experience models from the server
  const [partialExperiences, setPartialExperiences] = React.useState<
    PartialExperienceModel[]
  >(partialExperiencesProp);

  // Experiences list representing the source of truth of full experience models
  const [experiences, setExperiences] =
    React.useState<ExperienceModel[]>(experiencesProp);

  const [updatingExperiences, setUpdatingExperiences] = React.useState(false);

  const [updatedExperiences, setUpdatedExperiences] = React.useState<
    ExperienceModel[]
  >([]);

  const [addedExperiences, setAddedExperiences] = React.useState<
    ExperienceModel[]
  >([]);
  const [removedExperiences, setRemovedExperiences] = React.useState<
    ExperienceModel[]
  >([]);

  const [createExperienceEnabled, setCreateExperienceEnabled] =
    React.useState(false);

  // Handlers

  const handleSortingForUI = (expList: ExperienceModel[]) => {
    const sorted = sortExperiencesForUserProfilePage(
      expList
    ) as ExperienceModel[];
    return sorted.map((exp) => {
      const { Media } = exp;
      if (Media?.length) {
        const sortedMedia = sortRawMediaForGallery<ExperienceMediaModel[]>(
          Media,
          true
        );

        return { ...exp, Media: sortedMedia };
      }

      return exp;
    });
  };

  // Cache Clearing and Refreshing Handlers
  const handleRefreshingView = () => {
    router.refresh();
  };

  const handleClearingUserAuthorProfileCache = (
    profilePath = profileExperienceRootView,
    refresh = false
  ) => {
    if (profilePath) {
      // console.log(`**** clearing user author profile cache`, profilePath);
      clearPathCache(profilePath, 'layout');
    }

    if (refresh) {
      handleRefreshingView();
    }
  };

  const handleClearingPathCache = (
    pathnameToClear = pathname,
    refresh = false
  ) => {
    // console.log(`**** clearing path cache`, pathnameToClear);
    clearPathCache(pathnameToClear);

    if (refresh) {
      handleRefreshingView();
    }
  };

  const handleClearingAllUserExperiencesTagCache = (
    profileId = profileUserId,
    refresh = false,
    key = CACHE_KEY_USER_EXPERIENCES
  ) => {
    const tag = `${profileId}-${key}`;
    // console.log(`**** clearing all user experiences cache`, tag);
    clearTagCache(tag);

    if (refresh) {
      handleRefreshingView();
    }
  };

  const handleClearingAllUserExperienceCompletedPromptsTagCache = (
    profileId = profileUserId,
    refresh = false
  ) => {
    const tag = createGeneratedCompletePromptCacheKey(profileId);
    // console.log(
    //   `**** clearing all user experience completed prompt cache`,
    //   tag
    // );
    clearTagCache(tag);

    if (refresh) {
      handleRefreshingView();
    }
  };

  const handleClearingAllUserExperienceIncompletedPromptsTagCache = (
    profileId = profileUserId,
    refresh = false
  ) => {
    const tag = createGeneratedIncompletePromptCacheKey(profileId);
    // console.log(
    //   `**** clearing all user experience completed prompt cache`,
    //   tag
    // );
    clearTagCache(tag);

    if (refresh) {
      handleRefreshingView();
    }
  };

  const handleClearingSingleUserExperiencesTagCache = (
    expId: string,
    refresh = false,
    key = CACHE_KEY_USER_EXPERIENCE
  ) => {
    const tag = expId;
    // console.log(`**** clearing single experience cache`, tag);
    clearTagCache(tag);

    if (refresh) {
      handleRefreshingView();
    }
  };

  const handleClearingUsersFeaturedImagesCache = async (
    uid = profileUserId
  ) => {
    const tag = uid ? `${uid}-${CACHE_KEY_PUBLIC_FEATURED_PHOTOS}` : '';
    if (tag) {
      // console.log('**** clearing users featured images cache', tag);
      clearTagCache(tag);
    }
  };

  // Add/Remove Experience Handlers
  const handleAddingExperience = async (
    expToAdd: ExperienceModel,
    clearAndRefresh = true
  ) => {
    // Check if already added
    setAddedExperiences((prevAddedExperiences) => {
      const isAlreadyAdded = prevAddedExperiences.some(
        (exp) => exp.id === expToAdd.id
      );

      if (isAlreadyAdded) {
        return prevAddedExperiences;
      }

      return [...prevAddedExperiences, expToAdd];
    });

    // Add the experience to the experiences list in the provider
    setExperiences((experiences) => {
      const isAlreadyAdded = experiences.some((exp) => exp.id === expToAdd.id);

      if (isAlreadyAdded) {
        return { ...experiences, ...expToAdd };
      }

      return [...experiences, expToAdd];
    });

    // Clear the cache and refresh the view
    if (clearAndRefresh) {
      handleClearingSingleUserExperiencesTagCache(expToAdd.id);
      handleClearingAllUserExperiencesTagCache(profileUserId);
      handleClearingAllUserExperienceCompletedPromptsTagCache(profileUserId);
      handleClearingAllUserExperienceIncompletedPromptsTagCache(profileUserId);
      // handleClearingUserAuthorProfileCache(profilePermalink);
      handleRefreshingView();
    }
  };

  // Update Experience Handler
  const handleUpdatingExperience = (
    updatedExperience: ExperienceModel,
    setNewDate = true,
    clearAndRefresh = true
  ) => {
    // console.log(`**** updating experience in provider`, updatedExperience);
    const finalUpdatedExperience = setNewDate
      ? {
          ...updatedExperience,
          updatedAt: new Date(),
        }
      : updatedExperience;

    // Update the updated experiences list
    setUpdatedExperiences((experiences) => {
      // First, the list without the updated experience
      const updatedExperiences = experiences.filter(
        (exp) => exp.id !== updatedExperience.id
      );

      // Then, add the updated experience
      return [...updatedExperiences, finalUpdatedExperience];
    });

    // Then update the core experiences list
    setExperiences((experiences) => {
      return experiences.map((exp) => {
        if (exp.id === updatedExperience.id) {
          return finalUpdatedExperience;
        }

        return exp;
      });
    });

    if (clearAndRefresh) {
      handleClearingSingleUserExperiencesTagCache(updatedExperience.id);
      // handleClearingAllUserExperiencesTagCache(profileUserId);
      // handleClearingUserAuthorProfileCache(profilePermalink);
      handleRefreshingView();
    }
  };

  // Remove Experience Handler
  const handleRemovingExperience = (
    expToRemove: ExperienceModel,
    clearAndRefresh = true
  ) => {
    const removedExperience = { ...expToRemove, removed: true };

    // const { prompt, Prompt } = expToRemove;
    // console.log(`**** prompt model in handleRemovingExperience`, prompt);
    // Check if already added to the removed list
    setRemovedExperiences((prevRemovedExperiences) => {
      const isAlreadyRemoved = prevRemovedExperiences.some(
        (exp) => exp.id === expToRemove.id
      );

      if (isAlreadyRemoved) {
        return prevRemovedExperiences;
      }

      return [...prevRemovedExperiences, removedExperience];
    });

    // Update the experiences list in the provider to reflect the removal property
    handleUpdatingExperience(removedExperience, false);

    // Lastly, clear the cache and refresh the view
    if (clearAndRefresh) {
      handleClearingSingleUserExperiencesTagCache(expToRemove.id);
      handleClearingAllUserExperiencesTagCache(profileUserId);
      handleClearingAllUserExperienceCompletedPromptsTagCache(profileUserId);
      handleClearingAllUserExperienceIncompletedPromptsTagCache(profileUserId);
      // handleClearingUserAuthorProfileCache(profilePermalink);
      handleRefreshingView();
    }
  };

  /**
   * Handle initializing an experience
   *
   * @note This simple pushes a full experience model to the experiences list
   * @note This is handy for when a user is viewing a single experience and the full experience model is needed via lazy loading
   */
  const handleInitializingSingleExperience = (initExp: ExperienceModel) => {
    setExperiences((experiences) => {
      const isAlreadyAdded = experiences.some((exp) => exp.id === initExp.id);

      if (isAlreadyAdded) {
        return experiences;
      }

      return [...experiences, initExp];
    });
  };

  // Get Raw Experiences which are the source of truth (server)
  const handleGettingRawExperiences = () => {
    return experiencesProp;
  };

  const handleGettingRawExperiencesById = (expId: string) => {
    return experiencesProp.filter((exp) => exp.id === expId);
  };

  // Create Experience Handlers
  const handleEnablingCreateExperience = (nextState = true) => {
    setCreateExperienceEnabled(nextState);
  };

  const handleDisablingCreateExperience = (nextState = false) => {
    setCreateExperienceEnabled(nextState);
  };

  const handleOnSuccessfullyCreatedExperience = async (
    newExperience: ExperienceModel,
    clearUserProfileCache = true,
    closeDialog = true
  ) => {
    // console.log(
    //   `**** Successfully created experience within handleOnSuccessfullyCreatedExperience provider`,
    //   newExperience,
    //   clearUserProfileCache
    // );
    // Add the experience to the added list but don't clear the cache
    // We'll do that after the experience is added to the source experiences
    handleAddingExperience(newExperience, false);

    // If the experience has media, clear the users featured images cache
    const { Media } = newExperience;
    const hasMedia = Media && Media.length > 0;
    if (hasMedia) {
      handleClearingUsersFeaturedImagesCache(profileUserId);
    }

    // Clear the primary user profile and experiences cache
    if (clearUserProfileCache) {
      handleClearingSingleUserExperiencesTagCache(newExperience.id);
      handleClearingAllUserExperiencesTagCache(profileUserId);
      // handleClearingUserAuthorProfileCache();

      // Prefetch the profile page
      await sleep(25);
      const experiencePermalink = createUserProfileExperiencePermalink(
        newExperience.id,
        profilePermalink
      );
      // console.log(`**** experiencePermalink to prefetch`, {
      //   profilePermalink,
      //   experiencePermalink,
      // });
      router.prefetch(experiencePermalink);

      if (profileExperienceRootView) {
        router.prefetch(profileExperienceRootView);
      }

      await sleep(25);
    }

    if (closeDialog) {
      setCreateExperienceEnabled(false);
    }
  };

  // User + Profile Info Handlers
  const handleGettingAuthUser = async () => {
    if (!authUserSession) {
      return await getUserFromSession();
    }
    return authUserSession;
  };

  const handleGettingUserProfile = async (userId?: string) => {
    if (!userProfile) {
      if (userId) {
        return await fetchUserProfileFromDb(userId);
      }
    }

    return userProfile;
  };

  const handleIsProfilePublic = () => {
    return Boolean(isProfilePublic) || userProfile?.public;
  };

  const handleIsInPrivateBeta = () => {
    return Boolean(isAuthUserInPrivateBeta);
  };

  const handleIsAuthenticated = () => {
    return Boolean(authUserSession);
  };

  // Sync the experiences with the server
  useSyncExperiencesWithServer({
    notEnabled: noServerSync,
    experiences,
    serverExperiences: experiencesProp,
    setExperiences,
    handleSortingList: handleSortingForUI,
  });

  // Filter out and ensure latest experiences are shown
  const filteredExperiences = handleSortingForUI(
    getUniqueExperiencesById([...experiences])
  );

  // Prepare the provider props
  const providerProps: UserExperiencePostsContextType = {
    // Experience Lists
    experiences,
    partialExperiences,
    filteredExperiences,
    addedExperiences,
    removedExperiences,
    updatedExperiences,
    sourceExperiences: experiencesProp,
    // filteredExperiences,

    // Counters
    countExperiences: experiences.length,
    countFilteredExperiences: filteredExperiences.length,

    // Flags
    createExperienceEnabled,
    experienceCreatedSuccessfully: false,

    // User + Profile Info
    // session,
    // authUser,
    userProfile,
    profileUsername,
    profileUserId,
    profilePermalink,
    isProfilePublic,
    profileUserDisplayName,
    profileUserFirstName,
    profileUserLastName,
    isAuthUserOwnProfile,
    // isInPrivateBeta,
    // isAuthenticated,

    // Handlers

    // Create Experience Handlers
    handleEnablingCreateExperience,
    handleDisablingCreateExperience,
    handleOnSuccessfullyCreatedExperience,
    handleGettingRawExperiencesById,
    handleGettingRawExperiences,

    // User + Profile Info Handlers
    handleGettingAuthUser,
    handleGettingUserProfile,
    handleIsProfilePublic,
    handleIsInPrivateBeta,
    handleIsAuthenticated,

    // CRUD and UI Experience Handlers
    handleAddingExperience,
    handleRemovingExperience,
    handleUpdatingExperience,
    handleInitializingSingleExperience,
    handleSortingExperiences: handleSortingForUI,

    // Cache Clearing and Refreshing Handlers
    handleRefreshingView,
    handleClearingPathCache,
    handleClearingUserAuthorProfileCache,
    handleClearingAllUserExperiencesTagCache,
    handleClearingSingleUserExperiencesTagCache,
  };

  return (
    <UserExperiencePostsContext.Provider value={providerProps}>
      {children}
    </UserExperiencePostsContext.Provider>
  );
}

/**
 * Custom hook to access the UserExperiencePostsContext
 */
export function useUserExperiencePosts(
  props?: Partial<UserExperiencePostsContextType>
) {
  const context = React.useContext(UserExperiencePostsContext);

  if (context === undefined) {
    throw new Error(
      'useUserExperiencePosts must be used within a UserExperiencePostsProvider'
    );
  }

  // Set the experiences from the props if provided
  // TODO: This is not working as expected
  if (props?.experiences) {
    // const { experiences } = context;
    // context.experiences = getUniqueExperiencesById(
    //   getMostRecentExperiencesByUpdatedAt(props.experiences, experiences)
    // );
  }

  return context;
}
