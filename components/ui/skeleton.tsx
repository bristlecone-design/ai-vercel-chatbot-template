import { cn } from '@/lib/utils';

export const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';

export const shimmerBorder =
  'relative isolate overflow-hidden shadow-xl before:border-t before:border-rose-100/10 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export interface BlockSkeletonProps {
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Skeleton any arbritary element size
 */
export function BlockSkeleton({
  as: Component = 'div',
  className,
}: BlockSkeletonProps) {
  return (
    <Component
      className={cn('size-full rounded bg-muted', shimmer, className)}
    />
  );
}

export interface ImageSkeletonProps {
  square?: boolean;
  full?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

function ImageSkeleton({
  as: Component = 'div',
  square = false,
  full = false,
  className,
}: ImageSkeletonProps) {
  const sizeClass = square ? 'h-24 w-24' : full ? 'w-full h-full' : 'h-24 w-32';
  return (
    <Component
      className={cn('rounded bg-muted', shimmer, sizeClass, className)}
    />
  );
}

export interface VideoSkeletonProps {
  square?: boolean;
  full?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

function VideoSkeleton({
  as: Component = 'div',
  square = false,
  full = false,
  className,
}: VideoSkeletonProps) {
  const sizeClass = square ? 'aspect-square' : full ? 'aspect-video' : '';
  return (
    <Component
      className={cn('w-full rounded bg-muted', shimmer, sizeClass, className)}
    />
  );
}

function AvatarSkeleton({
  as: Component = 'div',
  square = false,
  full = false,
  className,
}: ImageSkeletonProps) {
  return (
    <Component
      className={cn(
        'size-10 bg-muted',
        shimmer,
        {
          rounded: square,
          'rounded-full': full,
        },
        className
      )}
    />
  );
}

export type FormInputSkeletonProps = BlockSkeletonProps & {
  withButton?: boolean;
};

function FormInputSkeleton({
  as: Component = 'div',
  withButton = false,
  className,
}: FormInputSkeletonProps) {
  if (!withButton) {
    return (
      <Component
        className={cn('h-10 w-full rounded bg-muted', shimmer, className)}
      />
    );
  }

  return (
    <div className="flex grow items-center gap-2">
      <Component
        className={cn('h-10 w-full rounded bg-muted', shimmer, className)}
      />
      <div className="flex shrink-0 items-center justify-end">
        <BlockSkeleton className="size-10 rounded-lg" />
      </div>
    </div>
  );
}

export {
  AvatarSkeleton,
  FormInputSkeleton,
  ImageSkeleton,
  Skeleton,
  VideoSkeleton,
};
