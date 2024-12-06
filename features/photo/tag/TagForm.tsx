'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useAppState } from '@/state/app-state';

import { parameterize } from '@/lib/strings';
import FieldSetWithStatus from '@/components/field-with-status';
import { SubmitButtonWithStatus } from '@/components/submit-button-with-status';

import { renamePhotoTagGloballyAction } from '../actions';

import { PATH_ADMIN_TAGS } from '@/config/site-paths';

export default function TagForm({
  tag,
  children,
}: {
  tag: string;
  children?: ReactNode;
}) {
  const { invalidateSwr } = useAppState();

  const [updatedTagRaw, setUpdatedTagRaw] = useState(tag);

  const updatedTag = useMemo(
    () => parameterize(updatedTagRaw),
    [updatedTagRaw]
  );

  const isFormValid = updatedTag && updatedTag !== tag;

  return (
    <form action={renamePhotoTagGloballyAction} className="space-y-8">
      <FieldSetWithStatus
        id="updatedTagRaw"
        label="New Tag Name"
        value={updatedTagRaw}
        onChange={setUpdatedTagRaw}
      />
      {/* Form data: tag to be replaced */}
      <input name="tag" value={tag} hidden readOnly />
      {/* Form data: updated tag */}
      <input name="updatedTag" value={updatedTag} hidden readOnly />
      {children}
      <div className="flex gap-3">
        <Link className="button" href={PATH_ADMIN_TAGS}>
          Cancel
        </Link>
        <SubmitButtonWithStatus
          disabled={!isFormValid}
          onFormSubmit={invalidateSwr}
        >
          Update
        </SubmitButtonWithStatus>
      </div>
    </form>
  );
}
