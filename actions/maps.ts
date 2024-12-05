import {
  type ParsedPlacesAndMarkersForMaps,
  type PlacesAndMunicipalitiesType,
  type SinglePlaceAndEstablishmentType,
  placesAndMunicipalitiesSchema,
} from '@/schemas/places/places-schemas';
import type { z } from 'zod';

import { getErrorMessage } from '@/lib/errors';
import {
  filterUniquePlacesByPlaceId,
  mapDbPlacesToMapMarkers,
} from '@/lib/maps/map-utils';

import {
  generateRelevantPlacesFromPrompt,
  lookupMunicipality,
  searchPlaceEmbeddingsInDb,
} from './places';

import { DEFAULT_CHAT_MODEL } from '@/constants/chat-defaults';

/**
 * Retrieve place marker data for usage on the client side maps.
 *
 * @note - This function takes the results from an AI generated prompt and retrieves places from the database.
 *
 * @see - @generateAndRetrievePlacesForMaps as the main entry point.
 */
export async function retrievePlacesAndMarkersForMaps(
  results: PlacesAndMunicipalitiesType,
  requireMunicipality = true,
  similarityThreshold = 0.85,
): Promise<ParsedPlacesAndMarkersForMaps> {
  'use server';

  try {
    const places = results.places || [];
    const chargingStations = results.chargingStations || [];

    if (!places.length && !chargingStations.length) {
      return {
        places: [],
        municipalities: [],
        chargingStations: [],
        markers: [],
        markerCount: 0,
        parsed: 'no',
      };
    }

    const municipalities = results.municipalities || [];
    // Configure to retrieve individual municipalities
    const municipalityPlaces = municipalities.map((m) => {
      return {
        name: m,
        type: 'Municipality',
      } as SinglePlaceAndEstablishmentType;
    });

    const chargingStationsAsPlace =
      places.length && chargingStations.length
        ? chargingStations.map((station) => {
            const xStation = {
              name: `${station.provider} Charging Station`,
              type: 'Charging Station',
            } as SinglePlaceAndEstablishmentType;
            return xStation;
          })
        : [];

    const xPlaces = [
      ...places,
      ...municipalityPlaces,
      ...chargingStationsAsPlace,
    ];
    // console.log(`xPlaces to search`, JSON.stringify(xPlaces, null, 2));

    // Map municipalities to places if available and single place-municipality is not available
    const placesWithMunicapalities = xPlaces.length
      ? xPlaces.map((place) => {
          // Basic scrubbing/validation
          const municipality = place.municipality || municipalities[0] || '';
          const placeName = place.name;

          const isMunicipality = place.type === 'Municipality';
          const isMunicipalityNameUnknown =
            municipality.toLowerCase() === 'unknown' ||
            municipality.toLowerCase() === 'not specified';

          const hasNevada = placeName.toLowerCase().includes('nevada');

          const placeNameHasMunicipality = placeName
            .toLowerCase()
            .includes(municipality.toLowerCase());

          return {
            ...place,
            // Sometimes the place name already contains the municipality
            municipality:
              hasNevada || placeNameHasMunicipality || isMunicipalityNameUnknown
                ? ''
                : municipality,
            metadata: {
              exempt:
                requireMunicipality === false ||
                hasNevada ||
                placeNameHasMunicipality ||
                isMunicipality ||
                isMunicipalityNameUnknown,
            },
          };
        })
      : xPlaces;

    // Query the db with places with municipalities
    // This action gives us our final places with coordinates (aka: markers)
    const queriedPlaces = await Promise.all(
      placesWithMunicapalities
        .filter((p) => {
          const meta = p.metadata || {};
          // Skip places that are exempt from municipality or already have a municipality
          return p.municipality || meta.exempt;
        })
        .map(async (place) => {
          const isMunicipality = place.type === 'Municipality';

          const places = isMunicipality
            ? await lookupMunicipality(place.name)
            : await searchPlaceEmbeddingsInDb(place.name, {
                city: place.municipality,
                similarityThreshold: similarityThreshold,
                limit: 1, // Take top N results
                attachQuery: true,
              });

          return places;
        }),
    );

    // Flatten the queried places
    const flattenedQueriedPlaces = queriedPlaces.flat();
    const nameOfPlaces = flattenedQueriedPlaces.map((p) => p.name);
    // console.log(
    //   `*** flattenedQueriedPlaces results names:`,
    //   JSON.stringify(nameOfPlaces, null, 2)
    // );

    if (!flattenedQueriedPlaces.length) {
      return {
        places,
        municipalities,
        chargingStations,
        markers: [],
        markerCount: 0,
        parsed: 'success',
      };
    }

    const markers = mapDbPlacesToMapMarkers(flattenedQueriedPlaces);
    const uniqueMarkers = filterUniquePlacesByPlaceId(markers);

    return {
      places,
      municipalities,
      chargingStations,
      markers: uniqueMarkers,
      markerCount: uniqueMarkers.length,
      parsed: 'success',
    };
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error(`error in retrievePlacesAndMarkersForMaps`, errMsg);
    return {
      places: [],
      municipalities: [],
      chargingStations: [],
      markers: [],
      markerCount: 0,
      parsed: 'error',
    };
  }
}

/**
 * Generate and retrieve places for usage on the client side maps.
 */
export async function generateAndRetrievePlacesForMaps(
  system: string,
  prompt: string,
  model = DEFAULT_CHAT_MODEL,
  schema: z.Schema = placesAndMunicipalitiesSchema,
  maxTokens = 768,
): Promise<ParsedPlacesAndMarkersForMaps> {
  'use server';

  try {
    const { object, finishReason } = await generateRelevantPlacesFromPrompt(
      system,
      prompt,
      model,
      schema,
      maxTokens,
    );
    console.log(`**** generateAndRetrievePlacesForMaps finished`, finishReason);

    const results = await retrievePlacesAndMarkersForMaps(object);
    return results;
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error(`error in generateAndRetrievePlacesForMaps`, errMsg);
    return {
      places: [],
      municipalities: [],
      chargingStations: [],
      markers: [],
      markerCount: 0,
      parsed: 'error',
    };
  }
}
