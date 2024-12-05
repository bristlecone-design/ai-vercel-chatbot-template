'use client';

import { Fragment } from 'react';
import { useAppState } from '@/state/app-state';
import clsx from 'clsx';
import { Link } from 'lucide-react';
import { AiOutlineEyeInvisible } from 'react-icons/ai';

import { deleteConfirmationTextForPhoto, titleForPhoto } from '../photo';
import {
  deletePhotoFormAction,
  syncPhotoExifDataAction,
} from '../photo/actions';
import type { RevalidatePhoto } from '../photo/InfinitePhotoScroll';
import PhotoDate from '../photo/PhotoDate';
import PhotoSmall from '../photo/PhotoSmall';
import AdminTable from './AdminTable';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import PhotoSyncButton from './PhotoSyncButton';

import type { Photo } from '@/types/photo';
import { pathForAdminPhotoEdit, pathForPhoto } from '@/config/site-paths';

export default function AdminPhotosTable({
  photos,
  onLastPhotoVisible,
  revalidatePhoto,
}: {
  photos: Photo[];
  onLastPhotoVisible?: () => void;
  revalidatePhoto?: RevalidatePhoto;
}) {
  const { invalidateSwr } = useAppState();

  return (
    <AdminTable>
      {photos.map((photo, index) => (
        <Fragment key={photo.id}>
          <PhotoSmall
            photo={photo}
            onVisible={
              index === photos.length - 1 ? onLastPhotoVisible : undefined
            }
          />
          <div className="flex flex-col lg:flex-row">
            <Link
              key={photo.id}
              href={pathForPhoto({ photo })}
              className="flex items-center gap-2 lg:w-[50%]"
              prefetch={false}
            >
              <span className={clsx(photo.hidden && 'text-dim')}>
                {titleForPhoto(photo)}
                {photo.hidden && (
                  <span className="whitespace-nowrap">
                    {' '}
                    <AiOutlineEyeInvisible
                      className="inline translate-y-[-0.5px]"
                      size={16}
                    />
                  </span>
                )}
              </span>
              {photo.priorityOrder !== null && (
                <span
                  className={clsx(
                    'rounded-sm px-1.5 py-1 text-xs leading-none',
                    'dark:text-gray-300',
                    'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  {photo.priorityOrder}
                </span>
              )}
            </Link>
            <div className={clsx('uppercase lg:w-[50%]', 'text-dim')}>
              <PhotoDate {...{ photo }} />
            </div>
          </div>
          <div
            className={clsx('flex flex-nowrap', 'items-center gap-2 sm:gap-3')}
          >
            <EditButton path={pathForAdminPhotoEdit(photo)} />
            <PhotoSyncButton
              action={syncPhotoExifDataAction}
              photoTitle={titleForPhoto(photo)}
              formData={{ photoId: photo.id }}
              onFormSubmit={invalidateSwr}
              includeLabel={false}
              shouldConfirm
              shouldToast
            />
            <FormWithConfirm
              action={deletePhotoFormAction}
              confirmText={deleteConfirmationTextForPhoto(photo)}
              onSubmit={() => revalidatePhoto?.(photo.id, true)}
            >
              <input type="hidden" name="id" value={photo.id} />
              <input type="hidden" name="url" value={photo.url} />
              <DeleteButton clearLocalState />
            </FormWithConfirm>
          </div>
        </Fragment>
      ))}
    </AdminTable>
  );
}
