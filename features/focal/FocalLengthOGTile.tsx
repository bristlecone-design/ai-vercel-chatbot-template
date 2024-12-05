import type { PhotoDateRange } from '@/features/photo';

import OGTile from '@/components/og-tile';

import { descriptionForFocalLengthPhotos, titleForFocalLength } from '.';

import type { Photo } from '@/types/photo';
import {
  absolutePathForFocalLengthImage,
  pathForFocalLength,
} from '@/config/site-paths';

export type OGLoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed';

export default function FocalLengthOGTile({
  focal,
  photos,
  loadingState: loadingStateExternal,
  riseOnHover,
  onLoad,
  onFail,
  retryTime,
  count,
  dateRange,
}: {
  focal: number;
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
        title: titleForFocalLength(focal, photos, count),
        description: descriptionForFocalLengthPhotos(
          photos,
          true,
          count,
          dateRange
        ),
        path: pathForFocalLength(focal),
        pathImageAbsolute: absolutePathForFocalLengthImage(focal),
        loadingState: loadingStateExternal,
        onLoad,
        onFail,
        riseOnHover,
        retryTime,
      }}
    />
  );
}
