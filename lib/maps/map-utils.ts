import type {
  PlaceWithMapMarkerLocationType,
  PlaceWithSimilarityType,
} from '@/schemas/places/places-schemas';

export function mapDbPlacesToMapMarkers(
  items: PlaceWithSimilarityType[],
): PlaceWithMapMarkerLocationType[] {
  if (!items || items.length === 0) {
    return [];
  }

  const markers = items.map((place) => {
    return {
      placeId: place.placeId,
      address:
        place.formattedAddressShort ||
        place.formattedAddress ||
        place.address ||
        '',
      city: place.city,
      // location: place.name,
      name: place.name,
      aliases: place.aliases,
      coordinates: (place.coordinates ||
        place.geometry) as PlaceWithMapMarkerLocationType['coordinates'],
      evOptions:
        place.evChargeOpts as PlaceWithMapMarkerLocationType['evOptions'],
      website: place.website,
      url: place.url,
      // photos: place.photos,
      similarity: place.similarity,
      query: place.query,
    } as PlaceWithMapMarkerLocationType;
  });

  return markers;
}

export function filterUniquePlacesByPlaceId(
  items: PlaceWithMapMarkerLocationType[],
) {
  if (!items || items.length === 0) {
    return [];
  }

  const uniquePlaces = new Map<string, PlaceWithMapMarkerLocationType>();
  [...items].forEach((place) => {
    const placeId = place.placeId;
    if (placeId) {
      uniquePlaces.set(placeId, place);
    }
  });

  return Array.from(uniquePlaces.values());
}
