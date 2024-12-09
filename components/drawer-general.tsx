'use client';

import * as React from 'react';
import type { DialogProps } from '@radix-ui/react-dialog';

import { cn, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft } from '@/components/ui/icons';

export interface GeneralDrawerProps extends DialogProps {
  modal?: boolean;
  dismissible?: boolean;
  noCloseBtn?: boolean;
  drawerKey?: string;
  closeOnOutsideClick?: boolean;
  dontScaleBackground?: boolean;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  titleContent?: React.ReactNode;
  footerCtaLabel?: string;
  title?: React.ReactNode;
  content?: string | null;
  className?: string;
  contentClassName?: string;
  handleOnClose?: () => void;
}

export function GeneralDrawer({
  drawerKey = 'general-drawer',
  children,
  className,
  contentProps,
  open: openProp,
  modal = true,
  dismissible = false,
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dontScaleBackground = false,
  titleClassName,
  contentClassName,
  titleContent,
  footerCtaLabel = 'Back',
  title: titleProp = 'Howdy Howdy',
  content: contentProp,
  handleOnClose,
  ...props
}: GeneralDrawerProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  // Dialog States
  const [isOpen, setIsOpen] = React.useState(openProp);

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    setIsOpen(nextState);
    if (!nextState && typeof handleOnClose === 'function') {
      await sleep(350);
      handleOnClose();
    }
  };

  const handleOnEscapeKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOnOpenChange(false);
    }
  };

  const handleClosePrimaryDrawer = () => {
    // setIsOpen(false);
    handleOnOpenChange(false);
  };

  return (
    <Drawer
      key={drawerKey}
      {...props}
      modal={modal}
      // handleOnly
      open={isOpen}
      dismissible={dismissible}
      shouldScaleBackground={!dontScaleBackground}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
    >
      <DrawerContent
        {...contentRestProps}
        onEscapeKeyDown={handleOnEscapeKeyDown}
        noCloseBtn={noCloseBtn || contentRestProps.noCloseBtn}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[2px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className="max-h-[94svh] min-h-[94svh] bg-background/95 backdrop-blur-lg"
      >
        <div className="mx-auto min-w-full max-w-4xl overflow-auto md:min-w-124 md:px-0">
          <DrawerHeader
            className={cn(
              'mx-auto flex max-w-4xl shrink flex-col flex-wrap pb-10 md:px-0'
            )}
          >
            <DrawerTitle asChild>
              <h2
                className={cn(
                  'flex items-center justify-center gap-2 text-2xl font-semibold md:text-3xl lg:text-4xl',
                  {
                    'py-8': true,
                  },
                  titleClassName
                )}
              >
                {titleProp}
                {titleContent}
              </h2>
            </DrawerTitle>
            {contentProp && (
              <DrawerDescription className="text-center text-base font-normal text-foreground/90 sm:text-center sm:text-lg">
                {contentProp}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div
            className={cn(
              'relative mx-auto flex w-full max-w-full grow flex-col items-center justify-center overflow-clip rounded-lg sm:max-w-full',
              contentClassName
            )}
          >
            {children}
          </div>
        </div>

        <DrawerFooter className="">
          <div
            className={cn('flex flex-row items-center justify-between gap-4')}
          >
            <div className="flex gap-2.5">
              <Button
                size="xs"
                flavor="ring"
                variant="tertiary"
                onClick={() => {
                  handleOnOpenChange(false);
                }}
                className="group"
              >
                <IconArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                {footerCtaLabel}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
