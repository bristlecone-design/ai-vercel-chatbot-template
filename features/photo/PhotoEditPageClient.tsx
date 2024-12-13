'use client';

import { useActionState } from 'react';

import { areSimpleObjectsEqual } from '@/lib/objects';

import AdminChildPage from '../admin/AdminChildPage';
import PhotoSyncButton from '../admin/PhotoSyncButton';
import { getExifDataAction } from './actions';
import AiButton from './ai/AiButton';
import { convertPhotoToFormData } from './form';
import PhotoForm from './form/PhotoForm';
import usePhotoFormParent from './form/usePhotoFormParent';
import type { TagsWithMeta } from './tag';

import type { Photo, PhotoFormData } from '@/types/photo';
import { PATH_ADMIN_PHOTOS } from '@/config/site-paths';

export default function PhotoEditPageClient({
  photo,
  uniqueTags,
  hasAiTextGeneration,
  imageThumbnailBase64,
  blurData,
}: {
  photo: Photo;
  uniqueTags: TagsWithMeta;
  hasAiTextGeneration: boolean;
  imageThumbnailBase64: string;
  blurData: string;
}) {
  const seedExifData = { url: photo.url };

  const [updatedExifData, action] = useActionState<Partial<PhotoFormData>>(
    getExifDataAction,
    seedExifData
  );

  const hasExifDataBeenFound = !areSimpleObjectsEqual(
    updatedExifData,
    seedExifData
  );

  const photoForm = convertPhotoToFormData(photo);

  const {
    pending,
    setIsPending,
    updatedTitle,
    setUpdatedTitle,
    hasTextContent,
    setHasTextContent,
    aiContent,
  } = usePhotoFormParent({
    photoForm,
    imageThumbnailBase64,
  });

  return (
    <AdminChildPage
      backPath={PATH_ADMIN_PHOTOS}
      backLabel="Photos"
      breadcrumb={
        pending && updatedTitle ? updatedTitle : photo.title || photo.id
      }
      breadcrumbEllipsis
      accessory={
        <div className="flex gap-2">
          {hasAiTextGeneration && (
            <AiButton {...{ aiContent, shouldConfirm: hasTextContent }} />
          )}
          <PhotoSyncButton action={action} formData={{ photoUrl: photo.url }} />
        </div>
      }
      isLoading={pending}
    >
      <PhotoForm
        type="edit"
        initialPhotoForm={photoForm}
        updatedExifData={hasExifDataBeenFound ? updatedExifData : undefined}
        updatedBlurData={blurData}
        uniqueTags={uniqueTags}
        aiContent={hasAiTextGeneration ? aiContent : undefined}
        onTitleChange={setUpdatedTitle}
        onTextContentChange={setHasTextContent}
        onFormStatusChange={setIsPending}
      />
    </AdminChildPage>
  );
}
