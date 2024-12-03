'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useAppState } from '@/state/AppState';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  IconCheck,
  IconMapNavigation,
  IconMapPin,
} from '@/components/ui/icons';

import { ExperienceMapClient } from './maps/maps';

import { siteConfig } from '@/config/site-base';

export function HeaderTitleLocationBadge({
  userLocation,
  className,
  onClick,
}: {
  userLocation: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Badge
      as="button"
      variant="secondary"
      className={cn(
        'transition-colors duration-75',
        'max-w-28 group-hover/exp-nv-title:bg-secondary-foreground/80 group-hover/exp-nv-title:text-secondary/80 sm:max-w-[initial]',
        className
      )}
      onClick={onClick}
    >
      <span className="truncate">{userLocation}</span>
    </Badge>
  );
}

export type UserLocationCoordinatesType = {
  latitude: number;
  longitude: number;
};

export type HeaderTitleLocationContentProps = Parameters<
  typeof HeaderTitleLocationContent
>[0];

export function HeaderTitleLocationContent({
  userLocation,
  userCoordinates,
  introTextClassName,
  introText = 'Experiences tailored to your current location near:',
}: {
  userLocation: string;
  userCoordinates?: UserLocationCoordinatesType;
  introText?: string;
  introTextClassName?: string;
}) {
  const { isCopied: areCoordinatesCoopied, copyToClipboard: copyCoordinates } =
    useCopyToClipboard({ timeout: 2000 });

  const hasCoordinates =
    userCoordinates?.latitude && userCoordinates?.longitude;

  const handleCopyingCoordinates = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (areCoordinatesCoopied) return;

    if (hasCoordinates) {
      copyCoordinates(
        `${userCoordinates.latitude}, ${userCoordinates.longitude}`
      );
      toast.success('Your coordinates copied to clipboard');
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <p
        className={cn(
          'text-wrap text-right text-sm font-normal leading-normal brightness-90',
          introTextClassName
        )}
      >
        {introText}
      </p>
      <div className="flex w-full flex-col items-end justify-start gap-0">
        <p className="flex items-center gap-1.5 font-medium">
          <IconMapPin />
          {userLocation}
        </p>
        {hasCoordinates && (
          <Button
            size="xs"
            variant="secondary"
            className={cn(
              'brightness-85 flex h-6 items-center gap-1.5 text-xs font-medium',
              {
                'cursor-default': areCoordinatesCoopied,
              }
            )}
            onClick={handleCopyingCoordinates}
          >
            {areCoordinatesCoopied && (
              <IconCheck className="text-success-foreground size-3.5" />
            )}
            {!areCoordinatesCoopied && (
              <IconMapNavigation className="size-3.5" />
            )}
            {userCoordinates.latitude.toFixed(2)},{' '}
            {userCoordinates.longitude.toFixed(2)}
          </Button>
        )}
      </div>
      {hasCoordinates && (
        <ExperienceMapClient
          noRenderList
          className="h-[250px] w-72"
          destinations={[
            {
              placeId: `user-location-${userLocation}`,
              coordinates: userCoordinates,
            },
          ]}
        />
      )}
    </div>
  );
}

export function HeaderTitleLocationPopover({
  userLocation,
  userCoordinates = { latitude: 0, longitude: 0 },
  open: openProp = false,
  openDelay = 275,
  className,
  children,
}: {
  children?: React.ReactNode;
  userLocation?: string;
  userCoordinates?: UserLocationCoordinatesType;
  openDelay?: number;
  className?: string;
  open?: boolean;
}) {
  const [open, setOpen] = React.useState(openProp);

  const handleOnOpenChange = (nextState: boolean) => {
    setOpen(nextState);
  };

  const handleOnBadgeClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(!open);
  };

  const hasCoordinates =
    userCoordinates?.latitude && userCoordinates?.longitude;

  return (
    <HoverCard
      open={open}
      openDelay={openDelay}
      onOpenChange={handleOnOpenChange}
    >
      {!children && (
        <HoverCardTrigger asChild>
          <Badge
            as="button"
            variant="secondary"
            className={cn(
              'transition-colors duration-75',
              'max-w-28 group-hover/exp-nv-title:bg-secondary-foreground/80 group-hover/exp-nv-title:text-secondary/80 sm:max-w-[initial]',
              className
            )}
            onClick={handleOnBadgeClick}
          >
            <span className="truncate">{userLocation}</span>
          </Badge>
        </HoverCardTrigger>
      )}
      {children && (
        <HoverCardTrigger asChild>
          <div>{children}</div>
        </HoverCardTrigger>
      )}
      <HoverCardContent
        align="end"
        side="bottom"
        sideOffset={12}
        alignOffset={0}
        className={cn(
          'peer/create-experience-location-content z-50 w-64 cursor-default rounded-lg bg-background/90 p-4 backdrop-blur-lg',
          {
            'w-80': hasCoordinates,
          }
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {userLocation && (
          <HeaderTitleLocationContent
            userLocation={userLocation}
            userCoordinates={userCoordinates}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export function HeaderTitleLink({
  children,
  className,
  title = siteConfig.shortTitle,
  href = '/',
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group/exp-nv-title',
        'relative flex items-center gap-1.5',
        buttonVariants({ variant: 'outline' }),
        'bg-transparent backdrop-blur-sm'
      )}
      onClick={onClick}
    >
      <span className={cn('flex items-center gap-2', className)}>
        <span>{title}</span>
        {children}
      </span>
    </Link>
  );
}

export function HeaderTitle() {
  const pathname = usePathname();
  const { userLocation, userLatitude, userLongitude } = {
    userLocation: 'Reno, NV',
    userLatitude: '39.5296',
    userLongitude: '-119.8138',
  }; // useAppState();

  const title = siteConfig.shortTitle;

  const userCoordinates = userLatitude &&
    userLongitude && {
      latitude: Number(userLatitude),
      longitude: Number(userLongitude),
    };

  return userLocation ? (
    <HeaderTitleLocationPopover
      userLocation={userLocation}
      userCoordinates={userCoordinates as UserLocationCoordinatesType}
    >
      <HeaderTitleLink
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <HeaderTitleLocationBadge userLocation={userLocation} />
      </HeaderTitleLink>
    </HeaderTitleLocationPopover>
  ) : (
    <HeaderTitleLink title={title} />
  );
}
