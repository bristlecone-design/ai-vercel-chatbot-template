'use client';

import { useRef } from 'react';
import Link from 'next/link';
import AdminPhotoMenuClient from '@/admin/AdminPhotoMenuClient';
import { cameraFromPhoto } from '@/camera';
import PhotoFilmSimulation from '@/simulation/PhotoFilmSimulation';
import { useAppState } from '@/state/AppState';
import { sortTags } from '@/tag';
import PhotoTags from '@/tag/PhotoTags';
import { clsx } from 'clsx';

import useOnVisible from '@/lib/hooks/use-on-visible';
import DivDebugBaselineGrid from '@/components/div-debug-baseline-grid';
import ImageLarge from '@/components/image/ImageLarge';
import ShareButton from '@/components/share-button';
import SiteGrid from '@/components/site-grid';

import {
  altTextForPhoto,
  doesPhotoNeedBlurCompatibility,
  Photo,
  shouldShowCameraDataForPhoto,
  shouldShowExifDataForPhoto,
  titleForPhoto,
} from '.';
import PhotoCamera from '../camera/PhotoCamera';
import { RevalidatePhoto } from './InfinitePhotoScroll';
import PhotoDate from './PhotoDate';
import PhotoLink from './PhotoLink';

import {
  pathForFocalLength,
  pathForPhoto,
  pathForPhotoShare,
} from '@/config/site-paths';
import { SHOULD_PREFETCH_ALL_LINKS } from '@/config/site-settings';

export default function PhotoLarge({
  photo,
  primaryTag,
  priority,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  prefetchRelatedLinks = SHOULD_PREFETCH_ALL_LINKS,
  revalidatePhoto,
  showCamera = true,
  showSimulation = true,
  shouldShare = true,
  shouldShareTag,
  shouldShareCamera,
  shouldShareSimulation,
  shouldShareFocalLength,
  shouldScrollOnShare,
  includeFavoriteInAdminMenu,
  onVisible,
}: {
  photo: Photo;
  primaryTag?: string;
  priority?: boolean;
  prefetch?: boolean;
  prefetchRelatedLinks?: boolean;
  revalidatePhoto?: RevalidatePhoto;
  showCamera?: boolean;
  showSimulation?: boolean;
  shouldShare?: boolean;
  shouldShareTag?: boolean;
  shouldShareCamera?: boolean;
  shouldShareSimulation?: boolean;
  shouldShareFocalLength?: boolean;
  shouldScrollOnShare?: boolean;
  includeFavoriteInAdminMenu?: boolean;
  onVisible?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const tags = sortTags(photo.tags, primaryTag);

  const camera = cameraFromPhoto(photo);

  const showCameraContent = showCamera && shouldShowCameraDataForPhoto(photo);
  const showTagsContent = tags.length > 0;
  const showExifContent = shouldShowExifDataForPhoto(photo);

  useOnVisible(ref, onVisible);

  const { arePhotosMatted } = useAppState();

  return (
    <SiteGrid
      containerRef={ref}
      contentMain={
        <Link
          href={pathForPhoto({ photo })}
          className={clsx(
            arePhotosMatted && 'flex aspect-[3/2] items-center bg-gray-100'
          )}
          prefetch={prefetch}
        >
          <div
            className={clsx(
              arePhotosMatted && 'flex w-full items-center justify-center',
              arePhotosMatted && photo.aspectRatio >= 1 ? 'h-[80%]' : 'h-[90%]'
            )}
          >
            <ImageLarge
              className={clsx(arePhotosMatted && 'h-full')}
              imgClassName={clsx(
                arePhotosMatted && 'object-contain w-full h-full'
              )}
              alt={altTextForPhoto(photo)}
              src={photo.url}
              aspectRatio={photo.aspectRatio}
              blurDataURL={photo.blurData}
              blurCompatibilityMode={doesPhotoNeedBlurCompatibility(photo)}
              priority={priority}
            />
          </div>
        </Link>
      }
      contentSide={
        <DivDebugBaselineGrid
          className={clsx(
            'relative',
            'sticky top-4 -translate-y-1 self-start',
            'grid grid-cols-2 md:grid-cols-1',
            'gap-y-baseline gap-x-0.5 sm:gap-x-1',
            'pb-6'
          )}
        >
          {/* Meta */}
          <div className="pr-2 md:pr-0">
            <div className="flex items-start gap-2 md:relative">
              <PhotoLink
                photo={photo}
                className="flex-grow font-bold uppercase"
                prefetch={prefetch}
              />
              <div className="absolute right-0 z-10 translate-y-[-4px]">
                <AdminPhotoMenuClient
                  {...{
                    photo,
                    revalidatePhoto,
                    includeFavorite: includeFavoriteInAdminMenu,
                    ariaLabel: `Admin menu for '${titleForPhoto(photo)}' photo`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-baseline">
              {photo.caption && (
                <div className="uppercase">{photo.caption}</div>
              )}
              {(showCameraContent || showTagsContent) && (
                <div>
                  {showCameraContent && (
                    <PhotoCamera
                      camera={camera}
                      contrast="medium"
                      prefetch={prefetchRelatedLinks}
                    />
                  )}
                  {showTagsContent && (
                    <PhotoTags
                      tags={tags}
                      contrast="medium"
                      prefetch={prefetchRelatedLinks}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          {/* EXIF Data */}
          <div className="space-y-baseline">
            {showExifContent && (
              <>
                <ul className="text-medium">
                  <li>
                    {photo.focalLength && (
                      <Link href={pathForFocalLength(photo.focalLength)}>
                        {photo.focalLengthFormatted}
                      </Link>
                    )}
                    {photo.focalLengthIn35MmFormatFormatted && (
                      <>
                        {' '}
                        <span
                          title="35mm equivalent"
                          className="text-extra-dim"
                        >
                          {photo.focalLengthIn35MmFormatFormatted}
                        </span>
                      </>
                    )}
                  </li>
                  <li>{photo.fNumberFormatted}</li>
                  <li>{photo.exposureTimeFormatted}</li>
                  <li>{photo.isoFormatted}</li>
                  <li>{photo.exposureCompensationFormatted ?? '0ev'}</li>
                </ul>
                {showSimulation && photo.filmSimulation && (
                  <PhotoFilmSimulation
                    simulation={photo.filmSimulation}
                    prefetch={prefetchRelatedLinks}
                  />
                )}
              </>
            )}
            <div
              className={clsx(
                'gap-y-baseline flex gap-x-2',
                'md:flex-col md:justify-normal'
              )}
            >
              <PhotoDate photo={photo} className="text-medium" />
              {shouldShare && (
                <ShareButton
                  className={clsx(
                    'md:translate-x-[-2.5px]',
                    'translate-y-[1.5px] md:translate-y-0'
                  )}
                  path={pathForPhotoShare({
                    photo,
                    tag: shouldShareTag ? primaryTag : undefined,
                    camera: shouldShareCamera ? camera : undefined,
                    // eslint-disable-next-line max-len
                    simulation: shouldShareSimulation
                      ? photo.filmSimulation
                      : undefined,
                    // eslint-disable-next-line max-len
                    focal: shouldShareFocalLength
                      ? photo.focalLength
                      : undefined,
                  })}
                  prefetch={prefetchRelatedLinks}
                  shouldScroll={shouldScrollOnShare}
                />
              )}
            </div>
          </div>
        </DivDebugBaselineGrid>
      }
    />
  );
}
