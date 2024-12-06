'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AboutPlatform } from '@/components/about/about-platform';

import { LoginEmailForm } from './login-form-email';

import { siteConfig } from '@/config/site-base';

export type DialogUserLoginProps = {
  title?: string;
  instructions?: string;
  redirectPath?: string;
};

export function DialogUserLogin({
  title = siteConfig.ui.login.title,
  instructions = siteConfig.ui.login.instructions,
  redirectPath,
}: DialogUserLoginProps) {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const urlRedirectPath = searchParams.get('callbackUrl');
  if (!redirectPath && urlRedirectPath) {
    redirectPath = urlRedirectPath;
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <Dialog open={isMounted}>
        <DialogContent
          className="bg-background/95 shadow-2xl"
          overlayProps={{
            className: 'backdrop-blur-[2px]',
          }}
          lightOverlay
          noCloseBtn
        >
          <DialogHeader className="space-y-2">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-base">
              {instructions}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <LoginEmailForm />
          </div>
          <DialogFooter className="w-full flex-row-reverse justify-between gap-6 sm:justify-center">
            <AboutPlatform btnTriggerVariant="secondary" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
