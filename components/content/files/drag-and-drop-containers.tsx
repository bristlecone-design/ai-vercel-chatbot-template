'use client';

import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

import { FileUploaderSkeletonOverlay } from './file-uploader-skeletons';

interface BaseProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
}

/**
 * Drag and Drop Container for handling file uploads
 *
 * @note Does not handle file processing, only drag and drop events
 * @note Use in conjunction with the provider @WithFileUploaderProvider and components like @FileUploader
 */
export interface DragAndDropContainerProps extends BaseProps {
  handleOnDropOfFiles: (files: FileList | File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DragAndDropContainer({
  isLoading,
  disabled,
  handleOnDropOfFiles,
  as: Component = 'div',
  className,
  children,
}: DragAndDropContainerProps) {
  const [dragActive, setDragActive] = useState(false);

  const onHandleOnDropOfFiles = useCallback(
    (files: FileList | File[]) => {
      handleOnDropOfFiles(files);
    },
    [handleOnDropOfFiles]
  );

  const isDragDisabled = isLoading || disabled;

  return (
    <Component
      className={cn(
        'relative w-full sm:rounded-md',
        {
          'border-spacing-2': dragActive && !isDragDisabled,
          'border-primary': dragActive && !isDragDisabled,
          'border-dotted': dragActive && !isDragDisabled,
          'ring-2': dragActive && !isDragDisabled,
          'ring-border': dragActive && !isDragDisabled,
          'ring-offset-2': dragActive && !isDragDisabled,
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
    </Component>
  );
}

/**
 * Drag and Drop Container for handling file uploads
 *
 * @requires WithFileUploaderProvider to be wrapped around the component tree
 */
export interface WithCtxtDragAndDropProps extends DragAndDropContainerProps {
  loadingClassName?: string;
}

export function WithCtxtDragAndDrop({
  isLoading,
  loadingClassName,
  handleOnDropOfFiles,
  as,
  className,
  children,
}: WithCtxtDragAndDropProps) {
  return (
    <DragAndDropContainer
      as={as}
      className={className}
      isLoading={isLoading}
      handleOnDropOfFiles={handleOnDropOfFiles}
    >
      {children}
      {isLoading && (
        <FileUploaderSkeletonOverlay className={loadingClassName} />
      )}
    </DragAndDropContainer>
  );
}
