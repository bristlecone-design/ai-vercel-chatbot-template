'use client';

import * as React from 'react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
// import { useTransitionRouter } from 'next-view-transitions';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

import { UserJoinLink } from '../auth/login/join-link';
import { LinkCta } from '../cta-link';
import { RefreshView } from '../refresh-view';
import { buttonVariants } from '../ui/button';
import { IconImages } from '../ui/icons';
import { DiscoveryScrollingItems } from './discovery-scroll-items';
import { DiscoveryMasthead } from './discovery-title';

const PATHS_TO_PREFETCH = ['/prompts/stories', '/prompts/stories/unr-150'];

export type DialogDiscoverSplashScreenProps = {
  waitlistCount?: number;
  lightOverlay?: boolean;
  noCloseBtn?: boolean;
  noRefreshBtn?: boolean;
  noContent?: boolean;
  noFooter?: boolean;
  openOnMount?: boolean;
  mastheadText?: React.ReactNode;
  mastheadByline?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  onChallengeSectionCtaUrl?: string;
  onChallengeSectionCtaLabel?: React.ReactNode;
  prefetchPaths?: string[];
  children?: React.ReactNode;
  cb?: (nextState: boolean) => void;
};

export function DialogDiscoverSplashScreen({
  waitlistCount = 0,
  openOnMount = true,
  lightOverlay = true,
  noCloseBtn = true,
  noRefreshBtn = true,
  noContent = false,
  noFooter = false,
  mastheadByline,
  mastheadText,
  children,
  prefetchPaths = PATHS_TO_PREFETCH,
  ctaLabel: ctaLabelProp,
  onChallengeSectionCtaUrl: onChallengeSectionCtaUrlProp,
  onChallengeSectionCtaLabel: onChallengeSectionCtaLabelProp,
  cb,
}: DialogDiscoverSplashScreenProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(openOnMount);
  const pathname = usePathname();

  const isOnChallengesSection = pathname.startsWith('/prompts');

  const [ctaClicked, setCtaClicked] = React.useState(false);

  const ctaLabel =
    waitlistCount && !ctaLabelProp ? (
      <span>
        Join <strong>{waitlistCount}</strong> others
      </span>
    ) : ctaLabelProp ? (
      ctaLabelProp
    ) : (
      'Join the waitlist'
    );

  const onCtaLinkClick = () => {
    setCtaClicked(true);
  };

  React.useEffect(() => {
    if (prefetchPaths) {
      for (const path of prefetchPaths) {
        router.prefetch(path);
      }
    }
  }, []);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextState) => {
        // Close dialog if noCloseBtn is false
        if (!noCloseBtn) {
          setIsOpen(nextState);
          typeof cb === 'function' && cb(nextState);
        }
      }}
    >
      <DialogContent
        className="max-w-2xl bg-background/95 p-8 sm:p-12 lg:max-w-3xl"
        lightOverlay={lightOverlay}
        noCloseBtn={noCloseBtn}
      >
        <DialogTitle asChild>
          <DiscoveryMasthead
            className="pb-12"
            titleProps={{
              className: 'smaller',
            }}
            bylineProps={{
              customText: mastheadByline,
            }}
            miscText={mastheadText}
          />
        </DialogTitle>
        <div className="flex flex-col gap-4 py-2">
          {!noContent && (
            <React.Fragment>
              <DiscoveryScrollingItems />
              <div className="flex flex-col gap-4">
                {!isOnChallengesSection && (
                  <UserJoinLink
                    variant="tertiary"
                    href="/signup"
                    label={ctaLabel}
                    onClick={onCtaLinkClick}
                    disabled={ctaClicked}
                  />
                )}
                {!isOnChallengesSection && (
                  <LinkCta
                    href="/prompts/stories/unr-150"
                    variant="secondary"
                    textClassName="justify-center"
                    onClick={onCtaLinkClick}
                    disabled={ctaClicked}
                  >
                    Contribute to 150 Years of UNR
                  </LinkCta>
                )}
                {!isOnChallengesSection && (
                  <LinkCta
                    href="/prompts/stories"
                    variant="outline"
                    textClassName="justify-center"
                    onClick={onCtaLinkClick}
                    disabled={ctaClicked}
                  >
                    Contribute to Other Story Series
                  </LinkCta>
                )}
                {isOnChallengesSection && (
                  <UserJoinLink
                    href="/signup"
                    className={cn(
                      buttonVariants({
                        variant: 'tertiary',
                      }),
                      'hover:no-underline'
                    )}
                    label={
                      onChallengeSectionCtaLabelProp || 'Join to Contribute'
                    }
                  />
                )}
              </div>
            </React.Fragment>
          )}
          {children}
        </div>
        <DialogFooter className="">{/* <AboutPlatform /> */}</DialogFooter>
        {!noRefreshBtn && (
          <div className="hidden w-full items-center justify-end gap-1.5 py-2 sm:flex">
            <IconImages
              aria-label="Refresh Background Image"
              className="text-foreground/60"
            />
            <RefreshView />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
