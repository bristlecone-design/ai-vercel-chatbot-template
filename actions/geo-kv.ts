'use server';

import { kv } from '@vercel/kv';

export type LatLongLocationType = {
  lat: string;
  long: string;
  location: string;
  fixedLength?: number;
};

export async function saveGeoLatLongLocation({
  lat,
  long,
  location,
  fixedLength,
}: LatLongLocationType) {
  if (fixedLength) {
    lat = Number.parseFloat(lat).toFixed(fixedLength);
    long = Number.parseFloat(long).toFixed(fixedLength);
  }

  const coordKey = `${lat}${long}`;
  await kv.hmset(`experience:geo:${coordKey}`, {
    lat,
    long,
    location,
  });

  await kv.zadd(`user:geo:${coordKey}`, {
    score: Date.now(),
    member: `experience:geo:${coordKey}`,
  });

  return;
}

export async function getGeoLatLongLocation({
  lat,
  long,
}: LatLongLocationType) {
  const data = await kv.hgetall(`experience:geo:${lat}${long}`);
  return data;
}
