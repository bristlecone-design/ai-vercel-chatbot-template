import { Photo, PhotoDateRange } from '@/photo';

import OGTile from '@/components/og-tile';

import { descriptionForTaggedPhotos, titleForTag } from '.';

import { absolutePathForTagImage, pathForTag } from '@/config/site-paths';

export type OGLoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed';

export default function TagOGTile({
  tag,
  photos,
  loadingState: loadingStateExternal,
  riseOnHover,
  onLoad,
  onFail,
  retryTime,
  count,
  dateRange,
}: {
  tag: string;
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
        title: titleForTag(tag, photos, count),
        description: descriptionForTaggedPhotos(photos, true, count, dateRange),
        path: pathForTag(tag),
        pathImageAbsolute: absolutePathForTagImage(tag),
        loadingState: loadingStateExternal,
        onLoad,
        onFail,
        riseOnHover,
        retryTime,
      }}
    />
  );
}