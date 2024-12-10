import type React from 'react';

import { UserProfileGeneralSkeleton } from '../_shared/profile-skeletons';

// Revalidate every 24 hours in seconds
// export const revalidate = 0; //86400;

// export const runtime = 'edge';

export default function TabsParentPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a placeholder page for the tabs parent page
  // If the user is on the parent page, they'll get redirected to the default, active tab
  return <UserProfileGeneralSkeleton />;
}
