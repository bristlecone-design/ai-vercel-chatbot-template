import { getErrorMessage } from '@/lib/errors';
import { base64ToFile } from '@/lib/images';
import { del } from '@vercel/blob';
import { unstable_expirePath } from 'next/cache';
import { updateUserAvatar, updateUserBanner } from '../lib/db/queries/user';
import { uploadUserAvatar, uploadUserBanner } from './blob';

/**
 * Delete an asset (blob) from remote storage by its URL.
 */
export async function deleteStorageAssetByUrl(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('deleteAssetByUrl error', getErrorMessage(error));
    return false;
  }
}

/**
 * Upload user banner to file blob store and update the user's profile in the db.
 */
export async function uploadAndStoreUserBanner(
  userId: string,
  banner: File | string | null,
  contentType?: string,
): Promise<{
  blob: boolean;
  db: boolean;
}> {
  try {
    const xBanner =
      typeof banner === 'string' && banner.startsWith('data:')
        ? await base64ToFile(banner, '', contentType)
        : banner;

    // If banner is not a file, return early
    if (xBanner !== null && !(xBanner instanceof File)) {
      return {
        db: false,
        blob: false,
      };
    }

    let dbUpdated = false;
    let blobUpdated = false;

    // Save the user's banner
    if (xBanner) {
      // Save the user's avatar and banner to the KV store
      const blobResult = await uploadUserBanner(
        xBanner,
        userId,
        `banner-${new Date().getTime()}`,
      );
      blobUpdated = Boolean(blobResult.url);

      if (blobResult.url) {
        dbUpdated = await updateUserBanner(userId, blobResult.url);
      }
    } else {
      // User wants to remove their banner
      dbUpdated = await updateUserBanner(userId, '');
    }

    // Revalidate the user's profile page globally
    if (dbUpdated && blobUpdated) {
      // console.log(`**** revalidating user profile page`);
      unstable_expirePath('/');
    }

    return {
      db: dbUpdated,
      blob: blobUpdated,
    };
  } catch (error) {
    console.error('uploadAndStoreUserBanner error', getErrorMessage(error));
    return {
      db: false,
      blob: false,
    };
  }
}

/**
 * Upload user avatar to file blob store and update the user's profile in the db.
 */
export async function uploadAndStoreUserAvatar(
  userId: string,
  avatar: File | string | null,
  contentType?: string,
): Promise<{
  blob: boolean;
  db: boolean;
}> {
  try {
    const xAvatar =
      typeof avatar === 'string' && avatar.startsWith('data:')
        ? await base64ToFile(avatar, '', contentType)
        : avatar;

    // If avatar is not a file, return early
    if (xAvatar !== null && !(xAvatar instanceof File)) {
      return {
        db: false,
        blob: false,
      };
    }

    let dbUpdated = false;
    let blobUpdated = false;

    // Save the user's avatar
    if (xAvatar) {
      // Save the user's avatar and banner to the KV store
      const blobResult = await uploadUserAvatar(
        xAvatar,
        userId,
        `avatar-${new Date().getTime()}`,
      );
      blobUpdated = Boolean(blobResult.url);

      if (blobResult.url) {
        dbUpdated = await updateUserAvatar(userId, blobResult.url);
      }
    } else {
      // User wants to remove their avatar
      dbUpdated = await updateUserAvatar(userId, '');
    }

    // Revalidate the user's profile page globally
    if (dbUpdated && blobUpdated) {
      // console.log(`**** revalidating user profile page`);
      unstable_expirePath('/');
    }

    return {
      db: dbUpdated,
      blob: blobUpdated,
    };
  } catch (error) {
    console.error('uploadAndStoreUserAvatar error', getErrorMessage(error));
    return {
      db: false,
      blob: false,
    };
  }
}
