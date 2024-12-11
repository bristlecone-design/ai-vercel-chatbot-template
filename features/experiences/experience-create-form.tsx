'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  connectMediaToExperience,
  getCachedSingleMediaByUrlWithExif,
} from '@/actions/media/get-core-media';
import { getCachedFeaturedPromptCollections } from '@/actions/prompts';
import { useAppState } from '@/state/app-state';
import { upload } from '@vercel/blob/client';
import { capitalCase } from 'change-case';
import { motion } from 'framer-motion';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';

import type { Experience } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import {
  ACCEPTED_IMG_VIDEO_MEDIA_TYPES,
  createImageFileFromSrcPath,
} from '@/lib/images';
import {
  createVideoFileFromSrcPath,
  isImage,
  isImageExtension,
  isVideo,
  isVideoExtension,
} from '@/lib/media/media-utils';
import { cn, sleep } from '@/lib/utils';
import { useGeneratedExperiencePlaceholder } from '@/hooks/use-generate-experience-placeholder';
import { useGeneratedExperienceTitle } from '@/hooks/use-generate-experience-title';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconChallengePrompts,
  IconCheck,
  IconClose,
  IconRefresh,
  IconSpinner,
} from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { WithCtxtDragAndDrop } from '@/components/content/files/drag-and-drop-containers';
import {
  mapFilesToSourceType,
  useWithFileUpload,
} from '@/components/content/files/file-uploader';
import type { FileInAttachedVisualKind } from '@/components/content/files/file-uploader-types';
import { ButtonCta } from '@/components/cta-btn';
import { clearEditorClientContent } from '@/components/editor/editor-client-utils';
import { SimpleEditor } from '@/components/editor/simple-editor';
import type { EditorInstance } from '@/components/editor/src';
import { Spinner } from '@/components/spinner';

import { PopoverWhatArePromptChallenges } from '../prompts/prompt-shared-popovers';
import { getExperienceMessageFromCode } from './experience-action-utils';
import { saveCreateExperience } from './experience-create-actions';
import { ExperienceLocationInfo } from './experience-location-info';
import { NUM_OF_ALLOWED_MEDIA_ATTACHMENTS } from './experience-post-constants';
import { deriveStoryTitleFromRawTitle } from './utils/experience-prompt-utils';

import type {
  GeneratedExperienceUserPrompt,
  PromptStoryBaseModel,
} from '@/types/experience-prompts';
import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';
import type { PhotoBasicExifData } from '@/types/photo';
import { SITE_MAX_POST_CHARS } from '@/config/site-forms';

export const MAX_FILES_SIZE_IN_BYTES = 12000000; // 10MB
export const MAX_IMAGE_FILE_SIZE_IN_BYTES = 12000000; // 12MB
export const MAX_AUDIO_FILE_SIZE_IN_BYTES = 250000000; // 25MB
export const MAX_VIDEO_FILE_SIZE_IN_BYTES = 500000000; // 50MB

type AttachedExistingMediaFile = {
  mediaId: string;
  file: File | undefined;
  visual: FileInAttachedVisualKind | undefined;
};

type AttachedExistingMediaFiles = AttachedExistingMediaFile[];

export type AttachedMediaFileByType = FileInAttachedVisualKind & {
  status: 'existing' | 'new';
  mediaId?: string;
  file: File;
};

export type AttachedMediaFileForUI = FileInAttachedVisualKind & {
  status: 'existing' | 'new';
  mediaId?: string;
  file?: File | undefined;
};

function ExperienceMediaFilesPlaceholder({
  disabled,
  onClickPlaceholder,
  delay = 0,
}: {
  delay?: number;
  onClickPlaceholder: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      tabIndex={0}
      initial={{ scale: 0.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.725, delay: 0.1 * delay }}
      className={cn(
        'h-12 w-16 sm:h-20 sm:w-24',
        'flex items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 hover:cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80',
        {
          'bg-accent/40': disabled,
          'ring-tertiary/40 ring-2 ring-offset-2 ring-offset-muted': disabled,
        }
      )}
      onClick={onClickPlaceholder}
    >
      <span className="text-sm text-foreground/25 sm:text-base">Media</span>
    </motion.div>
  );
}

export function ExperienceMediaFiles({
  disabled = false,
  maxAllowedFiles,
  attachedFiles = [],
  onClickPlaceholder,
  handleOnDropOfFiles,
  handleOnRemoveFile,
  handleOnFocus,
}: {
  disabled?: boolean;
  maxAllowedFiles: number;
  attachedFiles: AttachedMediaFileForUI[];
  onClickPlaceholder: () => void;
  handleOnDropOfFiles: (files: File[] | FileList) => void;
  handleOnRemoveFile: (item: AttachedMediaFileForUI) => void;
  handleOnFocus: (e: React.FocusEvent<any>) => void;
}) {
  // Local media drag-and-drop container
  const [dragMediaActive, setDragMediaActive] = React.useState(false);

  // Dynamic array combining the attached media and the media placeholders
  const hasAttachedFiles = Boolean(attachedFiles?.length);

  const numOfMediaPlaceholders = hasAttachedFiles
    ? maxAllowedFiles - attachedFiles.length
    : maxAllowedFiles;

  const needsPlaceholderContainers = numOfMediaPlaceholders > 0;
  const placeholderList = needsPlaceholderContainers
    ? Array.from({ length: numOfMediaPlaceholders })
    : [];

  const isDragDisabled = disabled;

  return (
    // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
    <div
      className="group/media-container grid w-full max-w-full grid-flow-col-dense grid-cols-5 grid-rows-2 gap-2 p-1.5"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragMediaActive(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragMediaActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragMediaActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragDisabled) return;

        setDragMediaActive(false);

        const files = e.dataTransfer.files;
        handleOnDropOfFiles(files);
      }}
    >
      {/* Render attached media */}
      {attachedFiles.length > 0 &&
        attachedFiles.map((item, index) => {
          // If React Element, just render it
          // if (React.isValidElement(item)) {
          //   return item;
          // }

          const mediaItem = item;

          if (!mediaItem.src) {
            return null;
          }

          const isImage = mediaItem.kind === 'image';
          const isVideo = mediaItem.kind === 'video';
          return (
            <motion.div
              key={mediaItem.name}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                duration: 0.725,
                delay: 0.1 * index,
              }}
              className={cn(
                'rounded-lg',
                // 'h-16 w-24 sm:h-28 sm:w-32',
                'relative items-center gap-2 bg-background/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2'
              )}
              onFocus={handleOnFocus}
              tabIndex={0}
            >
              {isImage && (
                <img
                  src={mediaItem.src}
                  alt="Media"
                  className={cn(
                    'h-16 w-20 sm:h-28 sm:w-32',
                    'my-0 aspect-auto max-h-full min-h-full rounded-lg object-cover opacity-80 hover:opacity-100'
                  )}
                />
              )}
              {isVideo && (
                <video
                  src={mediaItem.src}
                  className={cn(
                    'h-16 w-20 sm:h-28 sm:w-32',
                    'my-0 aspect-auto max-h-full min-h-full rounded-lg object-cover opacity-80 hover:opacity-100'
                  )}
                  autoPlay
                  controls
                  muted
                  loop
                />
              )}
              <Button
                size="custom"
                variant="outline"
                type="button"
                onClick={() => {
                  handleOnRemoveFile(mediaItem);
                }}
                className="absolute -left-2 -top-1.5 p-1 leading-none"
                tabIndex={-1}
              >
                <IconClose className="size-2.5" />
              </Button>
            </motion.div>
          );
        })}

      {/* Render media placeholders */}
      {needsPlaceholderContainers &&
        placeholderList.map((_, index) => {
          return (
            <ExperienceMediaFilesPlaceholder
              key={`media-placeholder-${index}`}
              disabled={isDragDisabled}
              onClickPlaceholder={onClickPlaceholder}
              delay={index}
            />
          );
        })}
    </div>
  );
}

type ExperienceStorySeriesSelection = Pick<
  PromptStoryBaseModel,
  'id' | 'title' | 'description' | 'shortDescription' | 'createdAt'
> & {};

function findStorySeriesById(
  storySeries: ExperienceStorySeriesSelection[],
  storyId: string
): ExperienceStorySeriesSelection | undefined {
  if (!storyId || !storySeries || !storySeries.length) return;

  return storySeries.find((story) => story.id === storyId);
}

export type ExperienceCreateFormProps = {
  title?: string;
  content?: string;
  richContent?: string;
  visibility?: Experience['visibility'];
  promptStorySwitchDisabld?: boolean;
  promptStoryId?: string;
  promptStoryTitle?: string;
  promptChallenge?: GeneratedExperienceUserPrompt | null;
  promptChallengeEnabled?: boolean;
  promptChallengeToggleDisabled?: boolean;
  noPromptChallengeToggleSwitch?: boolean;
  noPromptChallengeRefresh?: boolean;
  noPromptChallengeViewAll?: boolean;
  noPromptChallengeInfo?: boolean;
  editorContentKey?: string;
  disabled?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
  inputContentRef?: React.RefObject<HTMLTextAreaElement>;
  hideSubmitButton?: boolean;
  noFocusOnOpen?: boolean;
  noInputTitle?: boolean;
  submitBtnLabel?: string;
  submitBtnClassName?: string;
  redirectPathOnSuccess?: string;
  refreshPageOnSuccess?: boolean;
  containerClassName?: string;
  formFieldsClassName?: string;
  dragAndDropClassName?: string;
  inputContentPlaceholder?: string;
  inputContentLabelClassName?: string;
  inputTitleLabelClassName?: string;
  inputPublicLabelClassName?: string;
  className?: string;
  formTitle?: string;
  validMediaTypes?: string[];
  numOfAllowedMedia?: number;
  maxContentLength?: number;
  maxFilesSize?: number;
  maxImageFileSize?: number;
  maxAudioFileSize?: number;
  maxVideoFileSize?: number;
  existingMediaToAttach?: PhotoBasicExifData[];
  handleOnCancel?: () => void;
  handleOnStartCreating?: (
    content?: string,
    promptOrTitle?: string,
    storyTitle?: string
  ) => void;
  handleOnSuccess?: (newExperience: ExperienceModel) => void;
  handleOnComplete?: (successState: boolean, data?: ExperienceModel) => void;
  handleSelectingNewRandomPrompt?: (currentPrompt?: string) => void;
  handleTogglingPromptChallengeAcceptance?: (enabled: boolean) => void;
  handleViewingPromptChallenges?: (nextState?: boolean) => void;
};

export function ExperienceCreateForm({
  title: postTitleProp = '',
  content: postContentProp = '',
  richContent: postRichContentProp = '',
  visibility: postVisibilityProp = 'public',
  promptStorySwitchDisabld: promptStorySwitchDisabldProp = false,
  promptStoryId: promptStoryIdProp,
  promptStoryTitle: promptStoryTitleProp,
  promptChallenge: promptChallengeProp,
  promptChallengeEnabled: promptChallengeEnabledProp = false,
  noPromptChallengeToggleSwitch: noPromptChallengeToggleSwitchProp = false,
  promptChallengeToggleDisabled: promptChallengeToggleDisabledProp = false,
  noPromptChallengeRefresh: noPromptChallengeRefreshProp = false,
  noPromptChallengeViewAll: noPromptChallengeViewAllProp = false,
  noPromptChallengeInfo: noPromptChallengeInfoProp = false,
  editorContentKey: editorContentKeyProp,
  formRef: formRefProp,
  inputContentRef: inputContentRefProp,
  disabled: formDisabled = false,
  noFocusOnOpen: noFocusOnOpenProp = false,
  noInputTitle: noInputTitleProp = false,
  maxContentLength: maxContentLengthProp = SITE_MAX_POST_CHARS,
  numOfAllowedMedia: numOfAllowedMediaProp = NUM_OF_ALLOWED_MEDIA_ATTACHMENTS,
  maxFilesSize: maxFilesSizeProp = MAX_FILES_SIZE_IN_BYTES,
  maxImageFileSize: maxImageFileSizeProp = MAX_IMAGE_FILE_SIZE_IN_BYTES,
  maxAudioFileSize: maxAudioFileSizeProp = MAX_AUDIO_FILE_SIZE_IN_BYTES,
  maxVideoFileSize: maxVideoFileSizeProp = MAX_VIDEO_FILE_SIZE_IN_BYTES,
  validMediaTypes: validMediaTypesProp = ACCEPTED_IMG_VIDEO_MEDIA_TYPES,
  existingMediaToAttach: existingMediaToAttachProp = [],
  hideSubmitButton,
  redirectPathOnSuccess,
  refreshPageOnSuccess,
  inputContentLabelClassName,
  inputTitleLabelClassName,
  inputPublicLabelClassName,
  inputContentPlaceholder: inputContentPlaceholderProp = `What's going on?`,
  dragAndDropClassName,
  containerClassName,
  formFieldsClassName,
  submitBtnClassName,
  submitBtnLabel,
  className,
  formTitle,
  handleOnCancel,
  handleOnSuccess,
  handleOnComplete,
  handleOnStartCreating,
  handleSelectingNewRandomPrompt,
  handleTogglingPromptChallengeAcceptance:
    handleTogglingPromptChallengeAcceptanceProp,
  handleViewingPromptChallenges: handleViewingPromptChallengesProp,
}: ExperienceCreateFormProps) {
  const formRef = formRefProp || useRef<HTMLFormElement>(null);
  const inputContentRef =
    inputContentRefProp || useRef<HTMLTextAreaElement>(null);
  const focusedElRef = React.useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null
  >(null);

  const inputFileRef = useRef<HTMLInputElement>(null);

  const editorInstanceRef = useRef<EditorInstance | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const appState = useAppState();
  const {
    userDisplayName,
    userId,
    userLocation,
    userLatitude,
    userLongitude,
    isPreciseLocation,
  } = appState;
  // console.log(`**** userLocation in ExperienceCreateForm`, userLocation);

  const {
    files: attachedFilesProvider,
    status,
    validTypes,
    maxFilesSize,
    maxAudioFileSize,
    maxImageFileSize,
    maxVideoFileSize,
    base64Files,
    videoFiles,
    numAllowedFiles,
    handleChangeFiles,
    resetFiles: handleResetAttachedFilesProvider,
    handleDropOfFiles: handleDropOfFilesProvider,
    setAndProcessFiles: handleSettingFilesProvider,
    removeFile: handleRemovingFile,
    clearFileByName: handleClearingFileByName,
    removeBase64File: handleRemovingBase64File,
    setStatus: setFileUploadStatus,
  } = useWithFileUpload({
    operation: 'append',
    validTypes: validMediaTypesProp,
    numAllowedFiles: numOfAllowedMediaProp,
    maxFilesSize: maxFilesSizeProp,
    maxImageFileSize: maxImageFileSizeProp,
    // maxAudioFileSize: maxAudioFileSizeProp,
    maxVideoFileSize: maxVideoFileSizeProp,
  });

  const isStoryRelated = Boolean(promptStoryIdProp);

  // Personalized, non-story related prompts
  const isNonStoryPromptChallenge =
    !isStoryRelated && Boolean(promptChallengeProp);

  const [isMounted, setIsMounted] = React.useState(false);

  const [retrievingData, setRetrievingData] = React.useState(false);

  // Form state
  const [inputPostTitle, setInputTitle] = useLocalStorage(
    'postTitle',
    postTitleProp
  );

  const [inputPostCharCount, setInputCharCount] = React.useState<null | number>(
    null
  );

  const [inputPostContent, setInputContent] = useLocalStorage(
    'postContent',
    postContentProp
  );

  const [inputPostRichContent, setInputRichContent] =
    React.useState<string>(postRichContentProp);

  const contentLengthRemaining = inputPostCharCount
    ? maxContentLengthProp - inputPostCharCount
    : maxContentLengthProp;

  const [inputPostVisibility, setInputVisibility] = useLocalStorage<
    Experience['visibility']
  >('postVisibility', postVisibilityProp);

  const [selectableStories, setSelectableStories] = useLocalStorage<
    ExperienceStorySeriesSelection[]
  >('postSelectableStorySeries', []);

  const initialStoryId =
    promptStoryIdProp ||
    promptChallengeProp?.promptCollectionId ||
    'cm20tsmmp000uzldxrq8ihdia'; // Default to the 'Home Means Nevada' story series

  const [inputPostStoryId, setInputPostStoryId] = useLocalStorage<string>(
    'postStorySeries',
    initialStoryId
  );

  const currentStorySeries = findStorySeriesById(
    selectableStories,
    inputPostStoryId
  );

  const currentRawStoryTitle = currentStorySeries
    ? currentStorySeries.title
    : promptStoryTitleProp;

  const currentFormattedStoryTitle = currentRawStoryTitle
    ? deriveStoryTitleFromRawTitle(currentRawStoryTitle)
    : '';

  const currentStorySeriesDescription = currentStorySeries
    ? currentStorySeries.description || ''
    : '';

  // Dynamic placeholder
  const baseInputPlaceholder =
    promptChallengeProp?.prompt || inputContentPlaceholderProp;

  // Either part of a story series or general experience type
  const isValidExperienceType =
    isStoryRelated || (!isStoryRelated && !isNonStoryPromptChallenge);

  const storySeriesPromptValue =
    isValidExperienceType && promptChallengeProp?.prompt
      ? promptChallengeProp.prompt
      : '';

  const proceedGeneratePlaceholder =
    isValidExperienceType && isMounted && !retrievingData;

  // Personalized placeholder
  const {
    // ready: isPlaceholderReady,
    generating: isPlaceholderGenerating,
    // generated: isPlaceholderGenerated,
    placeholder: personalizedPlaceholder,
    handleGeneratingPlaceholder,
  } = useGeneratedExperiencePlaceholder({
    autoGenerateOnMount: proceedGeneratePlaceholder,
    storySeriesDescription: currentStorySeriesDescription,
    storySeries: currentFormattedStoryTitle,
    storySeriesPrompt: storySeriesPromptValue,
    isReady: proceedGeneratePlaceholder,
  });

  const placeholderToUse =
    isNonStoryPromptChallenge && baseInputPlaceholder
      ? baseInputPlaceholder
      : personalizedPlaceholder
        ? personalizedPlaceholder
        : isPlaceholderGenerating
          ? '...'
          : baseInputPlaceholder;

  // Dynamic suggested title
  const proceedGenerateTitle =
    Boolean(inputPostContent) && isMounted && !retrievingData;

  const autoGenerateTitleOnMount = !inputPostTitle && proceedGenerateTitle;

  const {
    // ready: isPlaceholderReady,
    generating: isTitleGenerating,
    // generated: isPlaceholderGenerated,
    suggestedTitle,
    handleGeneratingTitle,
  } = useGeneratedExperienceTitle({
    context: inputPostContent,
    autoGenerateOnMount: autoGenerateTitleOnMount,
    storySeriesDescription: currentStorySeriesDescription,
    storySeries: currentFormattedStoryTitle,
    storySeriesPrompt: storySeriesPromptValue,
    isReady: proceedGenerateTitle,
  });

  const isSuggestedTitleAccepted =
    Boolean(inputPostTitle) && inputPostTitle === suggestedTitle;

  // console.log('**** suggested title', {
  //   proceedGenerateTitle,
  //   autoGenerateTitleOnMount,
  //   isSuggestedTitleAccepted,
  //   isTitleGenerating,
  //   inputPostContent,
  //   inputPostTitle,
  //   suggestedTitle,
  // });

  // Track the uploaded files content
  const [successfullyProcessedFiles, setSuccessfullyProcessedFiles] =
    React.useState<AttachedMediaFileByType[]>([]);

  const [existingMediaFilesToAttach, setExistingMediaFilesToAttach] =
    React.useState<AttachedExistingMediaFiles>([]);
  // console.log(`**** existingMediaFilesToAttach`, existingMediaFilesToAttach);

  const numOfExistingMediaFilesToAttach =
    existingMediaFilesToAttach?.length || 0;
  const numOfAttachedMediaToProvider = attachedFilesProvider?.length || 0;
  // console.log(`**** attachedFilesProvider`, attachedFilesProvider);

  const hasExistingMediaFiles = Boolean(numOfExistingMediaFilesToAttach);
  const totalNumOfAttachedMedia =
    numOfExistingMediaFilesToAttach + numOfAttachedMediaToProvider;

  const maxMediaFilesAttachedReached =
    totalNumOfAttachedMedia >= numAllowedFiles;

  // Aggregate the attached media files by kind then combine them with the existing media files
  const attachedMediaByKindFromProvider: FileInAttachedVisualKind[] = [
    ...(base64Files || []),
    ...(videoFiles || []),
  ].filter((file) => file.src);

  const attachedMediaByKindFromExisting = (
    hasExistingMediaFiles
      ? [
          ...(existingMediaFilesToAttach || []).map((file) => {
            return {
              ...file.visual,
              file: file.file,
              mediaId: file.mediaId,
              status: 'existing',
            } as AttachedMediaFileByType;
          }),
        ].filter((file) => file?.src)
      : []
  ) as AttachedMediaFileByType[];

  const attachedMediaFilesCombinedByKind = [
    ...attachedMediaByKindFromProvider.map((visualMedia) => {
      const file = attachedFilesProvider?.find(
        (item) =>
          item.name === visualMedia.name && item.type === visualMedia.type
      );

      return {
        ...visualMedia,
        file,
        status: 'new',
      };
    }),
    ...(attachedMediaByKindFromExisting || []),
  ] as AttachedMediaFileByType[];

  const hasMediaFilesToProcess = Boolean(
    attachedMediaFilesCombinedByKind?.length
  );

  const mediaFilesForUI: AttachedMediaFileForUI[] = [
    ...attachedMediaFilesCombinedByKind,
  ].map((media) => {
    const payload = {
      ...media,
      status: media.status,
      mediaId: media.mediaId,
    } as AttachedMediaFileForUI;

    if (payload.file) {
      delete payload.file;
    }

    return payload;
  });

  const mediaFilesForUICount = mediaFilesForUI?.length || 0;
  const hasMediaFilesForUI = Boolean(mediaFilesForUICount);

  // Handlers
  const handleOnStorySeriesChange = (updatedStoryIdValue: string) => {
    setInputPostStoryId(updatedStoryIdValue);

    const newStorySeries = findStorySeriesById(
      selectableStories,
      updatedStoryIdValue
    );

    const newRawStoryTitle = newStorySeries
      ? newStorySeries.title
      : promptStoryTitleProp;

    const newStorySeriesDescription = newStorySeries
      ? newStorySeries.description || ''
      : '';

    if (typeof handleGeneratingPlaceholder === 'function') {
      handleGeneratingPlaceholder({
        storySeries: newRawStoryTitle,
        storySeriesDescription: newStorySeriesDescription,
        replace: true,
      });
    }

    if (typeof handleGeneratingTitle === 'function') {
      handleGeneratingTitle({
        context: inputPostContent,
        storySeries: newRawStoryTitle,
        storySeriesDescription: newStorySeriesDescription,
        currentTime: new Date().getTime(),
        replace: true,
      });
    }
  };

  const handleTogglingPromptChallengeAcceptance = () => {
    if (typeof handleTogglingPromptChallengeAcceptanceProp === 'function') {
      handleTogglingPromptChallengeAcceptanceProp(!promptChallengeEnabledProp);
    }
  };

  const handleTogglingPromptSelectionDrawer = (nextState?: boolean) => {
    if (typeof handleViewingPromptChallengesProp === 'function') {
      handleViewingPromptChallengesProp(nextState);
    }
  };

  const handleSettingEditorInstance = (instance: EditorInstance | null) => {
    editorInstanceRef.current = instance;
  };

  const handleUpdatingCharacterCount = (count: number) => {
    setInputCharCount(count);
  };

  const handleUpdatingContent = (value: string) => {
    setInputContent(value);
  };

  const handleUpdatingRichContent = (value: string) => {
    setInputRichContent(value);
  };

  const handleUpdatingContentValues = (plain: string, rich: string) => {
    handleUpdatingContent(plain);
    handleUpdatingRichContent(rich);
  };

  const handleClearingTitle = () => {
    setInputTitle('');
  };

  const handleClearingContent = () => {
    setInputContent('');
    setInputRichContent('');
    inputContentRef.current?.focus();
    // Main editor
    clearEditorClientContent(editorInstanceRef.current);
  };

  const handleClearingAllInputs = () => {
    setInputTitle('');
    setInputContent('');
    setInputRichContent('');
    setInputVisibility(postVisibilityProp);
    handleResetAttachedFilesProvider();
    // Main editor
    clearEditorClientContent(editorInstanceRef.current);
  };

  const handleRemovingMediaFile = (item: AttachedMediaFileForUI) => {
    if (item.status === 'new') {
      handleClearingFileByName(
        item.name,
        item.kind === 'image'
          ? 'image'
          : item.kind === 'video'
            ? 'video'
            : 'image'
      );
    } else if (item.status === 'existing') {
      const existingMediaFile = existingMediaFilesToAttach.find(
        (media) => media.mediaId === item.mediaId
      );

      if (existingMediaFile) {
        setExistingMediaFilesToAttach((prev) => {
          return prev.filter((media) => media.mediaId !== item.mediaId);
        });
      }
    }
  };

  const handleProcessingMediaFilesOnCreate = React.useCallback(
    async (expRecordId: string, mediaFiles: AttachedMediaFileByType[] = []) => {
      if (!expRecordId) {
        toast.error('No experience record ID provided');
        return;
      }

      if (!mediaFiles || !mediaFiles.length) {
        toast.error('No media files to process');
        return;
      }

      if (!userId) {
        toast.error('You need to be logged in to upload files');
        return;
      }

      // Remove any error messages
      // handleClearErrorMsg();
      // setFileUploadStatus('loading');

      // Submit all files at-once using primary action
      try {
        const userName = userDisplayName;
        const userFileNamePrefix =
          `${userId || ''}-${userName || ''}-${expRecordId}`.trim();
        const assetDirectory = 'user-media/';

        // Iterate over each file and upload them
        const responses = await Promise.all(
          mediaFiles.map(async (mediaItem) => {
            let processed = false;
            let mediaRecord: ExperienceMediaModel | undefined;
            // console.log(`**** processing mediaItem`, mediaItem);
            if (mediaItem.status === 'new') {
              const file = mediaItem.file;
              const finalFileName = `${assetDirectory}${userFileNamePrefix}-${file.name}`;
              // console.log(`**** uploading file: ${finalFileName}`, file);

              const newBlob = await upload(finalFileName, file, {
                access: 'public',
                multipart: true,
                handleUploadUrl: '/api/user/media/upload/client',
                clientPayload: JSON.stringify({
                  pathname,
                  experienceId: expRecordId,
                  allowedContentTypes: validMediaTypesProp,
                }),
              });

              // Update the uploaded files as they come in
              if (newBlob) {
                processed = true;
                // Get the full media record from the server
                const connectedMediaRecord =
                  await getCachedSingleMediaByUrlWithExif(newBlob.url);

                mediaRecord =
                  connectedMediaRecord as unknown as ExperienceMediaModel;

                setSuccessfullyProcessedFiles((prev) => [
                  ...prev,
                  {
                    ...mediaItem,
                    src: newBlob.url,
                  },
                ]);
              }
            } else if (mediaItem.status === 'existing' && mediaItem.mediaId) {
              // TODO: Make sure the media record's props are mapped correctly
              const connectedMediaRecord = await connectMediaToExperience(
                expRecordId,
                mediaItem.mediaId
              );

              if (connectedMediaRecord) {
                processed = true;
                mediaRecord = connectedMediaRecord as ExperienceMediaModel;

                setSuccessfullyProcessedFiles((prev) => [
                  ...prev,
                  {
                    ...mediaItem,
                    src: connectedMediaRecord.url,
                  },
                ]);
              }
            }

            return processed && mediaRecord ? mediaRecord : undefined;
          })
        );

        // if (responses.length) {
        //   setFileUploadStatus('success');
        //   // router.refresh();
        //   setSuccessfullyProcessedFiles(responses);
        // }

        return responses;
      } catch (error) {
        const errMsg = getErrorMessage(error);
        console.error('Error uploading user media files:', errMsg);
        toast.error(errMsg);
        setFileUploadStatus('error');
      }
    },
    [
      userId,
      pathname,
      userDisplayName,
      validMediaTypesProp,
      numOfAttachedMediaToProvider,
      setFileUploadStatus,
    ]
  );

  // Form submission action
  const handleFormSubmit = async (_prevState: any, data: FormData) => {
    // console.log('**** handleFormSubmit invoked', _prevState, data);
    // const allFormData = Object.fromEntries(data.entries());
    // console.log(`***** allFormData before validating`, allFormData);

    const content = data.get('content') as string;

    if (!content) {
      toast.error('Please provide some content');
      return;
    }

    // User Geo
    if (userLatitude) {
      data.append('userLatitude', userLatitude.toString());
    }
    if (userLongitude) {
      data.append('userLongitude', userLongitude.toString());
    }
    if (userLocation) {
      data.append('userLocation', userLocation);
    }

    let creatingExpToastId = undefined;
    if (typeof handleOnStartCreating === 'function') {
      const content = data.get('content');
      const prompt = data.get('prompt');
      const expTitle = data.get('title');
      const expOrPromptTitle = expTitle || prompt;
      const storyTitle = currentRawStoryTitle; //promptStoryTitleProp;

      handleOnStartCreating(
        content as string,
        expOrPromptTitle as string,
        storyTitle
      );

      creatingExpToastId = toast.info('Creating experience...', {
        dismissible: false,
        duration: Number.POSITIVE_INFINITY,
      });
    }

    // Wait for a bit before continuing
    // await sleep(1000000);

    const submitResult = await saveCreateExperience(_prevState, data);
    // console.log(`**** experience submitResult`, submitResult);
    if (creatingExpToastId) {
      toast.dismiss(creatingExpToastId);
    }

    toast.success('Experience created...');

    // Wait for a bit before continuing
    await sleep(750);

    // If successful...
    if (submitResult) {
      if (submitResult.type === 'success') {
        // Success
        const { data } = submitResult;
        const expRecord = data as ExperienceModel;

        handleClearingAllInputs();

        // Upload the media assets and associate them with the experience
        let uploadedMedia = [] as ExperienceMediaModel[];
        if (hasMediaFilesToProcess && expRecord && expRecord.id) {
          toast.success('Attaching your media files...');

          // If successful, returns the media records
          const mediaUploadRes = await handleProcessingMediaFilesOnCreate(
            expRecord.id,
            attachedMediaFilesCombinedByKind
          );

          if (mediaUploadRes?.length) {
            uploadedMedia = mediaUploadRes as ExperienceMediaModel[];
          }
        }

        // Associate the uploaded media with the experience
        if (uploadedMedia?.length) {
          expRecord.Media = uploadedMedia as unknown as ExperienceMediaModel[];
        }

        // A. Invoke any callbacks with the new experience record
        if (expRecord && typeof handleOnSuccess === 'function') {
          toast.success(getExperienceMessageFromCode(submitResult.resultCode));
          handleOnSuccess(expRecord);
        }

        if (typeof handleOnComplete === 'function') {
          handleOnComplete(true, expRecord);
        }

        if (redirectPathOnSuccess) {
          router.push(redirectPathOnSuccess);
        }

        // Refresh the server page (route)
        if (refreshPageOnSuccess) {
          router.refresh();
        }
      } else {
        // Creation failed
        if (typeof handleOnComplete === 'function') {
          handleOnComplete(false);
        }
      }
    }

    return submitResult;
  };
  // const [result, dispatch] = useFormState(saveCreateExperience, undefined);
  const [result, dispatch] = useFormState(handleFormSubmit, undefined);
  const { pending } = useFormStatus();

  const handleOnDropOfFiles = (files: File[] | FileList) => {
    if (handleDropOfFilesProvider) {
      handleDropOfFilesProvider(files);
    }
  };

  // Handle onEnter key press for textareas (shift + enter to submit)
  const handleTextAreaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (formRef.current) {
      const value = e.currentTarget.value;
      if (e.key === 'Enter' && e.shiftKey) {
        e.currentTarget.value = `${value}`;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.currentTarget.value = value;
        // e.stopPropagation();
        // e.preventDefault();
        // Uncomment this line to submit the form on enter key press
        // formRef.current.requestSubmit();
      }
    }
  };

  // Handle onEnter key press for general text inputs
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (formRef.current) {
      if (e.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();
        // formRef.current.requestSubmit();
      }
    }
  };

  // Handle on focus (to bring into view) the focused element
  const handleOnFocus = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >
  ) => {
    const target = e.target as HTMLTextAreaElement;
    focusedElRef.current = target;

    if (focusedElRef.current?.scrollIntoView) {
      focusedElRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }

    return e;
  };

  // Track mounted state
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, []);

  // Attach pre-existing media files to the form (if any) on mount
  // The source is from the existingMediaToAttach prop, not the provider or state but we leverage the provider to handle the files
  useEffect(() => {
    // Attach the pre-existing media files to the form
    if (
      isMounted &&
      existingMediaToAttachProp &&
      existingMediaToAttachProp.length
    ) {
      // Convert each media to a standard File object
      existingMediaToAttachProp.forEach(async (media) => {
        const { id: mediaId, url, urlOriginal, extension } = media;

        const mediaUrlToUse = urlOriginal || url;

        const mediaIsImage = extension
          ? isImageExtension(extension)
          : isImage(mediaUrlToUse);

        const mediaIsVideo = extension
          ? isVideoExtension(extension)
          : isVideo(mediaUrlToUse);

        const mediaFileName =
          mediaId && !media.title
            ? mediaId
            : media.title && mediaId
              ? `${media.title}-${mediaId}`
              : media.title || 'Untitled Media';

        const preparedMediaFile = await (mediaIsImage
          ? createImageFileFromSrcPath(mediaUrlToUse, mediaFileName)
          : createVideoFileFromSrcPath(mediaUrlToUse, mediaFileName));

        if (preparedMediaFile) {
          const fileToVisualSourceType = await mapFilesToSourceType([
            preparedMediaFile,
          ]);

          const visualMediaFile = fileToVisualSourceType.files[0];

          // If the file is not a visual media file, skip it
          if (!visualMediaFile || visualMediaFile.kind === 'file') {
            return undefined;
          }

          setExistingMediaFilesToAttach((prev) => {
            const mediaAlreadyAttached = prev.find(
              (item) => item.mediaId === mediaId
            );

            if (mediaAlreadyAttached) {
              return prev;
            }

            return [
              ...prev,
              { mediaId, file: preparedMediaFile, visual: visualMediaFile },
            ];
          });
        }

        return undefined;
      });
    }
  }, [isMounted]);

  /**
   * Fetch available stories for the user to select from
   *
   * @note Only runs on mount
   */

  useEffect(() => {
    // Fetch the stories
    const fetchStories = async () => {
      setRetrievingData(true);

      const stories = await getCachedFeaturedPromptCollections();

      if (stories) {
        setSelectableStories(
          stories.map((story) => {
            return {
              id: story.id,
              title: story.title,
              description: story.description,
              shortDescription: story.shortDescription,
              createdAt: story.createdAt,
            };
          })
        );
      }

      setRetrievingData(false);
    };

    if (!retrievingData && !selectableStories.length) {
      fetchStories();
    }
  }, [retrievingData, selectableStories]);

  /**
   * Update certain local storage states when props change
   *
   * @note Only runs when the props change, e.g. promptStoryId
   */
  useEffect(() => {
    if (promptStoryIdProp && promptStoryIdProp !== inputPostStoryId) {
      setInputPostStoryId(promptStoryIdProp);
    }
  }, [promptStoryIdProp, inputPostStoryId]);

  const isDragDisabled = formDisabled || pending;

  const storySeriesSelectionEnabled =
    !promptStorySwitchDisabldProp ||
    (!promptStorySwitchDisabldProp &&
      selectableStories.length > 0 &&
      !retrievingData);

  const handleSelectingNewRandomPromptEnabled = Boolean(
    handleSelectingNewRandomPrompt
  );

  const handleTogglingViewingPromptChallenges = Boolean(
    handleViewingPromptChallengesProp
  );

  return (
    <WithCtxtDragAndDrop
      // disabled={disabled}
      // isLoading={isFormDataProcessing}
      handleOnDropOfFiles={handleOnDropOfFiles}
      className={cn('max-w-full rounded-xl p-1', dragAndDropClassName)}
    >
      <form
        ref={formRef}
        action={dispatch}
        id="create-experience-form"
        className={cn(
          'create-experience-form flex flex-col items-center gap-4',
          className
        )}
      >
        <div
          className={cn(
            'flex w-full flex-col gap-4 sm:gap-6',
            containerClassName
          )}
        >
          {formTitle && (
            <h3 className="hidden text-center text-base font-semibold text-foreground/80">
              {formTitle}
            </h3>
          )}
          <div
            className={cn(
              'flex w-full flex-col gap-5 rounded-lg',
              formFieldsClassName
            )}
          >
            {/* Experience Content */}
            <div className="relative flex grow flex-col gap-3">
              <Label
                className={cn('font-medium', inputContentLabelClassName)}
                htmlFor="content"
              >
                Content
              </Label>
              <div className="relative">
                <input
                  id="content"
                  name="content"
                  type="hidden"
                  placeholder={placeholderToUse}
                  // promptContext={promptChallengeProp?.prompt}
                  // ref={inputContentRef}
                  value={inputPostContent}
                  // className={cn(
                  //   'sr-only',
                  //   'max-h-48 rounded-xl border-4 border-border/90 py-5 placeholder:text-lg placeholder:text-foreground/40 focus:placeholder:text-foreground/50'
                  // )}
                  // onChange={(e) => {
                  //   const value = e.target.value;
                  //   setInputContent(value);
                  // }}
                  // onKeyDown={handleTextAreaKeyDown}
                  // // onValueChange={(value) => {
                  // //   setInputContent(value);
                  // // }}
                  // onFocus={handleOnFocus}
                  disabled={formDisabled}
                  minLength={10}
                  maxLength={maxContentLengthProp}
                  required
                />
                <input
                  id="richContent"
                  name="richContent"
                  type="hidden"
                  placeholder={placeholderToUse}
                  // promptContext={promptChallengeProp?.prompt}
                  // ref={inputContentRef}
                  value={inputPostRichContent}
                  // onChange={(e) => {
                  //   const value = e.target.value;
                  //   setInputContent(value);
                  // }}
                  // onKeyDown={handleTextAreaKeyDown}
                  // // onValueChange={(value) => {
                  // //   setInputContent(value);
                  // // }}
                  // onFocus={handleOnFocus}
                  // disabled={formDisabled}
                />
                <SimpleEditor
                  autoFocus={!noFocusOnOpenProp}
                  disabled={formDisabled}
                  charLimit={maxContentLengthProp}
                  promptQuestion={placeholderToUse}
                  editor={editorInstanceRef.current}
                  contentKeySuffix={editorContentKeyProp}
                  onUpdateCharacterCount={handleUpdatingCharacterCount}
                  onSetEditorInstance={handleSettingEditorInstance}
                  onContentValueChange={handleUpdatingContentValues}
                />
              </div>
              <div className="flex w-full justify-between gap-2">
                <div className="flex grow items-center gap-2 text-foreground/70">
                  {!noPromptChallengeToggleSwitchProp && (
                    <Label className="flex items-center gap-2 text-foreground/70">
                      <Switch
                        id="prompChallengeAccepted"
                        name="prompChallengeAccepted"
                        value={promptChallengeEnabledProp ? 'on' : 'off'}
                        checked={promptChallengeEnabledProp}
                        onCheckedChange={
                          handleTogglingPromptChallengeAcceptance
                        }
                        className="data-[state=checked]:bg-tertiary"
                        disabled={
                          promptChallengeToggleDisabledProp || formDisabled
                        }
                      />
                      <span className="text-xs sm:text-sm">
                        {promptChallengeEnabledProp
                          ? 'Challenge Accepted'
                          : 'Accept Challenge'}
                      </span>
                    </Label>
                  )}
                  {handleSelectingNewRandomPromptEnabled &&
                    !noPromptChallengeRefreshProp && (
                      <Button
                        size="off"
                        variant="outline"
                        className="group h-[unset] rounded-full p-1 transition-colors"
                        disabled={formDisabled || !promptChallengeEnabledProp}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            typeof handleSelectingNewRandomPrompt === 'function'
                          ) {
                            handleSelectingNewRandomPrompt(
                              promptChallengeProp?.prompt
                            );
                          }
                        }}
                      >
                        <IconRefresh className="size-3.5 transition-transform duration-300 group-hover:rotate-180 group-hover:brightness-125" />
                      </Button>
                    )}
                  {handleTogglingViewingPromptChallenges &&
                    !noPromptChallengeViewAllProp && (
                      <Button
                        size="off"
                        variant="outline"
                        className="group h-[unset] rounded-full p-1 transition-colors"
                        disabled={formDisabled}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            typeof handleTogglingPromptSelectionDrawer ===
                            'function'
                          ) {
                            handleTogglingPromptSelectionDrawer();
                          }
                        }}
                      >
                        <IconChallengePrompts className="group-hover:text-tertiary size-3.5 transition-transform duration-300 group-hover:rotate-45 group-hover:brightness-125" />
                      </Button>
                    )}
                  {!noPromptChallengeInfoProp && (
                    <PopoverWhatArePromptChallenges
                      noBtnLabel
                      btnVariant="outline"
                      btnSize="off"
                      btnClassName="p-1 rounded-full h-[unset]"
                      btnIconClassName="size-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:text-tertiary group-hover:brightness-125"
                    />
                  )}
                </div>
                <div className="flex grow items-center justify-end gap-1.5">
                  <Button
                    size="custom"
                    variant="outline"
                    type="button"
                    onClick={handleClearingContent}
                    onFocus={handleOnFocus}
                    disabled={!inputPostContent || formDisabled}
                    className="p-1 leading-none"
                    tabIndex={-1}
                  >
                    <IconClose className="size-3" />
                  </Button>
                  <Badge variant="outline" className="text-foreground/40">
                    {contentLengthRemaining}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Experience Title (Optional) */}
            {!noInputTitleProp && (
              <div className="relative flex grow flex-col gap-3">
                <Label
                  className={cn('font-medium', inputTitleLabelClassName)}
                  htmlFor="title"
                >
                  Title
                </Label>

                <div className="relative">
                  <Input
                    id="title"
                    name="title"
                    placeholder="Title Your Experience (Optional)"
                    value={inputPostTitle}
                    className={cn(
                      'py-5 pr-10',
                      'lg:text-lg',
                      'rounded-xl border-4 border-border/90',
                      'placeholder:text-base placeholder:text-foreground/40 focus:placeholder:text-foreground/50'
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInputTitle(value);
                    }}
                    disabled={formDisabled}
                    // minLength={10}
                    maxLength={100}
                    // required
                  />
                  <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center gap-1">
                    <Button
                      size="custom"
                      variant="outline"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearingTitle();
                      }}
                      disabled={
                        !inputPostTitle || formDisabled || isTitleGenerating
                      }
                      className="rounded-md p-1 leading-none"
                    >
                      <IconClose className="size-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex min-h-7 w-full max-w-full items-center justify-between gap-1.5">
                  {isTitleGenerating ? (
                    <BlockSkeleton className="h-7 w-full" />
                  ) : !isSuggestedTitleAccepted ? (
                    <div className="flex w-full items-center justify-between gap-1.5 text-muted-foreground">
                      <span className="flex w-full gap-1.5">
                        <span className="sr-only text-[smaller] brightness-80">
                          Suggested Title
                        </span>
                        <span className="truncate">{suggestedTitle}</span>
                      </span>
                      {suggestedTitle && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="off"
                            variant="outline"
                            className="size-5 rounded-full"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setInputTitle(suggestedTitle);
                            }}
                          >
                            <IconCheck className="hover:fill-success-foreground size-3" />
                          </Button>
                          <Button
                            size="off"
                            variant="outline"
                            className="size-5 rounded-full"
                            type="button"
                            disabled={isTitleGenerating || !inputPostContent}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleGeneratingTitle({
                                replace: true,
                                currentTime: new Date().getTime(),
                                context: inputPostContent,
                                storySeries: currentFormattedStoryTitle,
                                storySeriesDescription:
                                  currentStorySeriesDescription,
                              });
                            }}
                          >
                            <IconRefresh className="hover:fill-success-foreground size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Display both Media Placeholders and Attached Media */}
            <ExperienceMediaFiles
              handleOnFocus={handleOnFocus}
              maxAllowedFiles={numAllowedFiles}
              attachedFiles={mediaFilesForUI}
              handleOnDropOfFiles={handleOnDropOfFiles}
              handleOnRemoveFile={handleRemovingMediaFile}
              onClickPlaceholder={() => {
                if (inputFileRef.current) {
                  inputFileRef.current.click();
                }
              }}
            />
            <input
              multiple
              type="file"
              name="media"
              className="sr-only"
              ref={inputFileRef}
              accept={validMediaTypesProp.join(',')}
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  handleChangeFiles(files);
                }
              }}
              key={numOfAttachedMediaToProvider}
            />

            {/* <div className="flex grow flex-col gap-2">
              <Label
                className={cn('font-medium', inputTitleLabelClassName)}
                htmlFor="title"
              >
                Title
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={inputPostTitle}
                  placeholder="What would you like to call this experience? (Optional)"
                  className={cn(
                    'rounded-xl border-4 border-border/90 py-5 placeholder:text-foreground/40 focus:placeholder:text-foreground/50'
                  )}
                  onKeyDown={handleInputKeyDown}
                  onChange={(e) => setInputTitle(e.target.value)}
                  onFocus={handleOnFocus}
                  disabled={formDisabled}
                  maxLength={64}
                  required={false}
                />
              </div>
            </div> */}

            <div className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
              {userLocation && (
                <ExperienceLocationInfo
                  userLocation={userLocation}
                  isPreciseLocation={isPreciseLocation}
                />
              )}
              <div className="flex w-full flex-row items-center gap-3 md:flex-row md:justify-end">
                {/* <div className="flex flex-row gap-2">
                  <Label
                    className={cn(
                      'hidden font-medium',
                      inputPublicLabelClassName
                    )}
                    htmlFor="media"
                  >
                    Media
                  </Label>
                  <div className="relative flex w-full items-center gap-1.5">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            formDisabled || maxMediaFilesAttachedReached
                          }
                          className="gap-1.5 rounded-xl border-4 border-border/90 py-5 font-normal text-foreground/60 focus:text-foreground/80"
                          onFocus={handleOnFocus}
                        >
                          <span className="text-sm">Media</span>
                          <Badge
                            variant="outline"
                            className="text-foreground/60"
                          >
                            {totalNumOfAttachedMedia}/{numAllowedFiles}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => {
                              if (inputFileRef.current) {
                                inputFileRef.current.click();
                              }
                            }}
                            className="flex items-center gap-1.5 p-1.5 text-sm focus:cursor-pointer focus:rounded-sm focus:bg-accent"
                          >
                            <IconImageGallery className="size-4" />
                            <span>Attach Media</span>
                            <span className="text-[smaller]">(Pics/Video)</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {}}
                          className="flex items-center gap-1.5 p-1.5 text-xs text-foreground/60"
                        >
                          <IconInfo className="size-3" />
                          <span>Drag-and-drop files here</span>
                          <span>&#8682;</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                      multiple
                      type="file"
                      name="media"
                      className="sr-only"
                      ref={inputFileRef}
                      accept={validMediaTypesProp.join(',')}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          handleChangeFiles(files);
                        }
                      }}
                      key={numOfAttachedMediaToProvider}
                    />
                  </div>
                </div> */}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div>
                    <Label
                      className={cn(
                        'hidden font-medium',
                        inputPublicLabelClassName
                      )}
                      htmlFor="public"
                    >
                      Public
                    </Label>
                    <div className="relative flex w-full items-center gap-1.5">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={formDisabled}
                            className="gap-1.5 rounded-xl border-4 border-border/90 py-5 font-normal text-foreground/60 focus:text-foreground/80"
                            onFocus={handleOnFocus}
                          >
                            <span className="text-sm">Visibility</span>
                            {inputPostVisibility && (
                              <Badge
                                variant="outline"
                                className="text-foreground/60"
                              >
                                {capitalCase(inputPostVisibility)}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" className="w-56">
                          <DropdownMenuRadioGroup>
                            <DropdownMenuCheckboxItem
                              checked={inputPostVisibility === 'public'}
                              onCheckedChange={(checkedState) => {
                                if (checkedState) {
                                  setInputVisibility('public');
                                }
                              }}
                            >
                              <span>Public (All)</span>
                            </DropdownMenuCheckboxItem>

                            <DropdownMenuCheckboxItem
                              disabled
                              checked={inputPostVisibility === 'authenticated'}
                              onCheckedChange={(checkedState) => {
                                if (checkedState) {
                                  setInputVisibility('authenticated');
                                }
                              }}
                            >
                              <span>Logged In Users</span>
                            </DropdownMenuCheckboxItem>

                            <DropdownMenuCheckboxItem
                              disabled
                              checked={inputPostVisibility === 'private'}
                              onCheckedChange={(checkedState) => {
                                if (checkedState) {
                                  setInputVisibility('private');
                                }
                              }}
                            >
                              <span>Private (Just You)</span>
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <input
                        type="hidden"
                        name="visibility"
                        value={inputPostVisibility}
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className={cn(
                        'hidden gap-1.5 font-medium',
                        inputPublicLabelClassName
                      )}
                      htmlFor="diyrots"
                    >
                      <span>Story Series</span>
                      {retrievingData && <Spinner />}
                    </Label>
                    <div className="relative flex w-full items-center gap-1.5">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              formDisabled ||
                              !storySeriesSelectionEnabled ||
                              isPlaceholderGenerating
                            }
                            className="gap-1.5 rounded-xl border-4 border-border/90 py-5 font-normal text-foreground/60 focus:text-foreground/80"
                            onFocus={handleOnFocus}
                          >
                            <span className="text-sm">Story Series</span>

                            {!retrievingData && (
                              <Badge
                                variant="outline"
                                className="text-foreground/60"
                              >
                                {currentFormattedStoryTitle || 'None Selected'}
                              </Badge>
                            )}
                            {retrievingData && <Spinner />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" className="w-56">
                          {selectableStories.length > 0 && (
                            <DropdownMenuRadioGroup
                              value={inputPostStoryId}
                              defaultValue={inputPostStoryId}
                              onValueChange={handleOnStorySeriesChange}
                            >
                              <DropdownMenuRadioItem textValue="" value="">
                                <span>None</span>
                              </DropdownMenuRadioItem>
                              {selectableStories.map((story) => {
                                return (
                                  <DropdownMenuRadioItem
                                    key={story.id}
                                    textValue={story.id}
                                    value={story.id}
                                  >
                                    <span>
                                      {deriveStoryTitleFromRawTitle(
                                        story.title
                                      )}
                                    </span>
                                  </DropdownMenuRadioItem>
                                );
                              })}
                            </DropdownMenuRadioGroup>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <input
                        type="hidden"
                        name="diyrots"
                        value={inputPostStoryId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="flex grow flex-col gap-2">
              <Label
                className={cn('font-medium', inputTitleLabelClassName)}
                htmlFor="title"
              >
                Title
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={inputPostTitle}
                  placeholder="What would you like to call this experience? (Optional)"
                  className={cn('rounded-xl border-4 border-border/90 py-5')}
                  onKeyDown={handleInputKeyDown}
                  onChange={(e) => setInputTitle(e.target.value)}
                  disabled={formDisabled}
                  maxLength={64}
                  required={false}
                />
              </div>
            </div> */}
          </div>
          {!hideSubmitButton && (
            <SubmitButton
              disabled={pending}
              label={submitBtnLabel}
              className={submitBtnClassName}
            />
          )}
        </div>

        {/* Hidden Fields */}
        {promptChallengeProp?.id && (
          <input type="hidden" name="ditpmorp" value={promptChallengeProp.id} />
        )}

        {promptChallengeProp?.prompt && (
          <input
            type="hidden"
            name="prompt"
            value={promptChallengeProp.prompt}
          />
        )}

        {userId && <input type="hidden" name="diresu" value={userId} />}
      </form>
    </WithCtxtDragAndDrop>
  );
}

export type SubmitButtonProps = {
  className?: string;
  disabled?: boolean;
  label?: string;
};

function SubmitButton({
  className,
  disabled = false,
  label = 'Save',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <ButtonCta
      aria-disabled={pending}
      disabled={pending || disabled}
      size="sm"
      className={cn('', className)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {pending ? (
        <>
          <IconSpinner />
          <span>Going to space and back...</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </ButtonCta>
  );
}
