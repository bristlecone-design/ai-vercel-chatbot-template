'use client';

import AppStateProvider from '@/state/app-state-provider';
import { SwrConfigClientProvider } from '@/state/swr-provider';
import { SessionProvider, type SessionProviderProps } from 'next-auth/react';
import type { ThemeProviderProps } from 'next-themes';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ThemeProvider } from './theme-provider';

export type ProvidersProps = ThemeProviderProps & {
  // Other providers' props
  session?: SessionProviderProps['session'];
};

export function Providers({ children, session, ...props }: ProvidersProps) {
  return (
    <SwrConfigClientProvider>
      <SessionProvider session={session}>
        <ThemeProvider {...props}>
          <TooltipProvider>
            <AppStateProvider>{children}</AppStateProvider>
          </TooltipProvider>
        </ThemeProvider>
      </SessionProvider>
    </SwrConfigClientProvider>
  );
}
