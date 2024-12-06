'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';

interface LoaderButtonProps extends ButtonProps {
  icon?: React.JSXElementConstructor<{ className?: string }>;
  iconClassName?: string;
  text?: string;
}

export function LoaderButton({
  size = 'lg',
  text = 'Google',
  variant = 'outline',
  icon,
  iconClassName,
  className,
  children,
  onClick: onClickProp,
  ...props
}: LoaderButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const Icon = icon as React.ElementType;
  return (
    <Button
      size={size}
      variant={variant}
      onClick={(e) => {
        setIsLoading(true);
        if (typeof onClickProp === 'function') {
          onClickProp(e);
        }
      }}
      disabled={isLoading}
      className={cn('flex items-center gap-1.5', className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className={cn('animate-spin', iconClassName)} />
      ) : Icon ? (
        <Icon className={iconClassName} />
      ) : null}
      {text || children}
    </Button>
  );
}
