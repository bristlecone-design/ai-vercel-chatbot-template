'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/state/app-state';
import clsx from 'clsx';
import { Link } from 'lucide-react';

import { getNextImageUrlForManipulation } from '@/lib/next-image';
import usePreventNavigation from '@/hooks/use-prevent-navigation';
import ErrorNote from '@/components/error-note';
import FieldSetWithStatus from '@/components/field-with-status';
import { Spinner } from '@/components/spinner';
import { SubmitButtonWithStatus } from '@/components/submit-button-with-status';

import {
  convertFormKeysToLabels,
  FORM_METADATA_ENTRIES,
  formHasTextContent,
  getChangedFormFields,
  getFormErrors,
  isFormValid,
} from '.';
import { createPhotoAction, updatePhotoAction } from '../actions';
import AiButton from '../ai/AiButton';
import type { AiContent } from '../ai/useAiImageQueries';
import { convertTagsForForm, type TagsWithMeta } from '../tag';
import UpdateBlurDataButton from '../UpdateBlurDataButton';

import type { PhotoDbInsert, PhotoFormData } from '@/types/photo';
import { PATH_ADMIN_PHOTOS, PATH_ADMIN_UPLOADS } from '@/config/site-paths';
import { BLUR_ENABLED } from '@/config/site-settings';

const THUMBNAIL_SIZE = 300;

export default function PhotoForm({
  type = 'create',
  initialPhotoForm,
  updatedExifData,
  updatedBlurData,
  uniqueTags,
  aiContent,
  onTitleChange,
  onTextContentChange,
  onFormStatusChange,
}: {
  type?: 'create' | 'edit';
  initialPhotoForm: Partial<PhotoFormData>;
  updatedExifData?: Partial<PhotoFormData>;
  updatedBlurData?: string;
  uniqueTags?: TagsWithMeta;
  aiContent?: AiContent;
  onTitleChange?: (updatedTitle: string) => void;
  onTextContentChange?: (hasContent: boolean) => void;
  onFormStatusChange?: (pending: boolean) => void;
}) {
  const [formData, setFormData] =
    useState<Partial<PhotoFormData>>(initialPhotoForm);
  const [formErrors, setFormErrors] = useState(getFormErrors(initialPhotoForm));
  const [formActionErrorMessage, setFormActionErrorMessage] = useState('');

  const { invalidateSwr, shouldDebugImageFallbacks } = useAppState();

  const changedFormKeys = useMemo(
    () => getChangedFormFields(initialPhotoForm, formData),
    [initialPhotoForm, formData]
  );
  const formHasChanged = changedFormKeys.length > 0;
  const onlyChangedFieldIsBlurData =
    changedFormKeys.length === 1 && changedFormKeys[0] === 'blurData';

  usePreventNavigation(formHasChanged && !onlyChangedFieldIsBlurData);

  const canFormBeSubmitted =
    (type === 'create' || formHasChanged) &&
    isFormValid(formData) &&
    !aiContent?.isLoading;

  // Update form when EXIF data
  // is refreshed by parent
  useEffect(() => {
    if (Object.keys(updatedExifData ?? {}).length > 0) {
      const changedKeys: (keyof PhotoFormData)[] = [];

      setFormData((currentForm) => {
        Object.entries(updatedExifData ?? {}).forEach(([key, value]) => {
          if (currentForm[key as keyof PhotoFormData] !== value) {
            changedKeys.push(key as keyof PhotoFormData);
          }
        });

        return {
          ...currentForm,
          ...updatedExifData,
        };
      });

      if (changedKeys.length > 0) {
        const fields = convertFormKeysToLabels(changedKeys);
        toastSuccess(`Updated EXIF fields: ${fields.join(', ')}`, 8000);
      } else {
        toastWarning('No new EXIF data found');
      }
    }
  }, [updatedExifData]);

  const { width, height } = getDimensionsFromSize(
    THUMBNAIL_SIZE,
    formData.aspectRatio
  );

  const url = formData.url ?? '';

  useEffect(() => {
    if (updatedBlurData) {
      setFormData((data) =>
        updatedBlurData ? { ...data, blurData: updatedBlurData } : data
      );
    } else if (!BLUR_ENABLED) {
      setFormData((data) => ({ ...data, blurData: '' }));
    }
  }, [updatedBlurData]);

  useEffect(
    () =>
      setFormData((data) =>
        aiContent?.title ? { ...data, title: aiContent?.title } : data
      ),
    [aiContent?.title]
  );

  useEffect(
    () =>
      setFormData((data) =>
        aiContent?.caption ? { ...data, caption: aiContent?.caption } : data
      ),
    [aiContent?.caption]
  );

  useEffect(
    () =>
      setFormData((data) =>
        aiContent?.tags ? { ...data, tags: aiContent?.tags } : data
      ),
    [aiContent?.tags]
  );

  useEffect(
    () =>
      setFormData((data) =>
        aiContent?.semanticDescription
          ? { ...data, semanticDescription: aiContent?.semanticDescription }
          : data
      ),
    [aiContent?.semanticDescription]
  );

  useEffect(() => {
    onTextContentChange?.(formHasTextContent(formData));
  }, [onTextContentChange, formData]);

  const isFieldGeneratingAi = (key: keyof PhotoFormData) => {
    switch (key) {
      case 'title':
        return aiContent?.isLoadingTitle;
      case 'caption':
        return aiContent?.isLoadingCaption;
      case 'tags':
        return aiContent?.isLoadingTags;
      case 'semanticDescription':
        return aiContent?.isLoadingSemantic;
      default:
        return false;
    }
  };

  const accessoryForField = (key: keyof PhotoFormData) => {
    if (aiContent) {
      switch (key) {
        case 'title':
          return (
            <AiButton
              aiContent={aiContent}
              requestFields={['title']}
              shouldConfirm={Boolean(formData.title)}
              className="h-full"
            />
          );
        case 'caption':
          return (
            <AiButton
              aiContent={aiContent}
              requestFields={['caption']}
              shouldConfirm={Boolean(formData.caption)}
              className="h-full"
            />
          );
        case 'tags':
          return (
            <AiButton
              aiContent={aiContent}
              requestFields={['tags']}
              shouldConfirm={Boolean(formData.tags)}
              className="h-full"
            />
          );
        case 'semanticDescription':
          return (
            <AiButton
              aiContent={aiContent}
              requestFields={['semantic']}
              shouldConfirm={Boolean(formData.semanticDescription)}
            />
          );
        case 'blurData':
          return shouldDebugImageFallbacks &&
            type === 'edit' &&
            formData.url ? (
            <UpdateBlurDataButton
              photoUrl={getNextImageUrlForManipulation(formData.url)}
              onUpdatedBlurData={(blurData) =>
                setFormData((data) => ({ ...data, blurData }))
              }
            />
          ) : null;
      }
    }
  };

  const shouldHideField = (
    key: keyof PhotoDbInsert | 'favorite',
    hideIfEmpty?: boolean,
    shouldHide?: (formData: Partial<PhotoFormData>) => boolean
  ) => {
    if (
      key === 'blurData' &&
      type === 'create' &&
      !BLUR_ENABLED &&
      !shouldDebugImageFallbacks
    ) {
      return true;
    } else {
      return (hideIfEmpty && !formData[key]) || shouldHide?.(formData);
    }
  };

  return (
    <div className="relative max-w-[38rem] space-y-8">
      <div className="flex gap-2">
        <div className="relative">
          <ImageWithFallback
            alt="Upload"
            src={url}
            className={clsx(
              'overflow-hidden rounded-md border',
              'border-gray-200 dark:border-gray-700'
            )}
            blurDataURL={formData.blurData}
            blurCompatibilityLevel="none"
            width={width}
            height={height}
            priority
          />
          <div
            className={clsx(
              'absolute left-2 top-2 transition-opacity duration-500',
              aiContent?.isLoading ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div
              className={clsx(
                'text-xs font-medium uppercase leading-none tracking-wide',
                'rounded-[4px] px-1.5 py-1',
                'inline-flex items-center gap-2',
                'bg-white/70 backdrop-blur-md dark:bg-black/60',
                'border border-gray-900/10 dark:border-gray-700/70',
                'select-none'
              )}
            >
              <Spinner
                color="text"
                size={9}
                className={clsx(
                  'text-extra-dim',
                  'translate-x-[1px] translate-y-[0.5px]'
                )}
              />
              Analyzing image
            </div>
          </div>
        </div>
      </div>
      {formActionErrorMessage && (
        <ErrorNote>{formActionErrorMessage}</ErrorNote>
      )}
      <form
        action={(data) =>
          (type === 'create' ? createPhotoAction : updatePhotoAction)(
            data
          ).catch((e) => setFormActionErrorMessage(e.message))
        }
        onSubmit={() => {
          setFormActionErrorMessage('');
          (document.activeElement as HTMLElement)?.blur?.();
        }}
      >
        {/* Fields */}
        <div className="space-y-6">
          {FORM_METADATA_ENTRIES(
            convertTagsForForm(uniqueTags),
            aiContent !== undefined
          ).map(
            ([
              key,
              {
                label,
                note,
                required,
                selectOptions,
                selectOptionsDefaultLabel,
                tagOptions,
                readOnly,
                validate,
                validateStringMaxLength,
                capitalize,
                hideIfEmpty,
                shouldHide,
                loadingMessage,
                type,
              },
            ]) =>
              !shouldHideField(key, hideIfEmpty, shouldHide) && (
                <FieldSetWithStatus
                  key={key}
                  id={key}
                  label={
                    label +
                    (key === 'blurData' && shouldDebugImageFallbacks
                      ? ` (${(formData[key] ?? '').length} chars.)`
                      : '')
                  }
                  note={note}
                  error={formErrors[key]}
                  value={formData[key] ?? ''}
                  isModified={changedFormKeys.includes(key)}
                  onChange={(value) => {
                    const formUpdated = { ...formData, [key]: value };
                    setFormData(formUpdated);
                    if (validate) {
                      setFormErrors({ ...formErrors, [key]: validate(value) });
                    } else if (validateStringMaxLength !== undefined) {
                      setFormErrors({
                        ...formErrors,
                        [key]:
                          value.length > validateStringMaxLength
                            ? `${validateStringMaxLength} characters or less`
                            : undefined,
                      });
                    }
                    if (key === 'title') {
                      onTitleChange?.(value.trim());
                    }
                  }}
                  selectOptions={selectOptions}
                  selectOptionsDefaultLabel={selectOptionsDefaultLabel}
                  tagOptions={tagOptions}
                  required={required}
                  readOnly={readOnly}
                  capitalize={capitalize}
                  placeholder={
                    loadingMessage && !formData[key]
                      ? loadingMessage
                      : undefined
                  }
                  loading={
                    (loadingMessage && !formData[key] ? true : false) ||
                    isFieldGeneratingAi(key)
                  }
                  type={type}
                  accessory={accessoryForField(key)}
                />
              )
          )}
        </div>
        {/* Actions */}
        <div
          className={clsx('sticky bottom-0 flex gap-3', 'mt-12 pb-4 md:pb-8')}
        >
          <Link
            className="button"
            href={type === 'edit' ? PATH_ADMIN_PHOTOS : PATH_ADMIN_UPLOADS}
          >
            Cancel
          </Link>
          <SubmitButtonWithStatus
            disabled={!canFormBeSubmitted}
            onFormStatusChange={onFormStatusChange}
            onFormSubmit={invalidateSwr}
            primary
          >
            {type === 'create' ? 'Create' : 'Update'}
          </SubmitButtonWithStatus>
          <div
            className={clsx(
              'absolute -left-2 -top-16 bottom-0 right-0 -z-10',
              'pointer-events-none',
              'bg-gradient-to-t',
              'from-white/90 from-60%',
              'dark:from-black/90 dark:from-50%'
            )}
          />
        </div>
      </form>
    </div>
  );
}
