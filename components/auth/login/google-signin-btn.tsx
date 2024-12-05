import * as React from 'react';
import { signIn } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconGoogle, IconSpinner } from '@/components/ui/icons';

interface SignInButtonProps extends ButtonProps {
  showIcon?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  iconClassName?: string;
  callbackUrl?: string;
  textPrefix?: string;
  text?: string;
}

export function SignInButtonGoogle({
  size = 'lg',
  textPrefix = 'Login with',
  text = 'Google',
  callbackUrl = '/',
  showIcon = true,
  variant = 'outline',
  iconClassName,
  className,
  ...props
}: SignInButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  return (
    <Button
      size={size}
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        signIn('google', { redirectTo: callbackUrl });
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
        <IconGoogle className={iconClassName} />
      ) : null}
      {textPrefix && <span className="hidden sm:inline">{textPrefix} </span>}
      {text}
    </Button>
  );
}
