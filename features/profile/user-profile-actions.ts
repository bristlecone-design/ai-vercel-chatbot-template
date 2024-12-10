'use server';

import { updateUser } from '@/actions/user';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import {
  UserProfileResultCode,
  type UserProfileUpdateResult,
} from './user-profile-types';

export async function saveUserProfileChanges(
  _prevState: UserProfileUpdateResult | undefined,
  formData: FormData,
): Promise<UserProfileUpdateResult | undefined> {
  try {
    const id = formData.get('id');
    const name = formData.get('name');
    const email = formData.get('email');
    const profession = formData.get('profession');
    const organization = formData.get('organization');
    const interests = formData.get('interests');
    const website = formData.get('website');
    const social = formData.get('social');
    const location = formData.get('location');
    const publiclyVisible = formData.get('public');

    const parsedValues = z
      .object({
        id: z.string(),
        name: z.string().min(3),
        email: z.string().email(),
        profession: z.string().optional(),
        organization: z.string().optional(),
        interests: z.string().optional(),
        website: z.string().optional(),
        social: z.string().optional(),
        location: z.string().optional(),
        publiclyVisible: z.boolean(),
      })
      .safeParse({
        id,
        name,
        email,
        profession,
        organization,
        interests,
        website,
        social,
        location,
        publiclyVisible,
      });

    if (parsedValues.success) {
      const updatedMedia = await updateUser(parsedValues.data.id, {
        name: parsedValues.data.name,
        email: parsedValues.data.email,
        profession: parsedValues.data.profession,
        organization: parsedValues.data.organization,
        interests: parsedValues.data.interests,
        url: parsedValues.data.website,
        urlSocial: parsedValues.data.social,
        location: parsedValues.data.location,
        public: parsedValues.data.publiclyVisible,
      });

      return {
        type: 'success',
        resultCode: UserProfileResultCode.Success,
        data: updatedMedia.data,
      };
    } else {
      return {
        type: 'error',
        resultCode: UserProfileResultCode.UnknownError,
        data: undefined,
      };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            type: 'error',
            resultCode: UserProfileResultCode.UnknownError,
          };
        default:
          return {
            type: 'error',
            resultCode: UserProfileResultCode.UnknownError,
          };
      }
    }
  }
}
