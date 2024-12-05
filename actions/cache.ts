'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function clearPathCache(path: string, type?: 'layout' | 'page') {
  revalidatePath(path, type);
}

export async function clearTagCache(tag: string) {
  revalidateTag(tag);
}
