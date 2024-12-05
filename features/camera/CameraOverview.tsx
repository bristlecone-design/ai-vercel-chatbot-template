import PhotoGridPage from '@/photo/PhotoGridPage';

import { createCameraKey, type Camera } from '.';
import type { PhotoDateRange } from '../photo';
import CameraHeader from './CameraHeader';

import type { Photo } from '@/types/photo';

export default function CameraOverview({
  camera,
  photos,
  count,
  dateRange,
  animateOnFirstLoadOnly,
}: {
  camera: Camera;
  photos: Photo[];
  count: number;
  dateRange?: PhotoDateRange;
  animateOnFirstLoadOnly?: boolean;
}) {
  return (
    <PhotoGridPage
      {...{
        cacheKey: `camera-${createCameraKey(camera)}`,
        photos,
        count,
        camera,
        animateOnFirstLoadOnly,
        header: (
          <CameraHeader
            {...{
              camera,
              photos,
              count,
              dateRange,
            }}
          />
        ),
      }}
    />
  );
}
