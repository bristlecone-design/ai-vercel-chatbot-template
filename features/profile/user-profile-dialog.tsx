'use client';

import * as React from 'react';
import { useAppState } from '@/state/app-state';
import type { DialogProps } from '@radix-ui/react-dialog';

import { cn, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft } from '@/components/ui/icons';

import { UserProfileForm } from './user-profile-form';

import type { USER_PROFILE_MODEL } from '@/types/user';

export interface UserProfileDialogProps extends DialogProps {
  noCloseBtn?: boolean;
  closeOnOutsideClick?: boolean;
  contentProps?: DrawerContentProps;
  title?: string;
  noFocusOnOpen?: boolean;
  className?: string;
  titleClassName?: string;
  userProfile?: USER_PROFILE_MODEL;
  handleOnClose?: () => void;
  // handleOnSuccess?: UserProfileFormProps['handleOnSuccess'];
}

export function UserProfileDialog({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  noFocusOnOpen = false,
  title = 'Edit Profile',
  contentProps,
  titleClassName,
  className,
  children,
  userProfile,
  open = true,
  handleOnClose,
  // handleOnSuccess,
  ...props
}: UserProfileDialogProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  // User Profile
  const { userProfile: userProfileApp, handleUpdatingAuthUser } = useAppState();

  const userToUse = userProfile || userProfileApp;

  // States
  const [isOpen, setIsOpen] = React.useState(open);
  const [isFormProcessing, setIsFormProcessing] = React.useState(false);

  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    setIsOpen(nextState);

    if (!nextState && typeof handleOnClose === 'function') {
      await sleep(350);
      handleOnClose();
    }
  };

  const handleOnUpdateSuccess = (payload: USER_PROFILE_MODEL) => {
    // Update Auth User and Clear Profile Cache
    handleUpdatingAuthUser(payload, true);
  };

  return (
    <Drawer
      {...props}
      open={isOpen}
      shouldScaleBackground
      // dismissible={false}
      // modal={false}
      onOpenChange={handleOnOpenChange}
      // onClose={() => {
      //   console.log('onClose invoked');
      // }}
      // onRelease={(e) => {
      //   console.log('onRelease invoked', e);
      // }}
    >
      <DrawerContent
        {...contentRestProps}
        onEscapeKeyDown={(e) => {
          // console.log(`onEscapeKeyDown`, e);
        }}
        onInteractOutside={(e) => {
          // console.log('onInteractOutside', e, { closeOnOutsideClick });
          e.preventDefault();
          e.stopPropagation();
        }}
        noCloseBtn={noCloseBtn || contentRestProps.noCloseBtn}
        onFocusOutside={(e) => {
          console.log('onFocusOutside', e, { closeOnOutsideClick });
          if (closeOnOutsideClick) {
            setIsOpen(false);
          } else {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[2px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className="max-h-[96svh] bg-background/95 backdrop-blur-lg"
      >
        <div className="mx-auto flex flex-col gap-2 overflow-y-auto">
          <DrawerHeader
            className={cn(
              'mx-auto flex w-full shrink flex-col flex-wrap pb-10 md:px-0'
            )}
          >
            <DrawerTitle
              asChild
              className={cn(
                'flex items-center justify-center gap-2 py-8 text-2xl font-semibold md:text-3xl lg:text-4xl',
                titleClassName
              )}
            >
              <h2>{title}</h2>
            </DrawerTitle>
          </DrawerHeader>

          <div className="w-full max-w-4xl">
            {userToUse && (
              <UserProfileForm
                noTitle
                noSaveBtn
                userProfile={userToUse}
                userId={userToUse.id}
                formRef={formRef}
                // disabled={isFormProcessing || experienceCreated}
                // handleOnComplete={handleOnCreateExperienceComplete}
                inputClassName="text-foreground/80"
                handleOnUpdateSuccess={handleOnUpdateSuccess}
              />
            )}
          </div>
        </div>

        <DrawerFooter className="">
          <div className="flex flex-row-reverse items-center justify-center gap-4 sm:justify-between">
            <Button
              disabled
              size="lg"
              variant="outline"
              className={cn(
                'hover:text-success-foreground group gap-2 rounded-xl border-4 border-border/40 py-5 transition-colors duration-75'
              )}
              onClick={() => handleOnOpenChange(false)}
            >
              <span>Changes Auto Save</span>
            </Button>
            <Button
              size="sm"
              flavor="ring"
              variant="outline"
              onClick={() => handleOnOpenChange(false)}
              className={cn(
                'hover:text-success-foreground group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75'
              )}
              disabled={isFormProcessing}
              // tabIndex={-1}
            >
              <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
              <span>Back</span>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
