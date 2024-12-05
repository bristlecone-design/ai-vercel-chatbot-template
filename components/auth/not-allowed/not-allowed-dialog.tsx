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

import { UserProfileOnboardingTabs } from '../profile/user-profile-onboarding-tabs';

import type { PhotoBasicExifData } from '@/types/photo';
import type { USER_MODEL } from '@/types/user';

export type DialogUserNotAllowedProps = {
  user: USER_MODEL;
  title?: string;
  description?: string;
  mobileDescription?: string;
  lightOverlay?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscapeKey?: boolean;
  className?: string;
  uploadedAssets?: PhotoBasicExifData[];
};

export function DialogUserNotAllowed({
  uploadedAssets = [],
  closeOnOutsideClick = false,
  closeOnEscapeKey = false,
  lightOverlay,
  className,
  user,
  title = 'Account Activation Pending',
  description = "You'll get an email when your account is active. Meanwhile, share some of your incredible Nevada photos to be featured on the platform. Or update your profile for a more personalized experience.",
  mobileDescription = "You'll get an email when your account is active.",
}: DialogUserNotAllowedProps) {
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
            <AlertDialogDescription className="hidden sm:block">
              {description}
            </AlertDialogDescription>
            <AlertDialogDescription className="sm:hidden">
              {mobileDescription}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="py-6">
          <UserProfileOnboardingTabs
            uploadedAssets={uploadedAssets}
            user={user}
          />
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
