'use client';

/* eslint-disable jsx-a11y/alt-text */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import Image, { type ImageProps } from 'next/image';
import { useAppState } from '@/state/app-state';

import { cn } from '@/lib/utils';

import { BLUR_ENABLED } from '@/config/site-settings';

export default function ImageWithFallback(
  props: ImageProps & {
    blurCompatibilityLevel?: 'none' | 'low' | 'high';
    imgClassName?: string;
  }
) {
  const {
    fill,
    width,
    height,
    children,
    className,
    priority,
    blurDataURL,
    blurCompatibilityLevel = 'low',
    imgClassName = 'object-cover h-full',
    onLoad: onLoadProp,
    ...rest
  } = props;

  const { shouldDebugImageFallbacks } = useAppState();

  const [wasCached, setWasCached] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);

  const onLoad = useCallback((img: SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);

    if (typeof onLoadProp === 'function') {
      onLoadProp(img);
    }
  }, []);
  const onError = useCallback(() => setDidError(true), []);

  const [hideFallback, setHideFallback] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const timeout = setTimeout(
      () => setWasCached(imgRef.current?.complete ?? false),
      100
    );
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isLoading && !didError) {
      const timeout = setTimeout(() => {
        setHideFallback(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, didError]);

  const showFallback = !wasCached && !hideFallback;

  const getBlurClass = () => {
    switch (blurCompatibilityLevel) {
      case 'high':
        // Fix poorly blurred placeholder data generated on client
        return 'blur-[4px] @xs:blue-md scale-[1.05]';
      case 'low':
        return 'blur-[2px] @xs:blue-md scale-[1.01]';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {(showFallback || shouldDebugImageFallbacks) && (
        <div
          className={cn(
            '@container',
            'absolute inset-0',
            'overflow-hidden',
            'transition-opacity duration-300 ease-in',
            !(BLUR_ENABLED && blurDataURL) && 'bg-main',
            isLoading || shouldDebugImageFallbacks ? 'opacity-100' : 'opacity-0'
          )}
        >
          {BLUR_ENABLED && blurDataURL ? (
            <img
              {...{
                ...rest,
                src: blurDataURL,
                alt: '',
                className: cn(imgClassName, getBlurClass()),
              }}
            />
          ) : (
            <div
              className={cn(
                'h-full w-full',
                'bg-gray-100/50 dark:bg-gray-900/50'
              )}
            />
          )}
        </div>
      )}
      <Image
        {...{
          ...rest,
          fill,
          width: fill ? undefined : width,
          height: fill ? undefined : height,
          ref: imgRef,
          priority,
          className: imgClassName,
          onLoad,
          onError,
        }}
      />
      {children}
    </div>
  );
}
