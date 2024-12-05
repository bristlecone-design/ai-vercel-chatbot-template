import type { PhotoDateRange } from '@/features/photo';
import PhotoGridPage from '@/features/photo/PhotoGridPage';

import FocalLengthHeader from './FocalLengthHeader';

import type { Photo } from '@/types/photo';

export default function FocalLengthOverview({
  focal,
  photos,
  count,
  dateRange,
  animateOnFirstLoadOnly,
}: {
  focal: number;
  photos: Photo[];
  count: number;
  dateRange?: PhotoDateRange;
  animateOnFirstLoadOnly?: boolean;
}) {
  return (
    <PhotoGridPage
      {...{
        cacheKey: `focal-${focal}`,
        photos,
        count,
        focal,
        header: (
          <FocalLengthHeader
            {...{
              focal,
              photos,
              count,
              dateRange,
            }}
          />
        ),
        animateOnFirstLoadOnly,
      }}
    />
  );
}
