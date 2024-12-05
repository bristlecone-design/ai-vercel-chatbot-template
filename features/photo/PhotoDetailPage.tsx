import { Camera } from '@/camera';
import CameraHeader from '@/camera/CameraHeader';
import FocalLengthHeader from '@/focal/FocalLengthHeader';
import { FilmSimulation } from '@/simulation';
import FilmSimulationHeader from '@/simulation/FilmSimulationHeader';
import { TAG_HIDDEN } from '@/tag';
import HiddenHeader from '@/tag/HiddenHeader';
import TagHeader from '@/tag/TagHeader';
import { clsx } from 'clsx';

import AnimateItems from '@/components/animations/animated-items';
import SiteGrid from '@/components/site-grid';

import { Photo, PhotoDateRange } from '.';
import PhotoGrid from './PhotoGrid';
import PhotoLarge from './PhotoLarge';
import PhotoLinks from './PhotoLinks';

export default function PhotoDetailPage({
  photo,
  photos,
  photosGrid,
  tag,
  camera,
  simulation,
  focal,
  indexNumber,
  count,
  dateRange,
  shouldShare,
  includeFavoriteInAdminMenu,
}: {
  photo: Photo;
  photos: Photo[];
  photosGrid?: Photo[];
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
  indexNumber?: number;
  count?: number;
  dateRange?: PhotoDateRange;
  shouldShare?: boolean;
  includeFavoriteInAdminMenu?: boolean;
}) {
  return (
    <div>
      {tag && (
        <SiteGrid
          className="mb-8 mt-4"
          contentMain={
            tag === TAG_HIDDEN ? (
              <HiddenHeader
                photos={photos}
                selectedPhoto={photo}
                indexNumber={indexNumber}
                count={count ?? 0}
              />
            ) : (
              <TagHeader
                key={tag}
                tag={tag}
                photos={photos}
                selectedPhoto={photo}
                indexNumber={indexNumber}
                count={count}
                dateRange={dateRange}
              />
            )
          }
        />
      )}
      {camera && (
        <SiteGrid
          className="mb-8 mt-4"
          contentMain={
            <CameraHeader
              camera={camera}
              photos={photos}
              selectedPhoto={photo}
              indexNumber={indexNumber}
              count={count}
              dateRange={dateRange}
            />
          }
        />
      )}
      {simulation && (
        <SiteGrid
          className="mb-8 mt-4"
          contentMain={
            <FilmSimulationHeader
              simulation={simulation}
              photos={photos}
              selectedPhoto={photo}
              indexNumber={indexNumber}
              count={count}
              dateRange={dateRange}
            />
          }
        />
      )}
      {focal && (
        <SiteGrid
          className="mb-8 mt-4"
          contentMain={
            <FocalLengthHeader
              focal={focal}
              photos={photos}
              selectedPhoto={photo}
              indexNumber={indexNumber}
              count={count}
              dateRange={dateRange}
            />
          }
        />
      )}
      <AnimateItems
        className="md:mb-8"
        animateFromAppState
        items={[
          <PhotoLarge
            key={photo.id}
            photo={photo}
            primaryTag={tag}
            priority
            prefetchRelatedLinks
            showCamera={!camera}
            showSimulation={!simulation}
            shouldShare={shouldShare}
            shouldShareTag={tag !== undefined}
            shouldShareCamera={camera !== undefined}
            shouldShareSimulation={simulation !== undefined}
            shouldScrollOnShare={false}
            includeFavoriteInAdminMenu={includeFavoriteInAdminMenu}
          />,
        ]}
      />
      <SiteGrid
        sideFirstOnMobile
        contentMain={
          <PhotoGrid
            photos={photosGrid ?? photos}
            selectedPhoto={photo}
            tag={tag}
            camera={camera}
            simulation={simulation}
            focal={focal}
            animateOnFirstLoadOnly
          />
        }
        contentSide={
          <AnimateItems
            animateOnFirstLoadOnly
            type="bottom"
            items={[
              <div
                key="PhotoLinks"
                className={clsx(
                  'grid grid-cols-2',
                  'gap-0.5 sm:gap-1',
                  'md:flex md:gap-4',
                  'user-select-none'
                )}
              >
                <PhotoLinks
                  {...{
                    photo,
                    photos,
                    tag,
                    camera,
                    simulation,
                    focal,
                  }}
                />
              </div>,
            ]}
          />
        }
      />
    </div>
  );
}
