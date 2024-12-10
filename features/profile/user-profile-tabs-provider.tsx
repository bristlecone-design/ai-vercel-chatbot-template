'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEvent } from 'react-use';

import type { USER_PROFILE_PUBLIC_TABS } from '@/app/(user)/profile/[userName]/_shared/shared-tab-types';

import { getUserProfilePermalink } from '../experiences/utils/experience-utils';
import { useUserProfile } from './user-profile-provider';

export const ACTIVE_TAB_KEY = 'user-profile-tab';

export const POSSIBLE_ACTIVE_TABS: USER_PROFILE_PUBLIC_TABS[] = [
  'discoveries',
  'experiences',
  'media',
];

export type UserProfileTabRefType = HTMLButtonElement;

export type UserProfileTabObjectRefType =
  React.RefObject<UserProfileTabRefType>;

export type UserProfileTabsContextType = {
  children?: React.ReactNode;

  //-- Values
  tabKey: typeof ACTIVE_TAB_KEY;
  activeTab: USER_PROFILE_PUBLIC_TABS | null;
  activeTabPath: string;

  activeSegment?: string | null;

  //-- User and Profile Info

  //-- Flags
  // Initiate the creation of a new experience

  //-- User and Profile Info
  // session?: Session;
  // // Profile User
  // userProfile: USER_PROFILE_MODEL;
  // profileUserDisplayName?: string | null;
  // profileUserFirstName: string | null;
  // profileUserLastName?: string | null;
  // profilePermalink: string;
  // profileUsername: string;
  // profileUserId: string;
  // // Auth User
  // authUser?: AppUser;
  // isProfilePublic?: boolean;
  // isInPrivateBeta?: boolean | null;
  // isAuthenticated: boolean;
  // isAuthUserOwnProfile: boolean;

  //-- Refs
  refDiscoveriesTab: UserProfileTabObjectRefType;
  refExperiencesTab: UserProfileTabObjectRefType;
  refMediaTab: UserProfileTabObjectRefType;

  //-- Handlers
  // Tab Handlers
  handleSettingTab: (tab: USER_PROFILE_PUBLIC_TABS) => void;
  handleSwitchingTabs: (tab: USER_PROFILE_PUBLIC_TABS) => void;
  handleSwitchingTabsFromTrigger: (
    tab: USER_PROFILE_PUBLIC_TABS,
    ref: UserProfileTabObjectRefType
  ) => void;
};

export const UserProfileTabsDefaultValues: UserProfileTabsContextType = {
  tabKey: ACTIVE_TAB_KEY,
  activeTab: 'experiences',
  activeTabPath: '',

  // Profile User
  // userProfile: {} as USER_PROFILE_MODEL,
  // profileUserId: '',
  // profileUserFirstName: '',
  // profileUsername: '',
  // profilePermalink: '',

  // // Auth User
  // authUser: {} as AppUser,
  // isAuthenticated: false,
  // isAuthUserOwnProfile: false,
  // isProfilePublic: false,
  // isInPrivateBeta: false,

  // Refs
  refDiscoveriesTab: React.createRef<UserProfileTabRefType>(),
  refExperiencesTab: React.createRef<UserProfileTabRefType>(),
  refMediaTab: React.createRef<UserProfileTabRefType>(),

  // Handlers
  handleSettingTab: () => {},
  handleSwitchingTabs: () => {},
  handleSwitchingTabsFromTrigger: () => {},
};

export const UserProfileTabsContext =
  React.createContext<UserProfileTabsContextType>(UserProfileTabsDefaultValues);

export type UserProfileTabsProviderProps = Pick<
  UserProfileTabsContextType,
  'children'
> & {
  activeTab?: USER_PROFILE_PUBLIC_TABS | null;
  children: React.ReactNode;
};

export function UserProfileTabsProvider({
  activeTab: activeTabProp,
  children,
}: UserProfileTabsProviderProps) {
  // console.log('**** props in UserProfileTabsProvider', {
  //   activeTabProp,
  // });

  const router = useRouter();
  const pathname = usePathname();
  // const segment = useSelectedLayoutSegment();
  // console.log('**** segment in UserProfileTabsProvider', segment);

  // Refs
  const refDiscoveriesTab = React.useRef<UserProfileTabRefType>(null);
  const refExperiencesTab = React.useRef<UserProfileTabRefType>(null);
  const refMediaTab = React.useRef<UserProfileTabRefType>(null);

  const btnRef = React.useRef<HTMLButtonElement>(null);
  btnRef.current?.focus();

  // State
  // const [activeTab, setActiveTab] =
  //   useLocalStorage<USER_PROFILE_PUBLIC_TABS | null>(
  //     ACTIVE_TAB_KEY,
  //     activeTabProp || null
  //   );\
  const [activeTab, setActiveTab] =
    React.useState<USER_PROFILE_PUBLIC_TABS | null>(activeTabProp || null);

  // App State and Flags
  const { profileUsername } = useUserProfile();

  const profilePermalink = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';

  // Tab-related flags
  const profileTabPermalink = activeTab
    ? `${profilePermalink}/${activeTab}`
    : '';
  // console.log(`**** profileTabPermalink`, profileTabPermalink);

  const userIsOnRootProfilePage = pathname === profilePermalink;
  const userIsOnTabRootProfilePage = pathname === profileTabPermalink;
  const userIsOnTabSubProfilePage =
    !userIsOnRootProfilePage &&
    !userIsOnTabRootProfilePage &&
    pathname.includes(profilePermalink);

  // Handlers
  const handleSettingTab = (tab: USER_PROFILE_PUBLIC_TABS) => {
    // console.log('***** handleSettingTab invoked in provider', tab);
    setActiveTab(tab);
  };

  const handleSwitchingTabs = (tab: USER_PROFILE_PUBLIC_TABS) => {
    // console.log('***** tab in handleSwitchingTabs in provider', tab);
    setActiveTab(tab as USER_PROFILE_PUBLIC_TABS);
    router.push(`${profilePermalink}/${tab}`);
    // router.refresh();
  };

  // Switching to a tab from a tab trigger
  const handleSwitchingTabsFromTrigger = (
    tab: USER_PROFILE_PUBLIC_TABS,
    triggerRef: UserProfileTabObjectRefType
  ) => {
    // console.log('***** tab in handleSwitchingTabsFromTrigger', tab);
    if (userIsOnTabSubProfilePage) {
      handleSwitchingTabs(tab);
      if (triggerRef?.current) {
        triggerRef?.current.focus();
      }
    }
  };

  // Listen for changes in localStorage
  useEvent(
    'exp-nv-tab-storage',
    (event) => {
      const item = window.localStorage.getItem(ACTIVE_TAB_KEY);
      if (item && item !== 'undefined') {
        setActiveTab(JSON.parse(item));
      }
    },
    window
  );

  // Re-route to the correct tab if the user is on the root profile page
  React.useEffect(() => {
    if (userIsOnRootProfilePage && activeTab) {
      router.replace(`${profilePermalink}/${activeTab}`);
    }
  }, [router, activeTab, profilePermalink, userIsOnRootProfilePage]);

  // Set the active tab to the activeTabProp if it exists
  React.useEffect(() => {
    if (userIsOnRootProfilePage) {
      return;
    }

    if (activeTabProp && activeTabProp !== activeTab) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp, activeTab, userIsOnRootProfilePage]);

  // Pre-fetch the non-active tabs
  React.useEffect(() => {
    if (activeTab) {
      const otherTabs = POSSIBLE_ACTIVE_TABS.filter((tab) => tab !== activeTab);
      // console.log('**** otherTabs to prefetch', otherTabs);
      // Rewrite the above as a for...of loop
      for (const tab of otherTabs) {
        const tabPath = `${profilePermalink}/${tab}`;
        // console.log('**** tabPath to prefetch', tabPath);
        router.prefetch(tabPath);
      }
    }
  }, [router, activeTab, profilePermalink]);

  // Prepare the provider props
  const providerProps: UserProfileTabsContextType = {
    // Refs and segments
    // activeSegment: segment,

    // Flags
    activeTab,
    activeTabPath: profileTabPermalink,
    tabKey: ACTIVE_TAB_KEY,

    // User + Profile Info
    // session,
    // authUser,
    // userProfile,
    // isProfilePublic,
    // isInPrivateBeta,
    // isAuthenticated,
    // isAuthUserOwnProfile,
    // profileUserDisplayName,
    // profileUserFirstName,
    // profileUserLastName,
    // profileUsername,
    // profilePermalink,
    // profileUserId,

    // Refs
    refDiscoveriesTab,
    refExperiencesTab,
    refMediaTab,

    // Handlers
    // Tab Handlers
    handleSettingTab,
    handleSwitchingTabs,
    handleSwitchingTabsFromTrigger,
  };

  return (
    <UserProfileTabsContext.Provider value={providerProps}>
      {children}
    </UserProfileTabsContext.Provider>
  );
}

/**
 * Custom hook to access the UserProfileTabsContext
 */
export function useUserProfileTabs(
  props?: Partial<UserProfileTabsContextType>
) {
  const context = React.useContext(UserProfileTabsContext);

  if (context === undefined) {
    throw new Error(
      'useUserProfileTabs must be used within a UserProfileTabsProvider'
    );
  }

  return context;
}
