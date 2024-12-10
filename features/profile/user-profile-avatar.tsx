'use client';

import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/user-avatar';

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

export type UserProfileAvatarProps = Omit<
  UserProfileDragAndDropAvatarContainerProps,
  'children'
> & {
  src?: string | null;
  alt?: string;
  userId: string;
  className?: string;
  containerClassName?: string;
  initials?: string;
  handleOnClick?: () => void;
  handleOnRemoveFile?: () => void;
};

/**
 * Display the user's avatar on their profile and offer the ability to change it.
 */
export function UserProfileAvatar({
  alt,
  src,
  editable,
  className,
  disabled,
  initials,
  editCtaLabel,
  removeCtaLabel,
  containerClassName,
  editableClassName,
  editCtaClassName,
  removeCtaClassName,
  handleOnDropOfFiles,
  handleOnRemoveFile,
  handleOnClick,
}: UserProfileAvatarProps) {
  return (
    <UserProfileDragAndDropAvatarContainer
      editable={editable}
      disabled={disabled}
      editCtaLabel={editCtaLabel}
      removeCtaLabel={removeCtaLabel}
      editableClassName={editableClassName}
      editCtaClassName={editCtaClassName}
      removeCtaClassName={removeCtaClassName}
      handleOnClick={handleOnClick}
      handleOnRemoveFile={handleOnRemoveFile}
      handleOnDropOfFiles={handleOnDropOfFiles}
      className={cn('size-24 sm:rounded-full md:size-28', containerClassName)}
    >
      <UserAvatar
        src={src || ''}
        noShimmer={!src}
        disabled={disabled}
        initials={initials}
        alt={alt || 'User Avatar'}
        className={cn('', className)}
        fallbackClassName={cn('size-full text-xl')}
        containerClassName={cn(
          'size-24 md:size-28 sm:rounded-full bg-secondary'
        )}
      />
    </UserProfileDragAndDropAvatarContainer>
  );
}
