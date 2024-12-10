import { getUserProfilePermalink } from '@/features/experiences/utils/experience-utils';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { getNextImageUrlForManipulation } from '@/lib/next-image';
import {
  getUsersFirstNameFromName,
  getUsersLastNameFromName,
} from '@/lib/user/user-utils';

import type { AppUser } from '@/types/next-auth';
import type { USER_PROFILE_MODEL } from '@/types/user';

export function mapAndInferAuthAndProfileProps(
  authUser?: AppUser,
  userProfile?: USER_PROFILE_MODEL,
) {
  if (!userProfile) {
    return {
      isProfilePublic: false,
      isInPrivateBeta: false,
      isAuthenticated: false,
      isAuthUserOwnProfile: false,
      profileUserFirstName: '',
      profileUserLastName: '',
      profileUserAvatar: '',
      profileUserBanner: '',
      profileUsername: '',
      profileUserBio: '',
      profileUserProfession: [],
      profileUserInterests: [],
      profileDisplayName: '',
      profileAbsoluteUrl: '',
      profileRelativeUrl: '',
      authUser: undefined,
      userProfile: undefined,
    };
  }

  const isProfilePublic = userProfile.public;
  const isInPrivateBeta = userProfile.privateBeta;

  const isAuthenticated = Boolean(authUser);

  const isAuthUserOwnProfile = authUser
    ? String(authUser.id) === String(userProfile.id)
    : false;

  const profileUsername = userProfile.username;
  const profileRelativeUrl = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';
  const profileAbsoluteUrl = profileRelativeUrl
    ? getBaseUrl() + profileRelativeUrl
    : '';

  const profileDisplayName = userProfile.name;
  const profileUserFirstName = getUsersFirstNameFromName(profileDisplayName);
  const profileUserLastName = getUsersLastNameFromName(profileDisplayName);

  const profileUserBio = userProfile.bio;

  const profileUserBanner = userProfile.banner;

  const profileUserProfession = (
    userProfile.profession && typeof userProfile.profession === 'string'
      ? userProfile.profession.split(',')
      : (userProfile.profession ?? [])
  ) as string[];

  const profileUserInterests = (
    userProfile.interests && typeof userProfile.interests === 'string'
      ? userProfile.interests.split(',')
      : (userProfile.interests ?? [])
  ) as string[];

  const userAvatar = userProfile.avatar || userProfile.image;
  const profileUserAvatar = userAvatar
    ? getNextImageUrlForManipulation(userAvatar)
    : '';

  return {
    authUser,
    userProfile,
    isProfilePublic,
    isInPrivateBeta,
    isAuthenticated,
    isAuthUserOwnProfile,
    profileUserFirstName,
    profileUserLastName,
    profileUserAvatar,
    profileUserBanner,
    profileUsername,
    profileUserBio,
    profileUserProfession,
    profileUserInterests,
    profileDisplayName,
    profileAbsoluteUrl,
    profileRelativeUrl,
  };
}
