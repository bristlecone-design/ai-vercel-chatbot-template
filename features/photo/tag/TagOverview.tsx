import { Photo, PhotoDateRange } from '@/photo';
import PhotoGridPage from '@/photo/PhotoGridPage';

import TagHeader from './TagHeader';

export default function TagOverview({
  tag,
  photos,
  count,
  dateRange,
  animateOnFirstLoadOnly,
}: {
  tag: string;
  photos: Photo[];
  count: number;
  dateRange?: PhotoDateRange;
  animateOnFirstLoadOnly?: boolean;
}) {
  return (
    <PhotoGridPage
      {...{
        cacheKey: `tag-${tag}`,
        photos,
        count,
        tag,
        header: (
          <TagHeader
            {...{
              tag,
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
