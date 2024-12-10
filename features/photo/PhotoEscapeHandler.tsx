'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppState } from '@/state/app-state';

import { getEscapePath } from '@/config/site-paths';

const LISTENER_KEYUP = 'keyup';

export default function PhotoEscapeHandler() {
  const router = useRouter();

  const pathname = usePathname();

  const { shouldRespondToKeyboardCommands } = useAppState();

  const escapePath = getEscapePath(pathname);

  useEffect(() => {
    if (shouldRespondToKeyboardCommands) {
      const onKeyUp = (e: KeyboardEvent) => {
        if (e.key.toUpperCase() === 'ESCAPE' && escapePath) {
          router.push(escapePath, { scroll: false });
        }
      };
      window.addEventListener(LISTENER_KEYUP, onKeyUp);
      return () => window.removeEventListener(LISTENER_KEYUP, onKeyUp);
    }
  }, [shouldRespondToKeyboardCommands, router, escapePath]);

  return null;
}
