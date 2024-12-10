'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import {
  UserProfileTabsProvider,
  type UserProfileTabsProviderProps,
} from '@/features/profile/user-profile-tabs-provider';

import { SharedProfileLayoutContainer } from './shared-layouts';
import type { USER_PROFILE_PUBLIC_TABS } from './shared-tab-types';
import { UserProfilePublicTabs } from './shared-tabs';

export type UserProfileTabsProps = {
  defaultTab?: UserProfileTabsProviderProps['activeTab'];
  children: React.ReactNode;
};

export function UserProfileTabsView({
  children,
  defaultTab: defaultTabProp = 'experiences',
}: UserProfileTabsProps) {
  const tabSegment = useSelectedLayoutSegment() as USER_PROFILE_PUBLIC_TABS;
  const activetab = tabSegment ? tabSegment : defaultTabProp;
  // console.log('***** UserProfileTabsView active tab', {
  //   activetab,
  //   tabSegment,
  //   defaultTabProp,
  // });

  return (
    <UserProfileTabsProvider
      key={`user-profile-tabs-${tabSegment}`}
      activeTab={activetab}
    >
      <SharedProfileLayoutContainer>
        <UserProfilePublicTabs
          // key={`user-profile-public-tabs-view-${tabSegment}`}
          defaultTab={tabSegment as USER_PROFILE_PUBLIC_TABS}
        >
          {children}
        </UserProfilePublicTabs>
      </SharedProfileLayoutContainer>
    </UserProfileTabsProvider>
  );
}
