'use client';

import { useState } from 'react';

import type { StorageListResponse } from '@/lib/storage';

import type { TagsWithMeta } from '../photo/tag';
import AdminAddAllUploads from './AdminAddAllUploads';
import AdminUploadsTable from './AdminUploadsTable';

export default function AdminUploadsClient({
  title,
  urls,
  uniqueTags,
}: {
  title?: string;
  urls: StorageListResponse;
  uniqueTags?: TagsWithMeta;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [addedUploadUrls, setAddedUploadUrls] = useState<string[]>([]);
  return (
    <div className="space-y-4">
      {urls.length > 1 && (
        <AdminAddAllUploads
          storageUrlCount={urls.length}
          uniqueTags={uniqueTags}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
          onUploadAdded={setAddedUploadUrls}
        />
      )}
      <AdminUploadsTable {...{ title, urls, isAdding, addedUploadUrls }} />
    </div>
  );
}
