'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';
import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';

import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { UserProfileNav } from './user-profile-nav';

export function ChatHeader({ selectedModelId }: { selectedModelId: string }) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  return (
    <header className="sticky top-0 flex min-h-14 w-full max-w-full items-center justify-between gap-2 px-2 py-1.5 md:px-2">
      <div className="flex max-w-full items-center justify-start gap-2">
        <SidebarToggle />
        {(!open || windowWidth < 768) && (
          <BetterTooltip content="New Chat">
            <Button
              variant="ghost"
              className={cn(
                'order-2 ml-auto gap-1.5 px-2 md:order-1 md:ml-0 md:h-fit md:px-2',
                'bg-transparent backdrop-blur-sm hover:bg-muted/20 hover:backdrop-blur-lg'
              )}
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">
                <span className="sr-only">New </span>Chat
              </span>
            </Button>
          </BetterTooltip>
        )}
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      </div>
      <div>
        <UserProfileNav />
      </div>
    </header>
  );
}
