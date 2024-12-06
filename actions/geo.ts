'use server';

import { headers } from 'next/headers';

import { getErrorMessage } from '@/lib/errors';

import type { GenericFeedbackRecord } from '@/types/feedback';
import type { UserGeo } from '@/types/geo';

/**
 *
 * @see https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
 */
export async function getLocationFromLatLong(lat: string, long: string) {
  // const { text, finishReason, usage } = await generateText({
  //   model: openai('gpt-4o-mini'),
  //   prompt: question,
  // });

  // return { text, finishReason, usage };
  const result = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${process.env.NEXT_PUBLIC_GEO_API_KEY}`,
  );

  const data = await result.json();

  // Get the first result then the address components then the long name from the locality field
  const city = data.results[0].address_components.find(
    (component: { types: string | string[] }) =>
      component.types.includes('locality'),
  ).long_name;

  return city;
}

export async function getCachedLocationFromLatLong(lat: string, long: string) {
  // 'use cache';
  // https://nextjs.org/docs/canary/app/api-reference/functions/// cacheLife
  // cacheLife('minutes');

  return getLocationFromLatLong(lat, long);
}

/**
 * For Headers usage
 * @see https://nextjs.org/docs/app/api-reference/functions/headers
 */

export type GetUserGeoResponse = {
  success: boolean;
  message?: string;
  geo: Partial<UserGeo>;
  error?: boolean;
};

/**
 * Retreive the user's geo location from the headers
 * @resources
 *  - https://nextjs.org/docs/pages/api-reference/functions/next-request#geo
 *  - https://nextjs.org/docs/pages/api-reference/next-config-js/headers
 *
 * @note Refer to middleware.ts for any custom overrides/maps
 */
export async function getUserGeoFromHeaders(): Promise<GetUserGeoResponse> {
  const geo = {} as Partial<UserGeo>;

  try {
    const userHeaders = await headers();
    // Loop through the headers and log them
    for (const [key, value] of userHeaders.entries()) {
      if (value) {
        // IP Address
        if (
          key === 'x-forwarded-for' ||
          key === 'x-real-ip' ||
          key === 'x-user-ip'
        ) {
          geo.ip = value;
        }
        // City, e.g. San Francisco
        if (key === 'x-vercel-ip-city' || key === 'x-ip-city') {
          geo.city = value;
        }
        // Country, e.g. US
        if (key === 'x-vercel-ip-country' || key === 'x-ip-country') {
          geo.country = value;
        }
        // Country Region, e.g. California
        if (
          key === 'x-vercel-ip-country-region' ||
          key === 'x-ip-country-region'
        ) {
          geo.countryRegion = value;
        }
        // Latitude and Longitude
        if (key === 'x-vercel-ip-latitude' || key === 'x-ip-latitude') {
          geo.latitude = value;
        }
        if (key === 'x-vercel-ip-longitude' || key === 'x-ip-longitude') {
          geo.longitude = value;
        }
      }
    }
  } catch (error) {
    console.error('Error in getUserGeoFromHeaders', error);
    const errorMsg = getErrorMessage(error);
    return {
      geo,
      error: true,
      success: false,
      message: errorMsg,
    };
  }

  return {
    message: 'User Geo',
    success: true,
    geo,
  };
}

/**
 * Map common user geo data from headers to use in other actions, e.g. feedback
 *
 * @todo - Add more geo data / make this more dynamic by adding a map of keys to loop through
 *
 */
export async function getAndMapUserGeo() {
  const userGeo = await getUserGeoFromHeaders();

  let userIp: string | undefined | null;
  let userCity: string | undefined | null;
  let userCountryRegion: string | undefined | null;
  let userLat: string | undefined | null;
  let userLong: string | undefined | null;

  const userGeoMeta = {} as GenericFeedbackRecord;

  if (!userGeo.success) {
    return userGeoMeta;
  }

  userIp = userGeo.geo?.ip;
  userCity = userGeo.geo?.city;
  userCountryRegion = userGeo.geo?.countryRegion;
  userLat = userGeo.geo?.latitude;
  userLong = userGeo.geo?.longitude;

  if (userIp) {
    userGeoMeta.ip = userIp;
  }
  if (userCity) {
    userGeoMeta.city = userCity;
  }
  if (userCountryRegion) {
    userGeoMeta.countryRegion = userCountryRegion;
  }
  if (userLat) {
    userGeoMeta.latitude = userLat;
  }
  if (userLong) {
    userGeoMeta.longitude = userLong;
  }

  return userGeoMeta;
}

export async function getIpFromUserGeo() {
  const userGeo = await getUserGeoFromHeaders();
  return userGeo.geo?.ip;
}

export async function getLocationFromUserGeo() {
  const userGeo = await getUserGeoFromHeaders();
  return userGeo.geo?.city;
}

export async function getLatLongFromUserGeo() {
  const userGeo = await getUserGeoFromHeaders();
  return {
    latitude: userGeo.geo?.latitude,
    longitude: userGeo.geo?.longitude,
  };
}
