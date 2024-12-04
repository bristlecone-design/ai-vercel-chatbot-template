import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { shimmer } from '@/components/ui/skeleton';

export type UserAvatarProps = {
  src: string;
  alt?: string;
  className?: string;
  sizeClassName?: string;
  containerClassName?: string;
  fallbackClassName?: string;
  initials?: React.ReactNode;
  noShimmer?: boolean;
  disabled?: boolean;
};

export function UserAvatar({
  src,
  disabled,
  alt = 'Avatar',
  className = '',
  containerClassName = '',
  sizeClassName = 'size-7',
  fallbackClassName,
  initials = 'NV',
  noShimmer,
}: UserAvatarProps) {
  return (
    <Avatar className={cn('', containerClassName, sizeClassName)}>
      <AvatarImage
        src={src}
        alt={alt}
        aria-disabled={disabled}
        className={cn('rounded-full', className)}
      />
      <AvatarFallback
        className={cn(
          'rounded-full',
          sizeClassName,
          className,
          fallbackClassName,
          !noShimmer && shimmer
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
