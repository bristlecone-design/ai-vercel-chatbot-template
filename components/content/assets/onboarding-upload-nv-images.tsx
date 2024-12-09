'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { PutBlobResult } from '@vercel/blob';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';

import { nFormatter } from '@/lib/datesAndTimes';
import { getErrorMessage } from '@/lib/errors';
import {
  DEFAULT_FILES_UPLOAD_KEY,
  getAllFilesFromFormData,
} from '@/lib/forms/form-utils';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from '@/lib/images';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  IconCircleMinus,
  IconCirclePlus,
  IconExpand,
  IconFileUpload,
  IconImages,
  IconSpinner,
} from '@/components/ui/icons';
import { ButtonScrollToTop } from '@/components/button-scroll-to-top';
import { SharedInfoTooltip } from '@/components/tooltip';

import { ErrorMessages, SuccessAnimated } from '../common/shared-components';
import {
  DEFAULT_API_INGEST_ENDPOINT,
  DEFAULT_API_PARSER_ENDPOINT,
} from '../common/shared-fetchers';
import {
  FileUploaderWithRef,
  useWithFileUpload,
  type FileUploaderProps,
} from '../files/file-uploader';
import type { ParsedFile } from '../files/file-uploader-types';
import {
  PreviewUploadedAssets,
  PreviewUserUploadedAssetsDialog,
  type UploadedAssetsProps,
} from './preview-user-uploaded-images';

import type { AppUser as AUTH_USER_MODEL } from '@/types/next-auth';
import type { PhotoBasicExifData } from '@/types/photo';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UploadContentStage = 'start' | 'attached' | 'uploaded';

export interface OnboardingUploadNVImagesProps {
  noMaxNumFiles?: boolean;
  maxNumFiles?: number;
  uploadedAssets?: PhotoBasicExifData[];
  apiParserEndpoint?: string;
  apiIngestEndpoint?: string;
  apiFilesKey?: string;
  formUploader?: FileUploaderProps;
  projectNamespace?: string;
  projectUrlSource?: string;
  projectUrlTitle?: string;
  className?: string;
  mediaContainerClassName?: string;
  noInputFields?: boolean;
  noScrollToTopBtn?: boolean;
  noUploadedHeadingText?: boolean;
  noSummaryBtnDialogExpand?: boolean;
  authUser: AUTH_USER_MODEL;
  userProfile?: USER_PROFILE_MODEL;
  selectedMediaIds?: UploadedAssetsProps['selectedMediaIds'];
  featuredMediaCacheKey?: string;
  disableSelectingMedia?: boolean;
  handleOnSelectingAsset?: (assetId: string) => void;
  handleOnUnselectAllAssets?: () => void;
  // Parent should already be tracking the selected media ids
  handleOnCreateWithSelectedAssets?: (selectedMediaIds?: string[]) => void;
}

export function OnboardingUploadNVImages({
  noMaxNumFiles = false,
  noScrollToTopBtn = false,
  noUploadedHeadingText = false,
  noSummaryBtnDialogExpand = false,
  maxNumFiles = 75,
  uploadedAssets = [],
  apiParserEndpoint = DEFAULT_API_PARSER_ENDPOINT,
  apiIngestEndpoint = DEFAULT_API_INGEST_ENDPOINT,
  apiFilesKey = DEFAULT_FILES_UPLOAD_KEY,
  formUploader: formUploaderProps,
  projectNamespace: projectNamespaceProp = '',
  projectUrlSource: projectUrlSourceProp = '',
  projectUrlTitle: projectUrlTitleProp = '',
  noInputFields = false,
  mediaContainerClassName,
  className,
  authUser,
  selectedMediaIds = [],
  disableSelectingMedia,
  featuredMediaCacheKey,
  handleOnSelectingAsset: handleOnSelectingAssetProp,
  handleOnUnselectAllAssets: handleOnUnselectAllAssetsProp,
  handleOnCreateWithSelectedAssets: handleOnCreateWithSelectedAssetsProp,
}: OnboardingUploadNVImagesProps) {
  // console.log(
  //   `**** uploadedAssets in OnboardingUploadNVImages`,
  //   uploadedAssets
  // );
  const pathname = usePathname();
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);

  // User's asset descriptor (optional)
  const [userAssetsDescriptor, setUserAssetsDescriptor] =
    useLocalStorage<string>(
      'exp-nv-onboarding-user-images',
      projectNamespaceProp
    );

  // Track error messages
  const [errorMsg, setErrorMsg] = React.useState<string[]>([]);

  // Track the stage of the content/assets, e.g. start, attached, uploaded
  const [contentStage, setContentStage] =
    React.useState<UploadContentStage>('start');

  // Track the parsed files content and preview them if needed
  const [parsedFiles, setParsedFiles] = React.useState<ParsedFile[]>([]);

  // Track the uploaded files content
  const [uploadedFiles, setUploadedFiles] = React.useState<PutBlobResult[]>([]);
  // console.log(`***** uploadedFiles`, uploadedFiles);
  // View uploaded/stored files in a modal
  const [viewUploadedFilesInDialog, setViewUploadedFilesInDialog] =
    React.useState(false);
  // console.log(`**** viewUploadedFilesInDialog`, viewUploadedFilesInDialog);

  const {
    files: providerFiles,
    status: providerStatus,
    setStatus: setFileUploadStatus,
    resetFiles: resetProviderFiles,
    resetSlate: resetSlateEditor,
    validTypes: providerValidTypes,
  } = useWithFileUpload();

  const {
    files: filesProp,
    noTitle = true,
    noDescription = true,
    validTypes = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES],
  } = formUploaderProps || {};

  // Track the uploaded and stored files coming in from the server
  const storedAssetFiles = uploadedAssets;
  const numOfStoredAssets = storedAssetFiles.length || 0;
  const pendingMaxNumFiles = noMaxNumFiles
    ? 100000
    : maxNumFiles - numOfStoredAssets;

  //--- Handlers
  const handleClosingUploadedFilesModal = () => {
    setViewUploadedFilesInDialog(false);
  };

  const handleClearUserAssetsDescriptor = () => {
    setUserAssetsDescriptor('');
  };

  // Handle updating and clearing error messages
  const handleUpdateErrorMsg = (msg: string) => {
    setErrorMsg((prev) => [...prev, msg]);
  };

  const handleClearErrorMsg = () => {
    setErrorMsg([]);
  };

  const handleRemoveFile = (file: File) => {
    // console.log(`Removing file: ${file.name}`);
    if (parsedFiles.length === 0) return;
    const updatedParsedFiles = parsedFiles.filter(
      (pf) => pf.file.name !== file.name
    );
    setParsedFiles(updatedParsedFiles);
  };

  // Handle resetting the form and the content stage
  const handleResetForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    formRef.current?.reset();
    // Local state reset
    setUploadedFiles([]);
    setContentStage('start');
    handleClearErrorMsg();
    handleClearUserAssetsDescriptor();
    // Reset the provider files and the slate editor
    resetSlateEditor();
  };

  const handleOnSelectingAsset = (
    nextState: boolean,
    asset: PhotoBasicExifData
  ) => {
    const assetId = asset.id;
    if (assetId && typeof handleOnSelectingAssetProp === 'function') {
      handleOnSelectingAssetProp(assetId);
    }
  };

  const handleOnUnselectAllAssets = () => {
    if (typeof handleOnUnselectAllAssetsProp === 'function') {
      handleOnUnselectAllAssetsProp();
    }
  };

  const handleOnCreateWithSelectedAssets = (
    mediaIds: string[] = selectedMediaIds
  ) => {
    if (typeof handleOnCreateWithSelectedAssetsProp === 'function') {
      handleOnCreateWithSelectedAssetsProp(mediaIds);
    }
  };

  // Flags for convenience
  const isAuthenticated = Boolean(authUser);
  const hasErrors = Boolean(errorMsg.length);
  const isUploading = providerStatus === 'loading';
  const isInStartStage = contentStage === 'start';
  const isInAttachedStage = contentStage === 'attached';
  const isInUploadedStage = contentStage === 'uploaded';
  const showSuccessVisual = isInUploadedStage && !isUploading;
  const selectedMediaCount = selectedMediaIds.length;
  const hasSelectedMediaIds = Boolean(selectedMediaCount);

  const disableUploadBtn = isUploading || !providerFiles?.length;
  const numOfAttachedFiles = providerFiles?.length || 0;
  const hasFilesAttached = Boolean(numOfAttachedFiles);
  const numOfUploadedFiles = uploadedFiles.length;
  // console.log(`**** Files attached meta`, {
  //   numOfAttachedFiles,
  //   hasFilesAttached,
  // });

  //======= Handle uploading the attached files content
  const handleUploadingFiles = React.useCallback(
    async (formData: FormData) => {
      if (!numOfAttachedFiles) {
        const errMsg = 'No files attached to upload';
        // console.error(errMsg);
        toast.error(errMsg);
        return;
      }

      // Remove any error messages
      handleClearErrorMsg();

      setFileUploadStatus('loading');

      // Submit all files at-once using primary action
      try {
        const userId = authUser.id;
        const userName = authUser.name;
        const userFileNamePrefix = `${userId || ''}-${userName || ''}`.trim();
        const assetDirectory = `featured-assets/`;
        const files = getAllFilesFromFormData(formData);

        // Iterate over each file and upload them
        const responses = await Promise.all(
          files.map(async (file) => {
            const finalFileName = `${assetDirectory}${userFileNamePrefix}-${file.name}`;
            // console.log(`**** uploading file: ${finalFileName}`, file);

            const newBlob = await upload(finalFileName, file, {
              access: 'public',
              handleUploadUrl: '/api/user/photos/upload/client',
              clientPayload: JSON.stringify({
                pathname,
                cacheKey: featuredMediaCacheKey,
              }),
            });

            // Update the uploaded files as they come in
            if (newBlob) {
              setUploadedFiles((prev) => [...prev, newBlob]);
            }

            return newBlob;
          })
        );

        if (responses.length) {
          setFileUploadStatus('success');
          setContentStage('uploaded');
          router.refresh();
          // setUploadedFiles(responses);
        }
        console.log(
          'Experience NV: Discover, Experience and Share. Thanks for being a part of the journey!'
        );

        // console.log(`***** multiple uploadResponse`, uploadResponse);
      } catch (error) {
        const errMsg = getErrorMessage(error);
        console.error('Error ingesting file content: ', errMsg);
        toast.error(errMsg);
        handleUpdateErrorMsg(errMsg);
        setFileUploadStatus('error');
      }
    },
    [numOfAttachedFiles]
  );

  return (
    <div
      className={cn(
        'flex w-full flex-col rounded-md',
        {
          'gap-6 py-4': showSuccessVisual,
          'gap-3': !showSuccessVisual,
        },
        className
      )}
    >
      {showSuccessVisual && <SuccessAnimated />}
      {hasErrors && (
        <ErrorMessages
          errorMsgs={errorMsg}
          handleClearErrorMsg={handleClearErrorMsg}
        />
      )}
      <FileUploaderWithRef
        {...((formUploaderProps as FileUploaderProps) || {})}
        // nowShowFilesListing
        disabled={isUploading || pendingMaxNumFiles <= 0}
        noSubmitBtn
        ref={formRef}
        files={filesProp}
        parsedFiles={parsedFiles}
        validTypes={validTypes}
        numAllowedFiles={pendingMaxNumFiles}
        numAllowedFilesLeftNote={`(${nFormatter(pendingMaxNumFiles)} uploads left)`}
        dragAndDropLabel="Drop your sweet NV pics & video here"
        dragAndDropInfoIcon={
          <SharedInfoTooltip
            title="Share Your Sweet Media"
            content="These should be your own photos and videos of NV experiences: urban, rural 🤠, small biz, ppl, parks, etc."
          />
        }
        noTitle={noTitle}
        noDescription={noDescription}
        onRemoveFile={handleRemoveFile}
        onFileChangeCb={(files) => {
          // console.log("**** onFileChangeCb invoked", files);
        }}
        onSubmit={handleUploadingFiles}
        // onViewParsedFile={handlePreviewParsedContent}
        // dragAndDropClassName="p-0"
        contentClassName="p-0"
        className={cn(
          'max-w-full border-none',
          {
            hidden: showSuccessVisual,
          },
          formUploaderProps?.className
        )}
      >
        {/* Pre-Upload Action Buttons */}
        {!showSuccessVisual && (
          <>
            <div className="flex w-full justify-end gap-1.5">
              {hasFilesAttached && (
                <Button
                  type="button"
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                  onClick={handleResetForm}
                  className={cn({
                    'text-sm brightness-50 hover:brightness-100':
                      !showSuccessVisual,
                  })}
                >
                  Start Over
                </Button>
              )}

              {hasFilesAttached && (
                <Button
                  type="button"
                  // form="file-upload-form"
                  disabled={disableUploadBtn}
                  className="flex gap-1.5 text-sm"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Invoke native form submit w/validation
                    formRef.current?.requestSubmit();
                  }}
                >
                  {isUploading ? (
                    <>
                      <IconSpinner className="animate-spin" />
                      <span>Uploading...</span>
                      <Badge
                        variant="secondary"
                        className="rounded- px-1.5 leading-none"
                      >
                        {numOfUploadedFiles + 1}
                        {' of '}
                        {numOfAttachedFiles}
                      </Badge>
                    </>
                  ) : (
                    <span className="flex gap-1.5">
                      <span>Upload</span>
                      <Badge
                        variant="secondary"
                        className="rounded- px-1.5 leading-none"
                      >
                        {numOfAttachedFiles}
                      </Badge>
                    </span>
                  )}
                </Button>
              )}
            </div>
            <div className="flex flex-col justify-start gap-2">
              <h3 className="flex items-center justify-between">
                <span>{!noUploadedHeadingText && 'My Platform Media'}</span>
                <span className="flex items-center justify-end gap-1.5">
                  {!noSummaryBtnDialogExpand && (
                    <Button
                      type="button"
                      disabled={isUploading}
                      variant="secondary"
                      size="xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setViewUploadedFilesInDialog(true);
                      }}
                      className={cn({
                        'hidden w-auto gap-1 self-end text-tiny brightness-50 hover:brightness-100 md:flex':
                          !showSuccessVisual,
                      })}
                    >
                      <IconImages />
                      <span>{numOfStoredAssets}</span>
                      <span>Uploaded</span>
                      <IconExpand className="size-3" />
                    </Button>
                  )}
                  {noSummaryBtnDialogExpand && (
                    <span
                      className={cn(
                        buttonVariants({
                          variant: 'secondary',
                          size: 'xs',
                        }),
                        'flex items-center gap-1 text-tiny hover:brightness-100'
                      )}
                    >
                      <IconImages />
                      {numOfStoredAssets}
                      <span className="hidden">Uploaded</span>
                    </span>
                  )}
                  <Button
                    type="button"
                    disabled={isUploading || !hasSelectedMediaIds}
                    variant="secondary"
                    size="xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOnUnselectAllAssets();
                    }}
                    className={cn(
                      'group/create-with-selected flex w-auto gap-1.5 self-end text-tiny transition-colors duration-75 hover:brightness-100 md:flex',
                      {
                        'brightness-50': !hasSelectedMediaIds,
                      }
                    )}
                  >
                    <IconCircleMinus className="size-3 transition-transform duration-300 group-hover/create-with-selected:rotate-180 group-hover/create-with-selected:text-destructive-foreground" />
                    <span>Deselect All</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={isUploading || !hasSelectedMediaIds}
                    variant={hasSelectedMediaIds ? 'tertiary' : 'outline'}
                    size="xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOnCreateWithSelectedAssets();
                    }}
                    className={cn(
                      'group/create-with-selected flex w-auto items-center justify-center gap-1.5 self-end text-tiny transition-colors duration-75 hover:brightness-100 md:flex',
                      {
                        'brightness-50': !hasSelectedMediaIds,
                      }
                    )}
                  >
                    <IconCirclePlus className="group-hover/create-with-selected:text-success-foreground size-3 transition-transform duration-300 group-hover/create-with-selected:rotate-180" />
                    <span>Create Experience</span>
                    <span className="flex gap-0.5 rounded-lg px-1.5 py-0.5 text-tiny text-[inherit]">
                      <span>{selectedMediaCount}</span>
                      <span className="hidden">Selected</span>
                    </span>
                  </Button>
                </span>
              </h3>
              <div
                className={cn(
                  'space-y-1 overflow-auto rounded-md border p-4 prose-h3:my-0 prose-img:my-0 md:min-h-[40lvh]',
                  mediaContainerClassName
                )}
              >
                <PreviewUploadedAssets
                  // noShowEditFeatures
                  // author={author}
                  enabledEdit
                  noUseDefaultColumns
                  isAuthenticated={isAuthenticated}
                  assets={uploadedAssets}
                  selectedMediaIds={selectedMediaIds}
                  enableAssetSelecting={!disableSelectingMedia}
                  handleOnSelectAsset={handleOnSelectingAsset}
                  className="p-0 md:grid-cols-2"
                  assetClassName=""
                />
              </div>
              {!noScrollToTopBtn && (
                <ButtonScrollToTop className="self-start" />
              )}
            </div>
          </>
        )}
      </FileUploaderWithRef>
      {/* {!showSuccessVisual && !noInputFields && (
        <GeneralTextAreaInput
          label="Brief Note"
          inputPlaceholder="A little bit about your images..."
          inputName="asset-descriptor"
          className="md:flex-col"
          isDisabled={isUploading || isInUploadedStage}
          descriptor={userAssetsDescriptor}
          handleClearDescriptor={handleClearUserAssetsDescriptor}
          handleSetDescriptor={setUserAssetsDescriptor}
        ></GeneralTextAreaInput>
      )} */}

      <div
        className={cn('flex items-center gap-2', {
          'justify-center': showSuccessVisual,
          'justify-between': !showSuccessVisual && numOfStoredAssets,
          'justify-end': !showSuccessVisual && !numOfStoredAssets,
        })}
      >
        {/* Post-Upload Action Buttons */}
        {showSuccessVisual && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleResetForm}
            disabled={isUploading}
            className="gap-1.5 text-base"
          >
            <IconFileUpload className="size-4" />
            <span>Upload More Pics</span>
          </Button>
        )}
      </div>
      {/* Preview Uploaded Assets */}
      {viewUploadedFilesInDialog && (
        <PreviewUserUploadedAssetsDialog
          open
          enableEdit
          assets={uploadedAssets}
          // author={mapUserToPhotoAuthorObj(user)}
          isAuthenticated={isAuthenticated}
          handleOnClose={handleClosingUploadedFilesModal}
        />
      )}
    </div>
  );
}
