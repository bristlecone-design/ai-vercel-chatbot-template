'use client';

import * as React from 'react';
import Link from 'next/link';
import type { DialogProps } from '@radix-ui/react-dialog';

import { cn, noop } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
} from '@/components/ui/dialog';

import { buttonVariants } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { IconArrowLeft } from '../ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileDragAndDropFormView } from './files/drag-and-drop-processor';
import { UrlUploaderForm } from './urls/url-form-processor';

export interface ContentUploaderTabsProps {
  className?: string;
  noInputFields?: boolean;
}

export function ContentUploaderTabs({
  className,
  noInputFields,
}: ContentUploaderTabsProps) {
  return (
    <Tabs
      defaultValue="file"
      onValueChange={(value) => {
        // console.log('tab value changed', value);
      }}
      className={cn('w-full', className)}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="file">File Upload</TabsTrigger>
        <TabsTrigger value="url">URL/Web Content</TabsTrigger>
      </TabsList>
      <TabsContent value="file">
        <Card>
          {/* <CardHeader>
            <CardTitle className="sr-only">File Upload</CardTitle>
          </CardHeader> */}
          <CardContent className="">
            <FileDragAndDropFormView noInputFields={noInputFields} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="url">
        <Card>
          {/* <CardHeader>
            <CardTitle className="sr-only">URL & Web Content</CardTitle>
          </CardHeader> */}
          <CardContent className="">
            <UrlUploaderForm noInputFields={noInputFields} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export interface ContentUploaderDialogProps extends DialogProps {
  noCloseBtn?: boolean;
  closeOnOutsideClick?: boolean;
  contentProps?: DialogContentProps;
  title?: string;
  description?: string;
  className?: string;
  noInputFields?: boolean;
}

export function ContentUploaderDialog({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  title = 'Upload Content to AI Platform',
  description = 'Ingest content to be searchable and analyzable.',
  contentProps,
  className,
  noInputFields,
  open = true,
  ...props
}: ContentUploaderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  const { overlayProps } = contentProps || {};

  return (
    <Dialog
      {...props}
      open={isOpen}
      onOpenChange={closeOnOutsideClick ? setIsOpen : noop}
    >
      <DialogContent
        noCloseBtn={noCloseBtn}
        onFocusOutside={(e) => {
          if (closeOnOutsideClick) {
            setIsOpen(false);
          } else {
            e.preventDefault();
          }
        }}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-sm bg-background/50',
            overlayProps?.className
          ),
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ContentUploaderTabs noInputFields={noInputFields} />
        <DialogFooter className="sm:justify-start">
          <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
            <IconArrowLeft />
            <span>Search</span>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
