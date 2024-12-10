import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconInfo } from '@/components/ui/icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function PopoverWhatArePromptChallenges({
  contentClassName,
  textContainerClassName,
  textClassName,
  btnLabel = 'What are Prompt Challenges?',
  btnVariant = 'ghost',
  btnSize = 'xs',
  noBtnLabel = false,
  btnIconClassName,
  btnClassName,
}: {
  btnLabel?: string;
  noBtnLabel?: boolean;
  contentClassName?: string;
  textContainerClassName?: string;
  textClassName?: string;
  btnClassName?: string;
  btnSize?: ButtonProps['size'];
  btnVariant?: ButtonProps['variant'];
  btnIconClassName?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={btnVariant}
          size={btnSize}
          className={cn(
            'group gap-1.5 text-sm text-foreground/75',
            btnClassName
          )}
        >
          <IconInfo className={cn('size-4', btnIconClassName)} />
          {!noBtnLabel && btnLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={8}
        align="center"
        alignOffset={0}
        className={cn(
          'w-full max-w-80 bg-background/95 backdrop-blur-lg md:max-w-108',
          contentClassName
        )}
      >
        <div
          className={cn(
            'text-sm leading-normal text-foreground/70',
            textContainerClassName
          )}
        >
          <p className={cn('text-center', textClassName)}>
            Prompt challenges are personalized to{' '}
            <Link href="/profile/edit" className="link-primary">
              your interests
            </Link>
            , experiences, and location. They're a fun way to share what you
            love about the Silver State and — once in the public beta — discover
            new adventures and hidden gems!
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PopoverWhatArePromptStories({
  contentClassName,
  textContainerClassName,
  textClassName,
  btnLabel = 'What are Story Series?',
  btnVariant = 'ghost',
  btnSize = 'xs',
  noBtnLabel = false,
  btnIconClassName,
  btnClassName,
}: {
  btnLabel?: string;
  noBtnLabel?: boolean;
  contentClassName?: string;
  textContainerClassName?: string;
  textClassName?: string;
  btnClassName?: string;
  btnSize?: ButtonProps['size'];
  btnVariant?: ButtonProps['variant'];
  btnIconClassName?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={btnVariant}
          size={btnSize}
          className={cn(
            'group gap-1.5 text-sm text-foreground/75',
            btnClassName
          )}
        >
          <IconInfo className={cn('size-4', btnIconClassName)} />
          {!noBtnLabel && btnLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={8}
        align="center"
        alignOffset={0}
        className={cn(
          'w-full max-w-80 bg-background/95 backdrop-blur-lg md:max-w-108',
          contentClassName
        )}
      >
        <div
          className={cn(
            'text-sm leading-normal text-foreground/70',
            textContainerClassName
          )}
        >
          <p className={cn('text-center', textClassName)}>
            Story Series are themed prompt challenges, like the{' '}
            <Link href="/prompts/stories/unr-150" className="link-primary">
              <strong>UNR 150th series</strong>
            </Link>
            , that highlight the best of Nevada its people, and its progress.
            They offer a fun and engaging way to share and explore the state's
            rich history, culture, innovations, and natural beauty through
            personal stories, collaborations and insights.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
