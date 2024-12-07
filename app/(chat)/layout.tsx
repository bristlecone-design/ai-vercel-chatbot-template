import { cookies } from 'next/headers';

import { cn } from '@/lib/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

import { auth } from '../(auth)/auth';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const isAuthenticated = !!session?.user;

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar closeSidebarOnMount={!isAuthenticated} user={session?.user} />
      <SidebarInset
        className={cn({
          'bg-background/50': !isAuthenticated,
        })}
      >
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
