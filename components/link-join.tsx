'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';

export type UserJoinLinkProps = {
  href?: string;
  label?: React.ReactNode;
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  noRedirect?: boolean;
  redirectUrl?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function UserJoinLink({
  href = '/login',
  label = 'Login',
  variant = 'link',
  className,
  redirectUrl,
  noRedirect = false,
  disabled = false,
  size,
  icon,
  onClick: onClickProp,
}: UserJoinLinkProps) {
  const pathname = usePathname();

  const [isClicked, setIsClicked] = React.useState(false);

  const handleOnClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsClicked(true);

    if (typeof onClickProp === 'function') {
      onClickProp(e);
    }
  };

  const callbackUrl =
    redirectUrl && !noRedirect
      ? `callbackUrl=${redirectUrl}`
      : pathname && !noRedirect
        ? `callbackUrl=${pathname}`
        : '';

  const finalHref = callbackUrl ? `${href}?${callbackUrl}` : href;

  return (
    <Link
      href={finalHref}
      aria-disabled={isClicked || disabled}
      className={cn(
        buttonVariants({
          variant,
          size,
          className: cn('gap-1.5 no-underline', className),
        })
      )}
      onClick={handleOnClick}
    >
      {icon}
      <span>{label}</span>
      {isClicked && <IconSpinner className="animate-spin" />}
    </Link>
  );
}
