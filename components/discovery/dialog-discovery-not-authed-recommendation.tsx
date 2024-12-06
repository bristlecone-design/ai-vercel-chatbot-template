'use client';

import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AboutPlatform } from '@/components/about/about-platform';

import { SignInButtonGitHub } from '../auth/login/github-signin-btn';
import { SignInButtonGoogle } from '../auth/login/google-signin-btn';
import { RegisterEmailForm } from '../auth/register/register-form-email';
import { Separator } from '../ui/separator';

/**
 * When a user is not authenticated and invokes a recommendation prompt, this dialog is shown to prompt the user to sign up/log-in
 */

export type DialogNotAuthedRecommendationProps = {
  prompt: string;
  redirectPath?: string;
};

export function DialogNotAuthedRecommendation({
  prompt,
  redirectPath = '/',
}: DialogNotAuthedRecommendationProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [pathToRedirect, setPathToRedirect] = useState<string>(redirectPath);

  useEffect(() => {
    setIsMounted(true);
    setPathToRedirect(window.location.pathname);
  }, []);

  return (
    <>
      <Dialog
        open={isMounted}
        onOpenChange={() => {
          setIsMounted(false);
        }}
      >
        <DialogContent className="">
          <DialogHeader className="space-y-2">
            <DialogTitle>Join the Experience</DialogTitle>
            <DialogDescription className="text-base">
              Sign up or log in to interact with the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex w-full flex-col items-stretch gap-2">
              <div className="flex flex-col items-stretch justify-center gap-4 py-4 sm:flex-row sm:items-center">
                {/* <LoginButtonGoogle variant="default" /> */}
                <SignInButtonGoogle
                  variant="default"
                  text="Google"
                  callbackUrl={pathToRedirect}
                />
                <SignInButtonGitHub
                  variant="default"
                  text="GitHub"
                  callbackUrl={pathToRedirect}
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Separator className="max-w-[15%]" />
              <span>OR</span>
              <Separator className="max-w-[15%]" />
            </div>
            <RegisterEmailForm
              redirectPath={redirectPath}
              title="Signup with email"
              className="sm:mx-auto sm:max-w-[84%]"
            />
          </div>
          <DialogFooter className="w-full gap-6">
            <AboutPlatform />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
