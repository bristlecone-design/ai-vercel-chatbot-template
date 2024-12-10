'use client';

import type { ReactNode } from 'react';
import { useAppState } from '@/state/app-state';
import clsx from 'clsx';
import { Link } from 'lucide-react';

import type { AnimationConfig } from '@/components/animations/animated-items';

import { titleForPhoto } from '.';
import type { Camera } from '../camera';
import type { FilmSimulation } from '../simulation';

import type { Photo } from '@/types/photo';
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
