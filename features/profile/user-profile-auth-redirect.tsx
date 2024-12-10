'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PrimaryContentContainer } from '@/components/layout-containers';

export type UserProfileAuthRedirectProps = {
  children?: React.ReactNode;
  redirectPath: string;
};

/**
 * Display the user's avatar on their profile and offer the ability to change it.
 */
export function UserProfileAuthRedirect({
  children,
  redirectPath,
}: UserProfileAuthRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectPath);
  }, []);

  return <PrimaryContentContainer>{children}</PrimaryContentContainer>;
}
