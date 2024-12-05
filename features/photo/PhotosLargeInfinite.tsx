'use client';

import InfinitePhotoScroll from './InfinitePhotoScroll';
import PhotosLarge from './PhotosLarge';

import { PATH_ROOT } from '@/config/site-paths';

export default function PhotosLargeInfinite({
  initialOffset,
  itemsPerPage,
}: {
  initialOffset: number;
  itemsPerPage: number;
}) {
  return (
    <InfinitePhotoScroll
      cacheKey={`page-${PATH_ROOT}`}
      initialOffset={initialOffset}
      itemsPerPage={itemsPerPage}
      wrapMoreButtonInGrid
    >
      {({ photos, onLastPhotoVisible, revalidatePhoto }) => (
        <PhotosLarge
          photos={photos}
          onLastPhotoVisible={onLastPhotoVisible}
          revalidatePhoto={revalidatePhoto}
        />
      )}
    </InfinitePhotoScroll>
  );
}
