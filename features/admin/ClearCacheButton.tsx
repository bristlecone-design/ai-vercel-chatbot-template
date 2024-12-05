'use client';

import { useAppState } from '@/state/app-state';
import { BiTrash } from 'react-icons/bi';

import { syncCacheAction } from '../photo/actions';

export default function ClearCacheButton() {
  const { invalidateSwr } = useAppState();

  return (
    <form action={syncCacheAction}>
      <SubmitButtonWithStatus
        icon={<BiTrash size={16} />}
        onFormSubmit={invalidateSwr}
      >
        Clear Cache
      </SubmitButtonWithStatus>
    </form>
  );
}
