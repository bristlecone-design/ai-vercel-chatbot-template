'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { signOut } from 'next-auth/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from './ui/button';
import { IconChevronDown, IconProfileUserCircle } from './ui/icons';
import { BlockSkeleton } from './ui/skeleton';
import { UserAvatar } from './user-avatar';

export function UserProfileNav() {
  const currentPath = usePathname();
  const isOnShareDiscover = currentPath === '/';

  const {
    isProfileReady,
    isAuthenticated,
    userProfileEmail,
    userAvatar,
    userDisplayName,
    userProfilePermalink,
    userProfileLoading,
  } = useAppState();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-10 gap-1.5 bg-background text-foreground/70 hover:bg-muted hover:text-foreground">
          {userAvatar && (
            <UserAvatar
              src={userAvatar}
              alt={userDisplayName ?? 'User Avatar'}
              className="rounded-full"
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
              userDisplayName
            )}
          </span>
          <IconChevronDown className="" />
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
