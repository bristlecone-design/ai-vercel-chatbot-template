'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppState } from '@/state/app-state';

import type { AnimationConfig } from '@/components/animations/animated-items';

import { getNextPhoto, getPreviousPhoto } from '.';
import type { Camera } from '../camera';
import type { FilmSimulation } from '../simulation';
import PhotoLink from './PhotoLink';

import type { Photo } from '@/types/photo';
import { pathForPhoto } from '@/config/site-paths';

const LISTENER_KEYUP = 'keyup';

const ANIMATION_LEFT: AnimationConfig = { type: 'left', duration: 0.3 };
const ANIMATION_RIGHT: AnimationConfig = { type: 'right', duration: 0.3 };

export default function PhotoLinks({
  photo,
  photos,
  tag,
  camera,
  simulation,
  focal,
}: {
  photo: Photo;
  photos: Photo[];
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
}) {
  const router = useRouter();

  const { setNextPhotoAnimation, shouldRespondToKeyboardCommands } =
    useAppState();

  const previousPhoto = getPreviousPhoto(photo, photos);
  const nextPhoto = getNextPhoto(photo, photos);

  useEffect(() => {
    if (shouldRespondToKeyboardCommands) {
      const onKeyUp = (e: KeyboardEvent) => {
        switch (e.key.toUpperCase()) {
          case 'ARROWLEFT':
          case 'J':
            if (previousPhoto) {
              setNextPhotoAnimation?.(ANIMATION_RIGHT);
              router.push(
                pathForPhoto({
                  photo: previousPhoto,
                  tag,
                  camera,
                  simulation,
                  focal,
                }),
                { scroll: false }
              );
            }
            break;
          case 'ARROWRIGHT':
          case 'L':
            if (nextPhoto) {
              setNextPhotoAnimation?.(ANIMATION_LEFT);
              router.push(
                pathForPhoto({
                  photo: nextPhoto,
                  tag,
                  camera,
                  simulation,
                  focal,
                }),
                { scroll: false }
              );
            }
            break;
        }
      };
      window.addEventListener(LISTENER_KEYUP, onKeyUp);
      return () => window.removeEventListener(LISTENER_KEYUP, onKeyUp);
    }
  }, [
    router,
    shouldRespondToKeyboardCommands,
    setNextPhotoAnimation,
    previousPhoto,
    nextPhoto,
    tag,
    camera,
    simulation,
    focal,
  ]);

  return (
    <>
      <PhotoLink
        photo={previousPhoto}
        nextPhotoAnimation={ANIMATION_RIGHT}
        tag={tag}
        camera={camera}
        simulation={simulation}
        focal={focal}
        scroll={false}
        prefetch
      >
        PREV
      </PhotoLink>
      <PhotoLink
        photo={nextPhoto}
        nextPhotoAnimation={ANIMATION_LEFT}
        tag={tag}
        camera={camera}
        simulation={simulation}
        focal={focal}
        scroll={false}
        prefetch
      >
        NEXT
      </PhotoLink>
    </>
  );
}
