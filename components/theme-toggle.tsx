'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconMoon, IconSun } from '@/components/ui/icons';

export function ThemeToggle({
  noLabel,
  className,
}: {
  className?: string;
  noLabel?: boolean;
}) {
  const { setTheme, theme } = useTheme();
  const [_, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size={noLabel ? 'icon' : 'default'}
      onClick={() => {
        startTransition(() => {
          setTheme(theme === 'light' ? 'dark' : 'light');
        });
      }}
      className={cn('flex cursor-pointer gap-2', className)}
    >
      {!theme ? null : theme === 'dark' ? (
        <React.Fragment>
          <IconMoon className="transition-all" />
          {!noLabel && <span className="">Dark</span>}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <IconSun className="transition-all" />
          {!noLabel && <span className="">Light</span>}
        </React.Fragment>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
