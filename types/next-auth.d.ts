import type { User as BaseAuthUser } from 'next-auth';

import 'next-auth/jwt';

import type { USER_PROFILE_MODEL } from './user';

type DOMAIN_ALLOWED = boolean;
type EMAIL_ALLOWED = boolean;

export type UserActive = boolean;
export type UserAllowed = boolean;
export type UserBlocked = boolean;
export type UserEnabled = boolean | undefined;
export type UserEmail = string;
export type UserImage = string;
export type UserName = string;
export type UserPassword = string;
export type UserSalt = string;
export type UserWaitlist = boolean;
export type UserDomainAllowed = boolean;
export type UserEmailExcluded = boolean;
export type UserMeta = Record<string, any>;

export interface EmailFormUser
  extends Pick<USER_PROFILE_MODEL, 'id' | 'email' | 'password' | 'salt'> {
  // Add other properties here as needed
}

// Alias for the user profile model. Also used to extend the auth user object.
export interface AppUser
  extends Pick<
    USER_PROFILE_MODEL,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'active'
    | 'image'
    | 'avatar'
    | 'name'
    | 'email'
    | 'username'
    | 'organization'
    | 'company'
    | 'banner'
    | 'public'
    | 'bio'
    | 'role'
    | 'url'
    | 'urlSocial'
    | 'profession'
    | 'interests'
    | 'location'
    | 'waitlist'
    | 'privateBeta'
    | 'onboarded'
    // | 'password'
    // | 'salt'
    // | 'onboarded'
    | 'allowed'
    | 'blocked'
    | 'active'
    | 'enabled'
    | 'waitlist'
    // | 'meta'
  > {
  // Add other properties here as needed
}

export interface AuthResult {
  type: string;
  message: string;
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: AppUser['id'];
    active?: UserActive;
  }
}

declare module 'next-auth' {
  /**
   * Leveraged by session callback's user object (AdapterUser extends User)
   */
  export interface User extends BaseAuthUser, AppUser {
    userId?: AppUser['id'];
    // username?: UserName;
    // avatar?: UserImage;
    // blocked?: UserBlocked;
    // domainAllowed?: UserDomainAllowed;
    // emailExcluded?: UserEmailExcluded;
  }

  export interface Session {
    id: AppUser['id'];
    user: AppUser;
    image?: UserImage;
    allowed?: UserAllowed;
    blocked?: UserBlocked;
    isActive: UserActive;
    domainAllowed?: UserDomainAllowed;
    emailExcluded?: UserEmailExcluded;
  }
}
