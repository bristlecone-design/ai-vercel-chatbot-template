'use client';

import type { Session } from 'next-auth';
import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useEffect,
} from 'react';

import type { AnimationConfig } from '@/components/animations/animated-items';

import type { AppStateProviderProps } from './app-state-provider';

import type { UserAppGeo, UserAppGeoCoordinates } from '@/types/geo';
import type { USER_PROFILE_MODEL } from '@/types/user';
import type { signIn } from 'next-auth/react';

export type ClearUserProfileCacheType = 'id' | 'username';

export const DEFAULT_USER_PROFILE_STATE = {
  id: '',
  url: '',
  bio: '',
  name: '',
  role: 'user',
  email: '',
  location: '',
  username: '',
  urlPay: '',
  organization: '',
  profession: '',
  followerCount: 0,
  onboarded: false,
  waitlist: false,
  allowed: false,
  active: false,
  logins: 0,
  company: '',
  interests: [],
  avatar: '',
  image: '',
  banner: '',
  blocked: false,
  privateBeta: false,
  public: false,
  urlSocial: '',
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as USER_PROFILE_MODEL;

export interface AppStateContext {
  isReady: boolean;

  // CORE
  userSession?: Session['user'];
  userId: string;

  // Geo
  userLocation: UserAppGeo['location'];
  // userCountry: UserAppGeo['country'];
  // userRegion: UserAppGeo['region'];
  userLatitude: UserAppGeoCoordinates['latitude'];
  userLongitude: UserAppGeoCoordinates['longitude'];
  isPreciseLocation: boolean;

  // Auth User
  userProfile?: USER_PROFILE_MODEL;
  userProfileUsername: string;
  userDisplayName?: string | null;
  userFirstName: string | null;
  userLastName?: string | null;
  userAvatar: string;
  userProfileBio: string;
  userProfileEmail: string;
  userProfileProfession: string;
  userProfileInterests: string[];
  userProfileLocation: string;
  userProfilePermalink: string;
  userProfileLoading?: boolean;

  // Auth User Flags
  isUserAllowed?: boolean;
  isProfilePublic?: boolean;
  isInPrivateBeta?: boolean | null;
  isAuthenticated: boolean;
  // isAuthUserOwnProfile: boolean;

  // Core Handlers

  // User Geo
  // Retrieves the loaded user geo data (for convenience)
  handleGettingUserGeo: () => UserAppGeo;

  // User Data
  handleGettingUserProfile: () => USER_PROFILE_MODEL | undefined;
  handleRefreshingUserProfile: (uid?: string) => void;
  handleUpdatingAuthUser: (
    user: USER_PROFILE_MODEL,
    clearCache?: boolean,
  ) => void;
  handleClearingCache: (type: ClearUserProfileCacheType) => void;
  handleClearingCacheById: (userId?: string) => void;
  handleClearingCacheByUsername: (username?: string) => void;

  // Navigation and Auth
  handleNavigateToUserProfile: (username?: string) => void;
  handleSigningOut: (redirectTo?: string) => Promise<boolean>;
  handleSigningIn: (...args: Parameters<typeof signIn>) => void;

  // User Email
  userEmail?: string;
  setUserEmail?: Dispatch<SetStateAction<string | undefined>>;

  // MISC
  currentPathname?: string;
  previousPathname?: string;
  hasLoaded?: boolean;
  setHasLoaded?: Dispatch<SetStateAction<boolean>>;
  swrTimestamp?: number;
  invalidateSwr?: () => void;
  nextPhotoAnimation?: AnimationConfig;
  setNextPhotoAnimation?: Dispatch<SetStateAction<AnimationConfig | undefined>>;
  clearNextPhotoAnimation?: () => void;
  shouldRespondToKeyboardCommands?: boolean;
  setShouldRespondToKeyboardCommands?: Dispatch<SetStateAction<boolean>>;
  isCommandKOpen?: boolean;
  setIsCommandKOpen?: Dispatch<SetStateAction<boolean>>;

  adminUpdateTimes?: Date[];
  registerAdminUpdate?: () => void;
  hiddenPhotosCount?: number;
  // DEBUG
  arePhotosMatted?: boolean;
  setArePhotosMatted?: Dispatch<SetStateAction<boolean>>;
  shouldDebugImageFallbacks?: boolean;
  setShouldDebugImageFallbacks?: Dispatch<SetStateAction<boolean>>;
  shouldShowBaselineGrid?: boolean;
  setShouldShowBaselineGrid?: Dispatch<SetStateAction<boolean>>;
}

export const DEFAULT_APP_STATE: AppStateContext = {
  isReady: false,

  // User Session
  userSession: undefined,
  userId: '',

  // Geo
  userLocation: '',
  // userCountry: '',
  // userRegion: '',
  userLatitude: '',
  userLongitude: '',
  isPreciseLocation: false,

  // Auth User
  userProfile: DEFAULT_USER_PROFILE_STATE,
  userProfileUsername: '',
  userDisplayName: '',
  userFirstName: '',
  userLastName: '',
  userAvatar: '',
  userProfileBio: '',
  userProfileEmail: '',
  userProfileInterests: [],
  userProfileLocation: '',
  userProfileProfession: '',
  userProfilePermalink: '',
  userProfileLoading: false,

  isUserAllowed: false,
  isAuthenticated: false,
  isProfilePublic: false,
  isInPrivateBeta: false,

  // Core Handlers

  // User Geo
  handleGettingUserGeo: () => ({}) as UserAppGeo,

  // User Data
  handleGettingUserProfile: () => DEFAULT_USER_PROFILE_STATE,
  handleRefreshingUserProfile: () => {},
  handleUpdatingAuthUser: () => {},
  handleClearingCacheById: () => {},
  handleClearingCacheByUsername: () => {},
  handleClearingCache: () => {},

  // Navigation and Auth
  handleNavigateToUserProfile: () => {},
  handleSigningOut: () => Promise.resolve(false),
  handleSigningIn: () => {},

  // Other required values as defined...
};

export const AppStateContext =
  createContext<AppStateContext>(DEFAULT_APP_STATE);

export type useAppStateProps = Pick<AppStateProviderProps, 'userProfile'>;

export const useAppState = (props?: useAppStateProps) => {
  const context = useContext(AppStateContext);

  if (context === undefined) {
    throw new Error('useAppState must be used within a AppStateProvider');
  }

  const { userProfile } = props || {};

  // Update the auth user if it exists on mount
  useEffect(() => {
    if (userProfile) {
      context.handleUpdatingAuthUser(userProfile);
    }
  }, []);

  return context;
};
