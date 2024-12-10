'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
// import { useTransitionRouter } from 'next-view-transitions';

import { DiscoveryMasthead } from '@/components/discovery/discovery-title';

export type DialogPromptNotOnBetaSplashScreenProps = {
  waitlistCount?: number;
  lightOverlay?: boolean;
  noCloseBtn?: boolean;
  openOnMount?: boolean;
  mastheadText?: React.ReactNode;
  mastheadByline?: React.ReactNode;
  handleOnClose?: (nextState: boolean) => void;
};

export function DialogPromptNotOnBetaSplashScreen({
  waitlistCount = 0,
  openOnMount = true,
  lightOverlay = false,
  noCloseBtn = false,
  mastheadByline,
  mastheadText,
  handleOnClose,
}: DialogPromptNotOnBetaSplashScreenProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(openOnMount);
  const pathname = usePathname();
  const isOnChallengesSection = pathname.startsWith('/prompts');

  const handleOnChange = (nextState: boolean) => {
    // Close dialog if noCloseBtn is false
    if (!noCloseBtn) {
      setIsOpen(nextState);

      if (nextState === false && typeof handleOnClose === 'function') {
        handleOnClose(nextState);
      }
    }
  };

  const ctaLabel = waitlistCount ? (
    <span>
      Join <strong>{waitlistCount}</strong> others
    </span>
  ) : (
    'Join the waitlist'
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOnChange}>
      <DialogContent
        className="max-w-2xl bg-background/95 p-8 sm:p-12"
        lightOverlay={lightOverlay}
        noCloseBtn={noCloseBtn}
      >
        <DiscoveryMasthead
          className="pb-12"
          titleProps={{
            className: 'smaller',
          }}
          bylineProps={{
            customText: (
              <span className="text-lg leading-relaxed sm:text-xl">
                You&apos;re set to join the public beta on Nevada Day, October
                25, 2024. Until then, feel free to{' '}
                <Link
                  href="/prompts"
                  className="link-primary decoration-2 underline-offset-4"
                >
                  share your experiences
                </Link>
                , and the Discover feature will be fully available at launch.
              </span>
            ),
          }}
          miscText={mastheadText}
        />
        <div className="flex flex-col gap-4 py-2">
          <div className="flex w-full flex-col-reverse items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/prompts"
              className={cn(
                buttonVariants({
                  variant: 'default',
                  size: 'default',
                  className: 'h-[unset] w-full sm:max-w-fit',
                })
              )}
            >
              Share NV Knowledge
            </Link>
            <Button
              variant="outline"
              onClick={() => handleOnChange(false)}
              className="h-[unset] w-full sm:max-w-fit"
            >
              Okay - thanks!
            </Button>
          </div>
        </div>
        <DialogFooter className="">{/* <AboutPlatform /> */}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
