'use client';

import type React from 'react';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import type {
  ChargingStationOptionAggregationType,
  ChargingStationOptionsType,
} from '@/schemas/charging-stations/charging-stations-schemas';
import type {
  MapGeoLocationCoordinatesType,
  MapLocationsType,
} from '@/schemas/maps/map-schemas';
import {
  GoogleMapsProvider,
  useGoogleMap,
} from '@ubilabs/google-maps-react-hooks';

import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  IconExternalLink,
  IconHorizontalLinkOff,
  IconList,
  IconMap,
  IconMapPin,
  IconZap,
} from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';
// import MapCanvas from '@/components/map-canvas/map-canvas';
import { MapCanvas } from '@/components/maps/map-canvas';
import { MapMarkers, type MapMarkerProps } from '@/components/maps/map-markers';

import { MAP_STYLES_DARK } from '@/constants/maps';

// Reno
const DEFAULT_COORDINATES = { latitude: 39.5299, longitude: -119.8143 };

const mapOptions = {
  language: 'en',
  region: 'US',
  clickableIcons: true,
  // Default is Reno
  center: {
    lat: DEFAULT_COORDINATES.latitude,
    lng: DEFAULT_COORDINATES.longitude,
  },
  styles: MAP_STYLES_DARK,
  // higher is closer; lower is farther away
  // zoom: 12,
  mapTypeControl: false,
  disableDefaultUI: false,
  zoomControl: true,
  zoomControlOptions: {
    position: 3, // Right top
  },
} as google.maps.MapOptions;

export interface ExperienceMapClientProps {
  msgId?: string;
  mapKey?: string;
  containerId?: string;
  containerClassName?: string;
  destinations: MapMarkerProps['destinations'];
  noRenderList?: boolean;
  listingLabel?: string;
  mapLabel?: string;
  mapContent?: React.ReactNode;
  initialZoomOverride?: number;
  initialZoom?: number;
  className?: string;
  mapId?: string;
}

type ExperienceMapLocation = MapGeoLocationCoordinatesType;

type ExperienceMapCoordinates = {
  latitude: Array<number>;
  longitude: Array<number>;
};

function getDestinationCoordinates(
  destinations: MapLocationsType
): ExperienceMapLocation[] {
  const locations = destinations.reduce((acc, item) => {
    if (item.coordinates?.latitude) {
      acc.push(item.coordinates);
    }

    return acc;
  }, [] as Array<ExperienceMapLocation>);

  if (!locations.length) {
    locations.push(DEFAULT_COORDINATES);
  }

  return locations;
}

function getAllDestinationCoordinates(
  locations: ExperienceMapLocation[]
): ExperienceMapCoordinates {
  let coordinates = {
    latitude: [],
    longitude: [],
  } as ExperienceMapCoordinates;

  try {
    coordinates = locations.reduce((acc, location) => {
      if (location?.latitude) {
        acc.latitude.push(location.latitude);
        acc.longitude.push(location.longitude);
      }

      return acc;
    }, coordinates);
  } catch (e) {
    console.error('Error getAllDestinationCoordinates', getErrorMessage(e));
    coordinates = {
      latitude: [DEFAULT_COORDINATES.latitude],
      longitude: [DEFAULT_COORDINATES.longitude],
    } as ExperienceMapCoordinates;
  }

  return coordinates;
}

function getAvgOfCoordinates(coordinates = [] as Array<number>) {
  return (Math.max(...coordinates) + Math.min(...coordinates)) / 2;
}

const ExperienceMapBoundary = ({
  children,
  locations,
}: React.PropsWithChildren<{
  locations: ExperienceMapLocation[];
}>): ReactElement => {
  const mapInstance = useGoogleMap();

  // Adjust the map boundaries based on the actual destination(s)
  useEffect(() => {
    try {
      if (mapInstance) {
        //Type definitions for non-npm package Google Maps JavaScript API 3.50
        const bounds = new google.maps.LatLngBounds();
        for (const l of locations) {
          if (l?.latitude && l?.longitude) {
            bounds.extend({
              lat: Number.parseFloat(String(l.latitude)),
              lng: Number.parseFloat(String(l.longitude)),
            });
            // Resize based on markers
            // console.log(`bounds`, bounds);
            mapInstance.fitBounds(bounds);
          }
        }
      }
    } catch (e) {
      console.error('Error in ExperienceMapBoundary', getErrorMessage(e));
    }
  }, [mapInstance]);

  // Render the child map markers and canvas
  return <>{children}</>;
};

export const ExperienceMapClient = ({
  mapKey,
  msgId,
  destinations,
  noRenderList = false,
  initialZoom: initialZoomProp = 16,
  initialZoomOverride: initialZoomOverrideProp,
  listingLabel = 'Destinations',
  containerId = 'experience-map-container',
  containerClassName,
  mapContent,
  mapLabel,
  className,
  mapId,
}: ExperienceMapClientProps) => {
  if (!destinations || !destinations.length) {
    return null;
  }

  const allLocations = getDestinationCoordinates(destinations);
  const allCoordinates = getAllDestinationCoordinates(allLocations);
  const avgLatCoordinates = getAvgOfCoordinates(allCoordinates.latitude);
  const avgLngCoordinates = getAvgOfCoordinates(allCoordinates.longitude);

  const locationsCount = destinations.length;

  const [isMounted, setIsMounted] = useState(false);
  const [center, setCenter] = useState({
    // It will be overridden at onLoad
    lat: avgLatCoordinates ?? DEFAULT_COORDINATES.latitude,
    lng: avgLngCoordinates ?? DEFAULT_COORDINATES.longitude,
  });

  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);

  const mapRef = useCallback(
    (node: React.SetStateAction<HTMLDivElement | null>) => {
      node && setMapContainer(node);
    },
    []
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Final map opts
  const mapOptionProps = {
    ...mapOptions,
    center,
    // https://console.cloud.google.com/google/maps-apis/studio/maps/731d4dcb656903c0?authuser=1&project=learned-vortex-412411
    // mapId: mapId || '731d4dcb656903c0',
  };

  return isMounted && locationsCount ? (
    <>
      <div
        id={containerId}
        className={cn(
          'relative flex h-full w-full flex-col gap-2',
          containerClassName
        )}
      >
        {mapLabel && (
          <h2 className="flex items-center gap-2 text-base font-medium leading-snug lg:text-lg">
            <IconMap className="size-4" />
            {mapLabel}
          </h2>
        )}
        <div
          className={cn(
            'boder-border h-[400px] min-h-[250px] w-full overflow-hidden rounded-sm border',
            className
          )}
        >
          <GoogleMapsProvider
            key={`google-maps-client-provider-${isMounted}-${locationsCount}`}
            googleMapsAPIKey={
              mapKey ||
              process.env.GOOGLE_MAPS_API_KEY! ||
              process.env.NEXT_PUBLIC_MAPS!
            }
            mapContainer={mapContainer}
            mapOptions={mapOptionProps}
            // https://developers.google.com/maps/documentation/javascript/advanced-markers/migration
            libraries={['marker']}
            onLoadMap={(map) => {
              // console.log(`onLoadMap in client map`, map);
              const initialZoom = map.getZoom();
              // Let's keep the initial view usable
              if (
                !initialZoomOverrideProp &&
                destinations.length <= 2 &&
                initialZoom &&
                initialZoom > 20
              ) {
                map.setZoom(initialZoomProp);
              } else if (initialZoomOverrideProp) {
                map.setZoom(initialZoomOverrideProp);
              }
            }}
          >
            {/* <React.StrictMode> */}
            <div className="experience-map-container h-full w-full">
              <ExperienceMapBoundary locations={allLocations}>
                <MapCanvas ref={mapRef} />
                <MapMarkers destinations={destinations} />
              </ExperienceMapBoundary>
              {!mapContainer && <BlockSkeleton />}
            </div>
            {/* </React.StrictMode> */}
          </GoogleMapsProvider>
        </div>
        {mapContent}
      </div>
      {!noRenderList && Boolean(destinations?.length) && (
        <div className="flex w-full flex-col gap-4">
          {listingLabel && (
            <h3 className="lg:text-md flex items-center gap-2 text-base font-medium leading-snug">
              <IconList className="size-4" />
              {listingLabel}
              <Badge
                variant="secondary"
                className="text-tiny rounded-full px-1 py-0.5"
              >
                {destinations.length}
              </Badge>
            </h3>
          )}
          <div className="flex max-h-64 flex-col gap-4 overflow-auto">
            <ol className="grid grid-cols-1 flex-col gap-2 sm:grid-cols-2 sm:gap-2">
              {destinations.map((d, i) => {
                const destinationName = d.city || d.name;
                const geo = d.coordinates;
                const geoPath =
                  geo?.latitude && geo?.longitude
                    ? `${geo.latitude},${geo.longitude}`
                    : '';
                const mapUrl = d.url;
                const baseAddress = 'https://maps.google.com/maps/place/';
                const addressToUse = mapUrl
                  ? mapUrl
                  : geoPath
                    ? `${baseAddress}${geoPath}`
                    : `${baseAddress}${destinationName}`;

                const evOpts = (d.evOptions ||
                  {}) as ChargingStationOptionsType;
                const hasEvOptions = Object.keys(evOpts).some((k) => k);

                const evChargeAggregate = (
                  hasEvOptions ? evOpts.connectorAggregation : []
                ) as ChargingStationOptionAggregationType[];

                const connectorAggregationItem =
                  evChargeAggregate[0] || undefined;

                const numOfConnectors = connectorAggregationItem
                  ? connectorAggregationItem?.count
                  : undefined;

                let evChargeRate = String(
                  connectorAggregationItem?.maxChargeRateKw
                    ? Number(connectorAggregationItem.maxChargeRateKw).toFixed(
                        2
                      )
                    : ''
                );

                // If charge rate is x.00, remove the decimal
                if (evChargeRate?.endsWith('.00')) {
                  evChargeRate = evChargeRate.slice(0, -3);
                }

                return (
                  <li
                    key={`destination-${destinationName}-${i}`}
                    className="w-full rounded-md border border-border bg-background p-3 text-sm transition-colors duration-150 hover:border-primary hover:bg-background/80"
                  >
                    {/* <DialogExperienceMap
                      title={`${d.location}`}
                      description={`One of the destinations part of the ${experience.name} experience.`}
                      mapLocation={`${experience.name}-${d.location}`}
                      destinations={[d]}
                    > */}
                    <div className="flex w-full flex-col gap-1">
                      <h3 className="flex items-center gap-2 font-semibold leading-snug">
                        <Badge
                          variant="secondary"
                          className="text-tiny rounded-full px-1.5 py-0.5 font-normal leading-none sm:self-start"
                        >
                          {i + 1}
                        </Badge>
                        <span className="w-full truncate">
                          {d.name && d.website && (
                            <a
                              href={d.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link inverse"
                            >
                              {d.name}
                            </a>
                          )}
                          {d.name && !d.website && d.name}
                        </span>
                      </h3>
                      {/* Address and Details, e.g. EV Options */}
                      <div className="flex w-full flex-col gap-1 pl-6">
                        {d.address && (
                          <div className="flex w-full items-center gap-1.5 text-foreground">
                            <IconMapPin className="size-3.5" />
                            <div className="w-full truncate">
                              <a
                                target="_blank"
                                href={addressToUse}
                                className="link inverse"
                                rel="noreferrer"
                              >
                                {d.address}
                              </a>
                            </div>
                          </div>
                        )}

                        {hasEvOptions && (
                          <div className="flex w-full items-center gap-1.5 text-foreground">
                            <IconZap className="size-3.5" />
                            <div className="flex gap-2">
                              {numOfConnectors && (
                                <span>{numOfConnectors} EV Connectors</span>
                              )}
                              {evChargeRate && (
                                <span>
                                  {/* Update to 2 decimal places */}
                                  {
                                    evChargeRate
                                  } kW{' '}
                                  <span className="sr-only">
                                    Max Charge Rate
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Website */}
                        <div className="flex w-full items-center gap-1.5 text-foreground">
                          {d.website && (
                            <IconExternalLink className="size-3.5" />
                          )}
                          {!d.website && (
                            <IconHorizontalLinkOff className="size-3.5" />
                          )}
                          <div className="flex w-full gap-1 truncate">
                            {d.website && (
                              <a
                                href={d.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link inverse flex gap-1.5"
                              >
                                {hasEvOptions && <span>Provider</span>}
                                Website
                              </a>
                            )}
                            {!d.website && 'No website'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* </DialogExperienceMap> */}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </>
  ) : (
    <BlockSkeleton />
  );
};
