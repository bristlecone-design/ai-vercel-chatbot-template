/**
 * New Google Places API
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/op-overview
 *
 * For Place Text Search
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * For Place Details
 * @see https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 */

export const BASE_PLACES_NEW_URL = 'https://places.googleapis.com/v1/places';

// https://developers.google.com/maps/documentation/places/web-service/text-search#text-search-requests
export const PLACES_NEW_SEARCH_TEXT_URL = `${BASE_PLACES_NEW_URL}:searchText`;

// Required Fields: FieldMask
// https://developers.google.com/maps/documentation/places/web-service/text-search#required-parameters
export const PLACES_NEW_ALL_FIELDS_MASK = '*';
export const PLACES_NEW_BASE_FIELDS_MASK =
  'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.priceLevel,places.location,places.viewport,places.googleMapsUri,places.websiteUri,places.regularOpeningHours,places.businessStatus,places.primaryType,places.evChargeOptions,places.fuelOptions,places.allowsDogs,places.delivery,places.dineIn,places.editorialSummary,places.evChargeOptions,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.menuForChildren,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.reservable,places.restroom,places.reviews,places.servesBeer,places.servesBreakfast,places.servesBrunch,places.servesCocktails,places.servesCoffee,places.servesDinner,places.servesLunch,places.servesVegetarianFood,places.servesWine,places.takeout';

/**
 * Legacy Google Places API
 */
// https://developers.google.com/maps/documentation/places/web-service/search-find-place#fields
export const PLACE_FIELDS =
  'formatted_address,name,photos,types,opening_hours,price_level,rating,user_ratings_total,place_id,type,business_status,vicinity';

export const PLACE_DETAILS_FIELDS =
  'address_component,address_components,adr_address,alt_id,geometry,icon,name,permanently_closed,photo,place_id,plus_code,type,url,utc_offset,vicinity,website,formatted_phone_number';

export const BASE_PLACES_LEGACY_URL =
  'https://maps.googleapis.com/maps/api/place/';
// https://developers.google.com/maps/documentation/places/web-service/details
export const PLACE_DETAILS_URL = `${BASE_PLACES_LEGACY_URL}details/json?`;

export const MAX_WIDTH_IMAGE = '400';
