'use client';

import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';

interface LinkCtaProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  noShowIcon?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  iconClassName?: string;
  text?: string;
  textClassName?: string;
  spinnerClassName?: string;
  href: string;
  ref?: React.RefObject<HTMLAnchorElement>;
  className?: string;
  disabled?: boolean;
}

export function LinkCta({
  size = 'lg',
  text = '',
  textClassName,
  spinnerClassName,
  variant = 'default',
  className,
  noShowIcon = false,
  disabled,
  children,
  href,
  onClick,
  ...props
}: LinkCtaProps) {
  const [isClicked, setIsClicked] = React.useState(false);

  const handleOnClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsClicked(true);
    onClick?.(e);

    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleOnClick}
      aria-disabled={isClicked || disabled}
      className={cn(
        'no-underline',
        buttonVariants({
          size,
          variant,
        }),
        'flex items-center gap-1.5',
        className
      )}
      {...props}
    >
      <span className={cn('flex w-full items-center gap-1.5', textClassName)}>
        {text || children}
        {!noShowIcon && isClicked && (
          <IconSpinner
            className={cn('size-4 animate-spin', spinnerClassName)}
          />
        )}
      </span>
    </Link>
  );
}
