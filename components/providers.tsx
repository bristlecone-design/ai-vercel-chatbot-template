'use client';

import type { ThemeProviderProps } from 'next-themes';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ThemeProvider } from './theme-provider';

export type ProvidersProps = ThemeProviderProps & {
  // Other providers' props
};

export function Providers({ children, ...props }: ProvidersProps) {
  return (
    <ThemeProvider {...props}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
