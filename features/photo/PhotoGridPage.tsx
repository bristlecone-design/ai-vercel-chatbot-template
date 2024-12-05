'use client';

import { useCallback, useState } from 'react';
import { Camera } from '@/camera';
import { FilmSimulation } from '@/simulation';
import { clsx } from 'clsx';

import AnimateItems from '@/components/animations/animated-items';
import SiteGrid from '@/components/site-grid';

import { Photo } from '.';
import PhotoGrid from './PhotoGrid';
import PhotoGridInfinite from './PhotoGridInfinite';

export default function PhotoGridPage({
  cacheKey,
  photos,
  count,
  tag,
  camera,
  simulation,
  focal,
  animateOnFirstLoadOnly,
  header,
  sidebar,
}: {
  cacheKey: string;
  photos: Photo[];
  count: number;
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
  animateOnFirstLoadOnly?: boolean;
  header?: JSX.Element;
  sidebar?: JSX.Element;
}) {
  const [shouldAnimateDynamicItems, setShouldAnimateDynamicItems] =
    useState(false);

  const onAnimationComplete = useCallback(
    () => setShouldAnimateDynamicItems(true),
    []
  );

  const initialOffset = photos.length;

  return (
    <SiteGrid
      contentMain={
        <div className={clsx(header && 'mt-4 space-y-8')}>
          {header && (
            <AnimateItems
              type="bottom"
              items={[header]}
              animateOnFirstLoadOnly
            />
          )}
          <div className="space-y-0.5 sm:space-y-1">
            <PhotoGrid
              {...{
                photos,
                tag,
                camera,
                simulation,
                focal,
                animateOnFirstLoadOnly,
                onAnimationComplete,
              }}
            />
            {count > initialOffset && (
              <PhotoGridInfinite
                {...{
                  cacheKey,
                  initialOffset,
                  canStart: shouldAnimateDynamicItems,
                  tag,
                  camera,
                  simulation,
                  focal,
                  animateOnFirstLoadOnly,
                }}
              />
            )}
          </div>
        </div>
      }
      contentSide={sidebar}
      sideHiddenOnMobile
    />
  );
}
