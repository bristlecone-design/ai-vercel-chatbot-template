'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconRefreshCw, IconSpinner } from '@/components/ui/icons';

interface RefreshViewProps extends ButtonProps {
  showIcon?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  iconClassName?: string;
  refreshPath?: string;
  label?: string;
}

export function RefreshView({
  size = 'icon',
  refreshPath = '/',
  label = '',
  showIcon = true,
  variant = 'ghost',
  iconClassName,
  className,
  ...props
}: RefreshViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={(e) => {
          e.preventDefault();

          startTransition(async () => {
            // console.log('refreshing path...', pathname);
            router.refresh();
            // refreshView(refreshPath);
          });
        }}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1.5 text-foreground/60',
          className
        )}
        {...props}
      >
        {isPending ? (
          <IconSpinner className={cn('animate-spin', iconClassName)} />
        ) : showIcon ? (
          <IconRefreshCw className={iconClassName} />
        ) : null}
        {label}
      </Button>
    </>
  );
}
