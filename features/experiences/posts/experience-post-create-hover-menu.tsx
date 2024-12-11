'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  IconCaravan,
  IconCornerDownArrow,
  IconPlus,
  IconScrollText,
} from '@/components/ui/icons';
import { Separator } from '@/components/ui/separator';
import { LinkCta } from '@/components/cta-link';

export type ExperienceCreateHoverMenuProps = {
  rerouting?: boolean;
  openDelay?: number;
  location?: string;
  className?: string;
  btnClassName?: string;
  handleEnableCreateFlow: (enableGenExp?: boolean) => void;
  handleCreatingAnExperience: () => void;
  handleAcceptingPromptChallenge: () => void;
  handleOnCloseExperienceDialog?: () => void;
};

export function ExperienceCreateHoverMenu({
  // rerouting,
  openDelay = 275,
  location,
  className,
  btnClassName,
  handleEnableCreateFlow,
  handleCreatingAnExperience,
  handleAcceptingPromptChallenge,
}: ExperienceCreateHoverMenuProps) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);

  const [reroutingTo, setReroutingTo] = React.useState('');

  const handleOnOpenChange = (nextState: boolean) => {
    setOpen(nextState);
  };

  const handleOnBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(!open);
  };

  return (
    <div
      className={cn(
        'absolute bottom-0 flex items-center justify-end p-3',
        className
      )}
    >
      <HoverCard
        openDelay={openDelay}
        open={open}
        onOpenChange={handleOnOpenChange}
      >
        <HoverCardTrigger asChild>
          <Button
            variant="default"
            size="icon"
            type="button"
            onClick={handleOnBtnClick}
            className={cn(
              'group size-12 self-end rounded-full p-2 transition-all hover:scale-100 hover:transform md:size-14',
              'border-2 border-foreground bg-tertiary text-foreground',
              'hover:border-tertiary hover:bg-foreground hover:text-tertiary',
              btnClassName
            )}
          >
            <span className="sr-only">Create Another Experience</span>
            <IconPlus className="size-full transition-transform delay-200 duration-300 group-hover:rotate-180" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent
          align="end"
          side="top"
          sideOffset={10}
          className="peer/create-experience-content w-72 rounded-lg p-1"
        >
          <div className="flex flex-col gap-1">
            <h3 className="flex flex-col justify-between px-3.5 py-1.5 text-xs">
              <span className="font-semibold">Public Beta Users</span>
              <span className="font-normal text-muted-foreground">
                Queued rollout starting <span>Oct. 25, 2024</span>
              </span>
            </h3>
            <Button
              disabled
              variant="ghost"
              className="justify-between gap-1.5 py-1.5 leading-none"
              // onClick={handleCreatingAnExperience}
            >
              <span className="font-medium">
                {location ? `Discover ${location}` : 'Discover'}
              </span>
              {/* <IconCaravan className="size-5" /> */}
            </Button>
            <div className="flex flex-col gap-1">
              <Button
                disabled
                variant="ghost"
                className="h-[unset] justify-between gap-1.5 py-1.5 pl-6 text-sm leading-none"
                // onClick={handleCreatingAnExperience}
              >
                <span className="font-medium">Create a Roadtrip</span>
                {/* <IconCaravan className="size-5" /> */}
              </Button>
              <Button
                disabled
                variant="ghost"
                className="h-[unset] justify-between gap-1.5 py-1.5 pl-6 text-sm leading-none"
                // onClick={handleCreatingAnExperience}
              >
                <span className="font-medium">Create an Event</span>
                {/* <IconCaravan className="size-5" /> */}
              </Button>
            </div>
            <Separator />
            <LinkCta
              noShowIcon
              size="off"
              variant="ghost"
              href="/prompts/stories/unr-150"
              textClassName="justify-between"
              className="group/create-item flex items-center justify-between gap-1.5 px-4 py-1.5"
            >
              <span className="grow font-medium">Story Series</span>
              <IconScrollText className="size-5" />
            </LinkCta>
            <LinkCta
              size="off"
              variant="ghost"
              href="/prompts/stories/unr-150"
              className="group/create-item flex items-center justify-between gap-1.5 px-4 py-1.5"
            >
              <IconCornerDownArrow className="size-3" />
              <span className="grow font-medium brightness-85 group-hover/create-item:brightness-100">
                150 Years of UNR
              </span>
            </LinkCta>
            <LinkCta
              size="off"
              variant="ghost"
              href="/prompts/stories/building-nevadas-future"
              className="group/create-item flex items-center justify-between gap-1.5 px-4 py-1.5"
            >
              <IconCornerDownArrow className="size-3" />
              <span className="grow font-medium brightness-85 group-hover/create-item:brightness-100">
                Building Nevada's Future
              </span>
            </LinkCta>
            <LinkCta
              size="off"
              variant="ghost"
              href="/prompts/stories/home-means-nevada"
              className="group/create-item flex items-center justify-between gap-1.5 px-4 py-1.5"
            >
              <IconCornerDownArrow className="size-3" />
              <span className="grow font-medium brightness-85 group-hover/create-item:brightness-100">
                Home Means Nevada
              </span>
            </LinkCta>
            <Separator />
            <Button
              variant="ghost"
              className="group/create-item justify-between gap-1.5 py-1.5 leading-none"
              onClick={handleCreatingAnExperience}
            >
              <span className="font-medium">Share an Experience</span>
              {/* {rerouting && (
                <IconSpinner className="size-5 animate-spin transition" />
              )} */}

              <IconCaravan className="size-5 transition group-hover/create-item:translate-x-0.5" />
            </Button>
            {/* <Link
              href="/prompts"
              className={cn(
                buttonVariants({
                  variant: 'ghost',
                }),
                'group/create-item justify-between gap-1.5 py-1.5 leading-none'
              )}
              onClick={(e) => {
                const href = e.currentTarget.getAttribute('href');
                setReroutingTo('challenges');
                handleAcceptingPromptChallenge();
                if (href) router.push(href);
              }}
            >
              <span className="font-medium">Prompt Challenge</span>
              {reroutingTo === 'challenges' && (
                <IconSpinner className="size-5 animate-spin transition" />
              )}
              {!reroutingTo && (
                <IconSparkle className="size-5 transition group-hover/create-item:rotate-180" />
              )}
            </Link> */}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
