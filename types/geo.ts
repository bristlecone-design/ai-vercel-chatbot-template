import type { Geo } from '@vercel/edge';
import type { GeolocatedResult } from 'react-geolocated';

export interface GeoBase extends Geo {}

export interface GeoResponse extends GeoBase {
  location: string;
  defaultCity?: string;
  parsedCity: string;
}

export interface GeometrySimple {
  lat: GeoResponse['latitude'];
  lng: GeoResponse['longitude'];
}

export type UserGeo = Geo & {
  ip: string | null;
};

export type UserAppGeoCoordinates = Omit<
  GeolocationCoordinates,
  'latitude' | 'longitude'
> & {
  // Retype as number or string
  latitude: number | string;
  longitude: number | string;
};

export type UserAppGeo = GeolocatedResult & {
  location: string;
  isPreciseLocation: boolean;
};
