'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import filePlaceholder from '@/public/file-placeholder.png';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { nFormatter, timeAgo } from '@/lib/datesAndTimes';
import {
  ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS,
  getFileDataAsBase64,
  isImageTypeSupported,
  setFileBlobToObjectUrl,
} from '@/lib/images';
import {
  fileTypeToExtension,
  isImageFile,
  isMediaFileSupported,
  isVideoFile,
} from '@/lib/media/media-utils';
import {
  createFormDataFromFiles,
  removeDuplicatesFromArray,
} from '@/lib/pinecone-langchain/common-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  IconAttachFiles,
  IconCircleCheck,
  IconCircleX,
  IconClose,
  IconDocFiles,
  IconEyeView,
  IconFileUpload,
  IconTextFile,
} from '@/components/ui/icons';

import { Badge } from '../../ui/badge';
import {
  createFilesListHash,
  mapFileTypeToIcon,
  ParsedFileOrUrlListingStatusIcon,
  WithTooltip,
} from '../common/shared-components';
import { WithCtxtDragAndDrop } from './drag-and-drop-containers';
import { FileUploaderSkeletonOverlay } from './file-uploader-skeletons';
import type {
  FileInAnyValidKind,
  FileInBase64,
  FileInGenericUrl,
  FileInVideoUrl,
  FileKind,
  ParsedFile,
  ParsedFileStatus,
} from './file-uploader-types';

import { NUM_FILES_LIMIT } from '@/constants/settings';

export const MAX_FILES_SIZE_IN_BYTES = 12000000; // 10MB
export const MAX_IMAGE_FILE_SIZE_IN_BYTES = 12000000; // 12MB
export const MAX_AUDIO_FILE_SIZE_IN_BYTES = 250000000; // 25MB
export const MAX_VIDEO_FILE_SIZE_IN_BYTES = 750000000; // 75MB

export type FilesToSourceTypes = {
  files: Array<FileInAnyValidKind>;
  base64: Array<FileInBase64>;
  videoUrl: Array<FileInVideoUrl>;
};

/**
 * Map a File to its corresponding source type, e.g. base64, video url, etc.
 *
 */
export async function mapFilesToSourceType(
  files: File[]
): Promise<FilesToSourceTypes> {
  const mappedFiles: FilesToSourceTypes['files'] = [];
  if (files.length > 0) {
    for (const file of files) {
      const fileItem: FileInBase64 | undefined = undefined;

      // Only convert images
      if (isImageTypeSupported(file)) {
        const fileAsBase64 = await getFileDataAsBase64(file);
        mappedFiles.push({
          src: fileAsBase64,
          name: file.name,
          type: file.type,
          kind: 'image',
        } as FileInBase64);
      } else if (isVideoFile(file)) {
        const fileAsObjectUrl = setFileBlobToObjectUrl(file);
        mappedFiles.push({
          src: fileAsObjectUrl,
          name: file.name,
          type: file.type,
          kind: 'video',
        } as FileInVideoUrl);
      } else {
        mappedFiles.push({
          src: filePlaceholder.src,
          name: file.name,
          type: file.type,
          kind: 'file',
        } as FileInGenericUrl);
      }
    }
  }

  return {
    files: mappedFiles,
    base64: mappedFiles.filter((file) => file.kind === 'image'),
    videoUrl: mappedFiles.filter((file) => file.kind === 'video'),
  };
}

export function determineValidFiles(
  files: FileList | File[],
  numAllowed = NUM_FILES_LIMIT,
  validTypes: string[]
) {
  // Limit number of files to process from original list
  const filesExcluded = Array.from(files).slice(numAllowed);

  // Eligibility: validate file types then limit number of files to process
  const invalidTypes: string[] = [];
  const filesToProcess = Array.from(files)
    .filter((file) => {
      const fileTypeAllowed = isMediaFileSupported(file.type, validTypes);
      if (!fileTypeAllowed) {
        invalidTypes.push(file.type);
      }
      return fileTypeAllowed;
    })
    .slice(0, numAllowed);

  return {
    valid: filesToProcess,
    invalid: filesExcluded,
    invalidTypes,
  };
}

export type ProcessValidFilesResponse = {
  valid: File[];
  invalid: File[];
  invalidTypes: string[];
  totalValid: number;
  totalAttempted: number;
  maxAllowedMet: boolean;
  duplicates: File[];
  duplicatesCount: number;
  largeFilesList?: File[];
  base64List: Array<FileInBase64>;
  videoList: Array<FileInVideoUrl>;
};

export type ValidFilesMaxSizes = {
  maxFilesSize?: number;
  maxImageFileSize?: number;
  maxAudioFileSize?: number;
  maxVideoFileSize?: number;
};

export async function processValidFiles(
  newFiles: File[] | FileList,
  existingFiles: File[] = [],
  operation: FileUpdateOperation = 'append',
  numAllowed = NUM_FILES_LIMIT,
  validTypes = ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS,
  maxFileSizes: ValidFilesMaxSizes = {}
): Promise<ProcessValidFilesResponse> {
  if (!newFiles)
    return {
      valid: [],
      invalid: [],
      invalidTypes: [],
      base64List: [],
      videoList: [],
      totalValid: 0,
      totalAttempted: 0,
      duplicates: [],
      duplicatesCount: 0,
      maxAllowedMet: false,
    };

  const newFilesList = Array.from(newFiles);

  // Track number of files attempted to be attached
  const attemptedAttachedFilesCount = newFiles.length;

  // Determine if we're appending or overriding existing files
  if (operation === 'override') {
    existingFiles = [];
  }

  // Get any duplicate files
  const duplicateFiles = newFilesList.filter((newFile) =>
    existingFiles.some(
      (existingFile) =>
        existingFile.name === newFile.name && existingFile.type === newFile.type
    )
  );

  // Max file sizes for audio and video
  const {
    maxFilesSize = MAX_FILES_SIZE_IN_BYTES,
    maxImageFileSize = MAX_IMAGE_FILE_SIZE_IN_BYTES,
    maxAudioFileSize = MAX_AUDIO_FILE_SIZE_IN_BYTES,
    maxVideoFileSize = MAX_VIDEO_FILE_SIZE_IN_BYTES,
  } = (maxFileSizes || {}) as ValidFilesMaxSizes;
  // console.log(`***** maxFileSizes in processValidFiles`, {
  //   maxFilesSize,
  //   maxImageFileSize,
  //   maxAudioFileSize,
  //   maxVideoFileSize,
  // });

  // Check if existing files and max allowed count are exceeded
  if (existingFiles.length >= numAllowed) {
    toast.error(
      `Existing files already meet or exceed the number allowed. Try removing some files before adding more.`
    );
    return {
      valid: [],
      invalid: [],
      invalidTypes: [],
      base64List: [],
      videoList: [],
      totalValid: 0,
      maxAllowedMet: true,
      duplicates: duplicateFiles,
      duplicatesCount: duplicateFiles.length,
      totalAttempted: attemptedAttachedFilesCount,
    };
  }

  // Combined list of existing and new files minus duplicates
  const combinedUniqueFiles = existingFiles
    .concat(newFilesList)
    .filter((file) => {
      return !duplicateFiles.some(
        (duplicateFile) => duplicateFile.name === file.name
      );
    });

  // Get the valid files to process, e.g.
  // Existing files: 3, new files: 5, max allowed: 5, process last 2 new files
  const newFilesToProcess = combinedUniqueFiles.slice(
    existingFiles.length,
    numAllowed
  );

  const {
    valid: validFiles,
    invalid,
    invalidTypes,
  } = determineValidFiles(newFilesToProcess, numAllowed, validTypes);

  // Run the valid files through the filesize check
  // TODO: Move this to a separate function
  const tooLargeFiles: File[] = [];
  const finalValidFiles = validFiles.filter((file) => {
    switch (file.type) {
      // 25MB Limit for Audio/Video per Whisper API
      case 'audio/mpeg':
      case 'audio/x-m4a':
        const isTooBig = file.size >= maxAudioFileSize;

        if (isTooBig) {
          // invalid.push(file);
          tooLargeFiles.push(file);
          return false;
        }
        break;

      case 'video/mp4':
      case 'video/quicktime':
        const isTooBigVideo = file.size >= maxVideoFileSize;
        if (isTooBigVideo) {
          // invalid.push(file);
          tooLargeFiles.push(file);
          return false;
        }
        break;

      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        const isTooBigImage = file.size >= maxImageFileSize;
        if (isTooBigImage) {
          // invalid.push(file);
          tooLargeFiles.push(file);
          return false;
        }
        break;

      // Other file types (generic)
      case 'application/pdf':
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'text/plain':
      case 'text/csv':
      case 'application/json':
        const isTooBigGeneric = file.size >= maxFilesSize;
        if (isTooBigGeneric) {
          // invalid.push(file);
          tooLargeFiles.push(file);
          return false;
        }

      default:
        return true;
    }

    return true;
  });

  // Run the valid files through the base64 conversion
  const {
    files: allMappedFiles = [],
    base64: filesAsBase64 = [],
    videoUrl: filesAsVideoUrl = [],
  } = (
    validFiles.length ? await mapFilesToSourceType(validFiles) : {}
  ) as FilesToSourceTypes;

  return {
    valid: finalValidFiles,
    invalid,
    invalidTypes,
    maxAllowedMet: false,
    totalValid: finalValidFiles.length,
    totalAttempted: attemptedAttachedFilesCount,
    largeFilesList: tooLargeFiles,
    duplicates: duplicateFiles,
    duplicatesCount: duplicateFiles.length,
    base64List: filesAsBase64,
    videoList: filesAsVideoUrl,
  };
}

/**
 * Map an ingested file's status to an icon
 *
 * @param status - The status of the ingested file, @see ParsedFileStatus
 */
export function mapIngestedFileStatusToIcon(
  status: ParsedFileStatus,
  className?: string
): React.ReactNode {
  const baseClassName = 'size-4';
  switch (status) {
    case 'success':
      return <IconCircleCheck className={cn(baseClassName, className)} />;
    case 'error':
      return <IconCircleX className={cn(baseClassName, className)} />;
    default:
      return null;
  }
}

/**
 * Map a parsed file's status to an icon
 *
 * @param status - The status of the parsed file, @see ParsedFileStatus
 */
export function mapParsedFileStatusToIcon(
  status: ParsedFileStatus,
  className?: string
): React.ReactNode {
  const baseClassName = 'size-4';
  switch (status) {
    case 'success':
      return <IconTextFile className={cn(baseClassName, className)} />;
    case 'error':
      return <IconCircleX className={cn(baseClassName, className)} />;
    default:
      return null;
  }
}

export interface ParsedFileViewContentsProps {
  label?: string;
  className?: string;
  iconClassName?: string;
  parsedFile: ParsedFile;
  filePreview?: FileInBase64;
  onViewParsedFile: (file: ParsedFile, preview?: FileInBase64) => void;
}

export function ParsedFileViewContents({
  className,
  iconClassName,
  onViewParsedFile,
  filePreview,
  parsedFile,
  label,
}: ParsedFileViewContentsProps) {
  if (!parsedFile) return null;
  return (
    <Button
      variant="ghost"
      size="custom"
      className={cn(
        'relative cursor-pointer gap-1 hover:bg-transparent',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onViewParsedFile(parsedFile, filePreview);
      }}
    >
      <WithTooltip tooltip={'View Parsed File Contents'} triggerClassName="">
        <IconEyeView className={cn('size-4', iconClassName)} />
      </WithTooltip>
      {label}
    </Button>
  );
}

export interface FilePreviewThumbnailProps {
  file: FileInAnyValidKind;
  disabled?: boolean;
  className?: string;
  imgClassName?: string;
  btnClassName?: string;
  iconTypeClassName?: string;
  iconRemoveClassName?: string;
  children?: React.ReactNode;
  withTypeIcon?: boolean;
  onRemove?: (file: FileInAnyValidKind) => void;
}

export function FilePreviewThumbnail({
  withTypeIcon = false,
  imgClassName,
  iconTypeClassName,
  iconRemoveClassName,
  btnClassName,
  className,
  disabled,
  onRemove,
  file,
}: FilePreviewThumbnailProps) {
  const previewIcon = withTypeIcon
    ? mapFileTypeToIcon(file.type, iconTypeClassName)
    : null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'relative flex size-16 items-center justify-center rounded-sm bg-background',
          {
            border: !previewIcon,
          },
          className
        )}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 0.5, 1],
          scale: [0.5, 1],
          // animationDelay: '0.100ms',
          // animationDuration: '0.2s'
        }}
        //https://www.framer.com/motion/transition/
        transition={{
          duration: 0.3,
          ease: [0, 0.71, 0.2, 1.01],
          scale: {
            type: 'spring',
            damping: 5,
            stiffness: 100,
            restDelta: 0.001,
          },
        }}
        exit={{
          opacity: [1, 0.5, 0],
          scale: [1, 0.5, 0.75, 0.35, 0],
        }}
      >
        {onRemove && (
          <Button
            variant="ghost"
            disabled={disabled}
            aria-disabled={disabled}
            onClick={() => onRemove(file)}
            className={cn(
              'absolute -right-2 -top-2 z-10 size-4 rounded-full bg-background p-1',
              btnClassName
            )}
          >
            <IconClose className={cn('size-full', iconRemoveClassName)} />
          </Button>
        )}
        {withTypeIcon && previewIcon}
        {!previewIcon && (
          <Image
            fill
            alt={file.name}
            src={file.src || ''}
            className={cn('size-16 rounded-md object-cover', imgClassName)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export interface FilePreviewOverviewProps
  extends Omit<FilePreviewThumbnailProps, 'file' | 'onRemove'> {
  file: File;
  parsedFile?: ParsedFile;
  filePreview?: FileInBase64;
  withImagePreview?: boolean;
  filenameClassName?: string;
  imgPreviewClassName?: string;
  iconFileClassName?: string;
  className?: string;
  noUserActions?: boolean;
  handleViewingParsedFile?: (parsedFile: ParsedFile) => void;
}

/**
 * Provides a little overview of a file, e.g. name, size, last modified, and parsed status
 *
 */
export function FilePreviewOverview({
  file,
  parsedFile,
  filePreview,
  withImagePreview,
  filenameClassName,
  imgPreviewClassName,
  iconFileClassName,
  className,
  noUserActions = false,
  handleViewingParsedFile,
}: FilePreviewOverviewProps) {
  const parsedFileStatus = parsedFile?.status;
  const parseSucceeded = parsedFileStatus === 'success';

  return (
    <>
      <div className={cn('flex grow items-center justify-between', className)}>
        <div
          className={cn(
            'flex w-full content-start items-center justify-start gap-2'
          )}
        >
          <div className="">
            {!withImagePreview && (
              <IconDocFiles className={cn('size-6', iconFileClassName)} />
            )}
            {withImagePreview && filePreview && (
              <FilePreviewThumbnail
                withTypeIcon={!isImageFile(file)}
                className={cn('size-10', imgPreviewClassName)}
                file={{
                  src: filePreview.src || filePlaceholder.src,
                  name: filePreview.name,
                  type: filePreview.type,
                  kind: isImageFile(file) ? 'image' : 'file',
                }}
              />
            )}
          </div>
          <div className="flex max-w-full grow flex-col gap-1.5 text-sm leading-none">
            <div className={cn('inline-block truncate', filenameClassName)}>
              {file.name.length > 23
                ? `${file.name.slice(0, 23)}...`
                : file.name}
            </div>
            <div className="flex w-full items-center justify-between gap-1.5 text-foreground/40">
              <div className="flex items-center gap-1.5">
                <span className="">{nFormatter(file.size)}</span> &#8226;{' '}
                <span>Mod: {timeAgo(new Date(file.lastModified))}</span>
              </div>
              {parsedFile && (
                <div className="flex items-center gap-1.5 px-3">
                  {parsedFileStatus && (
                    <span className="flex items-center gap-0.5">
                      {
                        <ParsedFileOrUrlListingStatusIcon
                          status={parsedFile.status}
                        />
                      }
                      <span className="sr-only">
                        {parseSucceeded ? 'Parsed' : 'Error'}
                      </span>
                    </span>
                  )}
                  {!noUserActions && (
                    <span className="flex items-center gap-1.5">
                      {handleViewingParsedFile && (
                        <ParsedFileViewContents
                          label="Preview"
                          parsedFile={parsedFile}
                          filePreview={filePreview}
                          onViewParsedFile={handleViewingParsedFile}
                        />
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export interface FilePreviewListingProps extends FilePreviewOverviewProps {
  listingClassName?: string;
  iconCloseClassName?: string;
  btnClassName?: string;
  loadingClassName?: string;
  isLoading?: boolean;
  // Handlers
  handleRemovingFile?: (file: File) => void;
}

export function FilePreviewListing({
  isLoading = false,
  withImagePreview = true,
  loadingClassName,
  imgPreviewClassName,
  listingClassName,
  iconFileClassName,
  iconCloseClassName,
  filenameClassName,
  btnClassName,
  className,
  disabled,
  filePreview,
  parsedFile,
  file,
  // Handlers
  handleRemovingFile,
  handleViewingParsedFile,
}: FilePreviewListingProps) {
  // We don't want to show the remove icon if the file is being processed or if it's already processed
  const hasParsedFile = Boolean(parsedFile);
  const parsedFileStatus = parsedFile?.status;
  const showRemoveIcon = Boolean(handleRemovingFile);

  return (
    <div
      className={cn(
        'relative flex w-full max-w-full items-center justify-between gap-2 rounded-md border bg-background p-2',
        className
      )}
    >
      <FilePreviewOverview
        file={file}
        parsedFile={parsedFile}
        filePreview={filePreview}
        withImagePreview={withImagePreview}
        filenameClassName={filenameClassName}
        imgPreviewClassName={imgPreviewClassName}
        iconFileClassName={iconFileClassName}
        className={listingClassName}
        handleViewingParsedFile={handleViewingParsedFile}
      />

      {showRemoveIcon && handleRemovingFile && (
        <Button
          variant="ghost"
          disabled={disabled || isLoading}
          aria-disabled={disabled || isLoading}
          onClick={() => handleRemovingFile(file)}
          className={cn('', btnClassName)}
        >
          <IconClose className={cn('size-4', iconCloseClassName)} />
        </Button>
      )}
      {isLoading && (
        <FileUploaderSkeletonOverlay className={loadingClassName} />
      )}
    </div>
  );
}

export type FileUpdateOperation = 'override' | 'append';

export type FileUploadStatus = 'idle' | 'loading' | 'success' | 'error';

// Drag and Drop File Upload Context for managing files in other components
export type FileUploadContextType = {
  files: File[] | null | undefined;
  filesHash?: string | null; // string of file names
  base64Files: FileInBase64[] | null;
  videoFiles: FileInVideoUrl[] | null;
  validTypes: string[];
  numAllowedFiles: number;
  maxFilesSize?: number;
  maxImageFileSize?: number;
  maxAudioFileSize?: number;
  maxVideoFileSize?: number;
  operation: FileUpdateOperation;
  status: FileUploadStatus;
  formRef?: React.RefObject<HTMLFormElement>;
  setFiles: (files: File[] | null) => void;
  setAndProcessFiles?: (
    files: FileList | File[],
    operation?: FileUpdateOperation,
    maxFiles?: number,
    validTypes?: string[]
  ) => Promise<
    | {
        valid: File[];
        invalid: File[];
        duplicates: File[];
        largeFilesList: File[];
        maxAllowedMet: boolean;
        totalValid: number;
        totalAttempted: number;
      }
    | undefined
  >;
  removeBase64File?: (file: FileInBase64) => void;
  handleUpdatingBase64Files?: (
    files: FileInBase64[],
    operation?: FileUpdateOperation
  ) => void;
  handleDropOfFiles?: (
    files: FileList | File[],
    operation?: FileUpdateOperation,
    maxFiles?: number,
    validTypes?: string[]
  ) => void;
  handleChangeFiles: (
    files: FileList | File[],
    operation?: FileUpdateOperation,
    maxFiles?: number,
    validTypes?: string[]
  ) => void;
  handleSettingCustomCallback?: (cb: (files: File[]) => void) => void;
  handleSettingValidTypes: (types: string[]) => void;
  handleSettingNumAllowedFiles: (num: number) => void;
  handleSettingOperationType: (op: FileUpdateOperation) => void;
  handleSettingMaxFileSize: (size: number) => void;
  handleSettingMaxImageFileSize: (size: number) => void;
  handleSettingMaxAudioFileSize: (size: number) => void;
  handleSettingMaxVideoFileSize: (size: number) => void;
  setStatus: (status: FileUploadStatus) => void;
  removeFile: (file: File) => void;
  clearFileByName: (fileName: string, kind?: FileKind) => void;
  resetSlate: () => void;
  resetFiles: () => void;
};

export const fileUploadContextInitialState: FileUploadContextType = {
  files: null,
  filesHash: null,
  base64Files: null,
  videoFiles: null,
  operation: 'append',
  numAllowedFiles: NUM_FILES_LIMIT,
  validTypes: ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS,
  maxFilesSize: MAX_FILES_SIZE_IN_BYTES,
  maxImageFileSize: MAX_IMAGE_FILE_SIZE_IN_BYTES,
  maxAudioFileSize: MAX_AUDIO_FILE_SIZE_IN_BYTES,
  maxVideoFileSize: MAX_VIDEO_FILE_SIZE_IN_BYTES,
  status: 'idle',
  setFiles: () => {},
  setAndProcessFiles: async () => undefined,
  handleUpdatingBase64Files: async () => {},
  handleSettingNumAllowedFiles: () => {},
  handleSettingOperationType: () => {},
  handleDropOfFiles: () => {},
  handleChangeFiles: () => {},
  handleSettingCustomCallback: () => {},
  handleSettingValidTypes: () => {},
  handleSettingMaxFileSize: () => {},
  handleSettingMaxImageFileSize: () => {},
  handleSettingMaxAudioFileSize: () => {},
  handleSettingMaxVideoFileSize: () => {},
  removeBase64File: () => {},
  clearFileByName: () => {},
  setStatus: () => {},
  removeFile: () => {},
  resetSlate: () => {},
  resetFiles: () => {},
};

export const FileUploadContext = React.createContext<FileUploadContextType>(
  fileUploadContextInitialState
);

/**
 * Hook to use the FileUploadContext
 *
 * @params props - Initialize with FileUploadProviderProps
 *
 * @note For Context best practices, @see https://kentcdodds.com/blog/how-to-use-react-context-effectively
 *
 * @returns FileUploadContextType
 */
export function useWithFileUpload(props?: Partial<FileUploadProviderProps>) {
  const context = React.useContext(FileUploadContext);
  if (context === undefined) {
    throw new Error(
      'useWithFileUpload must be used within a FileUploadContext Provider'
    );
  }

  // 'files' | 'validTypes' | 'numAllowedFiles' | 'operation'
  const {
    files: initFiles,
    operation: operationInit,
    validTypes: initValidTypes,
    numAllowedFiles: initNumOfFiles,
    maxFilesSize: initMaxFilesSize = MAX_FILES_SIZE_IN_BYTES,
    maxImageFileSize: initMaxImageFileSize = MAX_IMAGE_FILE_SIZE_IN_BYTES,
    maxAudioFileSize: initMaxAudioFileSize = MAX_AUDIO_FILE_SIZE_IN_BYTES,
    maxVideoFileSize: initMaxVideoFileSize = MAX_VIDEO_FILE_SIZE_IN_BYTES,
    onFileChangeCb,
  } = (props || {}) as FileUploadProviderProps;

  const {
    setAndProcessFiles,
    handleSettingValidTypes,
    handleSettingNumAllowedFiles,
    handleSettingOperationType,
    handleSettingMaxFileSize,
    handleSettingMaxImageFileSize,
    handleSettingMaxAudioFileSize,
    handleSettingMaxVideoFileSize,
    handleSettingCustomCallback,
  } = context;

  // Initialize prop files, validTypes, etc. on mount within the context provider
  useEffect(() => {
    if (initFiles) {
      setAndProcessFiles?.(initFiles);
    }
    if (initValidTypes) {
      handleSettingValidTypes(initValidTypes);
    }
    if (initNumOfFiles) {
      handleSettingNumAllowedFiles?.(initNumOfFiles);
    }
    if (operationInit) {
      handleSettingOperationType(operationInit);
    }
    if (initMaxFilesSize) {
      handleSettingMaxFileSize(initMaxFilesSize);
    }
    if (initMaxImageFileSize) {
      handleSettingMaxImageFileSize(initMaxImageFileSize);
    }
    if (initMaxAudioFileSize) {
      handleSettingMaxAudioFileSize(initMaxAudioFileSize);
    }
    if (initMaxVideoFileSize) {
      handleSettingMaxVideoFileSize(initMaxVideoFileSize);
    }
    if (
      typeof onFileChangeCb === 'function' &&
      typeof handleSettingCustomCallback === 'function'
    ) {
      handleSettingCustomCallback(onFileChangeCb);
    }
  }, []);

  // Return the context with initial values from props
  let initialContext = { ...context } as FileUploadContextType;

  if (initFiles) {
    initialContext = {
      ...initialContext,
      files: initFiles,
    };
  }

  if (initValidTypes) {
    initialContext = {
      ...initialContext,
      validTypes: initValidTypes,
    };
  }

  if (initNumOfFiles) {
    initialContext = {
      ...initialContext,
      numAllowedFiles: initNumOfFiles,
    };
  }

  if (operationInit) {
    initialContext = {
      ...initialContext,
      operation: operationInit,
    };
  }

  if (initMaxFilesSize) {
    initialContext = {
      ...initialContext,
      maxFilesSize: initMaxFilesSize,
    };
  }

  if (initMaxImageFileSize) {
    initialContext = {
      ...initialContext,
      maxImageFileSize: initMaxImageFileSize,
    };
  }

  if (initMaxAudioFileSize) {
    initialContext = {
      ...initialContext,
      maxAudioFileSize: initMaxAudioFileSize,
    };
  }

  if (initMaxVideoFileSize) {
    initialContext = {
      ...initialContext,
      maxVideoFileSize: initMaxVideoFileSize,
    };
  }

  return { ...initialContext };
}

export interface BaseProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
}

export interface BaseFileUploadProviderProps
  extends Pick<
    FileUploadContextType,
    | 'files'
    | 'validTypes'
    | 'numAllowedFiles'
    | 'operation'
    | 'maxAudioFileSize'
    | 'maxFilesSize'
    | 'maxImageFileSize'
    | 'maxVideoFileSize'
  > {}

export interface FileUploadProviderProps
  extends BaseProps,
    Partial<BaseFileUploadProviderProps> {
  // Callback to inform consumer of file changes
  onFileChangeCb?: (files: File[]) => void;
}

export const DEFAULT_FILE_UPLOAD_PROP_VALS: BaseFileUploadProviderProps = {
  files: null,
  operation: 'append',
  validTypes: ACCEPTED_MEDIA_TYPE_FILE_EXTENSIONS,
  numAllowedFiles: NUM_FILES_LIMIT,
};

/**
 * FileUploadProvider for managing files in other components
 *
 * @returns FileUploadContextProvider
 */
export function FileUploadProvider(props: FileUploadProviderProps) {
  const {
    maxFilesSize: maxFilesSizeProp = MAX_FILES_SIZE_IN_BYTES,
    maxAudioFileSize: maxAudioFileSizeProp = MAX_AUDIO_FILE_SIZE_IN_BYTES,
    maxImageFileSize: maxImageFileSizeProp = MAX_IMAGE_FILE_SIZE_IN_BYTES,
    maxVideoFileSize: maxVideoFileSizeProp = MAX_VIDEO_FILE_SIZE_IN_BYTES,
    operation: operationProp = DEFAULT_FILE_UPLOAD_PROP_VALS.operation,
    files: filesProp = DEFAULT_FILE_UPLOAD_PROP_VALS.files,
    validTypes: validTypesProp = DEFAULT_FILE_UPLOAD_PROP_VALS.validTypes,
    numAllowedFiles:
      numAllowedFilesProp = DEFAULT_FILE_UPLOAD_PROP_VALS.numAllowedFiles,
    onFileChangeCb,
    children,
  } = props;

  // Custom callback for file changes, takes into account prop of onFileChangeCb
  const [customCallback, setCustomCallback] =
    useState<FileUploadProviderProps['onFileChangeCb']>(onFileChangeCb);

  const [files, setFiles] =
    useState<BaseFileUploadProviderProps['files']>(filesProp);

  const [status, setStatus] = useState<FileUploadStatus>('idle');

  const [operationType, setOperationType] = useState<FileUpdateOperation>(
    operationProp!
  );

  const [validTypes, setValidTypes] = useState<
    BaseFileUploadProviderProps['validTypes']
  >(validTypesProp!);

  const [numAllowedFiles, setNumAllowedFiles] = useState<
    BaseFileUploadProviderProps['numAllowedFiles']
  >(numAllowedFilesProp!);

  const [filesInBase64, setFilesInBase64] =
    useState<Array<FileInBase64> | null>(null);

  const [filesInVideoUrl, setFilesInVideoUrl] = useState<Array<FileInVideoUrl>>(
    []
  );

  // Max file sizes for images, audio and video
  const [maxFilesSize, setMaxFilesSize] = useState<number>(maxFilesSizeProp);
  const [maxImageFileSize, setMaxImageFileSize] =
    useState<number>(maxImageFileSizeProp);
  const [maxAudioFileSize, setMaxAudioFileSize] =
    useState<number>(maxAudioFileSizeProp);
  const [maxVideoFileSize, setMaxVideoFileSize] =
    useState<number>(maxVideoFileSizeProp);

  const handleResetFiles = () => {
    setFiles(null);
    setFilesInBase64(null);
    setFilesInVideoUrl([]);
  };

  const handleSettingCustomCallback = (
    cb: FileUploadProviderProps['onFileChangeCb']
  ) => {
    setCustomCallback(cb);
  };

  /**
   * Reset core files, base64 files and other states
   */
  const handleResetingSlate = () => {
    handleResetFiles();
    setStatus('idle');
  };

  const handleSettingValidTypes = (types: string[]) => {
    setValidTypes(types);
  };

  const handleSettingNumAllowedFiles = (num: number) => {
    setNumAllowedFiles(num);
  };

  const handleSettingOperationType = (op: FileUpdateOperation) => {
    setOperationType(op);
  };

  const handleSettingMaxFileSize = (size: number) => {
    setMaxFilesSize(size);
  };

  const handleSettingMaxImageFileSize = (size: number) => {
    setMaxImageFileSize(size);
  };

  const handleSettingMaxAudioFileSize = (size: number) => {
    setMaxAudioFileSize(size);
  };

  const handleSettingMaxVideoFileSize = (size: number) => {
    setMaxVideoFileSize(size);
  };

  const handleRemoveBase64File = (fileToRemove: File | FileInBase64) => {
    if (fileToRemove) {
      const fileName =
        fileToRemove instanceof File ? fileToRemove.name : fileToRemove.name;

      setFilesInBase64((prevState) => {
        if (prevState) {
          const newFilesInBase64 = prevState.filter(
            (fileInBase64) => fileInBase64.name !== fileName
          );
          return newFilesInBase64;
        }

        return prevState;
      });
    }
  };

  const handleRemovingFile = (file: File) => {
    if (files) {
      setFiles((currentFiles) => {
        if (!currentFiles) return;
        const newFiles = currentFiles.filter((f) => f.name !== file.name);
        return newFiles;
      });
    }
  };

  const handleClearingFileByName = (fileName: string, kind?: FileKind) => {
    if (files) {
      // Remove from primary files
      setFiles((currentFiles) => {
        if (!currentFiles) return;
        const newFiles = currentFiles.filter((f) => f.name !== fileName);
        return newFiles;
      });

      if (kind) {
        if (kind === 'image') {
          // Remove from base64 files
          setFilesInBase64((prevState) => {
            if (prevState) {
              const newFilesInBase64 = prevState.filter(
                (fileInBase64) => fileInBase64.name !== fileName
              );
              return newFilesInBase64;
            }

            return prevState;
          });
        } else if (kind === 'video') {
          // Remove from video files
          setFilesInVideoUrl((prevState) => {
            if (prevState) {
              const newFilesInVideo = prevState.filter(
                (fileInVideo) => fileInVideo.name !== fileName
              );
              return newFilesInVideo;
            }

            return prevState;
          });
        }
      }
    }
  };

  /**
   * Handler for updating files with an array of files and an option to override existing files or append
   */
  const handleUpdatingFiles = useCallback(
    (
      providedFiles: File[] | File[],
      op: FileUpdateOperation = operationType
    ) => {
      setFiles((prevState) => {
        if (prevState && op === 'append') {
          return prevState.concat(providedFiles);
        }
        return providedFiles;
      });
      // Custom callback
      if (typeof customCallback === 'function') {
        customCallback(providedFiles);
      }
    },
    [numAllowedFiles, customCallback]
  );

  /**
   * Handler for updating files in base64
   *
   * Similar to handleUpdatingFiles but for setting files in base64
   */
  const handleUpdatingProcessedBase64Files = useCallback(
    async (
      providedFiles: FileInBase64[],
      op: FileUpdateOperation = operationType
    ) => {
      setFilesInBase64((prevState) => {
        if (prevState && op === 'append') {
          return prevState.concat(providedFiles);
        }
        return providedFiles;
      });
    },
    [numAllowedFiles]
  );

  /**
   * Handler for updating files in video
   *
   * Similar to handleUpdatingFiles but for setting files in video
   */
  const handleUpdatingProcessedVideoFiles = useCallback(
    async (
      providedFiles: FileInVideoUrl[],
      op: FileUpdateOperation = operationType
    ) => {
      setFilesInVideoUrl((prevState) => {
        if (prevState && op === 'append') {
          return prevState.concat(providedFiles);
        }
        return providedFiles;
      });
    },
    [numAllowedFiles]
  );

  /**
   * Primary handler for setting files in the context
   * Also handles processing files to base64 and updating the base64 files
   *
   * @param providedFiles - FileList or File[]
   * @param operation - FileUpdateOperation (default: 'append')
   * @param maxFiles - number of files allowed (default: numAllowedFiles)
   * @param validTypesList - list of valid file types (default: validTypes)
   */
  const handleSettingFiles = useCallback(
    async (
      providedFiles: FileList | File[],
      op: FileUpdateOperation = operationType,
      maxFiles = numAllowedFiles,
      validTypesList = validTypes
    ): Promise<
      | {
          valid: File[];
          invalid: File[];
          duplicates: File[];
          largeFilesList: File[];
          maxAllowedMet: boolean;
          totalValid: number;
          totalAttempted: number;
        }
      | undefined
    > => {
      const {
        base64List,
        videoList,
        valid: validList,
        invalid: invalidList,
        duplicates: duplicatesList,
        largeFilesList,
        duplicatesCount,
        maxAllowedMet,
        invalidTypes,
        totalAttempted,
        totalValid,
      } = await processValidFiles(
        providedFiles,
        files ?? [],
        op,
        maxFiles,
        validTypesList,
        {
          maxFilesSize,
          maxAudioFileSize,
          maxImageFileSize,
          maxVideoFileSize,
        }
      );

      const hasDuplicates = duplicatesCount > 0;

      const hasLargeFiles = largeFilesList && largeFilesList.length > 0;
      if (hasLargeFiles) {
        toast.error(
          `Some files were excluded due to being too large. Please ensure files are under the size limit, e.g. ${largeFilesList
            .map((file) => file.name)
            .join(', ')}`
        );
      }

      if (invalidList.length > 0) {
        toast.error(
          `${invalidList.length} were excluded due to invalid file types or being too big: ${invalidTypes.join(', ')}`
        );
      }

      if (!maxAllowedMet && !totalValid && !hasDuplicates && !hasLargeFiles) {
        toast.error(
          `No valid files to process. Here are the eligible file types: ${validTypesList.map((type) => `.${fileTypeToExtension(type)}`).join(', ')}`,
          {
            duration: 8000,
          }
        );
      }

      if (hasDuplicates) {
        toast.info(
          `Duplicate files ignored: ${duplicatesList
            .map((file) => file.name)
            .join(', ')}`,
          {
            duration: 4500,
          }
        );
      }

      // Set dropped files in context
      if (Boolean(totalValid)) {
        // console.log(`setting valid files in state`, validList);
        // Notify user of valid files
        toast.success(
          `Successfully attached ${totalValid} file(s) out of ${totalAttempted}.`,
          {
            duration: 1750,
            closeButton: true,
          }
        );

        // Update primary files
        handleUpdatingFiles(validList, op);

        // Set files in base64
        if (base64List.length) {
          handleUpdatingProcessedBase64Files(base64List, op);
        }

        // Set files in video
        if (videoList.length) {
          handleUpdatingProcessedVideoFiles(videoList, op);
        }

        return {
          valid: validList,
          invalid: invalidList,
          duplicates: duplicatesList,
          largeFilesList,
          maxAllowedMet,
          totalValid,
          totalAttempted,
        };
      }

      return undefined;
    },
    [numAllowedFiles, files, operationType, validTypes]
  );

  const providerValues: FileUploadContextType = {
    status,
    validTypes,
    files: files,
    videoFiles: filesInVideoUrl,
    base64Files: filesInBase64,
    maxFilesSize: maxFilesSizeProp,
    maxImageFileSize: maxImageFileSizeProp,
    maxAudioFileSize: maxAudioFileSizeProp,
    maxVideoFileSize: maxVideoFileSizeProp,
    filesHash: createFilesListHash(files),
    numAllowedFiles: numAllowedFiles,
    operation: operationType,
    setFiles: setFiles,
    setStatus: setStatus,
    clearFileByName: handleClearingFileByName,
    removeFile: handleRemovingFile,
    resetFiles: handleResetFiles, // Clears all files: dropped and base64
    resetSlate: handleResetingSlate,
    handleChangeFiles: handleSettingFiles,
    handleDropOfFiles: handleSettingFiles,
    setAndProcessFiles: handleSettingFiles,
    handleUpdatingBase64Files: handleUpdatingProcessedBase64Files,
    removeBase64File: handleRemoveBase64File,
    handleSettingCustomCallback: handleSettingCustomCallback,
    handleSettingValidTypes: handleSettingValidTypes,
    handleSettingNumAllowedFiles: handleSettingNumAllowedFiles,
    handleSettingOperationType: handleSettingOperationType,
    handleSettingMaxFileSize: handleSettingMaxFileSize,
    handleSettingMaxImageFileSize: handleSettingMaxImageFileSize,
    handleSettingMaxAudioFileSize: handleSettingMaxAudioFileSize,
    handleSettingMaxVideoFileSize: handleSettingMaxVideoFileSize,
  };

  return (
    <FileUploadContext.Provider value={providerValues}>
      {children}
    </FileUploadContext.Provider>
  );
}

/**
 * File Upload Provider for managing files in other components
 *
 * @usage Place this component at the root of the component tree to manage file uploads globally or locally within a component
 *
 * @see useWithFileUpload hook for consuming and updating the context
 */
export interface WithFileUploaderProviderProps
  extends BaseProps,
    FileUploadProviderProps {}

export function WithFileUploaderProvider({
  as: Component,
  className,
  children,
  ...providerProps
}: WithFileUploaderProviderProps) {
  return (
    <FileUploadProvider {...providerProps}>
      {Component && <Component className={className}>{children}</Component>}
      {!Component && children}
    </FileUploadProvider>
  );
}

export interface FileUploaderProps
  extends Omit<FileUploadProviderProps, 'children'> {
  children?: React.ReactNode;
  disabled?: boolean;
  fileListingClassName?: string;
  headingClassName?: string;
  contentClassName?: string;
  dragAndDropClassName?: string;
  dragAndDropCtxtClassName?: string;
  dragAndDropLabel?: string;
  dragAndDropInfoIcon?: React.ReactNode;
  nowShowFilesListing?: boolean;
  noTitle?: boolean;
  noDescription?: boolean;
  noRemainingCount?: boolean;
  noSubmitBtn?: boolean;
  isLoading?: boolean;
  // Helper for form submission
  formRef?: React.Ref<HTMLFormElement>;
  parsedFiles?: ParsedFile[];
  numAllowedFilesLeftNote?: string;
  // Handlers
  onSubmit?: (formData: FormData) => Promise<void>;
  onViewParsedFile?: (file: ParsedFile) => void;
  onRemoveFile?: (file: File) => void;
}

/**
 * Upload files to the system
 *
 * @note Leverages @WithCtxtDragAndDrop for interactive drag and drop functionality with file processing, preview and removal
 *
 */
export function FileUploader({
  children,
  isLoading = false,
  disabled = false,
  nowShowFilesListing = false,
  noRemainingCount = false,
  noSubmitBtn = false,
  headingClassName,
  contentClassName,
  dragAndDropCtxtClassName,
  dragAndDropClassName,
  fileListingClassName,
  noDescription,
  noTitle,
  className,
  files: filesProp,
  parsedFiles: parsedFilesProp,
  operation: operationProp,
  numAllowedFiles: numAllowedFilesProp,
  validTypes: validTypesProp,
  formRef: formRefProp,
  dragAndDropLabel = 'Drag and drop your files here',
  dragAndDropInfoIcon,
  numAllowedFilesLeftNote,
  // Max file size in bytes
  maxFilesSize: maxFilesSizeProp = MAX_FILES_SIZE_IN_BYTES,
  maxImageFileSize: maxImageFileSizeProp = MAX_IMAGE_FILE_SIZE_IN_BYTES,
  maxAudioFileSize: maxAudioFileSizeProp = MAX_AUDIO_FILE_SIZE_IN_BYTES,
  maxVideoFileSize: maxVideoFileSizeProp = MAX_VIDEO_FILE_SIZE_IN_BYTES,
  // Handlers
  onRemoveFile: onRemoveFileProp,
  onViewParsedFile,
  onSubmit,
}: FileUploaderProps) {
  const {
    files,
    status,
    base64Files,
    validTypes,
    maxFilesSize,
    maxAudioFileSize,
    maxImageFileSize,
    maxVideoFileSize,
    numAllowedFiles,
    handleDropOfFiles,
    handleChangeFiles,
    removeFile: handleRemovingFile,
    setStatus: setFileUploadStatus,
  } = useWithFileUpload({
    files: filesProp,
    operation: operationProp,
    validTypes: validTypesProp,
    numAllowedFiles: numAllowedFilesProp,
    maxImageFileSize: maxImageFileSizeProp,
    maxAudioFileSize: maxAudioFileSizeProp,
    maxVideoFileSize: maxVideoFileSizeProp,
    maxFilesSize: maxFilesSizeProp,
  });

  /**
   * Handle form submission
   */
  const onHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = createFormDataFromFiles(files!);
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  /**
   * Handle removing an attached file
   *
   * @note Takes into account a custom handler for removing files
   */
  const onHandleRemoveFile = (file: File) => {
    handleRemovingFile(file);
    if (typeof onRemoveFileProp === 'function') {
      onRemoveFileProp(file);
    }
  };

  /**
   * Wrapper for handling file drop events
   *
   * @note The context functions accept additional inputs for file processing, if needed
   *
   * @param files - FileList or File[]
   * @param operation - FileUpdateOperation (default: 'append')
   */
  const onHandleDropOfFiles = (
    files: File[] | FileList,
    operation: FileUpdateOperation = 'append'
  ) => {
    if (typeof handleDropOfFiles === 'function') {
      handleDropOfFiles(files, operation);
    }
  };

  /**
   * Wrapper for handling file change events
   *
   * @note signature is similar to handleDropOfFiles, just slightly different with the initial input because we're dealing directly with the input element
   *
   */
  const onHandleChangeOfFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      handleChangeFiles(files);
    }
  };

  const noTitleOrDescription = noTitle && noDescription;
  const isFormDataProcessing = status === 'loading';

  return (
    <Card className={cn('w-full max-w-lg', className)}>
      {!noTitleOrDescription && (
        <CardHeader>
          {!noTitle && (
            <h3 className={cn('text-base', headingClassName)}>
              Upload your files
            </h3>
          )}
          {!noDescription && (
            <p className="mt-1 text-sm leading-none text-foreground/70">
              Drag and drop your files here or click the button below.
            </p>
          )}
        </CardHeader>
      )}
      <CardContent
        className={cn(
          'relative flex max-w-full flex-col gap-4 p-4',
          contentClassName
        )}
      >
        <WithCtxtDragAndDrop
          disabled={disabled}
          isLoading={isFormDataProcessing}
          handleOnDropOfFiles={onHandleDropOfFiles}
          className={cn(
            'max-w-full border-2 border-dashed',
            dragAndDropClassName
          )}
        >
          <form
            id="file-upload-form"
            ref={formRefProp}
            aria-disabled={disabled}
            // aria-disabled={isFormDataProcessing}
            onSubmit={onHandleSubmit}
            // action={async (formData) => {
            //   setFileUploadStatus('loading');
            //   console.log(`form submitted::data`, formData);
            //   await sleep(10000);
            //   setFileUploadStatus('success');
            //   await sleep(2000);
            //   setFileUploadStatus('idle');
            // }}
          >
            <div className="p-4 text-center hover:brightness-125">
              <label
                htmlFor="files"
                aria-disabled={disabled}
                className={cn('flex cursor-pointer flex-col gap-2', {
                  'opacity-50': disabled,
                  'cursor-not-allowed': disabled,
                })}
              >
                <IconDocFiles className="mx-auto size-12" />
                <div className="flex flex-col items-center gap-1.5 text-sm text-foreground/70">
                  <span className="flex items-center gap-1.5">
                    {dragAndDropLabel}
                    {dragAndDropInfoIcon}
                  </span>
                  {!noRemainingCount && (
                    <Badge variant="secondary" className="gap-1 brightness-75">
                      <IconAttachFiles className="size-3" />
                      {files?.length || 0} files attached{' '}
                      {numAllowedFilesLeftNote}
                    </Badge>
                  )}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-center gap-1.5 border-y py-3">
              <label
                htmlFor="files"
                className={cn('flex items-center justify-center gap-1.5', {
                  'opacity-50': disabled,
                  'cursor-pointer': !disabled,
                  'cursor-not-allowed': disabled,
                })}
              >
                <IconFileUpload className={cn('size-5')} />
                <span className="text-sm text-foreground/50">
                  Browse local files
                </span>
              </label>
              <input
                multiple
                id="files"
                name="files"
                type="file"
                className="sr-only"
                disabled={disabled}
                onChange={onHandleChangeOfFiles}
              />
            </div>
            <div className="p-2 text-xs text-foreground/70">
              Accepts:{' '}
              <span className="text-foreground/50">
                {removeDuplicatesFromArray(
                  validTypes.map((type) => `.${fileTypeToExtension(type)}`)
                ).join(', ')}
              </span>
            </div>
            <div
              className={cn('flex justify-end p-2', {
                hidden: noSubmitBtn,
              })}
            >
              <Button type="submit" variant="default" className="">
                Upload
              </Button>
            </div>
          </form>
        </WithCtxtDragAndDrop>
        {!nowShowFilesListing && files && (
          <div
            className={cn(
              'relative flex max-h-64 max-w-full flex-col items-center gap-2 overflow-y-auto',
              fileListingClassName
            )}
          >
            {files.length > 0 &&
              files.map((file, index) => {
                const filePreview = base64Files?.find(
                  (fileInBase64) => fileInBase64.name === file.name
                );
                const parsedFile = parsedFilesProp?.find(
                  (parsedFile) => parsedFile.file.name === file.name
                );

                return (
                  <FilePreviewListing
                    key={index}
                    file={file}
                    parsedFile={parsedFile}
                    filePreview={filePreview}
                    isLoading={isFormDataProcessing}
                    handleRemovingFile={onHandleRemoveFile}
                    handleViewingParsedFile={onViewParsedFile}
                  />
                );
              })}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * File Uploader with Ref
 */
export const FileUploaderWithRef = React.forwardRef(
  (props: FileUploaderProps, ref: React.Ref<HTMLFormElement>) => {
    return <FileUploader {...props} formRef={ref} />;
  }
);
FileUploaderWithRef.displayName = 'FileUploaderWithRef';
