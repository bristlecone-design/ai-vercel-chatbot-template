'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IMAGE_OG_DIMENSION } from '@/features/photo/image-response';
import { clsx } from 'clsx';
import { BiError } from 'react-icons/bi';

import useOnVisible from '@/hooks/use-on-visible';

import { Spinner } from './spinner';

export type OGLoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed';

export default function OGTile({
  title,
  description,
  path,
  pathImageAbsolute,
  loadingState: loadingStateExternal,
  riseOnHover,
  onLoad,
  onFail,
  retryTime,
  onVisible,
}: {
  title: string;
  description: string;
  path: string;
  pathImageAbsolute: string;
  loadingState?: OGLoadingState;
  onLoad?: () => void;
  onFail?: () => void;
  riseOnHover?: boolean;
  retryTime?: number;
  onVisible?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const [loadingStateInternal, setLoadingStateInternal] = useState(
    loadingStateExternal ?? 'unloaded'
  );

  const loadingState = loadingStateExternal ?? loadingStateInternal;

  useEffect(() => {
    if (!loadingStateExternal && loadingStateInternal === 'unloaded') {
      setLoadingStateInternal('loading');
    }
  }, [loadingStateExternal, loadingStateInternal]);

  const { width, height, aspectRatio } = IMAGE_OG_DIMENSION;

  useOnVisible(ref, onVisible);

  return (
    <Link
      ref={ref}
      href={path}
      className={clsx(
        'group',
        'block w-full overflow-hidden rounded-md',
        'border shadow-sm',
        'border-gray-200 dark:border-gray-800',
        riseOnHover && 'transition-transform hover:-translate-y-1.5'
      )}
    >
      <div className="relative" style={{ aspectRatio }}>
        {loadingState === 'loading' && (
          <div
            className={clsx(
              'absolute bottom-0 left-0 right-0 top-0 z-10',
              'flex items-center justify-center'
            )}
          >
            <Spinner />
          </div>
        )}
        {loadingState === 'failed' && (
          <div
            className={clsx(
              'absolute bottom-0 left-0 right-0 top-0 z-[11]',
              'flex items-center justify-center',
              'text-red-400'
            )}
          >
            <BiError size={32} />
          </div>
        )}
        {(loadingState === 'loading' || loadingState === 'loaded') && (
          <img
            alt={title}
            className={clsx(
              'absolute bottom-0 left-0 right-0 top-0 z-0',
              'w-full',
              loadingState === 'loading' && 'opacity-0',
              'transition-opacity'
            )}
            src={pathImageAbsolute}
            width={width}
            height={height}
            onLoad={() => {
              if (onLoad) {
                onLoad();
              } else {
                setLoadingStateInternal('loaded');
              }
            }}
            onError={() => {
              if (onFail) {
                onFail();
              } else {
                setLoadingStateInternal('failed');
              }
              if (retryTime !== undefined) {
                setTimeout(() => {
                  setLoadingStateInternal('loading');
                }, retryTime);
              }
            }}
          />
        )}
      </div>
      <div
        className={clsx(
          'flex h-full flex-col gap-0.5 p-3',
          'font-sans leading-tight',
          'bg-gray-50 dark:bg-gray-900/50',
          'group-active:bg-gray-50 group-active:dark:bg-gray-900/50',
          'group-hover:bg-gray-100 group-hover:dark:bg-gray-900/70',
          'border-t border-gray-200 dark:border-gray-800'
        )}
      >
        <div className="font-medium text-gray-800 dark:text-white">{title}</div>
        <div className="text-medium">{description}</div>
      </div>
    </Link>
  );
}
