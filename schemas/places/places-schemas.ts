import {
  type ChargingStationOptionsType,
  chargingStationListSchema,
} from '@/schemas/charging-stations/charging-stations-schemas';
import type { MapLocationType } from '@/schemas/maps/map-schemas';
import { municipalityListSchema } from '@/schemas/municipalities/municipalities-schemas';
import { z } from 'zod';

import type { Embeddings, Place } from '@/lib/db/schema';
import type { ExperienceMediaModel } from '@/types/experiences';

/**
 * Conversational places and establishments
 *
 * Schema for inferring places and establishments from a chat message between the user and the AI. Goal is to identify places and establishments mentioned in the user prompt, context and or AI response.
 */
export const singlePlaceAndEstablishmentSchema = z.object({
  name: z
    .string()
    .describe(
      'Name of the place or establishment, e.g. Reno City Hall, Tesla Supercharging, Eldorado, Hub Coffee Roasters, Great Basin National Park, etc.',
    ),
  municipality: z
    .string()
    .describe(
      'Municipality of the place or establishment, e.g. Las Vegas, Reno, Tonopah, etc.',
    ),
  type: z
    .string()
    .describe(
      'Type of the place or establishment, e.g. Government, chargingStation, Hotel & Casino, Small Business - Coffee, etc.',
    )
    .describe(
      `Places and establishments mentioned in the user prompt, context and or AI response, e.g. [{ name: 'Reno City Hall', type: 'Government' }, { name: 'Tesla Supercharging', type: 'chargingStation' }, {name: 'Eldorado', type: 'Hotel & Casino'}, { name: 'Hub Coffee Roasters', type: 'Small Business - Coffee'}, ...]`,
    ),
  metadata: z.record(z.any()).optional(),
});

export type SinglePlaceAndEstablishmentType = z.infer<
  typeof singlePlaceAndEstablishmentSchema
>;

export const placesAndEstablishmentListSchema = z
  .array(singlePlaceAndEstablishmentSchema)
  .describe(
    'Places and establishments, e.g. parks, small businesses, etc., mentioned in the user prompt or context, e.g. Reno City Hall, Tesla Supercharging, Eldorado, Hub Coffee Roasters, etc.',
  );

export type PlacesAndEstablishmentListType = z.infer<
  typeof placesAndEstablishmentListSchema
>;

/**
 * Place Icons
 */
export const placeIconSchema = z.object({
  path: z.string().describe('Path to the icon image, e.g. url or base64'),
  width: z.string().describe('Width of the icon image'),
  height: z.string().describe('Height of the icon image'),
});

export type PlaceIconType = z.infer<typeof placeIconSchema>;

/**
 * Places, Establishments and Municipalities Object
 */
export const placesAndMunicipalitiesSchema = z.object({
  places: placesAndEstablishmentListSchema,
  municipalities: municipalityListSchema,
  chargingStations: chargingStationListSchema
    .describe(
      'Identify charging providers, brands and municipalities mentioned in context or as requested',
    )
    .optional(),
});

export type PlacesAndMunicipalitiesType = z.infer<
  typeof placesAndMunicipalitiesSchema
>;

export type PlaceWithMapMarkerLocationType = Omit<
  MapLocationType,
  'placeId'
> & {
  placeId: string; // Required for the client side maps
  evOptions?: ChargingStationOptionsType;
  icon?: PlaceIconType | ExperienceMediaModel['thumbnail'];
  similarity?: number;
};

export type PlacesWithMapMarkerLocationType = PlaceWithMapMarkerLocationType[];

export type ParsedPlacesAndMarkersForMaps = {
  places: PlacesAndMunicipalitiesType['places'];
  municipalities: PlacesAndMunicipalitiesType['municipalities'];
  chargingStations: PlacesAndMunicipalitiesType['chargingStations'];
  // Each marker is a location with a placeId, coordinates, etc.
  // Further, each marker is derived from the places, municipalities, etc. lists
  markers: PlacesWithMapMarkerLocationType;
  markerCount?: number;
  parsed: 'success' | 'error' | 'no';
};

export type WithSimilarityType = { similarity: number };
export type PlaceWithSimilarityType = Place &
  Partial<WithSimilarityType> & { query?: string };

export type EmbeddingWithSimilarityType = Embeddings & WithSimilarityType;
