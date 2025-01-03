import React from 'react';
import { clearTagCache } from '@/actions/cache';
import { useIntersectionObserver } from 'usehooks-ts';

import { nFormatter } from '@/lib/datesAndTimes';
import { updateExperienceViewCount } from '@/lib/db/queries/experiences-updates';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { IconEyeOpen } from '@/components/ui/icons';

export type SingleExperienceViewCountProps = {
  expId: string;
  viewCount?: number | null;
  noTriggerIncrement?: boolean;
  className?: string;
  btnClassName?: string;
  triggerClassName?: string;
};

type ViewCountBtnRef =
  | React.RefObject<HTMLButtonElement>
  | ((node?: Element | null) => void);

export type SingleExperienceViewCountBtnProps = ButtonProps & {
  ref: ViewCountBtnRef;
  disabled?: boolean;
  className?: string;
  count?: number | null;
};

export function SingleExperienceViewButton({
  ref,
  count,
  disabled,
  className,
  variant = 'ghost',
  size = 'off',
}: SingleExperienceViewCountBtnProps) {
  if (!count) {
    return null;
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        'group/post-icon rounded-full p-2 hover:bg-accent/80',
        'brightness-75 hover:brightness-100',
        'gap-1.5',
        className
      )}
    >
      <IconEyeOpen
        className={cn(
          'size-5 sm:size-5',
          'transition duration-150 group-hover/post-icon:scale-105 group-hover/post-icon:brightness-100'
        )}
      />
      {count && <span className="text-sm">{nFormatter(count)}</span>}
    </Button>
  );
}

export function SingleExperienceViewCount({
  expId,
  viewCount,
  btnClassName,
  triggerClassName,
  noTriggerIncrement,
}: SingleExperienceViewCountProps) {
  return (
    <HoverCard>
      <HoverCardTrigger className={triggerClassName}>
        <SingleExperienceViewCountBtn
          expId={expId}
          viewCount={viewCount}
          className={btnClassName}
        />
      </HoverCardTrigger>
      <HoverCardContent align="center" side="top">
        {viewCount && (
          <div className="flex w-full items-center justify-between gap-1.5 text-sm">
            <span className="font-bold">Experience Views:</span>
            <Badge variant="outline" className="">
              {nFormatter(viewCount)}
            </Badge>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export function SingleExperienceViewCountBtn({
  expId,
  viewCount,
  className,
  disabled,
  noTriggerIncrement = false,
  intersectingThreshold = 0.3,
  //   onClick,
}: SingleExperienceViewCountProps & {
  disabled?: boolean;
  intersectingThreshold?: number;
}) {
  const { isIntersecting, ref: intersectionRef } = useIntersectionObserver({
    threshold: intersectingThreshold,
  });

  const [mounted, setMounted] = React.useState(false);
  const [count, setCount] = React.useState(viewCount || 0);
  const [incrementing, setIncrementing] = React.useState(false);
  const [incremented, setIncremented] = React.useState(false);

  const isDisabled = disabled || incrementing;

  React.useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, []);

  // Increment count
  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    if (incremented) {
      return;
    }

    if (incrementing) {
      return;
    }

    // Proceed to increment
    setCount((prev) => prev + 1); // Optimistic update

    // Update count in DB
    setIncrementing(true);
    updateExperienceViewCount(expId, 1)
      .then((record) => {
        if (typeof record === 'object' && record.views) {
          const updatedViewCount = record.views;
          if (updatedViewCount !== count && updatedViewCount > count) {
            setCount(record.views);
            clearTagCache(expId);
          }
        }
      })
      .finally(() => {
        setIncrementing(false);
        setIncremented(true);
      })
      .catch((error) => {
        console.error('Error incrementing view count:', error);
        setIncrementing(false);
      });
  }, [mounted, incremented, incrementing]);

  // Nothing to show if no count and not requested to incrementing
  if (!count && noTriggerIncrement) {
    return null;
  }

  return (
    <SingleExperienceViewButton
      ref={intersectionRef}
      count={count}
      disabled={isDisabled}
      className={className}
    />
  );
}
