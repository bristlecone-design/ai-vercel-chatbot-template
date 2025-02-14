'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from 'next-auth';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';

import { UserProfileNav } from './user-profile-nav';

export function AppSidebar({
  user,
  closeSidebarOnMount,
}: {
  user: User | undefined;
  closeSidebarOnMount?: boolean;
}) {
  const router = useRouter();
  const { setOpenMobile, setOpen } = useSidebar();

  React.useEffect(() => {
    if (closeSidebarOnMount) {
      setOpen(false);
    }
  }, [closeSidebarOnMount]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu className="">
          <div className="flex flex-row items-center justify-between">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row items-center gap-3"
            >
              <span className="cursor-pointer rounded-md px-2 text-lg font-semibold hover:bg-muted">
                Experience Nevada
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="h-fit p-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="-mx-2">
          <SidebarHistory user={user} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="-mx-2 gap-0">
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              {/* <SidebarUserNav user={user} /> */}
              <UserProfileNav flipChevron />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
