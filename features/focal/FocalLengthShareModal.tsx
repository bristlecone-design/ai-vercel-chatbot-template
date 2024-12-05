import type { PhotoDateRange } from '@/features/photo';

import ShareModal from '@/components/share-photo';

import { shareTextFocalLength } from '.';
import FocalLengthOGTile from './FocalLengthOGTile';

import type { Photo } from '@/types/photo';
import {
  absolutePathForFocalLength,
  pathForFocalLength,
} from '@/config/site-paths';

export default function FocalLengthShareModal({
  focal,
  photos,
  count,
  dateRange,
}: {
  focal: number;
  photos: Photo[];
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <ShareModal
      pathShare={absolutePathForFocalLength(focal)}
      pathClose={pathForFocalLength(focal)}
      socialText={shareTextFocalLength(focal)}
    >
      <FocalLengthOGTile {...{ focal, photos, count, dateRange }} />
    </ShareModal>
  );
}
