'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { getUsersFirstNameFromName } from '@/lib/user/user-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// import { UserTMCCProfileForm } from '../../profile/user-tmcc-profile-form';

import type { USER_MODEL } from '@/types/user';

export type DialogOnboardTMCCUserProps = {
  user: USER_MODEL;
  title?: string;
  description?: string;
  lightOverlay?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscapeKey?: boolean;
};

export function DialogOnboardTMCCUser({
  closeOnOutsideClick = false,
  closeOnEscapeKey = false,
  lightOverlay,
  user,
  title = 'Account Onboarding',
  description = "You're just about done. Complete the following information to finish setting up your account.",
}: DialogOnboardTMCCUserProps) {
  const router = useRouter();
  const userFirstName = getUsersFirstNameFromName(user?.name);
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(true);
  const handleOnOpenChange = (ns?: boolean) => {
    const nextState = typeof ns === 'boolean' ? ns : !isOpen;
    setIsOpen(nextState);
    signOut({
      callbackUrl: pathname,
    });
    router.refresh();
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(ns) => {
        handleOnOpenChange(ns);
      }}
    >
      <AlertDialogContent
        lightOverlay={lightOverlay}
        onEscapeKeyDown={(e) => {
          if (closeOnEscapeKey) {
            handleOnOpenChange();
          } else {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          if (closeOnOutsideClick) {
            handleOnOpenChange();
          } else {
            e.preventDefault();
          }
        }}
        className=""
      >
        <AlertDialogHeader className="gap-4">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <div className="space-y-2">
            {userFirstName && (
              <AlertDialogDescription>
                Hi {userFirstName},
              </AlertDialogDescription>
            )}
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="py-6">
          {/* <UserTMCCProfileForm noTitle userId={user.id!} /> */}
        </div>
        <AlertDialogFooter className="items-center">
          <AlertDialogAction
            variant="outline"
            onClick={() => {
              handleOnOpenChange();
            }}
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
