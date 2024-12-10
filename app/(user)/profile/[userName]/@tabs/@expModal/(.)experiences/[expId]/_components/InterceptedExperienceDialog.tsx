'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  type DrawerProps,
} from '@/components/ui/drawer';
import { IconArrowLeft } from '@/components/ui/icons';

export interface InterceptedExperienceDialogProps extends DialogProps {
  noCloseBtn?: boolean;
  dismissible?: boolean;
  noRouterBack?: boolean;
  onCloseRoutePath?: string;
  isStorySeries?: boolean;
  isPromptChallenge?: boolean;
  closeOnOutsideClick?: boolean;
  dontScaleBackground?: boolean;
  contentProps?: DrawerContentProps;
  noTitle?: boolean;
  titleClassName?: string;
  titleContent?: React.ReactNode;
  footerCtaLabel?: string;
  title?: React.ReactNode;
  content?: string;
  description?: React.ReactNode;
  descriptionClassName?: string;
  headerClassName?: string;
  authorName?: string;
  className?: string;
  contentClassName?: string;
  direction?: DrawerProps['direction'];
  handleOnClose?: () => void;
}

export function InterceptedExperienceDialog({
  children,
  className,
  contentProps,
  isPromptChallenge = false,
  isStorySeries = false,
  open: openProp = true,
  dismissible = false,
  noCloseBtn = false,
  onCloseRoutePath,
  noRouterBack = false,
  noTitle = false,
  closeOnOutsideClick = false,
  dontScaleBackground = true,
  titleClassName,
  contentClassName,
  titleContent,
  description,
  descriptionClassName,
  headerClassName,
  authorName,
  footerCtaLabel = 'Back',
  title: titleProp = 'An Experience',
  content: contentProp,
  direction = 'right',
  handleOnClose,
  ...props
}: InterceptedExperienceDialogProps) {
  // console.log(`***** experience in intercepted dialog`);
  const router = useRouter();
  const { overlayProps, ...contentRestProps } = contentProps || {};

  // Dialog States
  const [isOpen, setIsOpen] = React.useState(openProp);

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    if (!nextState) {
      // Since we are using an intercepting dialog, we need to handle the back navigation for closing the dialog
      // @see https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#modals
      if (!noRouterBack) {
        router.back();
      }

      if (noRouterBack && onCloseRoutePath) {
        router.push(onCloseRoutePath);
      }

      if (typeof handleOnClose === 'function') {
        await sleep(350);
        handleOnClose();
      }
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

  React.useEffect(() => {
    if (onCloseRoutePath && noRouterBack) {
      router.prefetch(onCloseRoutePath);
    }
  }, [onCloseRoutePath, noRouterBack, router]);

  const title =
    authorName && !isPromptChallenge && !isStorySeries
      ? `${titleProp} by ${authorName}`
      : titleProp;

  return (
    <Drawer
      key={'experience-post-media-gallery'}
      {...props}
      modal
      // handleOnly
      open={isOpen}
      dismissible={dismissible}
      direction={direction}
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
        className={cn(
          'max-h-svh min-h-svh gap-4 rounded-none bg-background/95 backdrop-blur-lg',
          className
        )}
      >
        <div className="md:overflow-y-[unset] overflow-y-auto">
          <DrawerHeader
            className={cn(
              'mx-auto max-w-4xl shrink pb-10 md:px-0',
              headerClassName
            )}
          >
            <DrawerTitle
              asChild
              className={cn(
                'flex items-center justify-center gap-2 text-center text-2xl font-semibold leading-normal md:text-3xl lg:text-4xl lg:leading-snug',
                {
                  'py-8': !isPromptChallenge && !isStorySeries,
                  'pb-4 pt-8': isPromptChallenge && !isStorySeries,
                },
                {
                  'sr-only': noTitle,
                },
                titleClassName
              )}
            >
              <h2>
                {title}
                {titleContent}
              </h2>
            </DrawerTitle>
            {description && (
              <DrawerDescription
                className={cn(
                  'text-center text-xl font-normal text-foreground/90',
                  {
                    'text-2xl': isPromptChallenge,
                  },
                  descriptionClassName
                )}
              >
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>

          <div
            className={cn(
              'relative mx-auto grid w-full max-w-full grow grid-cols-1 flex-col items-center justify-center overflow-clip rounded-lg sm:max-w-4xl'
              // contentClassName
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
                size="sm"
                flavor="ring"
                variant="outline"
                onClick={() => {
                  handleOnOpenChange(false);
                }}
                className={cn(
                  'group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75 hover:text-success-foreground'
                )}
              >
                <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                {footerCtaLabel}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
