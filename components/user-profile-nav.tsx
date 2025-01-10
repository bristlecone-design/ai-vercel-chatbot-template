'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { signOut } from 'next-auth/react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import {
  IconChevronDown,
  IconMapNavigation,
  IconProfileUserCircle,
} from './ui/icons';
import { BlockSkeleton } from './ui/skeleton';
import { UserAvatar } from './user-avatar';

export interface UserProfileNavProps {
  flipChevron?: boolean;
}

export function UserProfileNav({ flipChevron }: UserProfileNavProps) {
  const currentPath = usePathname();
  const isOnShareDiscover = currentPath === '/';

  const {
    isProfileReady,
    isAuthenticated,
    userProfileEmail,
    userAvatar,
    userEmail,
    userDisplayName,
    userProfilePermalink,
    userProfileLoading,
    userLocation,
    userGeoLocation,
  } = useAppState();

  if (!isAuthenticated) {
    return null;
  }

  const derivedUserLocation = userLocation || userGeoLocation;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'data-[state=open] :text-accent-foreground w-fit data-[state=open]:bg-accent data-[state=closed]:text-foreground/55'
        )}
      >
        <Button
          variant="ghost"
          className="gap-1.5 bg-transparent backdrop-blur-sm hover:bg-transparent hover:backdrop-blur-lg md:h-[34px] md:px-2"
        >
          {userAvatar && (
            <UserAvatar
              src={userAvatar}
              alt={userDisplayName ?? 'User Avatar'}
              className="rounded-full"
              sizeClassName="size-7"
            />
          )}
          {!userAvatar && !isProfileReady && (
            <BlockSkeleton className="size-7 rounded-full" />
          )}
          {!userAvatar && isProfileReady && (
            <IconProfileUserCircle className="size-5" />
          )}
          <span className="hidden truncate sm:inline-block">
            {userProfileLoading ? (
              <BlockSkeleton className="h-6 w-20" />
            ) : (
              userDisplayName || userEmail
            )}
          </span>
          <IconChevronDown
            className={cn('', {
              'rotate-180 transform': flipChevron,
            })}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        className="w-[--radix-popper-anchor-width]"
      >
        {userProfileEmail && userProfilePermalink && (
          <React.Fragment>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                // console.log('onSelect invoked', event);
              }}
            >
              <Link
                href={userProfilePermalink}
                className="truncate text-xs font-medium brightness-65"
              >
                {userProfileEmail}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </React.Fragment>
        )}
        {!isOnShareDiscover && (
          <DropdownMenuItem
            disabled={isOnShareDiscover}
            className="cursor-pointer"
            onSelect={(event) => {
              // console.log('onSelect invoked', event);
            }}
          >
            <Link href="/" className="font-medium">
              Share &amp; Discover
            </Link>
          </DropdownMenuItem>
        )}
        {isOnShareDiscover && (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              // console.log('onSelect invoked', event);
            }}
          >
            <Link href="/" className="font-medium">
              New Discovery
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isAuthenticated && (
          <React.Fragment>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                // console.log('onSelect invoked', event);
              }}
            >
              <Link href="/profile/edit" className="font-medium">
                Personalize
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </React.Fragment>
        )}
        {derivedUserLocation && (
          <DropdownMenuItem
            disabled
            className="cursor-pointer justify-between"
            onSelect={(event) => {
              // console.log('onSelect invoked', event);
            }}
          >
            <span className="font-medium">{derivedUserLocation}</span>
            <IconMapNavigation />
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          asChild
          className=""
          onSelect={(event) => {
            // console.log('onSelect invoked', event);
          }}
        >
          <ThemeToggle
            disabled
            className="w-full flex-row-reverse justify-between"
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            type="button"
            className="w-full cursor-pointer text-destructive brightness-150"
            onClick={() => {
              signOut({
                redirectTo: '/',
              });
            }}
          >
            Sign out
          </button>
        </DropdownMenuItem>
        {/* Theme Toggle */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
