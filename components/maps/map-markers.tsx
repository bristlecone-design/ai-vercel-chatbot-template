'use client';

import { useEffect, useState } from 'react';
import type { PlacesWithMapMarkerLocationType } from '@/schemas/places/places-schemas';
import { useGoogleMap } from '@ubilabs/google-maps-react-hooks';

import { getErrorMessage } from '@/lib/errors';

import type { PhotoThumbnail } from '@/types/photo';

export interface MapMarkerProps {
  destinations: PlacesWithMapMarkerLocationType;
}

/**
 * Component to render all map markers
 */
export const MapMarkers = ({ destinations }: MapMarkerProps) => {
  // Get the global map instance with the useGoogleMap hook
  const map = useGoogleMap();
  // console.log(`**** destinations in MapMarkers`, destinations);

  const [, setMarkers] = useState<Array<google.maps.Marker>>([]);

  // Add markers to the map
  useEffect(() => {
    try {
      if (map) {
        const initialBounds = new google.maps.LatLngBounds();

        // const infoWindow = new google.maps.InfoWindow({
        //   content: 'hola',
        //   disableAutoPan: true,
        // });

        // https://developers.google.com/maps/documentation/javascript/reference/marker
        const destinationMarkers: Array<google.maps.Marker | undefined> =
          destinations
            .map((destination, index) => {
              const { coordinates, city: locationName, name } = destination;

              if (!coordinates) return undefined;

              const position = {
                lat: Number(coordinates.latitude),
                lng: Number(coordinates.longitude),
              };

              const markerIcon: PhotoThumbnail | undefined =
                destination.icon || undefined;

              const markerOptions: google.maps.MarkerOptions = {
                map,
                position,
                title: locationName || name,
                label: String(index + 1),
                clickable: true,
                animation: null, //google.maps.Animation.DROP,
              };

              // TODO: Add advanced marker options
              // https://developers.google.com/maps/documentation/javascript/reference/advanced-markers
              // https://github.com/googlemaps/js-markerclusterer/blob/main/examples/defaults.ts
              // https://developers.google.com/maps/documentation/javascript/marker-clustering
              // const advancedMarkerOptions: google.maps.marker.AdvancedMarkerElementOptions =
              //   {
              //     map,
              //     position,
              //     title: locationName || name,
              //     // https://developers.google.com/maps/documentation/javascript/advanced-markers/collision-behavior
              //     collisionBehavior:
              //       google.maps.CollisionBehavior
              //         .OPTIONAL_AND_HIDES_LOWER_PRIORITY,
              //     // label: String(index + 1),
              //     // clickable: true,
              //     // animation: null, //google.maps.Animation.DROP,
              //   };

              if (markerIcon) {
                const iconWidth = Number(markerIcon.width);
                const iconHeight = Number(markerIcon.height);
                markerOptions.icon = {
                  url: markerIcon.path,
                  scaledSize: new google.maps.Size(
                    iconWidth || 72,
                    iconHeight || 72
                  ),
                  scale: 1,
                };
              }

              initialBounds.extend(position);

              const marker = new google.maps.Marker(markerOptions);

              // https://developers.google.com/maps/documentation/javascript/examples/event-simple
              // map.addListener('center_changed', () => {
              //   // 3 seconds after the center of the map has changed, pan back to the
              //   // marker.
              //   console.log(`center changed`);
              //   window.setTimeout(() => {
              //     map.panTo(marker.getPosition() as google.maps.LatLng);
              //   }, 3000);
              // });

              marker.addListener('click', () => {
                const originalZoom = map.getZoom();
                if (originalZoom) {
                  map.setZoom(originalZoom ? originalZoom + 2 : 19);
                }
                const markerPosition =
                  marker.getPosition() as google.maps.LatLng;
                if (markerPosition) {
                  map.setCenter(markerPosition);
                }

                // infoWindow.setContent(position.lat + ', ' + position.lng);
                // infoWindow.open(map, marker);

                // if (markerIcon) {
                //   console.log(
                //     `**** setting icon to larger size on click`,
                //     markerIcon
                //   );
                //   marker.setIcon({
                //     scale: 3.5,
                //     path: markerIcon.path,
                //   });
                // }
              });

              return marker;
            })
            .filter(Boolean);

        // Resize the icon marker based on zoom level
        // map.addListener('zoom_changed', function () {
        //   const currentZoom = map.getZoom();
        //   console.log(`**** zoom changed`, { currentZoom });
        //   console.log(`**** markers on zoom change`, destinationMarkers);
        //   if (destinationMarkers.length) {
        //     // Scale the icon marker to be smaller if zoom level is 15 or less
        //     destinationMarkers.forEach((marker, index) => {
        //       if (marker) {
        //         const markerIcon = marker.getIcon() as google.maps.Icon;
        //         console.log(`**** current markerIcon`, markerIcon);
        //         if (currentZoom && currentZoom <= 15) {
        //           console.log(
        //             `***** zoom is 15 or less, adjust icon size`,
        //             currentZoom
        //           );
        //           marker.setIcon({
        //             ...markerIcon,
        //             path: markerIcon.url,
        //             scale: 0.75,
        //             scaledSize:
        //           });
        //         } else {
        //           console.log(`**** zoom is 15 or greater`, currentZoom);
        //           marker.setIcon({
        //             ...markerIcon,
        //             path: markerIcon.url,
        //             scale: 1.5,
        //           });
        //         }
        //       }
        //     });
        //   }
        // });

        // @note- Temp disabled as it's causing load issues - 5/16/24
        // Set the center of the map to fit markers
        // const cneterOfBounds = initialBounds.getCenter();
        // console.log(`center of bounds to re-center map on`, cneterOfBounds);
        // map.setCenter(cneterOfBounds);

        if (destinationMarkers.length) {
          setMarkers(destinationMarkers as google.maps.Marker[]);
        }

        // Clean up markers
        return () => {
          if (destinationMarkers.length) {
            destinationMarkers.forEach((marker) => marker!.setMap(null));
          }
        };
      } else {
        setMarkers([]);
        return () => {};
      }
    } catch (e) {
      const errMsg = getErrorMessage(e);
      console.error(`Error in MapMarkers`, errMsg);
    }
  }, [map]);

  return null;
};
