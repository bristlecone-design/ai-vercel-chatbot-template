import { ReactNode } from 'react';
import { clsx } from 'clsx';

import AnimateItems from '@/components/animations/animated-items';
import DivDebugBaselineGrid from '@/components/div-debug-baseline-grid';
import ShareButton from '@/components/share-button';

import { dateRangeForPhotos, Photo, PhotoDateRange } from '.';

import { HIGH_DENSITY_GRID } from '@/config/site-settings';

export default function PhotoSetHeader({
  entity,
  entityVerb,
  entityDescription,
  photos,
  selectedPhoto,
  sharePath,
  indexNumber,
  count,
  dateRange,
}: {
  entity: ReactNode;
  entityVerb?: string;
  entityDescription: string;
  photos: Photo[];
  selectedPhoto?: Photo;
  sharePath?: string;
  indexNumber?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  const { start, end } = dateRangeForPhotos(photos, dateRange);

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.id === selectedPhoto.id)
    : undefined;

  return (
    <AnimateItems
      type="bottom"
      distanceOffset={10}
      animateOnFirstLoadOnly
      items={[
        <DivDebugBaselineGrid
          key="PhotosHeader"
          className={clsx(
            'grid items-start gap-0.5 sm:gap-1',
            HIGH_DENSITY_GRID
              ? 'xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-5'
              : 'xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4'
          )}
        >
          <span
            className={clsx(
              'inline-flex uppercase',
              HIGH_DENSITY_GRID && 'sm:col-span-2'
            )}
          >
            {entity}
          </span>
          <span
            className={clsx(
              'inline-flex gap-2 self-start',
              'text-dim uppercase',
              HIGH_DENSITY_GRID
                ? 'lg:col-span-2'
                : 'sm:col-span-2 md:col-span-1 lg:col-span-2'
            )}
          >
            {selectedPhotoIndex !== undefined
              ? // eslint-disable-next-line max-len
                `${entityVerb ? `${entityVerb} ` : ''}${indexNumber || selectedPhotoIndex + 1} of ${count ?? photos.length}`
              : entityDescription}
            {selectedPhotoIndex === undefined && sharePath && (
              <ShareButton
                className="translate-y-[1.5px]"
                path={sharePath}
                dim
              />
            )}
          </span>
          <span
            className={clsx(
              'hidden sm:inline-block',
              'text-right uppercase',
              'text-dim'
            )}
          >
            {start === end ? (
              start
            ) : (
              <>
                {end}
                <br />– {start}
              </>
            )}
          </span>
        </DivDebugBaselineGrid>,
      ]}
    />
  );
}
