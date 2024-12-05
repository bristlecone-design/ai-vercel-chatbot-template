'use server';

import { cookies } from 'next/headers';

const GEO_LOCATION_COOKIE = 'location';

/**
 * Handle anything cookie related
 * 
 * @see https://nextjs.org/docs/app/api-reference/functions/cookies

 */

export async function createGeoLocationCookie(
  value = '',
  locationKey = GEO_LOCATION_COOKIE,
) {
  if (!value) {
    return;
  }

  (await cookies()).set(locationKey, value);
}

export async function getGeoLocationCookie(locationKey = GEO_LOCATION_COOKIE) {
  return (await cookies()).get(locationKey);
}
