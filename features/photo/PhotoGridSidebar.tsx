'use client';

import { useMemo } from 'react';
import { useAppState } from '@/state/app-state';
import { FaTag } from 'react-icons/fa';
import { IoMdCamera } from 'react-icons/io';

import { dateRangeForPhotos, photoQuantityText, type PhotoDateRange } from '.';
import { sortCamerasWithCount, type Cameras } from '../camera';
import PhotoCamera from '../camera/PhotoCamera';
import {
  sortFilmSimulationsWithCount,
  type FilmSimulations,
} from '../simulation';
import PhotoFilmSimulation from '../simulation/PhotoFilmSimulation';
import PhotoFilmSimulationIcon from '../simulation/PhotoFilmSimulationIcon';
import {
  addHiddenToTags,
  TAG_FAVS,
  TAG_HIDDEN,
  type TagsWithMeta,
} from './tag';
import FavsTag from './tag/FavsTag';
import HiddenTag from './tag/HiddenTag';
import PhotoTag from './tag/PhotoTag';

export default function PhotoGridSidebar({
  tags,
  cameras,
  simulations,
  photosCount,
  photosDateRange,
}: {
  tags: TagsWithMeta;
  cameras: Cameras;
  simulations: FilmSimulations;
  photosCount: number;
  photosDateRange?: PhotoDateRange;
}) {
  const { start, end } = dateRangeForPhotos(undefined, photosDateRange);

  const { hiddenPhotosCount } = useAppState();

  const tagsIncludingHidden = useMemo(
    () => addHiddenToTags(tags, hiddenPhotosCount),
    [tags, hiddenPhotosCount]
  );

  return (
    <>
      {tags.length > 0 && (
        <HeaderList
          title="Tags"
          icon={<FaTag size={12} className="text-icon" />}
          items={tagsIncludingHidden.map(({ tag, count }) => {
            switch (tag) {
              case TAG_FAVS:
                return (
                  <FavsTag
                    key={TAG_FAVS}
                    countOnHover={count}
                    type="icon-last"
                    prefetch={false}
                    contrast="low"
                    badged
                  />
                );
              case TAG_HIDDEN:
                return (
                  <HiddenTag
                    key={TAG_HIDDEN}
                    countOnHover={count}
                    type="icon-last"
                    prefetch={false}
                    contrast="low"
                    badged
                  />
                );
              default:
                return (
                  <PhotoTag
                    key={tag}
                    tag={tag}
                    type="text-only"
                    countOnHover={count}
                    prefetch={false}
                    contrast="low"
                    badged
                  />
                );
            }
          })}
        />
      )}
      {cameras.length > 0 && (
        <HeaderList
          title="Cameras"
          icon={
            <IoMdCamera size={13} className="text-icon translate-y-[-0.25px]" />
          }
          items={cameras
            .sort(sortCamerasWithCount)
            .map(({ cameraKey, camera, count }) => (
              <PhotoCamera
                key={cameraKey}
                camera={camera}
                type="text-only"
                countOnHover={count}
                prefetch={false}
                contrast="low"
                hideAppleIcon
                badged
              />
            ))}
        />
      )}
      {simulations.length > 0 && (
        <HeaderList
          title="Films"
          icon={<PhotoFilmSimulationIcon className="translate-y-[0.5px]" />}
          items={simulations
            .sort(sortFilmSimulationsWithCount)
            .map(({ simulation, count }) => (
              <div key={simulation} className="translate-x-[-2px]">
                <PhotoFilmSimulation
                  simulation={simulation}
                  countOnHover={count}
                  type="text-only"
                  prefetch={false}
                />
              </div>
            ))}
        />
      )}
      {photosCount > 0 && start ? (
        <HeaderList
          title={photoQuantityText(photosCount, false)}
          items={start === end ? [start] : [`${end} –`, start]}
        />
      ) : (
        <HeaderList items={[photoQuantityText(photosCount, false)]} />
      )}
    </>
  );
}
