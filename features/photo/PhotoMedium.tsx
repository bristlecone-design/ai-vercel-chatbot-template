'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Camera } from '@/camera';
import { FilmSimulation } from '@/simulation';
import { clsx } from 'clsx';

import useOnVisible from '@/lib/hooks/use-on-visible';
import ImageMedium from '@/components/image/ImageMedium';

import { altTextForPhoto, doesPhotoNeedBlurCompatibility } from '.';

import { Photo } from '@/types/photo';
import { pathForPhoto } from '@/config/site-paths';
import { SHOULD_PREFETCH_ALL_LINKS } from '@/config/site-settings';

export default function PhotoMedium({
  photo,
  tag,
  camera,
  simulation,
  focal,
  selected,
  priority,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  className,
  onVisible,
}: {
  photo: Photo;
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
  selected?: boolean;
  priority?: boolean;
  prefetch?: boolean;
  className?: string;
  onVisible?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useOnVisible(ref, onVisible);

  return (
    <Link
      ref={ref}
      href={pathForPhoto({ photo, tag, camera, simulation, focal })}
      className={clsx(
        'active:brightness-75',
        selected && 'brightness-50',
        className
      )}
      prefetch={prefetch}
    >
      <ImageMedium
        src={photo.url}
        aspectRatio={photo.aspectRatio}
        blurDataURL={photo.blurData}
        blurCompatibilityMode={doesPhotoNeedBlurCompatibility(photo)}
        className="flex h-full w-full object-cover"
        imgClassName="object-cover w-full h-full"
        alt={altTextForPhoto(photo)}
        priority={priority}
      />
    </Link>
  );
}
