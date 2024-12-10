// 'use client';

import type React from 'react';
import { Fragment } from 'react';

import type { ProfilePageProps } from '../_shared/profile-page-types';
import { UserProfileTabsView } from '../_shared/shared-tabs-view';

type TabsSlotLayoutProps = ProfilePageProps & {
  expModal?: React.ReactNode;
};

export default async function TabsSlotLayout(props: TabsSlotLayoutProps) {
  // const searchParams = await props.searchParams;
  // const params = await props.params;

  const { children, expModal } = props;

  // console.log('**** Props in main @tabs layout slot file', {
  //   params,
  //   searchParams,
  //   children,
  //   expModal,
  // });
  // const { userName } = params;
  // const segments = useSelectedLayoutSegments();
  // console.log('**** Segments in main @tabs layout slot file', {
  //   segments,
  //   userName,
  // });

  // const defaultTab = (segments[0] ||
  // null) as UserProfileTabsProps['defaultTab'];
  // console.log('**** Default tab in main @tabs layout slot file', {
  //   defaultTab,
  // });

  // const tabsViewKey = defaultTab
  //   ? `profile-${userName}-${defaultTab}`
  //   : `profile-${userName}`;

  return (
    <Fragment>
      <UserProfileTabsView>
        {/* <React.Suspense fallback={<BlockSkeleton className="h-80 w-full" />}> */}
        {children}
        {/* </React.Suspense> */}
        {expModal}
      </UserProfileTabsView>
    </Fragment>
  );
}
