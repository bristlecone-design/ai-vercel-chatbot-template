import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { useSidebar, type SidebarTrigger } from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';

import { SidebarLeftIcon } from './icons';
import { Button } from './ui/button';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <BetterTooltip content="Toggle Sidebar" align="start">
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        className={cn(
          'md:h-fit md:px-2',
          'bg-transparent backdrop-blur-sm hover:bg-muted/20 hover:backdrop-blur-lg'
        )}
      >
        <SidebarLeftIcon size={16} />
      </Button>
    </BetterTooltip>
  );
}
