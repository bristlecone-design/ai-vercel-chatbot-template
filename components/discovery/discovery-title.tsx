import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export type DiscoveryTitleProps = {
  firstPart?: string;
  secondPart?: string;
  className?: string;
  firstPartClassName?: string;
  secondPartClassName?: string;
  linkHref?: string;
  smaller?: boolean;
};

export function DiscoveryTitle({
  firstPart = 'Experience',
  secondPart = 'Nevada',
  linkHref,
  smaller = false,
  firstPartClassName,
  secondPartClassName,
  className,
}: DiscoveryTitleProps) {
  const titleParts = (
    <React.Fragment>
      <span className={cn('shaded-text', firstPartClassName)}>{firstPart}</span>{' '}
      <span
        className={cn(
          'brightness-90 hover:brightness-100',
          secondPartClassName
        )}
      >
        {secondPart}
      </span>
    </React.Fragment>
  );

  const textClassName = smaller
    ? 'text-xl sm:text-2xl xl:text-2xl'
    : 'text-4xl sm:text-5xl md:text-6xl xl:text-7xl';

  return (
    <h1
      className={cn(
        'text-center font-semibold tracking-normal transition-all duration-150 md:font-extrabold',
        'leading-loose md:leading-normal',
        textClassName,
        className
      )}
    >
      {linkHref ? (
        <Link href={linkHref} passHref>
          {titleParts}
        </Link>
      ) : (
        titleParts
      )}
    </h1>
  );
}

export type DiscoveryBylineProps = {
  size?: 'default' | 'sm';
  customText?: React.ReactNode;
};

export function DiscoveryByline({
  customText,
  size = 'default',
}: DiscoveryBylineProps) {
  return (
    <p
      className={cn(
        'lead text-center text-foreground/75',
        'max-w-xs sm:max-w-full',
        {
          'text-2xl': size === 'sm',
          'text-lg sm:text-xl lg:text-2xl': size === 'default',
        }
      )}
    >
      {customText}
      {!customText && (
        <>
          We all have an experience to{' '}
          <span className="inline-block whitespace-nowrap">
            <Link
              href="/prompts"
              className="link-primary cursor-pointer no-underline"
            >
              <span className="text-foreground">share</span>
            </Link>{' '}
            and{' '}
            <Link
              href="/prompts"
              className="link-primary cursor-pointer no-underline"
            >
              <span className="text-foreground">discover</span>
            </Link>
          </span>
        </>
      )}
    </p>
  );
}

export type DiscoveryMastheadProps = {
  className?: string;
  miscText?: React.ReactNode;
  titleProps?: DiscoveryTitleProps;
  bylineProps?: DiscoveryBylineProps;
  hideOnMobile?: boolean;
  size?: 'default' | 'sm';
};

export function DiscoveryMasthead({
  className,
  miscText,
  titleProps,
  bylineProps,
  hideOnMobile = false,
  size = 'default',
}: DiscoveryMastheadProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        {
          'gap-4 lg:gap-6': size === 'default',
          'gap-2 lg:gap-6': size === 'sm',
          'hidden sm:flex': hideOnMobile,
        },
        className
      )}
    >
      <DiscoveryTitle {...titleProps} />
      <DiscoveryByline {...bylineProps} />
      {miscText}
    </div>
  );
}
