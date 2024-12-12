'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { cn, randomRange } from '@/lib/utils';

export type DiscoveryRandomBgImageProps = React.ComponentProps<'div'> & {
  className?: string;
  containerClassName?: string;
  numImages?: number;
  bgImageNum?: number;
};

export const NUM_IMAGES = 30;

export function DiscoveryRandomBgImage({
  className,
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

  return (
    <div className={cn('absolute -z-10 size-full', containerClassName)}>
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={
          isReady
            ? {
                opacity: 1,
                animationDelay: '0.5s',
                animationDuration: '1s',
              }
            : {}
        }
        exit={{
          opacity: 0,
        }}
        className={cn(
          '-z-50 hidden size-full bg-background bg-cover hover:blur-none sm:fixed sm:block',
          className
        )}
        style={{
          backgroundImage: isReady
            ? `url(/assets/bg/exp-nv/exp-nv-bg-${bgImage}.jpg)`
            : 'none',
        }}
      />
    </div>
  );
}

export type DiscoveryBgImageContainerProps = React.ComponentProps<'div'> & {
  numImages?: DiscoveryRandomBgImageProps['numImages'];
  bgImageNum?: DiscoveryRandomBgImageProps['bgImageNum'];
  children: React.ReactNode;
  noFullSize?: boolean;
  className?: string;
};

export function DiscoveryBgImageContainer({
  className,
  numImages,
  bgImageNum,
  noFullSize = false,
  children,
}: DiscoveryBgImageContainerProps) {
  const fullsizeClass = noFullSize ? '' : 'h-dvh w-screen';
  return (
    <div
      className={cn(
        'relative flex items-start justify-center bg-background/65 sm:items-center',
        fullsizeClass,
        className
      )}
    >
      <DiscoveryRandomBgImage numImages={numImages} bgImageNum={bgImageNum} />
      {children}
    </div>
  );
}
