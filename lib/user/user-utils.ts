import type { User as UserDb } from '@/lib/db/schema';
import type { AppUser } from '@/types/next-auth';
import type { USER_PROFILE_MODEL, User } from '@/types/user';

export function deriveUsernameFromEmail(email: string) {
  return email.split('@')[0];
}

export function getUserInitialsFromName(name: string | undefined) {
  if (!name) return '';
  const nameParts = name.split(' ');
  return nameParts.reduce((acc, part) => {
    return acc + part[0];
  }, '');
}

export function getUsersFirstNameFromName(name: string | null | undefined) {
  if (!name) return '';
  return name.split(' ')[0];
}

export function getUsersLastNameFromName(name: string | null | undefined) {
  if (!name) return '';
  const nameParts = name.split(' ');
  return nameParts[nameParts.length - 1];
}

export type UserClientFriendly = USER_PROFILE_MODEL;

export function mapDbUserToClientFriendlyUser(
  user: User | USER_PROFILE_MODEL | UserDb,
): UserClientFriendly {
  return {
    id: user.id,
    url: user.url,
    urlSocial: user.urlSocial,
    urlPay: user.urlPay,
    bio: user.bio,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    image: user.image,
    banner: user.banner,
    company: user.company,
    interests: user.interests,
    organization: user.organization,
    username: user.username,
    location: user.location,
    public: user.public,
    waitlist: user.waitlist,
    privateBeta: user.privateBeta,
    profession: user.profession,
    role: user.role,
    active: user.active,
    onboarded: user.onboarded,
    logins: user.logins,
    blocked: user.blocked,
    allowed: user.allowed,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,

    // Following: user.Following,
    // FollowedBy: user.FollowedBy,
    followerCount: user.followerCount,
  };
}

export function mapAppUserToClientFriendlyUser(
  user: AppUser | User,
): UserClientFriendly {
  if (!user) {
    return user;
  }

  return {
    id: user.id,
    url: user.url,
    urlSocial: user.urlSocial,
    bio: user.bio,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    image: user.image,
    banner: user.banner,
    company: user.company,
    interests: user.interests,
    organization: user.organization,
    username: user.username,
    public: user.public,
    waitlist: user.waitlist,
    privateBeta: user.privateBeta,
    profession: user.profession,
    role: user.role,
    active: user.active,
    onboarded: user.onboarded,
    blocked: user.blocked,
    allowed: user.allowed,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export type PhotoAuthorClientFriendly = {
  id: USER_PROFILE_MODEL['id'];
  url: USER_PROFILE_MODEL['url'];
  urlSocial: USER_PROFILE_MODEL['urlSocial'];
  name: USER_PROFILE_MODEL['name'];
  bio: USER_PROFILE_MODEL['bio'];
  email: USER_PROFILE_MODEL['email'];
  public: USER_PROFILE_MODEL['public'];
  avatar: USER_PROFILE_MODEL['avatar'];
  profession: USER_PROFILE_MODEL['profession'];
  intereests: USER_PROFILE_MODEL['interests'];
  username: USER_PROFILE_MODEL['username'];
  // createdAt: User['createdAt'];
  // updatedAt: User['updatedAt'];
};

export function mapDbUserToClientFriendlyPhotoAuthor(
  user: USER_PROFILE_MODEL,
): PhotoAuthorClientFriendly {
  return {
    id: user.id,
    url: user.url,
    bio: user.bio,
    name: user.name,
    email: user.email,
    public: user.public,
    avatar: user.avatar,
    username: user.username,
    profession: user.profession,
    intereests: user.interests,
    urlSocial: user.urlSocial,
  };
}
