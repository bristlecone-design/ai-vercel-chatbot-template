'use client';

import { cn } from '@/lib/utils';
import { UserBanner } from '@/components/user-banner';

import {
  UserProfileDragAndDropAvatarContainer,
  type UserProfileDragAndDropAvatarContainerProps,
} from './user-profile-drag-and-drop';

// interface BaseProps {
//   as?: keyof JSX.IntrinsicElements;
//   className?: string;
//   children: React.ReactNode;
//   disabled?: boolean;
// }

export type UserProfileBannerProps = Omit<
  UserProfileDragAndDropAvatarContainerProps,
  'children'
> & {
  url: string | null;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  noShimmer?: boolean;
  isVideoFile?: boolean;
  fileType?: string;
  handleOnClick?: () => void;
  handleOnRemoveFile?: () => void;
};

/**
 * Display the user's banner on their profile and offer the ability to change it.
 */
export function UserProfileBanner({
  url,
  fileType,
  isVideoFile,
  noShimmer,
  editable,
  children,
  className,
  disabled,
  editCtaLabel,
  removeCtaLabel,
  containerClassName,
  editableClassName,
  editCtaClassName,
  removeCtaClassName,
  handleOnDropOfFiles,
  handleOnRemoveFile,
  handleOnClick,
}: UserProfileBannerProps) {
  return (
    <UserProfileDragAndDropAvatarContainer
      disabled={disabled}
      editable={editable}
      editCtaLabel={cn('Banner', editCtaLabel)}
      removeCtaLabel={cn('Banner', removeCtaLabel)}
      editableClassName={editableClassName}
      editCtaClassName={editCtaClassName}
      removeCtaClassName={cn('hidden', removeCtaClassName)}
      handleOnClick={handleOnClick}
      handleOnRemoveFile={handleOnRemoveFile}
      handleOnDropOfFiles={handleOnDropOfFiles}
      className={cn('rounded-md', containerClassName)}
    >
      <UserBanner
        key={`user-banner-${url}`}
        url={url || ''}
        noShimmer={noShimmer}
        isVideoFile={isVideoFile}
        fileType={fileType}
        className={className}
      />
      {children}
    </UserProfileDragAndDropAvatarContainer>
  );
}
