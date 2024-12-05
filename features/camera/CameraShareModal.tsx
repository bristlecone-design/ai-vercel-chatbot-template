import ShareModal from '@/components/share-photo';

import type { Camera } from '.';
import type { PhotoDateRange } from '../photo';
import CameraOGTile from './CameraOGTile';
import { shareTextForCamera } from './meta';

import type { Photo } from '@/types/photo';
import { absolutePathForCamera, pathForCamera } from '@/config/site-paths';

export default function CameraShareModal({
  camera,
  photos,
  count,
  dateRange,
}: {
  camera: Camera;
  photos: Photo[];
  count: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <ShareModal
      pathShare={absolutePathForCamera(camera)}
      pathClose={pathForCamera(camera)}
      socialText={shareTextForCamera(camera, photos)}
    >
      <CameraOGTile {...{ camera, photos, count, dateRange }} />
    </ShareModal>
  );
}
