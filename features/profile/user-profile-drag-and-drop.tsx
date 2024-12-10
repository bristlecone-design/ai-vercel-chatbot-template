'use client';

import React from 'react';
import { useHoverDirty } from 'react-use';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconFileUpload, IconTrash } from '@/components/ui/icons';

interface BaseProps {
  // as prop should be either a Div element or span nothing else
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * Drag and Drop Container for handling file uploads
 *
 * @note Does not handle file processing, only drag and drop events
 * @note Use in conjunction with the provider @WithFileUploaderProvider and components like @FileUploader
 */
export interface UserProfileDragAndDropAvatarContainerProps extends BaseProps {
  handleOnDropOfFiles: (files: FileList | File[]) => void;
  handleOnRemoveFile?: () => void;
  handleOnClick?: () => void;
  isLoading?: boolean;
  editable?: boolean;
  editableClassName?: string;
  editCtaLabel?: string;
  editCtaClassName?: string;
  removeCtaLabel?: string;
  removeCtaClassName?: string;
}

export function UserProfileDragAndDropAvatarContainer({
  isLoading,
  editable,
  editableClassName,
  editCtaClassName,
  editCtaLabel = 'Avatar',
  removeCtaLabel = 'Avatar',
  removeCtaClassName,
  as: Component = 'div',
  className,
  children,
  disabled,
  handleOnClick,
  handleOnRemoveFile,
  handleOnDropOfFiles,
}: UserProfileDragAndDropAvatarContainerProps) {
  // Ref should account for the container being a div
  const containerRef = React.useRef<HTMLElement>(null);
  const isHovering = useHoverDirty(containerRef);
  const [dragActive, setDragActive] = React.useState(false);

  const onHandleOnDropOfFiles = React.useCallback(
    (files: FileList | File[]) => {
      handleOnDropOfFiles(files);
    },
    [handleOnDropOfFiles]
  );

  const isDragDisabled = isLoading || disabled || !editable;

  return (
    <Component
      ref={containerRef}
      className={cn(
        'group relative',
        {
          'border-spacing-2': dragActive && !isDragDisabled,
          'border-primary': dragActive && !isDragDisabled,
          'border-dotted': dragActive && !isDragDisabled,
          'ring-2': dragActive && !isDragDisabled,
          'ring-primary-alt': dragActive && !isDragDisabled,
          'ring-offset-4': dragActive && !isDragDisabled,
          'ring-offset-input': dragActive && !isDragDisabled,
        },
        className
      )}
      // onPointerDownOutside={e => e.preventDefault()}
      // onPointerDown={e => e.preventDefault()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragActive(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragActive(false);

        const files = e.dataTransfer.files;
        onHandleOnDropOfFiles(files);
      }}
    >
      {children}
      {/* Create subtle overlay if disabled */}
      {/* {isDragDisabled && (
        <Skeleton className="absolute inset-0 bg-background/60 bg-opacity-10" />
      )} */}
      {!isDragDisabled &&
        isHovering &&
        editable &&
        (typeof handleOnClick === 'function' ||
          typeof handleOnRemoveFile === 'function') && (
          <div
            className={cn(
              'absolute right-4 top-4 z-20 flex items-center justify-center gap-1.5 text-2xl',
              editableClassName
            )}
          >
            {handleOnClick && (
              <Button
                size="xs"
                variant="outline"
                disabled={isDragDisabled}
                className="gap-1.5 text-xs"
                onClick={handleOnClick}
              >
                <IconFileUpload className="size-3" />
                <span className={cn('', editCtaClassName)}>
                  <span className="sr-only">Change</span>
                  <span className="">{editCtaLabel}</span>
                </span>
              </Button>
            )}
            <Button
              size="xs"
              variant="destructive"
              disabled={isDragDisabled || !handleOnRemoveFile}
              className="gap-1.5 text-xs"
              onClick={handleOnRemoveFile}
            >
              <IconTrash className="size-3" />
              <span className={cn('', removeCtaClassName)}>
                <span className="sr-only">Remove</span>
                <span>{removeCtaLabel}</span>
              </span>
            </Button>
          </div>
        )}
    </Component>
  );
}
