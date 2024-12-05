'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';

export type UserLoginLinkProps = {
  href?: string;
  label?: string;
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  icon?: React.ReactNode;
};

export function UserLoginLink({
  href = '/login',
  label = 'Login',
  variant = 'link',
  size,
  className,
  icon,
}: UserLoginLinkProps) {
  const pathname = usePathname();
  const finalHref = pathname ? `${href}?callbackUrl=${pathname}` : href;

  return (
    <Link
      href={finalHref}
      className={cn(
        buttonVariants({
          variant,
          size,
          className: cn('no-underline', className),
        })
      )}
    >
      {label}
      {icon}
    </Link>
  );
}
