import { revalidatePath } from 'next/cache';

export async function refreshView(path = '/') {
  return revalidatePath(path);
}
