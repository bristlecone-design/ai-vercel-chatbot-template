'use client';

import * as React from 'react';
import type {
  DialogOverlayProps,
  DialogPortalProps,
} from '@radix-ui/react-dialog';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';

export type DrawerProps = React.ComponentProps<
  typeof DrawerPrimitive.Root
> & {};

const Drawer = ({
  shouldScaleBackground = true,
  dismissible = true,
  ...props
}: DrawerProps) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    dismissible={dismissible}
    {...props}
  />
);
Drawer.displayName = 'Drawer';

const DrawerNested = (
  props: React.ComponentProps<typeof DrawerPrimitive.NestedRoot>
) => <DrawerPrimitive.NestedRoot {...props} />;

DrawerNested.displayName = 'DrawerNested';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;
``;
export interface DrawerPortalProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Portal> {}

export interface DrawerOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay> {}

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  DrawerOverlayProps
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  lightOverlay?: boolean;
  noCloseBtn?: boolean | undefined;
  portalProps?: DialogPortalProps;
  overlayProps?: DialogOverlayProps;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      className,
      children,
      noCloseBtn,
      overlayProps,
      lightOverlay,
      onInteractOutside,
      onPointerDownOutside,
      ...props
    },
    ref
  ) => (
    <DrawerPortal>
      <DrawerOverlay
        {...(overlayProps || {})}
        className={cn(overlayProps?.className, {
          'bg-background/5': lightOverlay,
        })}
      />
      <DrawerPrimitive.Content
        ref={ref}
        onInteractOutside={onInteractOutside}
        // Default behavior is to close the drawer when clicking outside
        onPointerDownOutside={onPointerDownOutside}
        className={cn(
          'group/dialog fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
);
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
