import type { PhotoDateRange } from '@/features/photo';
import PhotoSetHeader from '@/features/photo/PhotoSetHeader';

import { descriptionForFocalLengthPhotos } from '.';
import PhotoFocalLength from './PhotoFocalLength';

import type { Photo } from '@/types/photo';
import { pathForFocalLengthShare } from '@/config/site-paths';

export default function FocalLengthHeader({
  focal,
  photos,
  selectedPhoto,
  indexNumber,
  count,
  dateRange,
}: {
  focal: number;
  photos: Photo[];
  selectedPhoto?: Photo;
  indexNumber?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <PhotoSetHeader
      entity={<PhotoFocalLength focal={focal} contrast="high" />}
      entityDescription={descriptionForFocalLengthPhotos(
        photos,
        undefined,
        count
      )}
      photos={photos}
      selectedPhoto={selectedPhoto}
      sharePath={pathForFocalLengthShare(focal)}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />
  );
}
