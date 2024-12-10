'use server';

import { CACHE_KEY_INCOMPLETE_PROMPTS } from '@/actions/cache-keys';
import { revalidateTag } from 'next/cache';

import { AuthError } from 'next-auth';
import { z } from 'zod';

import { getErrorMessage } from '@/lib/errors';

import {
  type ExperienceActionResult,
  ExperienceResultCode,
} from './experience-action-types';

import type { ExperienceModel } from '@/types/experiences';

export async function saveCreateExperience(
  _prevState: ExperienceActionResult | undefined,
  formData: FormData,
): Promise<ExperienceActionResult | undefined> {
  try {
    // const id = formData.get('id');
    // const allFormData = Object.fromEntries(formData.entries());
    // console.log(`***** allFormData before validating`, allFormData);
    const userId = formData.get('diresu');
    const userLatitude = formData.get('userLatitude');
    const userLongitude = formData.get('userLongitude');
    const userLocation = formData.get('userLocation');

    const title = formData.get('title');
    const content = formData.get('content');
    const richContent = formData.get('richContent');
    const location = formData.get('location');
    const publiclyVisible = formData.get('visibility');
    const prompt = formData.get('prompt');
    const promptChallengeId = formData.get('ditpmorp');
    const promptStoryId = formData.get('diyrots');

    const userLocationToUse = userLocation || location || '';

    // const media = formData.getAll('media');
    // console.log('**** saveMediaAttrChanges invokeded', {
    //   userId,
    //   promptChallengeId,
    //   prompt,

    //   userLatitude,
    //   userLongitude,
    //   userLocation,
    //   userLocationToUse,

    //   title,
    //   content,
    //   richContent,
    //   location,
    //   publiclyVisible,
    //   // media,
    // });

    const parsedValues = z
      .object({
        userId: z.string(),
        // Prompt Challenge (optional)
        promptStoryId: z.string().optional().nullable(),
        promptChallengeId: z.string().optional().nullable(),
        prompt: z.string().optional().nullable(),

        // Geo
        userLatitude: z.number().optional().nullable(),
        userLongitude: z.number().optional().nullable(),
        userLocation: z.string().optional().nullable(),

        // User Input
        content: z.string().min(1),
        richContent: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        media: z.instanceof(File).optional().nullable(),
        visibility: z.nativeEnum(PostVisibilityTypes).optional(),
      })
      .safeParse({
        userId,
        promptStoryId,
        promptChallengeId,
        prompt,

        // Geo
        userLocation: userLocationToUse,
        userLatitude: userLatitude ? Number(userLatitude) : userLatitude,
        userLongitude: userLongitude ? Number(userLongitude) : userLongitude,

        // User Input
        content,
        richContent,
        title,
        location,
        // media,
        visibility: publiclyVisible,
      });

    // console.log('***** parsedValues', parsedValues, parsedValues.error);

    if (parsedValues.success) {
      const { data } = parsedValues;

      const payload: Prisma.ExperienceCreateInput = {
        latitude: data.userLatitude,
        longitude: data.userLongitude,
        location: data.userLocation,
        content: data.content.trim(),
        richContent: data.richContent?.trim(),
        title: data.title?.trim(),
        visibility: data.visibility,
        prompt: data.prompt?.trim(),

        // Connect the experience to the author
        Author: {
          connect: {
            id: data.userId,
          },
        },

        // Collaborators: {
        //   connect: {
        //     id: data.userId,
        //   },
        // },
      };

      // Connect the experience to the prompt challenge if provided
      if (data.promptChallengeId) {
        payload.Prompt = {
          connect: {
            id: data.promptChallengeId,
          },
        };
      }

      // Connect the experience to the prompt story if provided
      if (data.promptStoryId) {
        payload.Story = {
          connect: {
            id: data.promptStoryId,
          },
        };
      }

      // console.log('**** final payload to create experience out of::', payload);

      const createdExperienceRes = await createExperience(payload);

      // console.log(
      //   '*** createdExperienceRes',
      //   JSON.stringify(createdExperienceRes, null, 2)
      // );

      if (typeof createdExperienceRes === 'string' || !createdExperienceRes) {
        throw new Error(
          `Failed to create experience: ${createdExperienceRes || ''}`.trim(),
        );
      }

      const { id: createdExpId, promptId: createdPromptId } =
        createdExperienceRes;
      if (createdPromptId) {
        // Revalidate the cache for incomplete prompts
        revalidateTag(CACHE_KEY_INCOMPLETE_PROMPTS);

        // Connect the user to the prompt-collaboration record
        const pc = await createPromptExperienceCollaborator(
          data.userId,
          createdPromptId,
          createdExpId,
          data.promptStoryId ?? undefined,
        );
        // console.log(
        //   `**** createdPromptCollaborator record`,
        //   JSON.stringify(pc, null, 2)
        // );
      }

      return {
        type: 'success',
        resultCode: ExperienceResultCode.Success,
        data: createdExperienceRes as unknown as ExperienceModel,
      };
    }

    return {
      type: 'error',
      resultCode: ExperienceResultCode.UnknownError,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            type: 'error',
            resultCode: ExperienceResultCode.UnknownError,
          };
        default:
          return {
            type: 'error',
            resultCode: ExperienceResultCode.UnknownError,
          };
      }
    }

    const errMsg = getErrorMessage(error);

    return {
      type: 'error',
      resultCode: ExperienceResultCode.UnknownError,
      msg: errMsg,
    };
  }
}
