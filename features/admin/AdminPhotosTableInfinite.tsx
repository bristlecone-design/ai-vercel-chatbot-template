'use client';

import InfinitePhotoScroll from '../photo/InfinitePhotoScroll';
import AdminPhotosTable from './AdminPhotosTable';

import { PATH_ADMIN_PHOTOS } from '@/config/site-paths';

export default function AdminPhotosTableInfinite({
  initialOffset,
  itemsPerPage,
}: {
  initialOffset: number;
  itemsPerPage: number;
}) {
  return (
    <InfinitePhotoScroll
      cacheKey={`page-${PATH_ADMIN_PHOTOS}`}
      initialOffset={initialOffset}
      itemsPerPage={itemsPerPage}
      useCachedPhotos={false}
      includeHiddenPhotos
    >
      {({ photos, onLastPhotoVisible, revalidatePhoto }) => (
        <AdminPhotosTable
          photos={photos}
          onLastPhotoVisible={onLastPhotoVisible}
          revalidatePhoto={revalidatePhoto}
        />
      )}
    </InfinitePhotoScroll>
  );
}
