'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import type { DialogProps } from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';

import { cn, sleep } from '@/lib/utils';
import { usePersonalizedUserGreeting } from '@/hooks/use-generate-personalized-greeting';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordian';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft, IconSpinner } from '@/components/ui/icons';
import { LinkCta } from '@/components/cta-link';
import { Prose } from '@/components/prose';

/**
 * Dialog Drawer for Getting Started
 */

export function GettingStartedSteps({
  usersUsername,
  handleOnRouteToLink: handleOnRouteToLinkProp,
}: {
  usersUsername: string;
  handleOnRouteToLink?: () => void;
}) {
  const router = useRouter();

  const handleOnLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    const href = target.getAttribute('href');

    if (!href) return;
    router.push(href);

    if (typeof handleOnRouteToLinkProp === 'function') {
      handleOnRouteToLinkProp();
    }
  };

  return (
    <Accordion
      defaultValue="item-1"
      collapsible
      type="single"
      className="w-full"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger className="brightness-85 gap-4 hover:no-underline hover:brightness-110">
          <span className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center">
            <span>Public Beta Status</span>
            <span className="flex gap-2">
              <Badge variant="outline">Waitlist</Badge>
              <Badge variant="outline">Beginning Nevada Day 2024</Badge>
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="text-base lg:text-lg">
          You're on the waitlist for the public beta and are scheduled to join
          in a staggered queue after{' '}
          <strong>October 31st, 2024 (Nevada Day)</strong>.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger className="brightness-85 gap-4 hover:no-underline hover:brightness-110">
          Things to Do Now
        </AccordionTrigger>
        <AccordionContent className="text-base lg:text-lg">
          Get ready for the public beta! Start by{' '}
          <Link
            className="link-primary"
            href="/profile/edit"
            onClick={handleOnLinkClick}
          >
            <strong>updating your profile</strong>
          </Link>{' '}
          with your interests and details.
        </AccordionContent>
        <AccordionContent className="text-base lg:text-lg">
          Next, dive into some featured story series, like the{' '}
          <Link
            href="/prompts/stories/unr-150"
            className="link-primary"
            onClick={handleOnLinkClick}
          >
            <strong>150 Years of UNR</strong>
          </Link>{' '}
          or share some of{' '}
          <Link
            className="link-primary"
            href={`/profile/${usersUsername}/experiences`}
            onClick={handleOnLinkClick}
          >
            <strong>your other experiences</strong>
          </Link>{' '}
          of the Silver State.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger className="brightness-85 gap-4 hover:no-underline hover:brightness-110">
          Story Series and Prompt Challenges
        </AccordionTrigger>
        <AccordionContent className="text-base lg:text-lg">
          Featured story series, like{' '}
          <Link
            href="/prompts/stories/home-means-nevada"
            className="link-primary"
            onClick={handleOnLinkClick}
          >
            <strong>Home Means Nevada</strong>
          </Link>
          , are{' '}
          <Link
            href="/prompts/stories"
            className="link-primary"
            onClick={handleOnLinkClick}
          >
            themed story series
          </Link>{' '}
          that highlight the best of Nevada and its people. They're a great way
          to share and discover the Silver State's rich history, culture, and
          natural beauty.
        </AccordionContent>
        <AccordionContent className="text-base lg:text-lg">
          Prompt challenges are personalized to{' '}
          <Link
            href="/profile/edit"
            className="link-primary"
            onClick={handleOnLinkClick}
          >
            your interests
          </Link>
          , experiences, and location. They're a fun way to{' '}
          <Link
            href="/prompts"
            className="link-primary"
            onClick={handleOnLinkClick}
          >
            share what you love
          </Link>{' '}
          about the Silver State and — once in the public beta — discover new
          adventures and hidden gems shared by others!
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger className="brightness-85 gap-4 hover:no-underline hover:brightness-110">
          About the Platform
        </AccordionTrigger>
        <AccordionContent className="select-text text-base lg:text-lg">
          Experience NV is a community-driven platform designed to help you and
          others <strong>discover</strong> and <strong>share</strong> the{' '}
          <strong>best of Nevada</strong>. It's where you can share your
          favorite spots, experiences, and adventures — rural, urban and
          everything in-between — and find new ones through the stories of
          others.
        </AccordionContent>
        <AccordionContent className="select-text text-base lg:text-lg">
          Our goal is to{' '}
          <strong>strengthen your connection to the Silver State</strong> and{' '}
          <strong>its people</strong>, whether you're a longtime local, new to
          the area, or just visiting. By sharing our curated adventures, we can
          help each other uncover the hidden gems of Nevada and{' '}
          <strong>build a stronger sense of community</strong> while{' '}
          <strong>boosting outdoor recreation</strong>,{' '}
          <strong>collaboration and partnerships</strong>,{' '}
          <strong>traditions</strong>, <strong>tourism</strong>, and{' '}
          <strong>economic development</strong>.
        </AccordionContent>
        <AccordionContent className="select-text text-base lg:text-lg">
          Our AI implementation is anchored on{' '}
          <strong>"Human-led, AI-assisted"</strong> to help you and others
          curate and share the best of Nevada.
        </AccordionContent>
        <AccordionContent className="text-base lg:text-lg">
          Experience NV is in private beta and will open to the public in a
          staggered queue after <strong>Nevada Day, Oct. 31st, 2024</strong>.
        </AccordionContent>
        <AccordionContent className="flex gap-2 text-base">
          <LinkCta
            href="/profile/edit"
            variant="secondary"
            size="sm"
            className="hover:bg-tertiary max-w-fit"
            onClick={handleOnLinkClick}
          >
            Update Profile{' '}
            <span className="hidden sm:inline-block">Interests</span>
          </LinkCta>
          <LinkCta
            href="/prompts/stories"
            variant="secondary"
            size="sm"
            className="hover:bg-tertiary max-w-fit"
            onClick={handleOnLinkClick}
          >
            Story Series
          </LinkCta>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export interface GettingStartedDrawerProps extends DialogProps {
  noCloseBtn?: boolean;
  dismissable?: boolean;
  closeThreshold?: number;
  closeOnOutsideClick?: boolean;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  title?: string;
  description?: string;
  noFocusOnOpen?: boolean;
  className?: string;
  noMinimizeOnOutsideClick?: boolean;
  shouldScaleBackground?: boolean;
  handleOnClose?: () => void;
}

export function GettingStartedDrawer({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dismissable = true,
  closeThreshold = 0.1,
  noFocusOnOpen = false,
  noMinimizeOnOutsideClick = true,
  shouldScaleBackground = true,
  titleClassName,
  title: titleProp = 'Getting Started',
  description: descriptionProp = `Let's get you going on your journey`,
  contentProps,
  className,
  children,
  open,
  handleOnClose,
  ...props
}: GettingStartedDrawerProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const {
    userProfileUsername,
    userFirstName = '',
    userLocation,
  } = useAppState();

  // States
  const [isMounted, setIsMounted] = React.useState(false);

  const [isOpen, setIsOpen] = React.useState(open);

  // Personalized user greeting
  const {
    ready,
    generated,
    generating,
    personalizedReply,
    handleGeneratingPersonalizedGreeting,
  } = usePersonalizedUserGreeting({
    autoGenerateOnMount: false,
    name: userFirstName,
  });

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    // console.log(`handleOnOpenChange invoked in create experience dialog`, {
    //   nextState,
    // });
    setIsOpen(nextState);
    if (!nextState) {
      await sleep(350);

      if (typeof handleOnClose === 'function') {
        handleOnClose();
      }
    }
  };

  const handleOnEscapeKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOnOpenChange(false);
    }
  };

  const handleClosePrimaryDrawer = () => {
    // setIsOpen(false);
    handleOnOpenChange(false);
  };

  const handleOnRouteToLink = () => {
    // setIsOpen(false);
    handleOnOpenChange(false);
  };

  // Effects
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate personalized greeting
  React.useEffect(() => {
    if (isMounted && ready && userFirstName && !generated && !generating) {
      handleGeneratingPersonalizedGreeting(userFirstName, userLocation);
    }
  }, [isMounted, userFirstName, userLocation, ready, generated, generating]);

  const finalDescription = userFirstName
    ? `${descriptionProp}, ${userFirstName}`
    : descriptionProp;

  return (
    <Drawer
      {...props}
      modal
      // modal={snap === 1}
      // handleOnly
      open={isOpen}
      dismissible={dismissable}
      closeThreshold={closeThreshold}
      shouldScaleBackground={shouldScaleBackground}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
      // onRelease={(e) => {
      //   console.log('onRelease invoked', e);
      // }}
    >
      <DrawerContent
        {...contentRestProps}
        onEscapeKeyDown={handleOnEscapeKeyDown}
        noCloseBtn={noCloseBtn || contentRestProps.noCloseBtn}
        onPointerDownOutside={(event) => {
          // console.log(`***** onPointerDownOutside invoked`, event);
          if (!noMinimizeOnOutsideClick) {
            event.preventDefault();
          } else {
            handleClosePrimaryDrawer();
            event.stopPropagation();
          }
        }}
        onClick={(event) => {
          // console.log(`***** onClick invoked`, event);
        }}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[3px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className={cn(
          'max-h-[100svh] min-h-[94svh] bg-background/85 backdrop-blur-lg'
        )}
      >
        <div className="flex min-w-full grow flex-col justify-start gap-4 overflow-y-auto">
          <DrawerHeader
            className={cn(
              'mx-auto max-w-5xl shrink pb-4 sm:pb-8 md:px-2 xl:px-10'
            )}
          >
            <DrawerTitle
              asChild
              className={cn(
                'flex items-center justify-center gap-2 truncate text-2xl font-semibold md:text-3xl lg:text-4xl',
                'pb-4 pt-8',
                // {
                //   'py-8': !promptChallengeAccepted,
                //   'pb-3 pt-8': promptChallengeAccepted,
                // },
                titleClassName
              )}
            >
              <motion.h2
                // key={title}
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                // exit={{ scale: 0.1, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.725, delay: 0.1 }}
              >
                <h3>{titleProp}</h3>
              </motion.h2>
            </DrawerTitle>

            {(personalizedReply || generating) && (
              <DrawerDescription className="flex items-center justify-center gap-2 text-center text-xl font-medium text-foreground md:text-2xl">
                {personalizedReply}
                {generating && <IconSpinner className="size-4 animate-spin" />}
              </DrawerDescription>
            )}
          </DrawerHeader>

          <Prose className="mx-auto flex w-full shrink flex-col items-start justify-start gap-8 px-4 py-2 lg:prose-lg lg:max-w-5xl">
            <GettingStartedSteps
              handleOnRouteToLink={handleOnRouteToLink}
              usersUsername={userProfileUsername}
            />
          </Prose>
        </div>

        <DrawerFooter className="">
          <div className="flex w-full justify-between">
            <Button
              size="sm"
              flavor="ring"
              variant="outline"
              onClick={() => {
                handleClosePrimaryDrawer();
              }}
              className={cn(
                'hover:text-success-foreground group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75'
              )}
            >
              <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
              Back
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
