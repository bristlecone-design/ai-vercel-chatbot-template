import type * as React from 'react';
import { signIn } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { IconGitHub } from '@/components/ui/icons';
import { LoaderButton } from '@/components/loader-btn';

interface LoginButtonProps extends React.ComponentProps<typeof LoaderButton> {
  showIcon?: boolean;
  callbackUrl?: string;
  textPrefix?: string;
  text?: string;
}

export function SignInButtonGitHub({
  size = 'lg',
  textPrefix = 'Login with',
  text = 'GitHub',
  callbackUrl = '/',
  showIcon = true,
  variant = 'outline',
  iconClassName,
  className,
  ...props
}: LoginButtonProps) {
  return (
    <LoaderButton
      size={size}
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        signIn('github', { redirectTo: callbackUrl });
      }}
      className={cn(
        'flex items-center gap-1.5 duration-75 hover:bg-primary hover:text-primary-foreground',
        className
      )}
      icon={showIcon ? IconGitHub : undefined}
      {...props}
    >
      {textPrefix && <span className="hidden sm:inline">{textPrefix} </span>}
      {text}
    </LoaderButton>
  );
}
