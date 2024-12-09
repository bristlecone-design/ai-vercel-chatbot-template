'use client';

import * as React from 'react';
import type { DialogProps } from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface GeneralDialogProps extends DialogProps {
  children?: React.ReactNode;
  contentClassName?: string;
  contentInnerClassName?: string;
  footerContent?: React.ReactNode;
  footerCtaLabel?: string | React.ReactNode;
  footerClassName?: string;
  titleClassName?: string;
  titleContent?: React.ReactNode;
  open?: boolean;
  title?: string | React.ReactNode;
  closeBtnClassName?: string;
  closeBtnVariant?: ButtonProps['variant'];
  noAutoFocus?: boolean;
  onClose?: (nextState?: boolean) => void;
  onEdit?: () => void;
}

export function GeneralDialog({
  children,
  open = false,
  footerContent,
  footerClassName,
  footerCtaLabel = 'Okay',
  title = 'General Dialog Title',
  titleClassName,
  titleContent,
  contentClassName,
  contentInnerClassName,
  closeBtnClassName,
  closeBtnVariant,
  noAutoFocus = false,
  onClose,
  onEdit,
  ...props
}: GeneralDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  const handleClose = (nextState: boolean) => {
    setIsOpen(nextState);
    onClose?.(nextState);
  };

  return (
    <Dialog
      open={isOpen}
      {...props}
      onOpenChange={(nextState) => {
        if (nextState === false) {
          handleClose(nextState);
        } else {
          setIsOpen(nextState);
        }
      }}
    >
      <DialogContent
        className={cn('', contentClassName)}
        onOpenAutoFocus={
          noAutoFocus
            ? (e) => {
                e.preventDefault();
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle
            className={cn('flex items-center gap-2 truncate', titleClassName)}
          >
            {title}
            {titleContent}
          </DialogTitle>
        </DialogHeader>
        <div
          className={cn(
            'grow space-y-1 rounded-md border p-4 text-sm',
            contentInnerClassName
          )}
        >
          {children}
        </div>
        <DialogFooter className={cn('items-center', footerClassName)}>
          {footerContent}
          <Button
            onClick={() => {
              handleClose(false);
            }}
            className={cn('gap-1.5', closeBtnClassName)}
            variant={closeBtnVariant || 'default'}
          >
            {footerCtaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
