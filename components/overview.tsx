import { memo } from 'react';
import Link from 'next/link';
import { getUserProfilePermalink } from '@/features/experiences/utils/experience-utils';
import { useAppState } from '@/state/app-state';
import { motion } from 'framer-motion';

import { DiscoveryMasthead } from './discovery/discovery-title';
import { UserAvatar } from './user-avatar';

function OverviewAvatar() {
  const appState = useAppState();
  const { userAvatar, userProfileUsername, userDisplayName } = appState;
  console.log('**** appState:', appState);

  if (!userAvatar) return null;

  const userProfilePermalink = userProfileUsername
    ? getUserProfilePermalink(userProfileUsername)
    : '';

  const renderedAvatar = (
    <UserAvatar
      src={userAvatar}
      alt={userDisplayName ?? 'User'}
      className="rounded-full border-4"
      sizeClassName="size-14 md:size-16"
    />
  );

  return userProfilePermalink ? (
    <Link href={userProfilePermalink}>{renderedAvatar}</Link>
  ) : (
    renderedAvatar
  );
}

export const Overview = memo(({ children }: { children?: React.ReactNode }) => {
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
      <div className="flex max-w-3xl flex-col items-center gap-8 rounded-xl p-6 text-center leading-relaxed">
        <DiscoveryMasthead />
        <OverviewAvatar />
        {children}
      </div>
    </motion.div>
  );
});
