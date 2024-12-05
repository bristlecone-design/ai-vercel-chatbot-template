'use client';

import { useState } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';

import { DialogDiscoverSplashScreen } from './dialog-discover-splash-screen';

export type DialogJoinTheExperienceProps = {
  open?: boolean;
  waitlistCount?: number;
  lightOverlay?: boolean;
  noCloseBtn?: boolean;
  noRefreshBtn?: boolean;
  ctaLabel?: string;
  ctaVariant?: ButtonProps['variant'];
  ctaSize?: ButtonProps['size'];
  mastheadByline?: React.ReactNode;
  className?: string;
};

export function DialogJoinTheExperience({
  ctaLabel = 'Join the Experience',
  ctaVariant = 'default',
  ctaSize = 'default',
  waitlistCount = 0,
  mastheadByline,
  open: openProp = false,
  lightOverlay = false,
  noRefreshBtn = false,
  noCloseBtn = false,
  className,
}: DialogJoinTheExperienceProps) {
  const [isOpen, setIsOpen] = useState(openProp);

  const handleTogglingDialog = (nextState: boolean) => {
    setIsOpen(nextState);
  };

  return (
    <>
      <Link
        href="/"
        className={cn(
          'transition-all duration-300',
          buttonVariants({
            variant: ctaVariant,
            size: ctaSize,
          }),
          'bg-orange-700 text-foreground',
          'hover:bg-orange-700/90 hover:text-foreground',
          className
        )}
        onClick={(e) => {
          setIsOpen(true);
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {ctaLabel}
      </Link>
      {isOpen && (
        <DialogDiscoverSplashScreen
          // key={`dialog-join-the-experience-${isOpen}`}
          cb={handleTogglingDialog}
          waitlistCount={waitlistCount}
          lightOverlay={lightOverlay}
          noRefreshBtn={noRefreshBtn}
          noCloseBtn={noCloseBtn}
          mastheadByline={mastheadByline}
        />
      )}
    </>
  );
}
