import { z } from 'zod';

export const MapGeoLocationCoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export type MapGeoLocationCoordinatesType = z.infer<
  typeof MapGeoLocationCoordinatesSchema
>;

export const MapGeoViewportSchema = z.object({
  northeast: MapGeoLocationCoordinatesSchema,
  southwest: MapGeoLocationCoordinatesSchema,
});

export type MapGeoViewportType = z.infer<typeof MapGeoViewportSchema>;

export const MapGeoSchema = z.object({
  coordinates: MapGeoLocationCoordinatesSchema,
  viewport: MapGeoViewportSchema.optional(),
});

export type MapGeoType = z.infer<typeof MapGeoSchema>;

export const MapLocationSchema = MapGeoSchema.merge(
  z.object({
    placeId: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    // location: z.string().min(4, 'Provide a location, place or activity'),
    name: z
      .string()
      .min(4, 'Name alternative for location, place or activity')
      .optional(),
    aliases: z.array(z.string()).optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(), // Google Maps URL
  }),
);

export type MapLocationType = z.infer<typeof MapLocationSchema>;

export type MapLocationsType = MapLocationType[];
