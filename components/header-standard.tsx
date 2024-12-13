'use client';

import { cn } from '@/lib/utils';

import { UserProfileNav } from './user-profile-nav';

export function StandardHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center justify-between gap-2 px-2 py-1.5 sm:w-full sm:bg-background/50 sm:backdrop-blur-sm md:px-2',
        className
      )}
    >
      <div className="flex items-center justify-start gap-2"> </div>
      <div>
        <UserProfileNav />
      </div>
    </header>
  );
}
