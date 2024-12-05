import type { ComponentProps } from 'react';

import { authCachedSafe } from '@/app/(auth)/auth.cache';

import AdminPhotoMenuClient from './AdminPhotoMenuClient';

export default async function AdminPhotoMenu(
  props: ComponentProps<typeof AdminPhotoMenuClient>
) {
  const session = await authCachedSafe();
  return Boolean(session?.user?.email) ? (
    <AdminPhotoMenuClient {...props} />
  ) : null;
}
