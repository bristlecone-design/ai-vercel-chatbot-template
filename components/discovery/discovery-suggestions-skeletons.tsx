'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { BlockSkeleton, shimmer, Skeleton } from '@/components/ui/skeleton';

export function DiscoveryUserSuggestionSkeleton({
  className,
  titleClassName,
  actionClassName,
}: {
  className?: string;
  titleClassName?: string;
  actionClassName?: string;
}) {
  return (
    <motion.div
      className={cn(
        'flex flex-col gap-2 rounded-lg border bg-muted/40 p-2.5',
        shimmer,
        'before:animate-[shimmer_4.5s_infinite] before:via-white/5',
        className
      )}
      variants={{
        initial: {
          y: 20,
          opacity: 0,
          scale: 0.9,
        },
        animate: {
          y: 0,
          opacity: 1,
          scale: [0.25, 1.25, 1],
        },
        exit: {
          y: 0,
          opacity: 0.5,
          scale: 1,
        },
      }}
      initial={'initial'}
      animate={'animate'}
      exit={'exit'}
      transition={{
        duration: 0.25,
        ease: 'easeIn',
      }}
    >
      <BlockSkeleton className={cn('h-5 w-4/5', titleClassName)} />
      <BlockSkeleton className={cn('h-4 w-3/4', actionClassName)} />
    </motion.div>
  );
}

export type DiscoveryUserSuggestionsSkeletonsSectionProps = {
  numSuggestions?: number;
  noHeading?: boolean;
};

export function DiscoveryUserSuggestionsSkeletonsSection({
  numSuggestions = 4,
  noHeading = false,
}: DiscoveryUserSuggestionsSkeletonsSectionProps) {
  if (!numSuggestions || numSuggestions < 1) return null;

  return (
    <div className="relative grid w-full grid-cols-1 gap-4 py-5">
      <div className="grid grid-cols-1 gap-1.5">
        {!noHeading && (
          <h2>
            <Skeleton className="h-5 w-1/2" />
          </h2>
        )}
        <div className="grid w-full grid-cols-1 items-start gap-3 prose-h3:text-sm prose-h3:font-semibold prose-p:text-sm md:grid-cols-2">
          {[...Array(numSuggestions)].map((_, idx) => {
            return (
              <DiscoveryUserSuggestionSkeleton
                key={`recommendation-skeleton-${idx}`}
                titleClassName={cn({
                  'w-4/5': idx % 2 === 0, // For indexes that are even
                  'w-3/4': idx % 2 !== 0, // For indexes that are odd
                })}
                actionClassName={cn({
                  'w-3/4': idx % 2 === 0, // For indexes that are even
                  'w-1/2': idx % 2 !== 0, // For indexes that are odd
                })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
