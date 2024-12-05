import OGTile from '@/components/og-tile';

import type { Camera } from '.';
import type { PhotoDateRange } from '../photo';
import { descriptionForCameraPhotos, titleForCamera } from './meta';

import type { Photo } from '@/types/photo';
import { absolutePathForCameraImage, pathForCamera } from '@/config/site-paths';

export type OGLoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed';

export default function CameraOGTile({
  camera,
  photos,
  loadingState: loadingStateExternal,
  riseOnHover,
  onLoad,
  onFail,
  retryTime,
  count,
  dateRange,
}: {
  camera: Camera;
  photos: Photo[];
  loadingState?: OGLoadingState;
  onLoad?: () => void;
  onFail?: () => void;
  riseOnHover?: boolean;
  retryTime?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <OGTile
      {...{
        title: titleForCamera(camera, photos, count),
        description: descriptionForCameraPhotos(photos, true, count, dateRange),
        path: pathForCamera(camera),
        pathImageAbsolute: absolutePathForCameraImage(camera),
        loadingState: loadingStateExternal,
        onLoad,
        onFail,
        riseOnHover,
        retryTime,
      }}
    />
  );
}
