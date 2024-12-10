'use client';

import type React from 'react';
import { useUserProfileTabs } from '@/features/profile/user-profile-tabs-provider';

import { cn } from '@/lib/utils';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// import { useTransitionRouter } from 'next-view-transitions';

import type { USER_PROFILE_PUBLIC_TABS } from './shared-tab-types';

import type { ExperienceModel } from '@/types/experiences';
import type { AppUser as AUTH_USER_MODEL } from '@/types/next-auth';
import type { PhotoBasicExifData } from '@/types/photo';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserProfilePublicTabsProps = {
  authUser?: AUTH_USER_MODEL | undefined;
  userProfile?: USER_PROFILE_MODEL;
  enabledEdit?: boolean;
  usersCount?: number;
  userOwnsProfile?: boolean;
  mediaAssets?: PhotoBasicExifData[];
  experiences?: ExperienceModel[];
  activeTabContent?: React.ReactNode;
  children?: React.ReactNode;
  defaultTab?: USER_PROFILE_PUBLIC_TABS | null;
  className?: string;
};

export function UserProfilePublicTabs({
  className,
  defaultTab: defaultTabProp = null,
  activeTabContent,
  children,
}: UserProfilePublicTabsProps) {
  // console.log(`***** prop values in UserProfilePublicTabs`, {
  //   experiencesProp,
  //   mediaAssets,
  //   enabledEdit,
  //   usersCount,
  //   user,
  // });
  const {
    // activeSegment,
    activeTab,
    activeTabPath,
    refDiscoveriesTab: discoveriesTriggerRef,
    refExperiencesTab: experiencesTriggerRef,
    refMediaTab: mediaTriggerRef,
    handleSwitchingTabs,
    handleSwitchingTabsFromTrigger,
  } = useUserProfileTabs();
  // console.log('***** UserProfilePublicTabs props from hook', {
  //   defaultTabProp,
  //   activeTab,
  //   activeTabPath,
  //   activeTabContent,
  //   children,
  //   className,
  // });
  // const tabsKeyPrefix = 'user-profile-public-tabs';

  return (
    <Tabs
      // key={`user-profile-tabs-${defaultTabProp}`}
      defaultValue={activeTab ?? defaultTabProp ?? undefined}
      onValueChange={(value) => {
        // console.log('***** value in onValueChange', value);
        handleSwitchingTabs(value as USER_PROFILE_PUBLIC_TABS);
      }}
      className={cn('relative w-full', className)}
    >
      <TabsList
        className="grid w-full grid-cols-2"
        defaultValue={activeTab ?? undefined}
      >
        <TabsTrigger
          value="discoveries"
          ref={discoveriesTriggerRef}
          onClick={(e) => {
            // console.log('***** clicked discoveries tab', e);
            handleSwitchingTabsFromTrigger(
              'discoveries',
              discoveriesTriggerRef
            );
          }}
        >
          Discoveries
        </TabsTrigger>
        <TabsTrigger
          value="experiences"
          ref={experiencesTriggerRef}
          className="flex items-center gap-2"
          onClick={(e) => {
            // console.log(`***** clicked experiences tab`, e);
            handleSwitchingTabsFromTrigger(
              'experiences',
              experiencesTriggerRef
            );
          }}
        >
          Experiences <span className="hidden">& Collabs</span>
        </TabsTrigger>
        {/* <TabsTrigger
          value="media"
          ref={mediaTriggerRef}
          className="flex items-center gap-2"
          onClick={(e) => {
            // console.log(`***** clicked media tab`, e);
            handleSwitchingTabsFromTrigger('media', mediaTriggerRef);
          }}
        >
          Media
        </TabsTrigger> */}
      </TabsList>
      {activeTab && (
        <TabsContent value={activeTab}>
          {activeTabContent || children}
        </TabsContent>
      )}
      {!activeTab && (!activeTabContent || !children) && (
        <BlockSkeleton className="size-full" />
      )}
    </Tabs>
  );
}
