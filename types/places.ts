import type { placesSchema } from '@/lib/db/schema';
import type { z } from 'zod';

import type {
  AddressType as GoogleAddressType,
  PlaceData as GooglePlaceDataType,
  PlacePhoto as GooglePlacePhotoType,
  Place as PlaceType,
} from '@googlemaps/google-maps-services-js';

export interface PLACE_MODEL extends z.infer<typeof placesSchema> {}

export type GooglePlacePhoto = GooglePlacePhotoType & { src: string };

export type FindPlaceResponse = {
  photo: GooglePlacePhoto;
} & PlaceType &
  GooglePlaceDataType;

export type GooglePlaceData = GooglePlaceDataType;

export type GoogleAddressComponent = GooglePlaceData['address_components'];

export type GoogleAddressTypes = GoogleAddressType[];

export type GooglePlace = PlaceType;

export type StoredGooglePlace = PlaceType & { id?: string };
