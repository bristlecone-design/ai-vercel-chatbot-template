'use server';

import { clearTagCache } from '@/actions/cache';

import { AuthError } from 'next-auth';
import { z } from 'zod';

import { updateMediaAttrs } from '@/lib/db/queries/media/update-core-media';
import { MediaResultCode, type MediaUpdateResult } from './media-update-types';

export async function saveMediaAttrChanges(
  _prevState: MediaUpdateResult | undefined,
  formData: FormData,
): Promise<MediaUpdateResult | undefined> {
  try {
    const id = formData.get('id');
    const title = formData.get('title');
    const caption = formData.get('caption');
    const location = formData.get('locationName');
    const price = formData.get('price');
    const usageNotes = formData.get('usageNotes');
    const downloadable = formData.get('downloadable');
    const publiclyVisible = formData.get('public');
    // console.log(`**** saveMediaAttrChanges invokeded`, {
    //   id,
    //   title,
    //   caption,
    //   price,
    //   usageNotes,
    //   downloadable,
    //   publiclyVisible,
    // });

    const parsedValues = z
      .object({
        id: z.string(),
        title: z.string().optional(),
        caption: z.string().optional(),
        locationName: z.string().optional(),
        price: z.string().optional(),
        usageNotes: z.string().optional(),
        downloadable: z.string().nullable().optional(),
        public: z.string().nullable().optional(),
      })
      .safeParse({
        id,
        title,
        caption,
        locationName: location,
        price,
        usageNotes,
        downloadable,
        public: publiclyVisible,
      });

    // console.log(`***** parsedValues`, parsedValues, parsedValues.error);

    if (parsedValues.success) {
      const { data } = parsedValues;
      const price = data.price ? Number.parseFloat(data.price) : null;
      const downloadable = data.downloadable === '1';
      const publiclyVisible = data.public === '1';

      const updatedPayload = {
        title: data.title,
        caption: data.caption,
        locationName: data.locationName,
        usageNotes: data.usageNotes,
        public: publiclyVisible,
        downloadable,
        price,
      };
      // console.log(`**** updatedPayload to save for id ${id}`, updatedPayload);

      const { data: updatedMedia } = await updateMediaAttrs(
        parsedValues.data.id,
        updatedPayload,
      );

      // Clear the cache for the experience that this media belongs to
      if (updatedMedia.experienceId) {
        clearTagCache(updatedMedia.experienceId);
      }

      return {
        type: 'success',
        resultCode: MediaResultCode.Success,
        data: updatedMedia,
      };
    } else {
      return {
        type: 'error',
        resultCode: MediaResultCode.UnknownError,
        data: undefined,
      };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            type: 'error',
            resultCode: MediaResultCode.UnknownError,
          };
        default:
          return {
            type: 'error',
            resultCode: MediaResultCode.UnknownError,
          };
      }
    }
  }
}
