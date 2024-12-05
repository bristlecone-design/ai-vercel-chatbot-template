import * as React from 'react';
import { signIn } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconGitHub, IconSpinner } from '@/components/ui/icons';

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean;
  noTextPrefix?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  iconClassName?: string;
  callbackUrl?: string;
  textPrefix?: string;
  text?: string;
}

export function SignInButtonGitHub({
  size = 'lg',
  noTextPrefix = false,
  textPrefix = 'Login with',
  text = 'GitHub',
  callbackUrl = '/',
  showIcon = true,
  variant = 'outline',
  iconClassName,
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  return (
    <Button
      size={size}
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        signIn('github', { redirectTo: callbackUrl });
      }}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-1.5 duration-75 hover:bg-primary hover:text-primary-foreground',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className={cn('animate-spin', iconClassName)} />
      ) : showIcon ? (
        <IconGitHub className={iconClassName} />
      ) : null}
      {textPrefix && <span className="hidden sm:inline">{textPrefix} </span>}
      {text}
    </Button>
  );
}
