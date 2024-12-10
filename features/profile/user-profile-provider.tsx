'use client';

import * as React from 'react';
import type { Session } from 'next-auth';

import { getUsersFirstNameFromName } from '@/lib/user/user-utils';

import {
  createUserProfileExperienceTabPermalink,
  getUserProfilePermalink,
} from '../experiences/utils/experience-utils';

import type { AppUser } from '@/types/next-auth';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserProfileContextType = {
  //-- User and Profile Info
  session?: Session;
  authUser?: AppUser;

  // Profile User
  userProfile: USER_PROFILE_MODEL;
  profileUserDisplayName?: string | null;
  profileUserFirstName: string | null;
  profileUserLastName?: string | null;
  profilePermalink: string;
  profileExperiencesPermalink: string;
  profileUsername: string;
  profileUserId: string;

  // Auth User
  isProfilePublic?: boolean | null;
  isInPrivateBeta?: boolean | null;
  isAuthenticated: boolean;
  isAuthUserOwnProfile: boolean;

  // Flags
  isProfileSearchOpen: boolean;

  //-- Handlers
  handleProfileSearchToggle: () => void;
  // TODO: Add more handlers as needed
};

export const UserProfileDefaultValues: UserProfileContextType = {
  // Profile User
  userProfile: {} as USER_PROFILE_MODEL,
  profileUserId: '',
  profileUserFirstName: '',
  profileUsername: '',
  profilePermalink: '',
  profileExperiencesPermalink: '',

  // Auth User
  authUser: {} as AppUser,
  isAuthenticated: false,
  isAuthUserOwnProfile: false,
  isProfilePublic: false,
  isInPrivateBeta: false,

  // Flags
  isProfileSearchOpen: false,

  // Handlers
  handleProfileSearchToggle: () => {},
  // TODO: Add more handlers as needed
};

export const UserProfileContext = React.createContext<UserProfileContextType>(
  UserProfileDefaultValues
);

export type UserProfileProviderProps = Pick<
  UserProfileContextType & {
    children: React.ReactNode;
  },
  | 'session'
  | 'authUser'
  | 'userProfile'
  | 'isProfilePublic'
  | 'isInPrivateBeta'
  | 'isAuthenticated'
  | 'isAuthUserOwnProfile'
  | 'children'
>;

export function UserProfileProvider({
  // session,
  authUser,
  userProfile,
  isProfilePublic,
  isInPrivateBeta,
  isAuthenticated,
  isAuthUserOwnProfile,
  children,
}: UserProfileProviderProps) {
  // const router = useRouter();
  // const pathname = usePathname();

  const profileUserId = userProfile.id;
  const profileUserDisplayName = userProfile.name;
  const profileUserFirstName = getUsersFirstNameFromName(userProfile.name);
  const profileUserLastName = null;

  const profileUsername = userProfile.username || '';
  const profilePermalink = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';

  const profileExperiencesPermalink = profilePermalink
    ? createUserProfileExperienceTabPermalink(profilePermalink)
    : '';

  // State
  const [isProfileSearchOpen, setProfileSearchOpen] = React.useState(false);

  // Handlers
  const handleProfileSearchToggle = () => {
    setProfileSearchOpen((prev) => !prev);
  };
  // TODO: Add more handlers as needed

  // Prepare the provider props
  const providerProps: UserProfileContextType = {
    // User + Profile Info
    // session,
    authUser,
    userProfile,

    // Profile User
    profileUserDisplayName,
    profileUserFirstName,
    profileUserLastName,
    profileUsername,
    profilePermalink,
    profileExperiencesPermalink,
    profileUserId,

    // Auth User
    isProfilePublic,
    isInPrivateBeta,
    isAuthenticated,
    isAuthUserOwnProfile,

    // Flags
    isProfileSearchOpen,

    // Handlers
    handleProfileSearchToggle,
  };

  return (
    <UserProfileContext.Provider value={providerProps}>
      {children}
    </UserProfileContext.Provider>
  );
}

/**
 * Custom hook to access the UserProfileContext
 */
export function useUserProfile(props?: Partial<UserProfileContextType>) {
  const context = React.useContext(UserProfileContext);

  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }

  return context;
}
