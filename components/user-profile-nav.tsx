'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from './ui/button';
import { IconChevronDown } from './ui/icons';
import { BlockSkeleton } from './ui/skeleton';
import { UserAvatar } from './user-avatar';

import { getBaseConfigKey } from '@/config/site-base';

export function UserProfileNav() {
  const session = useSession();

  const status = session?.status;
  const user = session?.data?.user ?? null;
  const userEmail = user?.email ?? null;
  const userImagePath = user?.image ?? null;
  const isLoading = status === 'loading';

  if (!user && !isLoading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-10 gap-1.5 bg-background text-foreground/70 hover:bg-muted hover:text-foreground">
          {userImagePath && (
            <UserAvatar
              src={userImagePath}
              alt={userEmail ?? 'User Avatar'}
              className="rounded-full"
            />
          )}
          {!userImagePath && <BlockSkeleton className="size-7 rounded-full" />}
          <span className="hidden truncate sm:inline-block">
            {isLoading ? <BlockSkeleton className="h-6 w-20" /> : user?.name}
          </span>
          <IconChevronDown className="" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        className="w-[--radix-popper-anchor-width]"
      >
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            // console.log('onSelect invoked', event);
          }}
        >
          <Link href="/" className="font-medium">
            {getBaseConfigKey('shortTitle')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            type="button"
            className="w-full cursor-pointer"
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
