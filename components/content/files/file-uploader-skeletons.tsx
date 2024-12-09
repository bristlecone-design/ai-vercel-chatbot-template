import { cn } from '@/lib/utils';

import { Skeleton } from '../../ui/skeleton';

interface BaseProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
}

export type FileUploaderSkeletonProps = Omit<BaseProps, 'children'> & {
  withAnimation?: boolean;
};

/**
 * File Uploader Skeleton
 *
 * @note Used when uploading file(s)
 */
export function FileUploaderSkeleton({ className }: FileUploaderSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

/**
 * File Uploader Skeleton to freeze/pause a UI section layer
 */
export function FileUploaderSkeletonOverlay({
  className,
  withAnimation,
}: FileUploaderSkeletonProps) {
  return (
    <Skeleton
      className={cn(
        'absolute inset-0 size-full animate-none bg-secondary/50',
        {
          'animate-pulse': withAnimation,
        },
        className
      )}
    />
  );
}
