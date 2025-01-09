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
  carouselDelay: delay = 12500,
  className,
  scrimClassName,
  containerClassName,
  numImages: numImagesProp = NUM_IMAGES,
  bgImageNum: bgImageNumProp,
}: DiscoveryRandomBgImageProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  // The first index is the current image, the second index is the next image
  const [queuedImgs, setQueudImgs] = React.useState<Array<number | undefined>>([
    bgImageNumProp,
    undefined,
  ]);

  const currentImg = queuedImgs[0];
  const nextImg = queuedImgs[1];

  // Create image path
  const getImagePath = (imgNum: number) =>
    `/assets/bg/exp-nv/exp-nv-bg-${imgNum}.jpg`;

  // get a random number between min and max, excluding the current image
  const getRandomImage = (
    min: number,
    max: number,
    current = currentImg
  ): number => {
    const randNum = randomRange(min, max);

    // If the random number is the same as the current bgImage, call the function again
    return randNum === current || !randNum ? getRandomImage(min, max) : randNum;
  };

  const preloadNextImage = (newNextBgImgNum: number) => {
    const img = new Image();
    img.src = getImagePath(newNextBgImgNum);
  };

  // Create the necessary logic to determine the  nextd image, preload it, and update the current image
  const generateBgImages = (current: number | undefined = undefined) => {
    const newCurrentBgImgNum = getRandomImage(1, numImagesProp, current);

    preloadNextImage(newCurrentBgImgNum);

    // Shift the current image to the next image and set the new current image
    setQueudImgs((prev) => [prev[1], newCurrentBgImgNum]);
  };

  // Initial setup
  React.useEffect(() => {
    setIsMounted(true);

    // New current index background image index
    if (!queuedImgs[0]) {
      generateBgImages();
    }
  }, [queuedImgs, numImagesProp]);

  const isReady = isMounted && currentImg !== undefined;

  // Carousel interval
  useInterval(
    () => {
      generateBgImages(currentImg);
    },
    // Delay in milliseconds or null to stop it
    isReady && enableCarousel ? delay : null
  );

  return (
    <div className={cn('absolute -z-10 size-full', containerClassName)}>
      <motion.div
        key={`bg-image-${currentImg}`}
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
            ? `url(${getImagePath(currentImg)})`
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
