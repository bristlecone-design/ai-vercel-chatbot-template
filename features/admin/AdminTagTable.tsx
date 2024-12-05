import { Fragment } from 'react';
import clsx from 'clsx';

import { photoQuantityText } from '../photo';
import { deletePhotoTagGloballyAction } from '../photo/actions';
import { formatTag, sortTagsObject, type TagsWithMeta } from '../photo/tag';
import AdminTable from './AdminTable';
import AdminTagBadge from './AdminTagBadge';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';

import { pathForAdminTagEdit } from '@/config/site-paths';

export default function AdminTagTable({ tags }: { tags: TagsWithMeta }) {
  return (
    <AdminTable>
      {sortTagsObject(tags).map(({ tag, count }) => (
        <Fragment key={tag}>
          <div className="col-span-2 pr-2">
            <AdminTagBadge {...{ tag, count }} />
          </div>
          <div
            className={clsx('flex flex-nowrap', 'items-center gap-2 sm:gap-3')}
          >
            <EditButton path={pathForAdminTagEdit(tag)} />
            <FormWithConfirm
              action={deletePhotoTagGloballyAction}
              confirmText={
                // eslint-disable-next-line max-len
                `Are you sure you want to remove "${formatTag(tag)}" from ${photoQuantityText(count, false).toLowerCase()}?`
              }
            >
              <input type="hidden" name="tag" value={tag} />
              <DeleteButton clearLocalState />
            </FormWithConfirm>
          </div>
        </Fragment>
      ))}
    </AdminTable>
  );
}
