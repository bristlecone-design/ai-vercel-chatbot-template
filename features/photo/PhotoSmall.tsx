import { useRef } from 'react';
import Link from 'next/link';
import { Camera } from '@/camera';
import { FilmSimulation } from '@/simulation';
import { clsx } from 'clsx';

import useOnVisible from '@/lib/hooks/use-on-visible';
import ImageSmall from '@/components/image/ImageSmall';

import { altTextForPhoto, doesPhotoNeedBlurCompatibility, Photo } from '.';

import { pathForPhoto } from '@/config/site-paths';
import { SHOULD_PREFETCH_ALL_LINKS } from '@/config/site-settings';

export default function PhotoSmall({
  photo,
  tag,
  camera,
  simulation,
  focal,
  selected,
  className,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  onVisible,
}: {
  photo: Photo;
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
  selected?: boolean;
  className?: string;
  prefetch?: boolean;
  onVisible?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useOnVisible(ref, onVisible);

  return (
    <Link
      ref={ref}
      href={pathForPhoto({ photo, tag, camera, simulation, focal })}
      className={clsx(
        className,
        'active:brightness-75',
        selected && 'brightness-50',
        'min-w-[50px]',
        'overflow-hidden rounded-[0.15rem]',
        'border border-gray-200 dark:border-gray-800'
      )}
      prefetch={prefetch}
    >
      <ImageSmall
        src={photo.url}
        aspectRatio={photo.aspectRatio}
        blurDataURL={photo.blurData}
        blurCompatibilityMode={doesPhotoNeedBlurCompatibility(photo)}
        alt={altTextForPhoto(photo)}
      />
    </Link>
  );
}
