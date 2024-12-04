'use client';

import * as React from 'react';

// import Image from 'next/image';
// import TMCCLogo from '@/public/assets/logos/tmcc_583_horizontal.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, type ButtonProps } from '@/components/ui/button';

type AboutPlatformProps = ButtonProps & {
  children?: React.ReactNode;
  btnTriggerLabel?: string;
  btnTriggerVariant?: ButtonProps['variant'];
};

export function AboutPlatform({
  children,
  size,
  btnTriggerLabel = 'About',
  btnTriggerVariant = 'outline',
}: AboutPlatformProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={btnTriggerVariant} size={size}>
          {children || btnTriggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[98vw] sm:max-w-lg">
        <AlertDialogHeader className="space-y-4">
          <div className="flex flex-col gap-3.5">
            {/* <Image
              src={TMCCLogo}
              width="1041"
              height="204"
              alt="TMCC Logo"
              className="w-[42%] md:w-[42%]"
            /> */}
            <AlertDialogTitle className="text-left">
              Welcome <span className="sr-only">to Experience Nevada</span>
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left sm:text-base">
            <strong>Experience NV:</strong> A collaborative platform that blends
            local, curated insights with AI intelligence. Discover Nevada&apos;s
            best-kept secrets, from serene landscapes to bustling urban centers,
            local shops, rural communities and more.
          </AlertDialogDescription>
          <AlertDialogTitle className="text-left" asChild>
            <h2>Privacy and Shareability</h2>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left sm:text-base">
            <strong>Discoveries</strong> and <strong>Experiences</strong> can be
            private or public, and can be shared with others by a unique link.
          </AlertDialogDescription>
          <AlertDialogTitle className="text-left" asChild>
            <h2>Powered by Folks and Generative AI</h2>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left sm:text-base">
            Based in Reno, Nevada,{' '}
            <a
              href="https://labs.bristlecone.design?src=nv.guide"
              className="link font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              Bristlecone Labs
            </a>{' '}
            developed this community-driven platform to help you discover and
            share the best of the Silver State. By combining human-curated
            content, public data, and Generative AI, Experience Nevada enhances
            personalized exploration of Nevada's diverse experiences — from
            rural gems to urban adventures. Our Human-led, AI-assisted approach
            ensures every discovery strengthens connections to Nevada’s people,
            culture, and landscapes.
          </AlertDialogDescription>
          {/* <AlertDialogDescription className="text-left">
            This platform is in beta/pilot as of Summer 2023.
          </AlertDialogDescription> */}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>
            {/* <IconOpenAI className="mr-2 size-4" /> */}
            Okay <span className="ml-2">— Awesome</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
