'use client';

import * as React from 'react';
import type { DialogProps } from '@radix-ui/react-dialog';

import { cn, sleep } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft, IconSearch } from '@/components/ui/icons';

import type { PartialExperienceModel } from '@/types/experiences';

export type SearchableExperiences = PartialExperienceModel[];

export interface ExperienceSearchDrawerProps extends DialogProps {
  modal?: boolean;
  dismissible?: boolean;
  noCloseBtn?: boolean;
  drawerKey?: string;
  items: SearchableExperiences;
  closeOnOutsideClick?: boolean;
  dontScaleBackground?: boolean;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  titleContent?: React.ReactNode;
  footerCtaLabel?: string;
  title?: React.ReactNode;
  description?: string | null;
  className?: string;
  contentClassName?: string;
  btnTriggerProps?: ButtonProps;
  handleOnClose?: () => void;
}

export function ExperienceSearchDrawer({
  drawerKey = 'experience-search-drawer',
  children,
  className,
  contentProps,
  open: openProp,
  modal = true,
  items = [],
  dismissible = false,
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dontScaleBackground = false,
  titleClassName,
  contentClassName,
  titleContent,
  footerCtaLabel = 'Back',
  title: titleProp = 'Search Experiences',
  description: descriptionProp,
  btnTriggerProps,
  handleOnClose,
  ...props
}: ExperienceSearchDrawerProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const {
    variant: btnTriggerVariant = 'outline',
    className: btnTriggerClassName = '',
    size: btnTriggerSize = 'custom',
    ...btnTriggerRest
  } = btnTriggerProps || {};

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
      <DrawerTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleOnOpenChange(true);
          }}
          variant={btnTriggerVariant}
          size={btnTriggerSize}
          className={cn('p-1.5', btnTriggerClassName)}
          {...btnTriggerRest}
        >
          <IconSearch className="size-3" />
        </Button>
      </DrawerTrigger>
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
        className="max-h-[94svh] min-h-[94svh] bg-background/90 backdrop-blur-lg"
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
            {descriptionProp && (
              <DrawerDescription className="text-center text-base font-normal text-foreground/90 sm:text-center sm:text-lg">
                {descriptionProp}
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
