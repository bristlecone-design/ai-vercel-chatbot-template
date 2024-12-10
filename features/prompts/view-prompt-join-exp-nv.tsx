'use client';

import React from 'react';
import { useAppState } from '@/state/app-state';

import { cn } from '@/lib/utils';
import { DialogDiscoverSplashScreen } from '@/components/discovery/dialog-discover-splash-screen';

export type ViewPromptJoinExpNvProps = {
  children?: React.ReactNode;
  onChallengeSectionCtaLabel?: React.ReactNode;
  waitlistCount?: number;
  className?: string;
  showDialog?: boolean;
};

export function ViewPromptJoinExpNv({
  children,
  className,
  waitlistCount,
  onChallengeSectionCtaLabel,
  showDialog = false,
}: ViewPromptJoinExpNvProps) {
  const { isAuthenticated } = useAppState();
  const [showJoinDialog, setShowJoinDialog] = React.useState(showDialog);
  // console.log(
  //   `**** isAuthenticated and showJoinDialog: ${isAuthenticated} ${showJoinDialog}`
  // );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      className={cn('absolute inset-0 size-full', className)}
      onClick={() => setShowJoinDialog(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setShowJoinDialog(true);
        }
      }}
    >
      {showJoinDialog && (
        <DialogDiscoverSplashScreen
          lightOverlay={false}
          waitlistCount={waitlistCount}
          openOnMount={showJoinDialog}
          onChallengeSectionCtaLabel={onChallengeSectionCtaLabel}
          cb={() => setShowJoinDialog(false)}
        />
      )}
      {children}
    </div>
  );
}
