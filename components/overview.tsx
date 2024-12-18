import { memo } from 'react';
import Link from 'next/link';
import { getUserProfilePermalink } from '@/features/experiences/utils/experience-utils';
import { useAppState } from '@/state/app-state';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { DiscoveryMasthead } from './discovery/discovery-title';
import { UserAvatar } from './user-avatar';

function OverviewAvatar({
  ping,
  className,
  containerClassName,
  noProfileLink = false,
}: {
  ping?: boolean;
  className?: string;
  containerClassName?: string;
  noProfileLink?: boolean;
}) {
  const appState = useAppState();
  const { userAvatar, userProfileUsername, userDisplayName } = appState;

  if (!userAvatar) return null;

  const userProfilePermalink =
    userProfileUsername && !noProfileLink
      ? getUserProfilePermalink(userProfileUsername)
      : '';

  const renderedAvatar = (
    <div
      className={cn(
        'relative',
        {
          // 'animate-pulse': ping,
          'before:animate-ping-slow': ping,
          "before:absolute before:inset-0 before:rounded-full before:border-2 before:content-['']":
            ping,
        },
        containerClassName
      )}
    >
      <UserAvatar
        src={userAvatar}
        alt={userDisplayName ?? 'User'}
        className={cn(
          'rounded-full border-4',
          {
            'animate-pulse': ping,
          },
          className
        )}
        sizeClassName="size-14 md:size-16"
      />
    </div>
  );

  return userProfilePermalink ? (
    <Link href={userProfilePermalink}>{renderedAvatar}</Link>
  ) : (
    renderedAvatar
  );
}

export const Overview = memo(
  ({
    children,
    avatarPing,
    avatarClassName,
    avatarNoProfileLink,
  }: {
    children?: React.ReactNode;
    avatarNoProfileLink?: boolean;
    avatarClassName?: string;
    avatarPing?: boolean;
  }) => {
    const { isReady, userAvatar, userDisplayName } = useAppState();

    if (!isReady) return null;

    return (
      <motion.div
        key="overview"
        className="mx-auto max-w-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex max-w-3xl flex-col items-center gap-12 rounded-xl py-14 text-center leading-relaxed">
          <DiscoveryMasthead />
          <OverviewAvatar
            ping={avatarPing}
            noProfileLink={avatarNoProfileLink}
            className={avatarClassName}
          />
          {children}
        </div>
      </motion.div>
    );
  }
);
