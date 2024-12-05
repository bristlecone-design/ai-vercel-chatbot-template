import ShareModal from '@/components/share-photo';

import { shareTextForTag } from '.';
import { Photo, PhotoDateRange } from '../photo';
import TagOGTile from './TagOGTile';

import { absolutePathForTag, pathForTag } from '@/config/site-paths';

export default function TagShareModal({
  tag,
  photos,
  count,
  dateRange,
}: {
  tag: string;
  photos: Photo[];
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <ShareModal
      pathShare={absolutePathForTag(tag)}
      pathClose={pathForTag(tag)}
      socialText={shareTextForTag(tag)}
    >
      <TagOGTile {...{ tag, photos, count, dateRange }} />
    </ShareModal>
  );
}
