'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';

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
        <SidebarMenuButton className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
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
          <ChevronDown className="ml-auto" />
        </SidebarMenuButton>
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
