import type { Place } from '@/lib/db/schema';
import {
  createPromptChallengePermalink,
  createPromptCollectionStoryPermalink,
  createSingleCompletedStoryPromptChallengePermalink,
  createSingleStoryPromptChallengePermalink,
  createUserCompletedPromptChallengePermalink,
} from './experience-prompt-utils';

import type {
  ExperienceModel,
  PartialExperienceModel,
} from '@/types/experiences';
import type {
  GoogleAddressComponent,
  GoogleAddressTypes,
} from '@/types/places';

import type { USER_PROFILE_MODEL } from '@/types/user';

export function getPlaceNeighborhoodComponent(place: Place) {
  const addressComponents = place.addressComponents as GoogleAddressComponent;

  if (!addressComponents) {
    return false;
  }
  // Find the neighborhood
  const neighborhood = addressComponents.find((component) =>
    component.types.find((t) => t.includes('neighborhood')),
  );
  if (!neighborhood) {
    return false;
  }
  return neighborhood;
}

export function getPlaceNeighborhoodName(place: Place) {
  const neighborhood = getPlaceNeighborhoodComponent(place);
  if (!neighborhood) {
    return false;
  }
  return neighborhood.long_name;
}

export function getTypesOfComponents(place: Place) {
  const types = place.types;
  if (!types) {
    return false;
  }
  return types;
}

export function getNaturalFeatureComponent(place: Place) {
  const addressComponents = place.addressComponents as GoogleAddressComponent;

  if (!addressComponents) {
    return false;
  }
  // Find the natural feature (e.g. Lake Tahoe)
  const naturalFeature = addressComponents.find((component) =>
    component.types.find((t) => t.includes('natural_feature')),
  );
  if (!naturalFeature) {
    return false;
  }
  return naturalFeature;
}

export function getAdminStateComponent(place: Place) {
  const addressComponents = place.addressComponents as GoogleAddressComponent;

  if (!addressComponents) {
    return false;
  }
  // Find the state
  const state = addressComponents.find((component) =>
    component.types.find((t) => t.includes('administrative_area_level_1')),
  );
  if (!state) {
    return false;
  }
  return state;
}

export function getAdminCityComponent(place: Place) {
  const addressComponents = place.addressComponents as GoogleAddressComponent;

  if (!addressComponents) {
    return undefined;
  }
  // Find the city
  const city = addressComponents.find((component) =>
    component.types.find((t) => t.includes('locality')),
  );
  if (!city) {
    return undefined;
  }
  return city;
}

type MappedAddress = {
  streetNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export function createPlaceAddressFromComponents(
  addressComponents: GoogleAddressComponent,
): {
  address: MappedAddress;
  formattedAddress: string;
} {
  if (!addressComponents) {
    return {
      address: {},
      formattedAddress: '',
    };
  }
  const address = addressComponents.reduce((acc, component) => {
    const types = component.types as GoogleAddressTypes;
    for (const type of types) {
      if (type === 'street_number') {
        acc.streetNumber = component.long_name;
      } else if (type === 'route') {
        acc.street = component.long_name;
      } else if (type === 'locality') {
        acc.city = component.long_name;
      } else if (type === 'administrative_area_level_1') {
        acc.state = component.short_name;
      } else if (type === 'postal_code') {
        acc.zipCode = component.long_name;
      }
    }
    return acc;
  }, {} as MappedAddress);

  // Return the object and the stringified version
  const formattedAddress = `${address.streetNumber || ''} ${
    address.street ? `${address.street},` : ''
  } ${address.city ? `${address.city}, ` : ''} ${address.state} ${
    address.zipCode || ''
  }`.trim();

  return {
    address,
    formattedAddress,
  };
}

export function filterOperationalPlaces(places: Place[]) {
  return places.filter((place) => {
    // Return any item that doesn't have an explicit biz status (for now)
    if (!place.businessStatus) {
      return true;
    }
    return place.businessStatus === 'OPERATIONAL';
  });
}

export function filterTemporarilyClosedPlaces(places: Place[]) {
  return places.filter((place) => {
    // Return any item that doesn't have an explicit biz status (for now)
    if (!place.businessStatus) {
      return true;
    }
    return place.businessStatus === 'CLOSED_TEMPORARILY';
  });
}

// Filter for Nevada places that are still in operation
export function filterForPlacesNotClosedPermanently(places: Place[]) {
  return places.filter((place) => {
    // Return any item that doesn't have an explicit biz status (for now)
    if (!place.businessStatus) {
      return true;
    }
    return (
      place.businessStatus && place.businessStatus !== 'CLOSED_PERMANENTLY'
    );
  });
}

export function filterForNaturalFeatureComponent(
  places: Place[],
  allowedFeatures = [
    'Tahoe',
    'Yosemite',
    'Mono Lake',
    'Mojave',
    'Lee Vining',
    'Death Valley',
    'Joshua Tree',
    'Mammoth',
  ],
  allowedTypes = [
    'tourist_attraction',
    'natural_feature',
    'park',
    'point_of_interest',
  ],
) {
  return places.filter((place) => {
    const addressComponents = place.addressComponents;
    if (!addressComponents) {
      return false;
    }
    // Find the natural feature (e.g. Lake Tahoe) and types (e.g. tourist_attraction)
    const naturalFeature = getNaturalFeatureComponent(place);
    const placeTypes = getTypesOfComponents(place);
    if (!naturalFeature && !placeTypes) {
      return false;
    }

    // Compare against lowercase values of allowedFeatures
    let featureAllowed = false;
    if (naturalFeature) {
      featureAllowed = allowedFeatures.some((feature) => {
        return (
          naturalFeature.short_name
            .toLowerCase()
            .includes(feature.toLowerCase()) ||
          naturalFeature.long_name.toLowerCase().includes(feature.toLowerCase())
        );
      });
    }

    // Compare against lowercase values of placeTypes and allowedTypes
    // Then ensure the allowedfeatures is also a substring of the featuresAllowed array
    let typeAllowed = false;
    if (placeTypes) {
      typeAllowed = placeTypes.some((type) => {
        return (
          (allowedTypes.some((allowedType) => {
            return type.toLowerCase().includes(allowedType.toLowerCase());
          }) ||
            allowedTypes.some((allowedType) => {
              return type.toLowerCase().includes(allowedType.toLowerCase());
            })) &&
          allowedFeatures.some((feature) =>
            place.name.toLowerCase().includes(feature.toLowerCase()),
          )
        );
      });
    }

    return featureAllowed || typeAllowed;
  });
}

export function filterForAdminStateComponent(places: Place[]) {
  return places.filter((place) => {
    const addressComponents = place.addressComponents;

    // We're going to return truthy here because we want to include places that don't have a state
    // as we can assume they are in Nevada and filter them out later if they aren't
    if (!addressComponents) {
      return true;
    }
    // Same reasoning below as above block
    const state = getAdminStateComponent(place);
    if (!state) {
      return true;
    }

    return (
      state.short_name?.toLowerCase() === 'nv' ||
      state.long_name?.toLowerCase() === 'nevada' ||
      state.short_name?.toLowerCase() === 'ca' ||
      state.long_name?.toLowerCase() === 'california'
    );
  });
}

// Takes an array of places and returns only the ones that are in Nevada based on address_components long_name or short_name
export function filterForNevadaPlacesAndSpecialFeatures(
  items: Place[],
  allowedBorderTowns = [
    'Truckee',
    'Portola',
    'Basque',
    'Salt Lake',
    'South Lake Tahoe',
    'Boca',
    'Stateline',
    'Susanville',
    'Cedarville',
    'Garrison',
    'Burbank',
    'Alturas',
    'Meeks Bay',
    'Quincy',
    'Willow Beach',
    'Apple Hill',
    'Death Valley',
    'St George',
    'Mohave',
    'Hallelujah',
    'Beckwourth',
    'Stampede',
    'Kings Beach',
    'Tahoe City',
    'Markleeville',
    'Topaz',
    'Bridgeport',
    'Mono Lake',
    'Lee Vining',
    'Susanville',
    'Mammoth',
    'Alturas',
    'Cedarville',
    'Bishop',
  ],
) {
  const nevadaPlaces = filterForAdminStateComponent(items);
  const specialPlaces = filterForNaturalFeatureComponent(items);
  const borderTowns = items.filter((item) => {
    const city = getAdminCityComponent(item);
    const name = item.name;
    if (!city && !name) {
      return false;
    }

    // Check short_name and long_name for border towns
    // Compare against lowercase values of allowedBorderTowns
    return allowedBorderTowns.some((borderTown) => {
      return (
        city?.short_name?.toLowerCase().includes(borderTown.toLowerCase()) ||
        city?.long_name?.toLowerCase().includes(borderTown.toLowerCase()) ||
        name?.toLowerCase().includes(borderTown.toLowerCase())
      );
    });
  });

  const combinedPlaces = [...nevadaPlaces, ...specialPlaces, ...borderTowns];

  return combinedPlaces;
}

// Takes an array of places and return mapped array of places with
// the following properties: id, place_id, name, description, short_description, address, rating
const DEFAULT_PLACE_ATTRS = [
  'id',
  'place_id',
  'name',
  'city',
  'aliases',
  'description',
  'geometry',
  'business_status',
  'short_description',
  'formatted_address',
  'formatted_phone_number',
  'opening_hours',
  'address_components',
  'address',
  'rating',
  'photos',
  'photo',
  'website',
  'url',
  'types',
];

// Filter places by specified attributes
export function filterPlacesByAttributes(
  places: Place[],
  attrs = DEFAULT_PLACE_ATTRS,
): Place[] {
  return places.map((place) => {
    const filteredPlace: any = {};
    attrs.forEach((attr) => {
      if (place[attr]) {
        filteredPlace[attr] = place[attr];
      }
    });
    return filteredPlace;
  });
}

// Map places by specified attributes
export function mapPlacesByAttributes(
  places: Place[],
  attrs = DEFAULT_PLACE_ATTRS,
): Place[] {
  return places.map((place) => {
    const mappedPlace: any = {};
    attrs.forEach((attr) => {
      if (attr === 'address_components') {
        mappedPlace[attr] = place.addressComponents;
      } else if (attr === 'address') {
        mappedPlace[attr] = place.formattedAddress;
      } else if (attr === 'photo') {
        mappedPlace[attr] = place.photo ?? place.photos?.[0];
      } else {
        mappedPlace[attr] = place[attr];
      }
    });
    return mappedPlace;
  });
}

export function mapPlacesAddressIfNeeded(places: Place[]) {
  return places.map((place) => {
    if (place.address || place.formattedAddress) {
      return place;
    }

    const addressComponents = place.addressComponents as GoogleAddressComponent;

    if (!addressComponents) {
      return place;
    }

    const { formattedAddress } =
      createPlaceAddressFromComponents(addressComponents);

    return {
      ...place,
      address: formattedAddress,
    };
  });
}

export function mapPlacesCityIfNeeded(places: Place[]) {
  return places.map((place) => {
    if (place.city) {
      return place;
    }

    const city = getAdminCityComponent(place);
    if (!city) {
      return place;
    }

    return {
      ...place,
      city: city.long_name,
    };
  });
}

/**
 * Orders a list of Places by a specified key
 * like city or name. Compare with lowercase values
 */
export function orderPlacesBy(
  places: Place[],
  key: string,
  direction: 'asc' | 'desc' = 'desc',
) {
  return places.sort((a, b) => {
    const aKey = a[key]?.toLowerCase();
    const bKey = b[key]?.toLowerCase();
    if (aKey < bKey) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aKey > bKey) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

type Order = 'asc' | 'desc';

/**
 * Sort a list of Places by an array of keys and a certain value of the key, like city or name are the keys and Reno or Las Vegas are the values
 */
export function multiKeySort(
  array: Record<string, any>[],
  keys: string[],
  orders: Order[],
) {
  return array.sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const order = orders[i];

      const aKey = a[key]?.toLowerCase();
      const bKey = b[key]?.toLowerCase();

      if (aKey < bKey) {
        return order === 'asc' ? -1 : 1;
      }

      if (aKey > bKey) {
        return order === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });
}

export type SortableExperienceTypes =
  | ExperienceModel[]
  | PartialExperienceModel[];

/**
 * Dedupe an array of Places by place_id
 */
export function dedupePlaces(places: Place[]) {
  return places.reduce((acc, place) => {
    const existing = acc.find((p) => p.placeId === place.placeId);
    if (!existing) {
      acc.push(place);
    }
    return acc;
  }, [] as Place[]);
}

/**
 * Sort experiences by the pinned property
 */
export function sortExperiencesByPinned(
  experiences: SortableExperienceTypes,
  direction: 'asc' | 'desc' = 'asc',
) {
  return experiences.sort((a, b) => {
    if (a.pinned && !b.pinned) {
      return direction === 'asc' ? -1 : 1;
    }
    if (!a.pinned && b.pinned) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  }) as SortableExperienceTypes;
}

/**
 * Sort experiences by the pinnedAt property
 */
export function sortExperiencesByPinnedAt(
  experiences: SortableExperienceTypes,
  direction: 'asc' | 'desc' = 'desc',
) {
  return experiences.sort((a, b) => {
    if (a.pinnedAt && b.pinnedAt) {
      if (a.pinnedAt < b.pinnedAt) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a.pinnedAt > b.pinnedAt) {
        return direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  }) as SortableExperienceTypes;
}

/**
 * Sort experiences by the createdAt property
 */
export function sortExperiencesByCreatedAt(
  experiences: SortableExperienceTypes,
  direction: 'asc' | 'desc' = 'desc',
) {
  return experiences.sort((a, b) => {
    const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdAtA < createdAtB) {
      return direction === 'asc' ? -1 : 1;
    }
    if (createdAtA > createdAtB) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  }) as SortableExperienceTypes;
}

/**
 * Determine if a user has liked an experience based on the likes array
 * and the user's ID
 */
export function determineIfUserLikedExperience(
  experience: ExperienceModel,
  userId: string,
) {
  const liked = false;
  if (!experience.Likes) {
    return {
      ...experience,
      liked,
    };
  }

  return {
    ...experience,
    liked: experience.Likes.some(
      (like) => String(like.userId) === String(userId),
    ),
  };
}

/**
 * Determine if a user has bookmarked an experience based on the bookmarks array and the user's ID
 */
export function determineIfUserBookmarkedExperience(
  experience: ExperienceModel,
  userId: string,
) {
  const bookmarked = false;
  if (!experience.Bookmarks) {
    return {
      ...experience,
      bookmarked,
    };
  }

  return {
    ...experience,
    bookmarked: experience.Bookmarks.some(
      (bookmark) => String(bookmark.userId) === String(userId),
    ),
  };
}

/**
 * Map an array of experiences and determine if the user has liked or bookmarked each experience
 */
export function mapExperiencesWithUserActions(
  experiences: ExperienceModel[],
  userId: string,
) {
  if (!experiences || experiences.length === 0) {
    return [];
  }

  return experiences.map((experience) => {
    const withLike = determineIfUserLikedExperience(experience, userId);
    return determineIfUserBookmarkedExperience(withLike, userId);
  });
}

/**
 * Map a single experience and determine if the user has liked or bookmarked the experience
 *
 * @note Wraps the `mapExperiencesWithUserActions` function for a single experience
 */
export function mapSingleExperienceWithUserActions(
  experience: ExperienceModel,
  userId: string,
) {
  return mapExperiencesWithUserActions([experience], userId)[0];
}

/**
 * Filter out experiences that have been removed or blocked
 */
export function filterBlockedOrRemovedExperiences(
  experiences: ExperienceModel[] | PartialExperienceModel[],
) {
  if (!experiences || experiences.length === 0) {
    return [];
  }
  return experiences.filter(
    (experience) => !experience.removed && !experience.blocked,
  );
}

/**
 * Create User Profile Permalink
 */
export function getUserProfilePermalink(
  username: string,
  basePath = '/profile',
) {
  return `${basePath}/${username}`;
}

/**
 * Create User Profile Experience View Permalink
 *
 * @format /experiences
 */
export function createUserProfileExperienceTabPermalink(profilePath = '') {
  const path = '/experiences';
  return profilePath ? `${profilePath}${path}` : path;
}

/**
 * Create User Profile Experience Post Permalink
 *
 * @format /experiences/:experienceId
 */
export function createUserProfileExperiencePermalink(
  experienceId: string,
  profilePath = '',
) {
  const experiencePermalink = `${createUserProfileExperienceTabPermalink(profilePath)}/${experienceId}`;

  return experiencePermalink;
}

/**
 * Create User Profile Media View Permalink
 *
 * @format /media
 */
export function createUserProfileMediaTabPermalink(profilePath = '') {
  const path = '/media';
  return profilePath ? `${profilePath}${path}` : path;
}

/**
 * Get an array of recent experiences based on the updatedAt property.
 *
 * @note This function compares the server and client experiences and returns one list of the most recent experiences.
 */
export function getMostRecentExperiencesByUpdatedAt(
  serverExperiences: ExperienceModel[],
  clientExperiences: ExperienceModel[],
) {
  if (!serverExperiences || serverExperiences.length === 0) {
    return clientExperiences;
  }

  if (!clientExperiences || clientExperiences.length === 0) {
    return serverExperiences;
  }

  return serverExperiences.map((serverExperience) => {
    const clientExperience = clientExperiences.find(
      (clientExp) => clientExp.id === serverExperience.id,
    );

    if (clientExperience) {
      if (!serverExperience.updatedAt || !clientExperience.updatedAt) {
        return clientExperience;
      }

      return serverExperience.updatedAt >= clientExperience.updatedAt
        ? serverExperience
        : clientExperience;
    }

    return serverExperience;
  });
}

/**
 * Get a unique list of experiences based on the ID property.
 */
export function getUniqueExperiencesById(experiences: ExperienceModel[]) {
  return experiences.reduce((acc, experience) => {
    const existing = acc.find((exp) => exp.id === experience.id);
    if (!existing) {
      acc.push(experience);
    }
    return acc;
  }, [] as ExperienceModel[]);
}

/**
 * Handle sorting experiences for the user profile page UI
 */
export function sortExperiencesForUserProfilePage(
  experiences: ExperienceModel[] | PartialExperienceModel[],
  direction: 'asc' | 'desc' = 'desc',
) {
  return sortExperiencesByPinned(
    sortExperiencesByPinnedAt(
      sortExperiencesByCreatedAt(
        filterBlockedOrRemovedExperiences(experiences),
        direction,
      ),
    ),
  );
}

/**
 * Create context for generating experience prompts
 *
 * @note This function is used to generate personalized experience prompts for the user to engage with.
 * @note This function takes a user profile object and creates a string context for usage in the OpenAI API via `actions/experience-prompts.ts`
 */
export function createContextForGeneratingExperiencePrompts(
  userProfile: USER_PROFILE_MODEL,
) {
  if (!userProfile) {
    return '';
  }

  const { name, role, bio, company, profession, interests, location } =
    userProfile;

  let context = '';

  if (name) {
    context += `Name: ${name}. `;
  }

  if (interests) {
    context += `Interests: ${interests}. `;
  }

  if (bio) {
    context += `Bio: ${bio}. `;
  }

  // The following are contigent on the user having a name, bio, or interests to provide context

  if (context) {
    if (profession) {
      context += `Profession: ${profession}. `;
    }

    if (company) {
      context += `Company: ${company}. `;
    }

    if (location) {
      context += `Location: ${location}. `;
    }

    if (role) {
      context += `Role: ${role}. `;
    }
  }

  return context;
}

/**
 * Get X random experiences from the array of experiences. If the array has less than X experiences, return the array as is.
 */
export function getRandomNumOfExperiences(
  experiences: ExperienceModel[],
  numOfRandomItems = 5,
  includeIds: string[] = [],
): ExperienceModel[] {
  if (experiences.length <= numOfRandomItems) {
    return experiences;
  }

  const randomExperiences = [];
  const randomIndexes: number[] = [];

  while (randomIndexes.length < numOfRandomItems) {
    const randomIndex = Math.floor(Math.random() * experiences.length);

    if (!randomIndexes.includes(randomIndex)) {
      randomIndexes.push(randomIndex);
      randomExperiences.push(experiences[randomIndex]);
    }
  }

  if (includeIds.length > 0) {
    for (const id of includeIds) {
      const found = randomExperiences.find(
        (experience) => experience.id === id,
      );
      if (!found) {
        const experience = experiences.find(
          (experience) => experience.id === id,
        );
        if (experience) {
          randomExperiences.push(experience);
        }
      }
    }
  }

  return randomExperiences;
}

/**
 * Create the set of relevant experience permalinks
 *
 * @note takes into account if an experience is a general experience, one tied to a prompt, or one tied to a story series
 *
 * @note The basePath is the base path for the experience permalinks. It's optional but defaults to `/profile/[username]`
 *
 */
export function createRelevantExperiencePermalinks(
  experience: ExperienceModel,
  basePath = '',
) {
  const { id: expId, Prompt, Story } = experience;
  const { id: promptId } = Prompt || {};
  const { path: storyPath } = Story || {};

  const experiencePermalink = expId
    ? createUserProfileExperiencePermalink(expId, basePath)
    : '';

  const experiencePromptPermalink = promptId
    ? createUserCompletedPromptChallengePermalink(expId, promptId)
    : '';

  const experienceStoryPermalink =
    promptId && storyPath
      ? createSingleCompletedStoryPromptChallengePermalink(
          expId,
          promptId,
          storyPath,
        )
      : '';

  // If the experience is tied to a prompt or story series
  // Reference their permalinks as well
  const promptPermalink = promptId
    ? createPromptChallengePermalink(promptId)
    : '';

  const storyPermalink = storyPath
    ? createPromptCollectionStoryPermalink(storyPath)
    : '';

  const storyPromptPermalink =
    promptId && storyPath
      ? createSingleStoryPromptChallengePermalink(promptId, storyPath)
      : '';

  return {
    experiencePermalink,
    experiencePromptPermalink,
    experienceStoryPermalink,

    // If the experience is tied to a prompt or story series
    promptPermalink,
    storyPermalink,
    storyPromptPermalink,
  };
}
