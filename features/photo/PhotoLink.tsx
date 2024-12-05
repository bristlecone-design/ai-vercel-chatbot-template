'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Camera } from '@/camera';
import { Photo, titleForPhoto } from '@/photo';
import { FilmSimulation } from '@/simulation';
import { useAppState } from '@/state/AppState';
import { clsx } from 'clsx';

import { AnimationConfig } from '../components/animations/animated-items';

import { pathForPhoto } from '@/config/site-paths';

export default function PhotoLink({
  photo,
  tag,
  camera,
  simulation,
  focal,
  scroll,
  prefetch,
  nextPhotoAnimation,
  className,
  children,
}: {
  photo?: Photo;
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
  scroll?: boolean;
  prefetch?: boolean;
  nextPhotoAnimation?: AnimationConfig;
  className?: string;
  children?: ReactNode;
}) {
  const { setNextPhotoAnimation } = useAppState();

  return photo ? (
    <Link
      href={pathForPhoto({ photo, tag, camera, simulation, focal })}
      prefetch={prefetch}
      onClick={() => {
        if (nextPhotoAnimation) {
          setNextPhotoAnimation?.(nextPhotoAnimation);
        }
      }}
      className={className}
      scroll={scroll}
    >
      {children ?? titleForPhoto(photo)}
    </Link>
  ) : (
    <span
      className={clsx(
        'cursor-default text-gray-300 dark:text-gray-700',
        className
      )}
    >
      {children ?? (photo ? titleForPhoto(photo) : undefined)}
    </span>
  );
}
