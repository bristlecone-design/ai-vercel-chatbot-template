import { Fragment } from 'react';
import clsx from 'clsx';
import { formatDate } from 'date-fns';
import { Link } from 'lucide-react';

import {
  fileNameForStorageUrl,
  getIdFromStorageUrl,
  type StorageListResponse,
} from '@/lib/storage';
import { Spinner } from '@/components/spinner';

import { deleteBlobPhotoAction } from '../photo/actions';
import AddButton from './AddButton';
import AdminTable from './AdminTable';
import DeleteButton from './DeleteButton';

import { pathForAdminUploadUrl } from '@/config/site-paths';

export default function AdminUploadsTable({
  title,
  urls,
  addedUploadUrls,
  isAdding,
}: {
  title?: string;
  urls: StorageListResponse;
  addedUploadUrls?: string[];
  isAdding?: boolean;
}) {
  return (
    <AdminTable {...{ title }}>
      {urls.map(({ url, uploadedAt }) => {
        const addUploadPath = pathForAdminUploadUrl(url);
        const uploadFileName = fileNameForStorageUrl(url);
        const uploadId = getIdFromStorageUrl(url);
        return (
          <Fragment key={url}>
            <Link href={addUploadPath} prefetch={false}>
              <ImageSmall
                alt={`Upload: ${uploadFileName}`}
                src={url}
                aspectRatio={3.0 / 2.0}
                className={clsx(
                  'overflow-hidden rounded-[3px]',
                  'border border-gray-200 dark:border-gray-800'
                )}
              />
            </Link>
            <Link
              href={addUploadPath}
              className="break-all"
              title={
                uploadedAt
                  ? `${url} @ ${formatDate(uploadedAt, 'yyyy-MM-dd HH:mm:ss')}`
                  : url
              }
              prefetch={false}
            >
              {uploadId}
            </Link>
            <div
              className={clsx(
                'flex flex-nowrap',
                'items-center gap-2 sm:gap-3'
              )}
            >
              {addedUploadUrls?.includes(url) || isAdding ? (
                <span
                  className={clsx(
                    'flex h-9 w-full items-center justify-end pr-3'
                  )}
                >
                  {addedUploadUrls?.includes(url) ? (
                    <FaRegCircleCheck size={18} />
                  ) : (
                    <Spinner size={19} className="translate-y-[2px]" />
                  )}
                </span>
              ) : (
                <>
                  <AddButton path={addUploadPath} />
                  <FormWithConfirm
                    action={deleteBlobPhotoAction}
                    confirmText="Are you sure you want to delete this upload?"
                  >
                    <input
                      type="hidden"
                      name="redirectToPhotos"
                      value={urls.length < 2 ? 'true' : 'false'}
                      readOnly
                    />
                    <input type="hidden" name="url" value={url} readOnly />
                    <DeleteButton />
                  </FormWithConfirm>
                </>
              )}
            </div>
          </Fragment>
        );
      })}
    </AdminTable>
  );
}
