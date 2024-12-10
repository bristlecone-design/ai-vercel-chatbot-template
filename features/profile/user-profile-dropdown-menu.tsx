'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconBookmarkPlus,
  IconCaravan,
  IconCheck,
  IconCircleCheck,
  IconEdit,
  IconEllipsisVertical,
  IconHorizontalLink,
} from '@/components/ui/icons';

import { UserProfileDialog } from './user-profile-dialog';
import { useUserProfile } from './user-profile-provider';

export type UserProfileDropdownMenuProps = {
  editEnabled?: boolean;
  // userProfile?: USER_PROFILE_MODEL;
  className?: string;
};

export function UserProfileDropdownMenu({
  editEnabled = false,
  className,
}: UserProfileDropdownMenuProps) {
  // console.log(`**** UserProfileDropdownMenu`, {
  //   editEnabled,
  //   userProfile,
  // });
  const pathname = usePathname();
  const isOnEditPage = pathname === '/profile/edit';

  const { profileExperiencesPermalink } = useUserProfile();

  const [showEditDialog, setShowEditDialog] = React.useState(false);

  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopyProfileAddyLink = () => {
    if (isCopied) return;
    const finalProfilePermalink = `${window.location.origin}${profileExperiencesPermalink}`;

    copyToClipboard(finalProfilePermalink);
    toast(
      <div className="flex w-full max-w-full gap-2">
        <span className="flex items-start gap-1.5">
          <IconCircleCheck />
        </span>
        <span className="flex flex-col items-start gap-1.5 leading-none">
          <span className="shrink">Profile link copied</span>
          <span className="truncate brightness-50">
            {finalProfilePermalink.slice(0, 42)}...
          </span>
        </span>
      </div>
    );
  };

  const handleToggleEditDialog = () => {
    setShowEditDialog((prev) => !prev);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="off"
            className={cn(
              'rounded-full p-1.5 leading-none text-foreground/70 hover:text-foreground/100',
              className
            )}
          >
            <IconEllipsisVertical />
            <span className="sr-only">Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // side="top"
          className="flex w-44 flex-col gap-0.5"
        >
          {isOnEditPage && profileExperiencesPermalink && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  // onClick={handleToggleEditDialog}
                  className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                >
                  <Link href={profileExperiencesPermalink}>
                    <span>Profile Dashboard</span>
                    <IconCaravan className={cn('size-4')} />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {editEnabled && !isOnEditPage && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  // onClick={handleToggleEditDialog}
                  className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                >
                  <Link href="/profile/edit" prefetch={null}>
                    <span>Edit Profile</span>
                    <IconEdit className={cn('size-4')} />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={(e) => {
                onCopyProfileAddyLink();
                e.preventDefault();
              }}
              className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
            >
              <span>Copy Profile Link</span>
              {!isCopied && <IconHorizontalLink className={cn('size-4')} />}
              {isCopied && <IconCheck className="size-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled
              // onClick={() => {
              //   alert('hola');
              // }}
              className="flex items-center justify-between gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
            >
              <span>Follow</span>
              <IconBookmarkPlus className={cn('size-4')} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {showEditDialog && (
        <UserProfileDialog
          open={showEditDialog}
          handleOnClose={handleCloseEditDialog}
        />
      )}
    </>
  );
}
