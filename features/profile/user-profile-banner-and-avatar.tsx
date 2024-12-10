'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearPathCache, clearTagCache } from '@/actions/cache';
import { clearUserAvatar, clearUserBanner } from '@/actions/user';
import { useAppState } from '@/state/app-state';
import { toast } from 'sonner';

import { isVideoBlobDataUrl, isVideoFile } from '@/lib/media/media-utils';
import {
  uploadUserAvatarClient,
  uploadUserBannerClient,
} from '@/lib/storage/vercel-blob';
import { getUserInitialsFromName } from '@/lib/user/user-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';

import { UserProfileAvatar } from './user-profile-avatar';
import { UserProfileBanner } from './user-profile-banner';
import { UserProfileLinkCopiedDrawer } from './user-profile-link-copied-drawer';
import { useUserProfile } from './user-profile-provider';

import type { USER_PROFILE_MODEL } from '@/types/user';

const MAX_AVATAR_FILESIZE_IN_BYTES = 8 * 1024 * 1024;
const MAX_BANNER_FILESIZE_IN_BYTES = 15 * 1024 * 1024;
const MAX_BANNER_VIDEO_FILESIZE_IN_BYTES = 50 * 1024 * 1024;

export type UserProfileBannerAndAvatarProps = {
  userAvatar?: string;
  userBanner?: string;
  userUrl?: string | null;
  userId?: USER_PROFILE_MODEL['id'];
  className?: string;
  editable?: boolean;
  noBannerShimmer?: boolean;
  noBannerUserNameLabel?: boolean;
  numSharedAssets?: number;
  noAddyInByline?: boolean;
  profileAddy?: USER_PROFILE_MODEL['username'];
  profileAddyLabel?: React.ReactNode;
  userName?: USER_PROFILE_MODEL['name'];
  bannerUserNameLabel?: string;
  bannerUserNameLabelClassName?: string;
  maxAvatarFileSizeInBytes?: number;
  maxBannerFileSizeInBytes?: number;
  maxBannerVideoFileSizeInBytes?: number;
  children?: React.ReactNode;
};

export function UserProfileBannerAndAvatar({
  children,
  className,
  editable,
  profileAddyLabel,
  noBannerUserNameLabel = false,
  noBannerShimmer = false,
  noAddyInByline = false,
  numSharedAssets = 0,
  bannerUserNameLabel,
  bannerUserNameLabelClassName,
  maxAvatarFileSizeInBytes = MAX_AVATAR_FILESIZE_IN_BYTES,
  maxBannerFileSizeInBytes = MAX_BANNER_FILESIZE_IN_BYTES,
  maxBannerVideoFileSizeInBytes = MAX_BANNER_VIDEO_FILESIZE_IN_BYTES,
}: UserProfileBannerAndAvatarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const { handleUpdatingAuthUser } = useAppState();

  const { userProfile, profileUserDisplayName, profilePermalink } =
    useUserProfile();

  const {
    avatar: profileAvatar,
    banner: profileBanner,
    id: profileUserId,
    username: profileUsername,
  } = userProfile;

  const profileExperiencesPermalink = profilePermalink
    ? `${profilePermalink}/experiences`
    : '';

  const [isUpdating, setIsUpdating] = React.useState(false);

  const initialUserAvatar = profileAvatar || '';
  const [userAvatar, setUserAvatar] = React.useState<string | null>(
    initialUserAvatar
  );

  const initialUserBanner = profileBanner || '';
  const [userBanner, setUserBanner] = React.useState<string | null>(
    initialUserBanner
  );

  const [updatedAvatarFile, setUpdatedAvatarFile] = React.useState<File | null>(
    null
  );
  const [updatedBannerFile, setUpdatedBannerFile] = React.useState<File | null>(
    null
  );

  const usernameToUse = profileUsername || '';

  const isAvatarUpdated = userAvatar !== initialUserAvatar;
  const isBannerUpdated = userBanner !== initialUserBanner;

  const bothLocalImagesUpdated = isAvatarUpdated && isBannerUpdated;
  const showUpdatedSection = isAvatarUpdated || isBannerUpdated;

  // Update the user's avatar in state if it changes
  // React.useEffect(() => {
  //   if (userAvatarProp && userAvatarProp !== userAvatar) {
  //     setUserAvatar(userAvatarProp);
  //     setUpdatedAvatarFile(null);
  //   }
  // }, [userAvatarProp]);

  // // Update the user's banner in state if it changes
  // React.useEffect(() => {
  //   if (userBannerProp && userBannerProp !== userBanner) {
  //     setUserBanner(userBannerProp);
  //     setUpdatedBannerFile(null);
  //   }
  // }, [userBannerProp]);

  // Handle clear cache
  const handleClearCache = () => {
    if (profileUserId) {
      clearTagCache(profileUserId);
    }

    if (usernameToUse) {
      clearTagCache(usernameToUse);
    }

    if (pathname) {
      clearPathCache(pathname);
    }
  };

  // Handle updating the user's profile in the app state
  const handleUpdatingUserProfile = async (
    nextUserProfile: USER_PROFILE_MODEL = userProfile
  ) => {
    if (!nextUserProfile) {
      return;
    }

    // Update the user's profile in the app state
    handleUpdatingAuthUser(nextUserProfile, true);

    // Clear the cache
    handleClearCache();
  };

  // Handle clicking the avatar input
  const handleAvatarInputClick = () => {
    avatarInputRef.current?.click();
  };

  // Handle removing the avatar file
  const handleRemoveAvatarFile = () => {
    setUserAvatar(null);
    setUpdatedAvatarFile(null);
  };

  // Handle drop of files for the avatar
  const handleAvatarOnDropOfFiles = async (files: FileList | File[]) => {
    // console.log(
    //   `**** handleOnDropOfFiles invoked in UserProfileBannerAndAvatar`,
    //   files
    // );
    if (!files.length) {
      return;
    }

    const file = files[0];
    // Verify file size is less than X MB
    const fileSizeInMb = file.size / (1024 * 1024);
    const maxFileSizeInMb = maxAvatarFileSizeInBytes / (1024 * 1024);
    // console.log(`**** attached avatar fileSizeInMb`, {
    //   fileSizeInMb,
    //   source: file.size,
    //   maxAllowed: maxAvatarFileSizeInBytes,
    // });
    if (file.size > maxAvatarFileSizeInBytes) {
      toast.error(
        `Your profile avatar's file size must be less than ${maxFileSizeInMb}MB. Your file is ${fileSizeInMb.toFixed(2)}MB.`
      );
      return;
    }

    // Save the file to the state
    setUpdatedAvatarFile(file);

    // Update the user's avatar in the UI
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle clicking the banner input
  const handleBannerInputClick = () => {
    bannerInputRef.current?.click();
  };

  // Handle removing the banner file
  const handleRemoveBannerFile = () => {
    setUserBanner(null);
    setUpdatedBannerFile(null);
  };

  // Handle drop of files for the banner
  const handleBannerOnDropOfFiles = (files: FileList | File[]) => {
    if (files.length === 0) {
      return;
    }

    const file = files[0];
    const isFileAVideo = isVideoFile(file);
    // Verify file size is less than X MB
    const fileSizeInMb = file.size / (1024 * 1024);
    const maxFileSizeInBytesToUse = isFileAVideo
      ? maxBannerVideoFileSizeInBytes
      : maxBannerFileSizeInBytes;
    const maxFileSizeInMb = maxFileSizeInBytesToUse / (1024 * 1024);

    if (file.size > maxFileSizeInBytesToUse) {
      toast.error(
        `Your banner's file size must be less than ${maxFileSizeInMb}MB. Your file is ${fileSizeInMb.toFixed(2)}MB.`
      );
      return;
    }

    // Save the file to the state
    setUpdatedBannerFile(file);

    // Update the user's avatar in the UI
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserBanner(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Reset the changes
  const handleResettingChanges = () => {
    // Clear avatar changes
    setUpdatedAvatarFile(null);
    setUpdatedBannerFile(null);
    setUserAvatar(initialUserAvatar);
    setUserBanner(initialUserBanner);
  };

  // Save changes to the user's profile
  const handleSavingUpdatedUserImageFiles = async () => {
    // Process the file and save it to the user's profile
    // Notify the user that the changes are being saved
    setIsUpdating(true);

    let updatedAnAsset = false;

    // First, update the avatar
    let updatedAvatarSaved = false;

    if (isAvatarUpdated) {
      // Account for updated file
      if (updatedAvatarFile) {
        const avatarUploadResult = await uploadUserAvatarClient(
          updatedAvatarFile,
          profileUserId,
          updatedAvatarFile.name,
          undefined, // folder
          undefined, // multipart
          undefined // clientPayload
        );

        updatedAvatarSaved = Boolean(avatarUploadResult.url);
      } else {
        // User wants to remove their avatar
        const avatarUploadResult = await clearUserAvatar(profileUserId);
        updatedAvatarSaved = Boolean(avatarUploadResult);
      }

      if (updatedAvatarSaved) {
        toast.success('Your avatar has been updated!');
        updatedAnAsset = true;
      } else {
        toast.error('There was an issue updating your avatar.');
      }
      setUpdatedAvatarFile(null);
    }

    // Next, update the banner
    let updatedBannerSaved = false;
    if (isBannerUpdated) {
      // Account for updated file
      if (updatedBannerFile) {
        const bannerResult = await uploadUserBannerClient(
          updatedBannerFile,
          profileUserId,
          updatedBannerFile.name,
          undefined, // folder
          undefined, // multipart
          undefined // clientPayload
        );

        updatedBannerSaved = Boolean(bannerResult.url);
      } else {
        // User wants to remove their banner
        const bannerResult = await clearUserBanner(profileUserId);
        updatedBannerSaved = Boolean(bannerResult);
      }

      if (updatedBannerSaved) {
        toast.success('Your banner has been updated!');
        updatedAnAsset = true;
      } else {
        toast.error('There was an issue updating your banner.');
      }
      setUpdatedBannerFile(null);
    }

    if (updatedAnAsset) {
      const updatedUserProfile = {
        ...userProfile,
        avatar: updatedAvatarSaved ? userAvatar : userProfile.avatar,
        banner: updatedBannerSaved ? userBanner : userProfile.banner,
      };
      handleUpdatingUserProfile(updatedUserProfile);
      router.refresh();
    }

    // End the updating state
    setIsUpdating(false);
  };

  const isBannerVideoFile = updatedBannerFile
    ? isVideoFile(updatedBannerFile)
    : userBanner
      ? isVideoBlobDataUrl(userBanner)
      : false;
  const bannerFileType = updatedBannerFile ? updatedBannerFile.type : undefined;

  return (
    <UserProfileBanner
      url={userBanner}
      editable={editable}
      // Has the user made changes to the banner?
      noShimmer={noBannerShimmer || userBanner !== initialUserBanner}
      isVideoFile={isBannerVideoFile}
      fileType={bannerFileType}
      handleOnClick={handleBannerInputClick}
      handleOnDropOfFiles={handleBannerOnDropOfFiles}
      handleOnRemoveFile={userBanner ? handleRemoveBannerFile : undefined}
      className={cn(
        'border-1 relative h-48 w-full rounded-none bg-muted sm:rounded-md md:h-56',
        {
          'opacity-60': isUpdating,
        },
        className
      )}
      disabled={isUpdating}
    >
      {children}
      <UserProfileAvatar
        // disabled={true}
        editable={editable}
        userId={profileUserId}
        src={userAvatar}
        initials={
          profileUserDisplayName
            ? getUserInitialsFromName(profileUserDisplayName)
            : ''
        }
        className={cn('border-tertiary border-4', {
          'opacity-60': isUpdating,
        })}
        containerClassName="absolute -bottom-2.5 md:-bottom-8 left-4 md:left-8 z-10"
        editableClassName="inset-0"
        editCtaClassName="hidden"
        removeCtaClassName="hidden"
        handleOnClick={handleAvatarInputClick}
        handleOnDropOfFiles={handleAvatarOnDropOfFiles}
        handleOnRemoveFile={userAvatar ? handleRemoveAvatarFile : undefined}
      />

      {(profileUserDisplayName || showUpdatedSection) && (
        <div className="absolute bottom-0 right-0 z-0 flex w-full flex-col justify-end gap-2 p-4 align-bottom backdrop-blur-[1.5px]">
          {(profileUserDisplayName || bannerUserNameLabel) && (
            <div className="flex flex-col gap-1">
              {!noBannerUserNameLabel && (
                <h2
                  className={cn(
                    'text-right text-2xl font-semibold leading-none text-foreground/90 drop-shadow-md',
                    bannerUserNameLabelClassName
                  )}
                >
                  {profileExperiencesPermalink && (
                    <Link
                      href={profileExperiencesPermalink}
                      className="no-underline hover:no-underline"
                    >
                      {bannerUserNameLabel || profileUserDisplayName}
                    </Link>
                  )}
                  {!profileExperiencesPermalink &&
                    (bannerUserNameLabel || profileUserDisplayName) &&
                    (bannerUserNameLabel || profileUserDisplayName)}
                </h2>
              )}
              {(profileAddyLabel || usernameToUse) && (
                <p className="flex items-center justify-end gap-2 text-right text-base font-semibold leading-none text-foreground/80 drop-shadow-md">
                  {profileAddyLabel && <span>{profileAddyLabel}</span>}
                  {!noAddyInByline && !profileAddyLabel && usernameToUse && (
                    <span>@{usernameToUse}</span>
                  )}
                  <UserProfileLinkCopiedDrawer />
                </p>
              )}
            </div>
          )}
          {showUpdatedSection && (
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={isUpdating}
                className="gap-1.5 text-sm"
                onClick={handleResettingChanges}
              >
                Reset
              </Button>
              <Button
                size="xs"
                disabled={isUpdating}
                className="gap-1.5 text-sm"
                onClick={handleSavingUpdatedUserImageFiles}
              >
                {isUpdating && <IconSpinner />}
                {`Save Updated ${bothLocalImagesUpdated ? 'Images' : isAvatarUpdated ? 'Avatar' : 'Banner'}`}
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Form with two hidden input fields for banner and avatar */}
      <form className="hidden">
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/jpeg, image/png, image/webp, image/gif, image/jpg"
          onChange={(e) => handleAvatarOnDropOfFiles(e.target.files!)}
          ref={avatarInputRef}
        />
        <input
          type="file"
          id="banner"
          name="banner"
          accept="image/jpeg, image/png, image/webp, image/gif, image/jpg, video/mp4, video/mov, video/quicktime"
          onChange={(e) => handleBannerOnDropOfFiles(e.target.files!)}
          ref={bannerInputRef}
        />
      </form>
    </UserProfileBanner>
  );
}
