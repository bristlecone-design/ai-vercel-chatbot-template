'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInterval } from 'usehooks-ts';

import { cn, randomRange } from '@/lib/utils';

export type DiscoveryRandomBgImageProps = React.ComponentProps<'div'> & {
  className?: string;
  scrimClassName?: string;
  containerClassName?: string;
  enableCarousel?: boolean;
  carouselDelay?: number;
  numImages?: number;
  bgImageNum?: number;
};

export const NUM_IMAGES = 30;

export function DiscoveryRandomBgImage({
  enableCarousel = false,
  carouselDelay: delay = 8500,
  className,
  scrimClassName,
  containerClassName,
  numImages: numImagesProp = NUM_IMAGES,
  bgImageNum: bgImageNumProp,
}: DiscoveryRandomBgImageProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [bgImage, setBgImage] = React.useState<number | undefined>(
    bgImageNumProp
  );

  React.useEffect(() => {
    setIsMounted(true);

    if (!bgImage) {
      const bgImageNum = randomRange(0, numImagesProp);
      setBgImage(bgImageNum);
    }
  }, [bgImage, numImagesProp]);

  const isReady = isMounted && bgImage !== undefined;

  // Carousel interval
  useInterval(
    () => {
      const getRandomImage = (min: number, max: number): number => {
        const randNum = randomRange(min, max);
        // If the random number is the same as the current bgImage, call the function again
        return randNum === bgImage || !randNum
          ? getRandomImage(min, max)
          : randNum;
      };
      const newBgImgNum = getRandomImage(0, numImagesProp);
      setBgImage(newBgImgNum);
    },
    // Delay in milliseconds or null to stop it
    isReady && enableCarousel ? delay : null
  );

  return (
    <div className={cn('absolute -z-10 size-full', containerClassName)}>
      <motion.div
        key={`bg-image-${bgImage}`}
        initial={{
          opacity: 0,
        }}
        animate={
          isReady
            ? {
                opacity: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                animationDelay: '0.5s',
                animationDuration: '1s',
              }
            : {}
        }
        exit={{
          opacity: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0],
        }}
        className={cn(
          'fixed -z-50 hidden size-full bg-cover hover:blur-none sm:block',
          className
        )}
        style={{
          backgroundImage: isReady
            ? `url(/assets/bg/exp-nv/exp-nv-bg-${bgImage}.jpg)`
            : 'none',
        }}
      />
      {/* Scrim/Backdrop */}
      <div
        className={cn(
          'fixed inset-0 top-0 -z-10 size-full select-none bg-background/75 sm:bg-background/65',
          scrimClassName
        )}
      />
    </div>
  );
}

export type DiscoveryBgImageContainerProps = React.ComponentProps<'div'> & {
  enableCarousel?: DiscoveryRandomBgImageProps['enableCarousel'];
  carouselDelay?: DiscoveryRandomBgImageProps['carouselDelay'];
  numImages?: DiscoveryRandomBgImageProps['numImages'];
  bgImageNum?: DiscoveryRandomBgImageProps['bgImageNum'];
  bgImageClassName?: string;
  children: React.ReactNode;
  noFullSize?: boolean;
  showOnMobile?: boolean;
  className?: string;
};

export function DiscoveryBgImageContainer({
  className,
  numImages,
  bgImageNum,
  bgImageClassName,
  noFullSize = false,
  showOnMobile = false,
  enableCarousel = false,
  carouselDelay,
  children,
}: DiscoveryBgImageContainerProps) {
  const fullsizeClass = noFullSize ? 'size-full' : 'h-dvh w-screen';
  return (
    <div
      className={cn(
        'relative flex items-start justify-center sm:items-center',
        fullsizeClass,
        className
      )}
    >
      <DiscoveryRandomBgImage
        numImages={numImages}
        bgImageNum={bgImageNum}
        enableCarousel={enableCarousel}
        carouselDelay={carouselDelay}
        className={cn(
          {
            block: showOnMobile,
          },
          bgImageClassName
        )}
      />
      {children}
    </div>
  );
}
